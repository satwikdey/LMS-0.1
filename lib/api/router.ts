import { Prisma } from "@prisma/client";
import { ZodError, type ZodType } from "zod";
import { AppError, badRequest, forbiddenRole, unauthorized } from "@/lib/errors";
import { registry, type Access, type RouteDef } from "@/lib/api/registry";
import { parseCookies, ResponseCookies } from "@/lib/auth/cookies";
import { resolveAuthUserId } from "@/lib/auth/identity";
import { loadContext, type Ctx } from "@/lib/authz/context";
import "@/lib/api/routes";

const API_PREFIX = "/api";

function matchRoute(method: string, pathname: string): { route: RouteDef; params: Record<string, string> } | "method" | null {
  let pathMatched = false;
  for (const r of registry) {
    const m = r.regex.exec(pathname);
    if (!m) continue;
    pathMatched = true;
    if (r.method !== method) continue;
    const params: Record<string, string> = {};
    r.keys.forEach((k, i) => (params[k] = decodeURIComponent(m[i + 1])));
    return { route: r, params };
  }
  return pathMatched ? "method" : null;
}

/** Does `ctx` satisfy the declared access? Throws the appropriate AppError otherwise. */
export function checkAccess(access: Access, ctx: Ctx | null): void {
  if (access === "public") return;
  if (!ctx) throw unauthorized();
  if (access === "authenticated") return;
  if (access === "student") {
    if (ctx.account.kind !== "STUDENT") throw forbiddenRole();
    return;
  }
  if (ctx.account.kind !== "STAFF") throw forbiddenRole();
  if (access === "staff") return;
  if (!ctx.has(...access)) throw forbiddenRole();
}

function errorResponse(e: unknown, cookies: ResponseCookies): Response {
  let status = 500;
  let body: { error: { code: string; message: string; details?: unknown } };

  if (e instanceof AppError) {
    status = e.status;
    body = { error: { code: e.code, message: e.message, details: e.details } };
  } else if (e instanceof ZodError) {
    status = 400;
    body = {
      error: {
        code: "VALIDATION",
        message: e.issues[0] ? `${e.issues[0].path.join(".") || "request"}: ${e.issues[0].message}` : "Invalid request",
        details: e.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
      },
    };
  } else if (e instanceof Prisma.PrismaClientKnownRequestError) {
    if (e.code === "P2002") {
      status = 409;
      body = { error: { code: "CONFLICT", message: "A record with the same unique value already exists", details: e.meta } };
    } else if (e.code === "P2025") {
      status = 404;
      body = { error: { code: "NOT_FOUND", message: "Record not found" } };
    } else if (e.code === "P2003") {
      status = 409;
      body = { error: { code: "CONFLICT", message: "The record is referenced by other records or points at a missing one" } };
    } else {
      const msg = String((e.meta as { message?: string } | undefined)?.message ?? e.message);
      // CHECK / trigger violations raised by the integrity migration are business-rule violations.
      if (/23514|23000|violates check constraint|append-only|immutable|exceeds|Only staff/i.test(msg + e.code)) {
        status = 422;
        body = { error: { code: "UNPROCESSABLE", message: msg.split("\n").pop() ?? "Rule violation" } };
      } else {
        console.error("[api] database error", e);
        body = { error: { code: "INTERNAL", message: "Unexpected database error" } };
      }
    }
  } else {
    console.error("[api] unexpected error", e);
    body = { error: { code: "INTERNAL", message: "Something went wrong. Please try again." } };
  }

  const headers = new Headers({ "content-type": "application/json", "cache-control": "no-store" });
  cookies.apply(headers);
  return new Response(JSON.stringify(body), { status, headers });
}

function clientIp(req: Request): string {
  return (req.headers.get("x-forwarded-for")?.split(",")[0] ?? req.headers.get("x-real-ip") ?? "local").trim();
}

/**
 * Single entry point for every /api request (also used directly by the integration tests so
 * they exercise the real authorisation path, not a mock).
 */
export async function dispatch(req: Request): Promise<Response> {
  const cookies = new ResponseCookies();
  try {
    const url = new URL(req.url);
    const pathname = url.pathname.startsWith(API_PREFIX) ? url.pathname.slice(API_PREFIX.length) || "/" : url.pathname;
    const matched = matchRoute(req.method.toUpperCase(), pathname);
    if (matched === null) throw new AppError(404, "NOT_FOUND", "Unknown endpoint");
    if (matched === "method") throw new AppError(405, "METHOD_NOT_ALLOWED", "Method not allowed");
    const { route, params } = matched;

    // CSRF: browsers always send Origin on cross-site writes; reject mismatches.
    if (req.method !== "GET" && req.method !== "HEAD") {
      const origin = req.headers.get("origin");
      const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
      if (origin && host) {
        let originHost = "";
        try {
          originHost = new URL(origin).host;
        } catch {
          /* malformed */
        }
        if (originHost !== host) throw new AppError(403, "CSRF", "Cross-origin request rejected");
      }
    }

    const read = () => parseCookies(req.headers.get("cookie"));
    let ctx: Ctx | null = null;
    if (route.access !== "public" || req.headers.get("cookie") || req.headers.get("authorization")) {
      const authUserId = await resolveAuthUserId(read, req.headers.get("authorization"));
      ctx = authUserId ? await loadContext(authUserId) : null;
    }

    checkAccess(route.access, ctx);
    if (ctx?.account.mustChangePassword && !route.allowTempPassword) {
      throw new AppError(403, "PASSWORD_CHANGE_REQUIRED", "You must change your temporary password first");
    }

    let cachedBody: unknown;
    let bodyRead = false;
    const rc = {
      req,
      ctx,
      params,
      query: url.searchParams,
      ip: clientIp(req),
      cookies,
      readCookies: read,
      async json<T>(schema: ZodType<T, any, any>): Promise<T> {
        if (!bodyRead) {
          bodyRead = true;
          const text = await req.text();
          try {
            cachedBody = text ? JSON.parse(text) : {};
          } catch {
            throw badRequest("Request body must be valid JSON");
          }
        }
        return schema.parse(cachedBody);
      },
    };

    const result = await route.handler(rc);
    if (result instanceof Response) {
      cookies.apply(result.headers);
      return result;
    }
    const headers = new Headers({ "content-type": "application/json", "cache-control": "no-store" });
    cookies.apply(headers);
    return new Response(JSON.stringify(result ?? { ok: true }), { status: 200, headers });
  } catch (e) {
    return errorResponse(e, cookies);
  }
}
