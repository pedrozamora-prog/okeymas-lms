/**
 * Seed de departamentos por defecto para todas las organizaciones.
 * Uso: DATABASE_URL=... tsx prisma/seed-departments.ts
 *
 * Crea los departamentos estándar de un gimnasio si la org aún no tiene ninguno.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_DEPARTMENTS = [
  "Administración",
  "Recepción",
  "Servicio de Limpieza",
  "Monitor",
  "Deportivo",
];

async function main() {
  console.log("🌱  Seed de departamentos...\n");

  const orgs = await prisma.organization.findMany({ select: { id: true, name: true } });

  for (const org of orgs) {
    const existing = await prisma.department.count({ where: { organizationId: org.id } });
    if (existing > 0) {
      console.log(`⏭️   ${org.name}: ya tiene ${existing} departamentos, saltando.`);
      continue;
    }

    for (const name of DEFAULT_DEPARTMENTS) {
      await prisma.department.create({ data: { name, organizationId: org.id } });
    }
    console.log(`✅  ${org.name}: ${DEFAULT_DEPARTMENTS.length} departamentos creados`);
  }

  console.log("\n🎉  ¡Departamentos listos!");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
