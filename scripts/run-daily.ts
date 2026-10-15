import { prisma } from "../lib/db";
import { processDailyFeeAlerts } from "../lib/services/reporting";

async function main() {
  console.log("Running daily school operations & notification jobs...");
  const feeAlerts = await processDailyFeeAlerts(prisma);
  console.log(`Evaluated fee dues: ${feeAlerts.processedCount} overdue student notices dispatched.`);
  console.log("Daily job completed successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
