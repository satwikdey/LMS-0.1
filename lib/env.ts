export const env = {
  /** `supabase` in production; `local` uses the in-database credential store (dev/test only). */
  get authProvider(): "supabase" | "local" {
    const explicit = process.env.AUTH_PROVIDER;
    if (explicit === "supabase" || explicit === "local") return explicit;
    return process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
      ? "supabase"
      : "local";
  },
  get supabaseUrl() {
    return process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  },
  get supabaseAnonKey() {
    return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  },
  get supabaseServiceKey() {
    return process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  },
  get localAuthSecret() {
    const s = process.env.AUTH_LOCAL_SECRET;
    if (s && s.length >= 16) return s;
    if (process.env.NODE_ENV === "production") {
      throw new Error("AUTH_LOCAL_SECRET (>=16 chars) is required when AUTH_PROVIDER=local");
    }
    return "dev-only-insecure-secret-change-me";
  },
  /** Domain for synthetic Supabase identities of students who have no email. */
  get internalAuthDomain() {
    return process.env.INTERNAL_AUTH_DOMAIN ?? "students.portal.example.com";
  },
  get appUrl() {
    return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  },
  get cronSecret() {
    return process.env.CRON_SECRET ?? "";
  },
  get secureCookies() {
    return process.env.NODE_ENV === "production" && !process.env.INSECURE_COOKIES;
  },
};
