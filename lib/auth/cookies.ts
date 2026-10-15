export interface CookieOptions {
  path?: string;
  domain?: string;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "lax" | "strict" | "none" | boolean;
  maxAge?: number;
  expires?: Date;
}

export type CookieReader = () => { name: string; value: string }[];

export interface CookieSink {
  set(name: string, value: string, options?: CookieOptions): void;
}

export function parseCookies(header: string | null | undefined): { name: string; value: string }[] {
  if (!header) return [];
  return header
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const i = part.indexOf("=");
      const name = i < 0 ? part : part.slice(0, i);
      const raw = i < 0 ? "" : part.slice(i + 1);
      let value = raw;
      try {
        value = decodeURIComponent(raw);
      } catch {
        /* keep raw */
      }
      return { name, value };
    });
}

export function serializeCookie(name: string, value: string, o: CookieOptions = {}): string {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  parts.push(`Path=${o.path ?? "/"}`);
  if (o.domain) parts.push(`Domain=${o.domain}`);
  if (o.maxAge !== undefined) parts.push(`Max-Age=${Math.floor(o.maxAge)}`);
  if (o.expires) parts.push(`Expires=${o.expires.toUTCString()}`);
  if (o.httpOnly) parts.push("HttpOnly");
  if (o.secure) parts.push("Secure");
  if (o.sameSite) {
    const s = o.sameSite === true ? "strict" : o.sameSite;
    parts.push(`SameSite=${s[0].toUpperCase()}${s.slice(1)}`);
  }
  return parts.join("; ");
}

/** Collects cookies set during a request so the router can attach them to the response. */
export class ResponseCookies implements CookieSink {
  readonly items: { name: string; value: string; options?: CookieOptions }[] = [];
  set(name: string, value: string, options?: CookieOptions) {
    this.items.push({ name, value, options });
  }
  apply(headers: Headers) {
    for (const c of this.items) headers.append("set-cookie", serializeCookie(c.name, c.value, c.options));
  }
}
