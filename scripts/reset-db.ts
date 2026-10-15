import { resetDatabase } from "../lib/testing/reset";
import { prisma } from "../lib/db";

async function main() {
  console.log("Truncating all portal tables...");
  await resetDatabase();
  console.log("Database reset complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
