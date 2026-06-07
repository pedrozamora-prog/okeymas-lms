/**
 * Seed del Marketplace de Formia.
 * Crea una org "Formia Marketplace" con 6 cursos de fitness listos para importar.
 * También actualiza la org de okeymas a plan PROFESSIONAL para que tenga acceso.
 * Uso: DATABASE_URL=... tsx prisma/seed-marketplace.ts
 */
import { PrismaClient, CourseStatus, LessonType } from "@prisma/client";

const prisma = new PrismaClient();

const MARKETPLACE_ORG_ID   = "org-formia-marketplace";
const MARKETPLACE_ORG_SLUG = "formia-marketplace";

const COURSES = [
  {
    id:       "mkt-primeros-auxilios",
    title:    "Primeros Auxilios en Instalaciones Deportivas",
    shortDesc: "RCP, manejo de desfibrilador, lesiones deportivas y protocolo de emergencias para personal de gimnasio.",
    category: "Seguridad",
    isRequired: true,
    certificateEnabled: true,
    certificateType: "PROFESSIONAL" as const,
    certificateValidityDays: 365,
    modules: [
      {
        title: "Emergencias básicas", order: 1,
        lessons: [
          { title: "Reconocimiento de emergencias", type: LessonType.VIDEO, duration: 18, order: 1 },
          { title: "RCP para adultos y niños",       type: LessonType.VIDEO, duration: 25, order: 2 },
          { title: "Uso del desfibrilador (DEA)",    type: LessonType.VIDEO, duration: 20, order: 3 },
          { title: "Test de emergencias básicas",    type: LessonType.QUIZ,  duration: 15, order: 4 },
        ],
      },
      {
        title: "Lesiones deportivas comunes", order: 2,
        lessons: [
          { title: "Esguinces, fracturas y contusiones", type: LessonType.VIDEO, duration: 16, order: 1 },
          { title: "Insolación y golpe de calor",        type: LessonType.PDF,   duration: 8,  order: 2 },
          { title: "Evaluación final",                   type: LessonType.QUIZ,  duration: 20, order: 3 },
        ],
      },
    ],
  },
  {
    id:       "mkt-atencion-socio",
    title:    "Atención al Socio de Excelencia",
    shortDesc: "Comunicación efectiva, gestión de quejas y técnicas para crear experiencias memorables en el gimnasio.",
    category: "Atención cliente",
    isRequired: false,
    certificateEnabled: true,
    certificateType: "COMPLETION" as const,
    certificateValidityDays: null,
    modules: [
      {
        title: "Comunicación efectiva", order: 1,
        lessons: [
          { title: "Escucha activa y empatía",          type: LessonType.VIDEO, duration: 14, order: 1 },
          { title: "Lenguaje no verbal en el gimnasio", type: LessonType.VIDEO, duration: 11, order: 2 },
          { title: "Resolución de conflictos",          type: LessonType.VIDEO, duration: 16, order: 3 },
          { title: "Quiz de comunicación",              type: LessonType.QUIZ,  duration: 12, order: 4 },
        ],
      },
      {
        title: "Experiencia del socio", order: 2,
        lessons: [
          { title: "Journey del socio: alta a retención", type: LessonType.VIDEO, duration: 20, order: 1 },
          { title: "Gestión de quejas y reclamaciones",   type: LessonType.PDF,   duration: 10, order: 2 },
        ],
      },
    ],
  },
  {
    id:       "mkt-protocolo-apertura",
    title:    "Protocolo de Apertura y Cierre del Gimnasio",
    shortDesc: "Checklist diario, control de accesos, seguridad de instalaciones y procedimientos operativos estándar.",
    category: "Operaciones",
    isRequired: true,
    certificateEnabled: false,
    certificateType: "COMPLETION" as const,
    certificateValidityDays: null,
    modules: [
      {
        title: "Apertura", order: 1,
        lessons: [
          { title: "Checklist de apertura",               type: LessonType.PDF,   duration: 8,  order: 1 },
          { title: "Control de accesos y climatización",  type: LessonType.VIDEO, duration: 12, order: 2 },
          { title: "Inspección de equipos de fitness",    type: LessonType.VIDEO, duration: 15, order: 3 },
        ],
      },
      {
        title: "Cierre", order: 2,
        lessons: [
          { title: "Checklist de cierre",                 type: LessonType.PDF,   duration: 8,  order: 1 },
          { title: "Seguridad nocturna e incidentes",     type: LessonType.VIDEO, duration: 10, order: 2 },
          { title: "Evaluación operaciones",              type: LessonType.QUIZ,  duration: 10, order: 3 },
        ],
      },
    ],
  },
  {
    id:       "mkt-ventas-captacion",
    title:    "Técnicas de Venta y Captación de Socios",
    shortDesc: "Metodologías probadas para convertir visitas en altas y reducir la tasa de baja. Para personal de recepción.",
    category: "Ventas",
    isRequired: false,
    certificateEnabled: true,
    certificateType: "COMPLETION" as const,
    certificateValidityDays: null,
    modules: [
      {
        title: "El proceso de venta", order: 1,
        lessons: [
          { title: "La visita de prospección",        type: LessonType.VIDEO, duration: 18, order: 1 },
          { title: "Manejo de objeciones",            type: LessonType.VIDEO, duration: 22, order: 2 },
          { title: "Cierre de la venta",              type: LessonType.VIDEO, duration: 14, order: 3 },
          { title: "Test de ventas",                  type: LessonType.QUIZ,  duration: 15, order: 4 },
        ],
      },
      {
        title: "Fidelización", order: 2,
        lessons: [
          { title: "Retención proactiva del socio",   type: LessonType.VIDEO, duration: 16, order: 1 },
          { title: "Upselling de servicios premium",  type: LessonType.PDF,   duration: 8,  order: 2 },
        ],
      },
    ],
  },
  {
    id:       "mkt-higiene-instalaciones",
    title:    "Higiene y Limpieza de Instalaciones Fitness",
    shortDesc: "Protocolos de desinfección, productos autorizados y normativa de higiene para vestuarios, salas y equipos.",
    category: "Operaciones",
    isRequired: true,
    certificateEnabled: false,
    certificateType: "COMPLETION" as const,
    certificateValidityDays: null,
    modules: [
      {
        title: "Higiene en vestuarios y zonas comunes", order: 1,
        lessons: [
          { title: "Normativa sanitaria en gimnasios",   type: LessonType.PDF,   duration: 10, order: 1 },
          { title: "Protocolo de limpieza de vestuarios", type: LessonType.VIDEO, duration: 12, order: 2 },
          { title: "Desinfección de equipos de fitness",  type: LessonType.VIDEO, duration: 10, order: 3 },
          { title: "Evaluación de higiene",               type: LessonType.QUIZ,  duration: 10, order: 4 },
        ],
      },
    ],
  },
  {
    id:       "mkt-onboarding-monitor",
    title:    "Onboarding del Monitor de Fitness",
    shortDesc: "Todo lo que un nuevo monitor necesita saber: metodología de clases, seguridad del alumno y protocolo interno.",
    category: "Fitness",
    isRequired: true,
    certificateEnabled: true,
    certificateType: "PROFESSIONAL" as const,
    certificateValidityDays: 730,
    modules: [
      {
        title: "Tu rol como monitor", order: 1,
        lessons: [
          { title: "Responsabilidades del monitor",     type: LessonType.VIDEO, duration: 15, order: 1 },
          { title: "Metodología de clases grupales",    type: LessonType.VIDEO, duration: 20, order: 2 },
          { title: "Diseño de sesiones de entrenamiento", type: LessonType.PDF, duration: 12, order: 3 },
        ],
      },
      {
        title: "Seguridad del alumno", order: 2,
        lessons: [
          { title: "Evaluación inicial del alumno",     type: LessonType.VIDEO, duration: 18, order: 1 },
          { title: "Prevención de lesiones en sala",    type: LessonType.VIDEO, duration: 16, order: 2 },
          { title: "Test de certificación monitor",     type: LessonType.QUIZ,  duration: 20, order: 3 },
        ],
      },
    ],
  },
];

async function main() {
  console.log("🌱  Seed Marketplace Formia...\n");

  // ── Org marketplace ───────────────────────────────────────────────────
  const marketplaceOrg = await prisma.organization.upsert({
    where:  { id: MARKETPLACE_ORG_ID },
    update: {},
    create: {
      id:   MARKETPLACE_ORG_ID,
      name: "Formia Marketplace",
      slug: MARKETPLACE_ORG_SLUG,
      plan: "ENTERPRISE",
    },
  });
  console.log(`✅  Org marketplace: ${marketplaceOrg.name}`);

  // ── Actualizar org okeymas a PROFESSIONAL (para tener acceso al marketplace) ─
  const okeymasOrg = await prisma.organization.findUnique({ where: { id: "org-okeymas-001" } });
  if (okeymasOrg) {
    await prisma.organization.update({
      where: { id: "org-okeymas-001" },
      data:  { plan: "PROFESSIONAL" },
    });
    console.log(`✅  Org okeymas → plan PROFESSIONAL (acceso marketplace desbloqueado)`);
  }

  // ── Crear cursos marketplace ──────────────────────────────────────────
  for (const c of COURSES) {
    const { modules, ...courseData } = c;

    // Borrar curso existente para recrearlo con módulos frescos
    const existing = await prisma.course.findUnique({ where: { id: c.id } });
    if (existing) {
      await prisma.course.delete({ where: { id: c.id } });
    }

    const course = await prisma.course.create({
      data: {
        id:                      courseData.id,
        title:                   courseData.title,
        status:                  CourseStatus.PUBLISHED,
        isRequired:              courseData.isRequired,
        organizationId:          MARKETPLACE_ORG_ID,
        isMarketplace:           true,
        marketplaceCategory:     courseData.category,
        marketplaceShortDesc:    courseData.shortDesc,
        certificateEnabled:      courseData.certificateEnabled,
        certificateType:         courseData.certificateType,
        certificateValidityDays: courseData.certificateValidityDays,
        modules: {
          create: modules.map(mod => ({
            title: mod.title,
            order: mod.order,
            lessons: {
              create: mod.lessons.map(l => ({
                title:      l.title,
                type:       l.type,
                duration:   l.duration,
                order:      l.order,
                isRequired: true,
              })),
            },
          })),
        },
      },
    });

    const totalLessons = modules.reduce((s, m) => s + m.lessons.length, 0);
    console.log(`   ✅  [${courseData.category}] ${course.title}  (${modules.length} mód · ${totalLessons} lecc)`);
  }

  console.log(`
🎉  Marketplace listo!

📦  6 cursos disponibles en el catálogo:
   · Primeros Auxilios                   [Seguridad]
   · Atención al Socio de Excelencia     [Atención cliente]
   · Protocolo de Apertura y Cierre      [Operaciones]
   · Técnicas de Venta y Captación       [Ventas]
   · Higiene y Limpieza de Instalaciones [Operaciones]
   · Onboarding del Monitor de Fitness   [Fitness]

🔗  Visita /admin/marketplace para verlos e importarlos.
`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
