/**
 * Seed de cursos demo para la organización del super admin actual.
 * Uso: DATABASE_URL=... DIRECT_URL=... tsx prisma/seed-demo-courses.ts [email-del-admin]
 * Si no se pasa email, usa el primer SUPER_ADMIN encontrado.
 */
import { PrismaClient, CourseStatus, LessonType } from "@prisma/client";

const prisma = new PrismaClient();
const targetEmail = process.argv[2];

async function main() {
  console.log("🌱  Seed de cursos demo...\n");

  // Buscar el super admin
  const admin = await prisma.user.findFirst({
    where: {
      ...(targetEmail ? { email: targetEmail } : { role: "SUPER_ADMIN" }),
    },
    select: { id: true, name: true, email: true, organizationId: true },
  });

  if (!admin) {
    console.error("❌  No se encontró el usuario. Pasa el email como argumento: tsx seed-demo-courses.ts tu@email.com");
    process.exit(1);
  }

  const orgId = admin.organizationId;
  console.log(`✅  Admin: ${admin.name} (${admin.email})`);
  console.log(`✅  Organización ID: ${orgId}\n`);

  // ── CURSO 1: Bienvenida y onboarding ─────────────────────────────────
  const c1 = await prisma.course.upsert({
    where:  { id: `demo-${orgId}-bienvenida` },
    update: {},
    create: {
      id:             `demo-${orgId}-bienvenida`,
      title:          "Bienvenida y Onboarding",
      description:    "Conoce la empresa, sus valores, cultura y los protocolos básicos de trabajo. Formación obligatoria para todo el equipo.",
      status:         CourseStatus.PUBLISHED,
      isRequired:     true,
      order:          1,
      organizationId: orgId,
      certificateEnabled: true,
      certificateType:    "COMPLETION",
      modules: {
        create: [
          {
            title: "Nuestra empresa",
            order: 1,
            lessons: {
              create: [
                { title: "¿Quiénes somos?",        type: LessonType.VIDEO, duration: 8,  order: 1, isRequired: true },
                { title: "Misión y valores",        type: LessonType.PDF,   duration: 5,  order: 2, isRequired: true },
                { title: "Test de bienvenida",      type: LessonType.QUIZ,  duration: 10, order: 3, isRequired: true },
              ],
            },
          },
          {
            title: "Protocolo y normativa",
            order: 2,
            lessons: {
              create: [
                { title: "Normas internas",         type: LessonType.VIDEO, duration: 12, order: 1, isRequired: true },
                { title: "Atención al cliente",     type: LessonType.VIDEO, duration: 15, order: 2, isRequired: true },
                { title: "Evaluación final",        type: LessonType.QUIZ,  duration: 15, order: 3, isRequired: true },
              ],
            },
          },
        ],
      },
    },
  });
  console.log(`✅  Curso 1: ${c1.title}`);

  // ── CURSO 2: Seguridad e Higiene (PRL) ───────────────────────────────
  const c2 = await prisma.course.upsert({
    where:  { id: `demo-${orgId}-seguridad` },
    update: {},
    create: {
      id:             `demo-${orgId}-seguridad`,
      title:          "Seguridad e Higiene en Instalaciones Deportivas",
      description:    "Protocolos de seguridad, prevención de riesgos laborales y primeros auxilios para personal de gimnasio. Obligatorio por Ley 31/1995.",
      status:         CourseStatus.PUBLISHED,
      isRequired:     true,
      order:          2,
      organizationId: orgId,
      isPrl:          true,
      prlRiskLevel:   "BASICO",
      certificateEnabled:      true,
      certificateType:         "PROFESSIONAL",
      certificateValidityDays: 730,
      modules: {
        create: [
          {
            title: "Prevención de riesgos",
            order: 1,
            lessons: {
              create: [
                { title: "Riesgos en instalaciones deportivas", type: LessonType.VIDEO, duration: 20, order: 1, isRequired: true },
                { title: "Equipos de protección",               type: LessonType.PDF,   duration: 10, order: 2, isRequired: true },
                { title: "Quiz de prevención",                  type: LessonType.QUIZ,  duration: 15, order: 3, isRequired: true },
              ],
            },
          },
          {
            title: "Primeros auxilios",
            order: 2,
            lessons: {
              create: [
                { title: "RCP básico",             type: LessonType.VIDEO,      duration: 25, order: 1, isRequired: true  },
                { title: "RCP práctico en directo", type: LessonType.LIVE_CLASS, duration: 60, order: 2, isRequired: false },
              ],
            },
          },
        ],
      },
    },
  });
  console.log(`✅  Curso 2: ${c2.title} (PRL)`);

  // ── CURSO 3: Técnicas de venta (B2C público) ─────────────────────────
  const c3 = await prisma.course.upsert({
    where:  { id: `demo-${orgId}-ventas` },
    update: {},
    create: {
      id:             `demo-${orgId}-ventas`,
      title:          "Técnicas de Venta para Gimnasios",
      description:    "Estrategias de captación, venta cruzada y fidelización de socios. Aprende a convertir visitas en altas y a reducir bajas.",
      status:         CourseStatus.PUBLISHED,
      isRequired:     false,
      order:          3,
      organizationId: orgId,
      isPublic:       true,
      price:          2900,   // 29 €
      currency:       "eur",
      certificateEnabled: true,
      certificateType:    "COMPLETION",
      modules: {
        create: [
          {
            title: "Fundamentos de venta",
            order: 1,
            lessons: {
              create: [
                { title: "El proceso de venta",      type: LessonType.VIDEO, duration: 18, order: 1, isRequired: true },
                { title: "Manejo de objeciones",     type: LessonType.VIDEO, duration: 22, order: 2, isRequired: true },
                { title: "Test de ventas",           type: LessonType.QUIZ,  duration: 20, order: 3, isRequired: true },
              ],
            },
          },
          {
            title: "Fidelización",
            order: 2,
            lessons: {
              create: [
                { title: "Cómo reducir la tasa de baja", type: LessonType.VIDEO, duration: 16, order: 1, isRequired: true },
                { title: "Email marketing para socios",   type: LessonType.PDF,   duration: 8,  order: 2, isRequired: true },
              ],
            },
          },
        ],
      },
    },
  });
  console.log(`✅  Curso 3: ${c3.title} (B2C público · 29 €)`);

  // ── CURSO 4: Atención al cliente ─────────────────────────────────────
  const c4 = await prisma.course.upsert({
    where:  { id: `demo-${orgId}-atencion` },
    update: {},
    create: {
      id:             `demo-${orgId}-atencion`,
      title:          "Atención al Cliente de Excelencia",
      description:    "Habilidades de comunicación, gestión de conflictos y protocolos de atención para ofrecer una experiencia de socio de primer nivel.",
      status:         CourseStatus.PUBLISHED,
      isRequired:     false,
      order:          4,
      organizationId: orgId,
      modules: {
        create: [
          {
            title: "Comunicación efectiva",
            order: 1,
            lessons: {
              create: [
                { title: "Escucha activa",             type: LessonType.VIDEO, duration: 14, order: 1, isRequired: true },
                { title: "Lenguaje no verbal",         type: LessonType.VIDEO, duration: 12, order: 2, isRequired: true },
                { title: "Gestión de quejas y reclamaciones", type: LessonType.PDF, duration: 10, order: 3, isRequired: true },
                { title: "Evaluación del módulo",     type: LessonType.QUIZ,  duration: 15, order: 4, isRequired: true },
              ],
            },
          },
        ],
      },
    },
  });
  console.log(`✅  Curso 4: ${c4.title}`);

  console.log(`
🎉  ¡Seed completado! Se crearon 4 cursos demo en tu organización.

📌  Resumen:
   · Bienvenida y Onboarding          → Publicado · Obligatorio
   · Seguridad e Higiene (PRL)        → Publicado · Obligatorio · PRL Básico · Certificado 2 años
   · Técnicas de Venta para Gimnasios → Publicado · B2C público · 29 €  ← visible en /cursos
   · Atención al Cliente              → Publicado

🔗  Visita /admin/courses para verlos.
🔗  Visita /cursos para ver el catálogo público (el curso de ventas).
`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
