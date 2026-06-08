const { PrismaClient } = require("../packages/db/node_modules/@prisma/client");
const prisma = new PrismaClient();

prisma.organization
  .updateMany({
    where: { plan: { in: ["STARTER", "PROFESSIONAL"] } },
    data:  { plan: "CHAIN" },
  })
  .then(r => {
    console.log("✅ Orgs actualizadas a CHAIN:", r.count);
    return prisma.$disconnect();
  })
  .catch(e => {
    console.error("❌ Error:", e.message);
    return prisma.$disconnect();
  });
