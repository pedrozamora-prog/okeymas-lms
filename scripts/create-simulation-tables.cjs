const { PrismaClient } = require("../packages/db/node_modules/@prisma/client");
const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ScenarioDifficulty') THEN
        CREATE TYPE "ScenarioDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');
      END IF;
    END $$;
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "scenarios" (
      "id"              TEXT NOT NULL,
      "organizationId"  TEXT NOT NULL,
      "title"           TEXT NOT NULL,
      "description"     TEXT,
      "customerContext" TEXT NOT NULL,
      "objective"       TEXT NOT NULL,
      "difficulty"      "ScenarioDifficulty" NOT NULL DEFAULT 'MEDIUM',
      "isActive"        BOOLEAN NOT NULL DEFAULT true,
      "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "scenarios_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "scenarios_organizationId_fkey"
        FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "scenarios_organizationId_idx" ON "scenarios"("organizationId");
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "simulation_attempts" (
      "id"          TEXT NOT NULL,
      "userId"      TEXT NOT NULL,
      "scenarioId"  TEXT NOT NULL,
      "transcript"  JSONB NOT NULL DEFAULT '[]',
      "score"       INTEGER,
      "feedback"    TEXT,
      "evaluation"  JSONB,
      "completedAt" TIMESTAMP(3),
      "startedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "simulation_attempts_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "simulation_attempts_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "simulation_attempts_scenarioId_fkey"
        FOREIGN KEY ("scenarioId") REFERENCES "scenarios"("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
  `);

  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "simulation_attempts_userId_idx" ON "simulation_attempts"("userId")`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "simulation_attempts_scenarioId_idx" ON "simulation_attempts"("scenarioId")`);

  console.log("✅ Tablas scenarios y simulation_attempts creadas correctamente");
}

main()
  .catch(e => { console.error("❌", e.message); })
  .finally(() => prisma.$disconnect());
