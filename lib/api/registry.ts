import type { Position } from "@prisma/client";
import type { ZodType } from "zod";
import type { Ctx } from "@/lib/authz/context";
import type { CookieReader, ResponseCookies } from "@/lib/auth/cookies";

/**
 * Declared access for an endpoint. Enforced centrally by the router *before* any handler or
 * body validation runs, so every endpoint is guarded by database-backed roles.
 *  - "public"        no session needed
 *  - "authenticated" any active account (staff or student)
 *  - "student"       student accounts only
 *  - "staff"         any active staff account (scope is then checked by the handler)
 *  - Position[]      staff holding at least one of these active positions
 */
export type Access = "public" | "authenticated" | "student" | "staff" | Position[];

export interface RouteCtx<C = Ctx> {
  req: Request;
  ctx: C;
  params: Record<string, string>;
  query: URLSearchParams;
  ip: string;
  cookies: ResponseCookies;
  readCookies: CookieReader;
  json<T>(schema: ZodType<T, any, any>): Promise<T>;
}

export type Handler<C = Ctx> = (c: RouteCtx<C>) => Promise<unknown> | unknown;

export interface RouteDef {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  access: Access;
  /** Allow while the account still has a temporary password (change-password, logout, me). */
  allowTempPassword: boolean;
  handler: Handler<any>;
  regex: RegExp;
  keys: string[];
}

export const registry: RouteDef[] = [];

function compile(path: string) {
  const keys: string[] = [];
  const pattern = path
    .split("/")
    .filter(Boolean)
    .map((seg) => {
      if (seg.startsWith(":")) {
        keys.push(seg.slice(1));
        return "([^/]+)";
      }
      return seg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    })
    .join("/");
  return { regex: new RegExp(`^/${pattern}/?$`), keys };
}

type Method = RouteDef["method"];

function add<C>(method: Method, path: string, access: Access, handler: Handler<C>, allowTempPassword = false) {
  const { regex, keys } = compile(path);
  if (registry.some((r) => r.method === method && r.path === path)) {
    throw new Error(`Duplicate route ${method} ${path}`);
  }
  registry.push({ method, path, access, handler, regex, keys, allowTempPassword });
}

/** Register a guarded endpoint (handler receives a non-null ctx). */
export const route = {
  get: (path: string, access: Exclude<Access, "public">, h: Handler) => add("GET", path, access, h),
  post: (path: string, access: Exclude<Access, "public">, h: Handler) => add("POST", path, access, h),
  put: (path: string, access: Exclude<Access, "public">, h: Handler) => add("PUT", path, access, h),
  patch: (path: string, access: Exclude<Access, "public">, h: Handler) => add("PATCH", path, access, h),
  delete: (path: string, access: Exclude<Access, "public">, h: Handler) => add("DELETE", path, access, h),
};

/** Like `route` but reachable while a temporary password is still in force. */
export const routeAllowingTempPassword = {
  get: (path: string, h: Handler) => add("GET", path, "authenticated", h, true),
  post: (path: string, h: Handler) => add("POST", path, "authenticated", h, true),
};

export const publicRoute = {
  get: (path: string, h: Handler<null>) => add("GET", path, "public", h),
  post: (path: string, h: Handler<null>) => add("POST", path, "public", h),
};
