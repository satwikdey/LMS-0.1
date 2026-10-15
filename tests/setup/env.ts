import { inject } from "vitest";

const url = inject("databaseUrl");
process.env.DATABASE_URL = url;
process.env.DIRECT_URL = url;
process.env.AUTH_PROVIDER = "local";
process.env.AUTH_LOCAL_SECRET = "integration-test-secret-0123456789";
process.env.CRON_SECRET = "test-cron-secret";
