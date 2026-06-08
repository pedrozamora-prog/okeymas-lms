import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const orgs = await prisma.organization.findMany({
    select: { id: true, name: true, plan: true },
  });

  console.log("Organizaciones encontradas:");
  orgs.forEach(o => console.log(`  [${o.id}] ${o.name} — plan: ${o.plan}`));

  if (orgs.length === 1) {
    const updated = await prisma.organization.update({
      where: { id: orgs[0].id },
      data:  { plan: "CHAIN" },
    });
    console.log(`\n✅ Plan actualizado a CHAIN para: ${updated.name}`);
  } else {
    console.log("\nHay más de una org. Edita el script y pon el ID correcto.");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
