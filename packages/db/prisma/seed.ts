import { PrismaClient, Role, CourseStatus, LessonType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Yelau Fit LMS...");

  // ── ORGANIZACIÓN ──────────────────────────────────────────────────────
  const org = await prisma.organization.upsert({
    where: { slug: "yelau-madrid" },
    update: {},
    create: {
      name: "Yelau Group — Madrid",
      slug: "yelau-madrid",
    },
  });
  console.log(`✅ Organización: ${org.name}`);

  // ── USUARIOS ──────────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash("Admin1234!", 12);
  const userPassword  = await bcrypt.hash("User1234!", 12);

  const superAdmin = await prisma.user.upsert({
    where: { email: "admin@okeymas.com" },
    update: {},
    create: {
      name: "Elena Fernandez",
      email: "admin@okeymas.com",
      hashedPassword: adminPassword,
      role: Role.SUPER_ADMIN,
      organizationId: org.id,
    },
  });

  const instructor = await prisma.user.upsert({
    where: { email: "instructor@okeymas.com" },
    update: {},
    create: {
      name: "Laura Alan",
      email: "instructor@okeymas.com",
      hashedPassword: userPassword,
      role: Role.INSTRUCTOR,
      organizationId: org.id,
    },
  });

  const employee = await prisma.user.upsert({
    where: { email: "alumno@okeymas.com" },
    update: {},
    create: {
      name: "Pedro Zamora",
      email: "alumno@okeymas.com",
      hashedPassword: userPassword,
      role: Role.EMPLOYEE,
      organizationId: org.id,
    },
  });
  console.log(`✅ Usuarios: ${superAdmin.name}, ${instructor.name}, ${employee.name}`);

  // ── BADGES ────────────────────────────────────────────────────────────
  const badges = await Promise.all([
    prisma.badge.upsert({ where: { id: "badge-primer-curso" }, update: {}, create: { id: "badge-primer-curso",  name: "Primer Curso",     description: "Completaste tu primer curso",      imageUrl: "🎯", points: 50  } }),
    prisma.badge.upsert({ where: { id: "badge-maratonista" }, update: {}, create: { id: "badge-maratonista",   name: "Maratonista",      description: "5 cursos completados",             imageUrl: "🏃", points: 150 } }),
    prisma.badge.upsert({ where: { id: "badge-puntual"     }, update: {}, create: { id: "badge-puntual",       name: "Siempre Puntual",  description: "Asististe a 3 clases en directo",  imageUrl: "⏰", points: 75  } }),
    prisma.badge.upsert({ where: { id: "badge-experto"     }, update: {}, create: { id: "badge-experto",       name: "Experto Fitness",  description: "Aprobaste un quiz con 100%",       imageUrl: "💪", points: 100 } }),
  ]);
  console.log(`✅ Badges: ${badges.length} creados`);

  // ── CURSOS ────────────────────────────────────────────────────────────
  const curso1 = await prisma.course.upsert({
    where: { id: "course-bienvenida" },
    update: {},
    create: {
      id: "course-bienvenida",
      title: "Bienvenida a Yelau Group",
      description: "Conoce nuestra empresa, valores, cultura y protocolos básicos de trabajo.",
      status: CourseStatus.PUBLISHED,
      isRequired: true,
      order: 1,
      organizationId: org.id,
      modules: {
        create: [
          {
            title: "Introducción",
            order: 1,
            lessons: {
              create: [
                { title: "¿Quiénes somos?",          type: LessonType.VIDEO,  duration: 8,  order: 1, isRequired: true  },
                { title: "Nuestros valores",          type: LessonType.PDF,   duration: 5,  order: 2, isRequired: true  },
                { title: "Test de bienvenida",        type: LessonType.QUIZ,  duration: 10, order: 3, isRequired: true  },
              ],
            },
          },
          {
            title: "Protocolo y normativa",
            order: 2,
            lessons: {
              create: [
                { title: "Normas del gimnasio",       type: LessonType.VIDEO, duration: 12, order: 1, isRequired: true  },
                { title: "Atención al cliente",       type: LessonType.VIDEO, duration: 15, order: 2, isRequired: true  },
                { title: "Evaluación del módulo",     type: LessonType.QUIZ,  duration: 15, order: 3, isRequired: true  },
              ],
            },
          },
        ],
      },
    },
    include: { modules: { include: { lessons: true } } },
  });

  const curso2 = await prisma.course.upsert({
    where: { id: "course-seguridad" },
    update: {},
    create: {
      id: "course-seguridad",
      title: "Seguridad e Higiene en el Gimnasio",
      description: "Protocolos de seguridad, primeros auxilios y normas de higiene para instalaciones deportivas.",
      status: CourseStatus.PUBLISHED,
      isRequired: true,
      order: 2,
      organizationId: org.id,
      modules: {
        create: [
          {
            title: "Prevención de riesgos",
            order: 1,
            lessons: {
              create: [
                { title: "Riesgos laborales en gimnasios", type: LessonType.VIDEO, duration: 20, order: 1, isRequired: true },
                { title: "Equipos de protección",          type: LessonType.PDF,   duration: 10, order: 2, isRequired: true },
                { title: "Quiz de prevención",             type: LessonType.QUIZ,  duration: 15, order: 3, isRequired: true },
              ],
            },
          },
          {
            title: "Primeros auxilios",
            order: 2,
            lessons: {
              create: [
                { title: "RCP básico",                     type: LessonType.VIDEO, duration: 25, order: 1, isRequired: true },
                { title: "Clase en directo: RCP práctico", type: LessonType.LIVE_CLASS, duration: 60, order: 2, isRequired: false },
              ],
            },
          },
        ],
      },
    },
    include: { modules: { include: { lessons: true } } },
  });

  const curso3 = await prisma.course.upsert({
    where: { id: "course-ventas" },
    update: {},
    create: {
      id: "course-ventas",
      title: "Técnicas de Venta y Captación de Socios",
      description: "Estrategias de venta, captación y fidelización de clientes para personal de recepción.",
      status: CourseStatus.PUBLISHED,
      isRequired: false,
      order: 3,
      organizationId: org.id,
      modules: {
        create: [
          {
            title: "Fundamentos de ventas",
            order: 1,
            lessons: {
              create: [
                { title: "El proceso de venta",       type: LessonType.VIDEO, duration: 18, order: 1, isRequired: true },
                { title: "Manejo de objeciones",      type: LessonType.VIDEO, duration: 22, order: 2, isRequired: true },
                { title: "Test de ventas",            type: LessonType.QUIZ,  duration: 20, order: 3, isRequired: true },
              ],
            },
          },
        ],
      },
    },
    include: { modules: { include: { lessons: true } } },
  });
  console.log(`✅ Cursos: ${curso1.title}, ${curso2.title}, ${curso3.title}`);

  // ── QUIZ para la lección "Test de bienvenida" ─────────────────────────
  const testLesson = curso1.modules[0].lessons.find(l => l.title === "Test de bienvenida");
  if (testLesson) {
    await prisma.quiz.upsert({
      where: { lessonId: testLesson.id },
      update: {},
      create: {
        lessonId: testLesson.id,
        passingScore: 70,
        maxAttempts: 3,
        timeLimitMins: 10,
        questions: {
          create: [
            {
              text: "¿Cuántos gimnasios tiene Yelau Group?",
              order: 1,
              options: {
                create: [
                  { text: "1",  isCorrect: false, order: 1 },
                  { text: "3",  isCorrect: false, order: 2 },
                  { text: "5+", isCorrect: true,  order: 3 },
                  { text: "10", isCorrect: false, order: 4 },
                ],
              },
            },
            {
              text: "¿Cuál es el valor principal de Yelau Group?",
              order: 2,
              options: {
                create: [
                  { text: "Rapidez",           isCorrect: false, order: 1 },
                  { text: "Excelencia",        isCorrect: true,  order: 2 },
                  { text: "Precio bajo",       isCorrect: false, order: 3 },
                  { text: "Exclusividad",      isCorrect: false, order: 4 },
                ],
              },
            },
            {
              text: "¿Qué debes hacer si un cliente tiene una queja?",
              order: 3,
              options: {
                create: [
                  { text: "Ignorarla",                         isCorrect: false, order: 1 },
                  { text: "Escuchar y escalar al responsable", isCorrect: true,  order: 2 },
                  { text: "Decir que no es tu problema",       isCorrect: false, order: 3 },
                  { text: "Darle un descuento siempre",        isCorrect: false, order: 4 },
                ],
              },
            },
          ],
        },
      },
    });
    console.log("✅ Quiz de bienvenida creado");
  }

  // ── ENROLLMENTS del empleado de prueba ────────────────────────────────
  await prisma.enrollment.upsert({
    where: { userId_courseId: { userId: employee.id, courseId: curso1.id } },
    update: {},
    create: { userId: employee.id, courseId: curso1.id },
  });
  await prisma.enrollment.upsert({
    where: { userId_courseId: { userId: employee.id, courseId: curso2.id } },
    update: {},
    create: { userId: employee.id, courseId: curso2.id },
  });

  // Simula progreso en el primer módulo
  const primeraLeccion = curso1.modules[0].lessons[0];
  await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId: employee.id, lessonId: primeraLeccion.id } },
    update: {},
    create: { userId: employee.id, lessonId: primeraLeccion.id, completed: true, timeSpent: 480, completedAt: new Date() },
  });
  console.log("✅ Progreso de prueba para Ana García");

  // ── PUNTOS del empleado ───────────────────────────────────────────────
  await prisma.userPoints.upsert({
    where: { userId: employee.id },
    update: {},
    create: { userId: employee.id, total: 25 },
  });

  // ── CLASE EN DIRECTO programada ───────────────────────────────────────
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(18, 0, 0, 0);

  await prisma.liveClass.upsert({
    where: { id: "live-rcp-01" },
    update: {},
    create: {
      id: "live-rcp-01",
      title: "RCP Práctico — Sesión en Directo",
      scheduledAt: tomorrow,
      durationMins: 60,
      instructorId: instructor.id,
      organizationId: org.id,
    },
  });
  console.log(`✅ Clase en directo: mañana a las 18:00`);

  // ── RUTA DE APRENDIZAJE ───────────────────────────────────────────────
  await prisma.learningPath.upsert({
    where: { id: "path-onboarding" },
    update: {},
    create: {
      id: "path-onboarding",
      title: "Onboarding Nuevo Empleado",
      description: "Ruta completa para nuevos incorporaciones a Yelau Group",
      courses: {
        create: [
          { courseId: curso1.id, order: 1 },
          { courseId: curso2.id, order: 2 },
        ],
      },
    },
  });
  console.log("✅ Ruta de aprendizaje: Onboarding");

  console.log("\n🎉 Seed completado con éxito!\n");
  console.log("📧 Credenciales de prueba:");
  console.log("   Admin      → admin@okeymas.com      / Admin1234!");
  console.log("   Instructor → instructor@okeymas.com / User1234!");
  console.log("   Alumno     → alumno@okeymas.com     / User1234!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
