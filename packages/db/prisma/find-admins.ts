import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
p.user.findMany({
  where: { role: "SUPER_ADMIN" },
  select: { email: true, name: true, organizationId: true },
}).then(users => {
  console.log("Super admins en la BD:");
  users.forEach(u => console.log(`  · ${u.email}  (${u.name})  org: ${u.organizationId}`));
  if (!users.length) console.log("  Ninguno encontrado");
  p.$disconnect();
});
