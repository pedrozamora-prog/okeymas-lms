import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { sendNewEnrollmentEmail, OrgEmailConfig } from "@/lib/email";
import { sendPushToMany } from "@/lib/push";
import { getOrgWhatsAppConfig, sendWhatsAppMessage } from "@/lib/whatsapp";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const admin = session?.user as { id: string; role: string; organizationId: string } | undefined;

  if (!admin || !["SUPER_ADMIN", "BRANCH_ADMIN", "INSTRUCTOR"].includes(admin.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id: courseId } = await params;

  // Verificar que el curso pertenece a la org
  const course = await prisma.course.findFirst({
    where: { id: courseId, organizationId: admin.organizationId },
    select: { title: true, organizationId: true },
  });
  if (!course) return NextResponse.json({ error: "Curso no encontrado" }, { status: 404 });

  const body = await req.json();
  const departments: string[] = body.departments ?? [];
  const userIds:     string[]     = body.userIds     ?? [];
  const deadline:    Date | null  = body.deadline ? new Date(body.deadline) : null;
  const notify:      boolean      = body.notify !== false; // true por defecto

  if (departments.length === 0 && userIds.length === 0) {
    return NextResponse.json({ error: "Selecciona al menos un departamento o usuario" }, { status: 400 });
  }

  // Obtener usuarios a inscribir
  const users = await prisma.user.findMany({
    where: {
      organizationId: admin.organizationId,
      isActive: true,
      OR: [
        ...(departments.length > 0 ? [{ departmentId: { in: departments } }] : []),
        ...(userIds.length > 0     ? [{ id: { in: userIds } }]             : []),
      ],
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    select: { id: true, name: true, email: true, whatsappPhone: true } as any,
  });

  if (users.length === 0) {
    return NextResponse.json({ error: "No se encontraron usuarios con los criterios seleccionados" }, { status: 404 });
  }

  // Obtener inscripciones ya existentes
  const existing = await prisma.enrollment.findMany({
    where: { courseId, userId: { in: users.map(u => u.id) } },
    select: { userId: true },
  });
  const existingIds = new Set(existing.map(e => e.userId));

  // Org config (email + whatsapp)
  const org = await prisma.organization.findUnique({
    where:  { id: admin.organizationId },
    select: { emailFromName: true, emailFromAddress: true, emailReplyTo: true, resendApiKey: true, notifyNewEnrollment: true },
  });
  const waCfg = await getOrgWhatsAppConfig(prisma as Parameters<typeof getOrgWhatsAppConfig>[0], admin.organizationId);
  const emailCfg: OrgEmailConfig = {
    fromName:    org?.emailFromName,
    fromAddress: org?.emailFromAddress,
    replyTo:     org?.emailReplyTo,
    resendApiKey: org?.resendApiKey,
  };

  const toEnroll = users.filter(u => !existingIds.has(u.id));
  const skipped  = users.filter(u => existingIds.has(u.id));

  // Inscribir en lote
  if (toEnroll.length > 0) {
    await prisma.enrollment.createMany({
      data: toEnroll.map(u => ({
        userId:   u.id,
        courseId,
        deadline: deadline ?? undefined,
        autoEnrolled: false,
      })),
      skipDuplicates: true,
    });

    // Notificaciones in-app
    await prisma.notification.createMany({
      data: toEnroll.map(u => ({
        userId:  u.id,
        type:    "NEW_ENROLLMENT" as const,
        title:   "Nueva formación asignada",
        message: `Se te ha inscrito en el curso "${course.title}".`,
      })),
      skipDuplicates: true,
    });

    // Emails + Push (fire & forget)
    if (notify) {
      if (org?.notifyNewEnrollment) {
        Promise.allSettled(
          toEnroll.map(u =>
            sendNewEnrollmentEmail(u.email, u.name, course.title, deadline, emailCfg)
          )
        );
      }
      sendPushToMany(
        toEnroll.map(u => u.id),
        {
          title: "Nueva formación asignada",
          body:  `Se te ha inscrito en "${course.title}"`,
          url:   "/dashboard/courses",
          tag:   `enrollment-${course.title.slice(0, 20)}`,
        }
      );

      // WhatsApp (fire & forget — only if enabled and user has phone)
      if (waCfg?.enabled) {
        const usersWithPhone = (toEnroll as { id: string; name: string; email: string; whatsappPhone?: string | null }[])
          .filter(u => u.whatsappPhone);
        if (usersWithPhone.length > 0) {
          Promise.allSettled(
            usersWithPhone.map(u =>
              sendWhatsAppMessage(
                waCfg,
                u.whatsappPhone!,
                `📚 Hola ${u.name.split(" ")[0]}, se te ha inscrito en el curso *"${course.title}"* en Formia. ¡Empieza cuando quieras!`,
                { externalId: `formia_enroll_${u.id}_${courseId}`, metadata: { course_id: courseId, user_id: u.id } }
              )
            )
          );
        }
      }
    }
  }

  return NextResponse.json({
    ok:       true,
    enrolled: toEnroll.length,
    skipped:  skipped.length,
    total:    users.length,
  });
}

// GET — preview: cuántos usuarios se inscribirían y cuántos ya están
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const admin = session?.user as { role: string; organizationId: string } | undefined;
  if (!admin || !["SUPER_ADMIN", "BRANCH_ADMIN", "INSTRUCTOR"].includes(admin.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id: courseId } = await params;
  const { searchParams } = new URL(req.url);
  const departments = searchParams.getAll("dept");

  const [allUsers, enrolled] = await Promise.all([
    prisma.user.findMany({
      where: {
        organizationId: admin.organizationId,
        isActive: true,
        ...(departments.length > 0 ? { departmentId: { in: departments } } : {}),
      },
      select: { id: true, name: true, email: true, departmentId: true, department: { select: { name: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.enrollment.findMany({
      where: { courseId },
      select: { userId: true, status: true },
    }),
  ]);

  const enrolledIds = new Set(enrolled.map(e => e.userId));

  return NextResponse.json({
    users: allUsers.map(u => ({
      ...u,
      enrolled: enrolledIds.has(u.id),
    })),
    enrolledCount: enrolled.length,
  });
}
