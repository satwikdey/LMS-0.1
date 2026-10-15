import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { hashPassword, verifyPasswordHash } from "@/lib/auth/passwords";
import type { CookieReader, CookieSink } from "@/lib/auth/cookies";

export const LOCAL_SESSION_COOKIE = "portal_session";
const LOCAL_SESSION_TTL_SECONDS = 60 * 60 * 12;

/**
 * Identity provider abstraction. Production uses Supabase Auth; `local` is a database-backed
 * stand-in for development, automated tests and the browser suite (no Supabase project needed).
 * Application authorisation never depends on the provider: it always re-reads roles from the DB.
 */
export interface IdentityProvider {
  readonly name: "supabase" | "local";
  /** Create the identity, or — if it already exists (e.g. after a partial failure) — reset its password. Idempotent. */
  ensureIdentity(i: { authEmail: string; password: string; displayName: string; accountId: string }): Promise<{ authUserId: string }>;
  setPassword(authUserId: string, password: string): Promise<void>;
  setEmail(authUserId: string, newEmail: string): Promise<void>;
  setDisabled(authUserId: string, disabled: boolean): Promise<void>;
  /** Check credentials without creating a session. Returns the identity id or null. */
  verifyPassword(authEmail: string, password: string): Promise<string | null>;
  /** Check credentials and start a session by writing cookies to `sink`. */
  signIn(authEmail: string, password: string, sink: CookieSink, read: CookieReader): Promise<string | null>;
  signOut(sink: CookieSink, read: CookieReader): Promise<void>;
  sendPasswordReset(authEmail: string, redirectTo: string): Promise<void>;
}

// ───────────────────────── Local provider ─────────────────────────

function b64url(buf: Buffer | string): string {
  return Buffer.from(buf).toString("base64url");
}

function hmac(body: string): string {
  return b64url(createHmac("sha256", env.localAuthSecret).update(body).digest());
}

export function signLocalToken(authUserId: string, ttlSeconds = LOCAL_SESSION_TTL_SECONDS): string {
  const body = b64url(JSON.stringify({ sub: authUserId, exp: Math.floor(Date.now() / 1000) + ttlSeconds }));
  return `${body}.${hmac(body)}`;
}

export function verifyLocalToken(token: string | undefined | null): string | null {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = Buffer.from(hmac(body));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as { sub?: string; exp?: number };
    if (!payload.sub || !payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload.sub;
  } catch {
    return null;
  }
}

export class LocalIdentityProvider implements IdentityProvider {
  readonly name = "local" as const;

  async ensureIdentity(i: { authEmail: string; password: string }) {
    const email = i.authEmail.toLowerCase();
    const passwordHash = await hashPassword(i.password);
    const existing = await prisma.localCredential.findUnique({ where: { authEmail: email } });
    if (existing) {
      await prisma.localCredential.update({
        where: { authUserId: existing.authUserId },
        data: { passwordHash, disabled: false },
      });
      return { authUserId: existing.authUserId };
    }
    const row = await prisma.localCredential.create({
      data: { authUserId: randomUUID(), authEmail: email, passwordHash },
    });
    return { authUserId: row.authUserId };
  }

  async setPassword(authUserId: string, password: string) {
    await prisma.localCredential.update({
      where: { authUserId },
      data: { passwordHash: await hashPassword(password) },
    });
  }

  async setEmail(authUserId: string, newEmail: string) {
    await prisma.localCredential.update({ where: { authUserId }, data: { authEmail: newEmail.toLowerCase() } });
  }

  async setDisabled(authUserId: string, disabled: boolean) {
    await prisma.localCredential.update({ where: { authUserId }, data: { disabled } });
  }

  async verifyPassword(authEmail: string, password: string) {
    const row = await prisma.localCredential.findUnique({ where: { authEmail: authEmail.toLowerCase() } });
    if (!row || row.disabled) return null;
    return (await verifyPasswordHash(password, row.passwordHash)) ? row.authUserId : null;
  }

  async signIn(authEmail: string, password: string, sink: CookieSink) {
    const id = await this.verifyPassword(authEmail, password);
    if (!id) return null;
    sink.set(LOCAL_SESSION_COOKIE, signLocalToken(id), {
      httpOnly: true,
      sameSite: "lax",
      secure: env.secureCookies,
      path: "/",
      maxAge: LOCAL_SESSION_TTL_SECONDS,
    });
    return id;
  }

  async signOut(sink: CookieSink) {
    sink.set(LOCAL_SESSION_COOKIE, "", { path: "/", maxAge: 0, httpOnly: true, sameSite: "lax" });
  }

  async sendPasswordReset() {
    /* local mode has no mailer; staff-assisted recovery is the supported path */
  }
}

// ───────────────────────── Supabase provider ─────────────────────────

export class SupabaseIdentityProvider implements IdentityProvider {
  readonly name = "supabase" as const;

  private admin() {
    return createClient(env.supabaseUrl, env.supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }

  private async findUserIdByEmail(email: string): Promise<string | null> {
    const admin = this.admin();
    for (let page = 1; page <= 50; page++) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) throw error;
      const hit = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
      if (hit) return hit.id;
      if (data.users.length < 1000) break;
    }
    return null;
  }

  async ensureIdentity(i: { authEmail: string; password: string; displayName: string; accountId: string }) {
    const admin = this.admin();
    const meta = { accountId: i.accountId, displayName: i.displayName };
    const created = await admin.auth.admin.createUser({
      email: i.authEmail,
      password: i.password,
      email_confirm: true,
      user_metadata: meta,
    });
    if (!created.error && created.data.user) return { authUserId: created.data.user.id };

    const message = created.error?.message ?? "";
    const code = (created.error as { code?: string } | null)?.code;
    if (code === "email_exists" || /already|registered|exists/i.test(message)) {
      const id = await this.findUserIdByEmail(i.authEmail);
      if (!id) throw new Error("Identity exists but could not be located for recovery");
      const upd = await admin.auth.admin.updateUserById(id, {
        password: i.password,
        ban_duration: "none",
        user_metadata: meta,
      });
      if (upd.error) throw upd.error;
      return { authUserId: id };
    }
    throw created.error ?? new Error("Supabase identity creation failed");
  }

  async setPassword(authUserId: string, password: string) {
    const { error } = await this.admin().auth.admin.updateUserById(authUserId, { password });
    if (error) throw error;
  }

  async setEmail(authUserId: string, newEmail: string) {
    const { error } = await this.admin().auth.admin.updateUserById(authUserId, {
      email: newEmail,
      email_confirm: true,
    });
    if (error) throw error;
  }

  async setDisabled(authUserId: string, disabled: boolean) {
    const { error } = await this.admin().auth.admin.updateUserById(authUserId, {
      ban_duration: disabled ? "876000h" : "none",
    });
    if (error) throw error;
  }

  async verifyPassword(authEmail: string, password: string) {
    const client = createClient(env.supabaseUrl, env.supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data, error } = await client.auth.signInWithPassword({ email: authEmail, password });
    return error || !data.user ? null : data.user.id;
  }

  private serverClient(sink: CookieSink, read: CookieReader) {
    return createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
      cookies: {
        getAll: () => read(),
        setAll: (cookies) => cookies.forEach(({ name, value, options }) => sink.set(name, value, options)),
      },
    });
  }

  async signIn(authEmail: string, password: string, sink: CookieSink, read: CookieReader) {
    const { data, error } = await this.serverClient(sink, read).auth.signInWithPassword({ email: authEmail, password });
    return error || !data.user ? null : data.user.id;
  }

  async signOut(sink: CookieSink, read: CookieReader) {
    await this.serverClient(sink, read).auth.signOut();
  }

  async sendPasswordReset(authEmail: string, redirectTo: string) {
    const client = createClient(env.supabaseUrl, env.supabaseAnonKey, { auth: { persistSession: false } });
    await client.auth.resetPasswordForEmail(authEmail, { redirectTo });
  }
}

// ───────────────────────── Factory ─────────────────────────

let override: IdentityProvider | null = null;

/** Tests inject failing / recording providers here. */
export function setIdentityProviderForTests(p: IdentityProvider | null) {
  override = p;
}

export function getIdentityProvider(): IdentityProvider {
  if (override) return override;
  return env.authProvider === "supabase" ? new SupabaseIdentityProvider() : new LocalIdentityProvider();
}

/** Resolve the authenticated identity id from request cookies / bearer token, or null. */
export async function resolveAuthUserId(read: CookieReader, authorization?: string | null): Promise<string | null> {
  if (env.authProvider === "local" || override?.name === "local") {
    const bearer = authorization?.startsWith("Bearer ") ? authorization.slice(7) : null;
    const cookie = read().find((c) => c.name === LOCAL_SESSION_COOKIE)?.value;
    return verifyLocalToken(bearer ?? cookie);
  }
  const client = createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: { getAll: () => read(), setAll: () => undefined },
  });
  const { data, error } = await client.auth.getUser();
  return error || !data.user ? null : data.user.id;
}
