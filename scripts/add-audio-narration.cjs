// Run: $env:DATABASE_URL="postgresql://..."; node scripts/add-audio-narration.cjs
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(`
    ALTER TABLE lessons ADD COLUMN IF NOT EXISTS audio_narration_url TEXT;
  `);
  console.log("✅ Columna audio_narration_url añadida a lessons");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
