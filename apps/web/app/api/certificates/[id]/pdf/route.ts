export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { CertificateDocument } from "@/components/certificates/certificate-template";
import { createElement } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const user = session?.user as { id: string } | undefined;
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;

  const cert = await prisma.certificate.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true } },
      course: {
        select: {
          certSignerName:  true,
          certSignerTitle: true,
          organization: {
            select: { name: true, logoUrl: true },
          },
        },
      },
    },
  });

  if (!cert) return NextResponse.json({ error: "Certificado no encontrado" }, { status: 404 });
  if (cert.userId !== user.id) {
    // Admins también pueden descargar — verificar rol
    const fullUser = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true, organizationId: true } });
    const isAdmin = ["SUPER_ADMIN", "BRANCH_ADMIN"].includes(fullUser?.role ?? "");
    if (!isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const org = cert.course?.organization;

  const pdfBuffer = await renderToBuffer(
    createElement(CertificateDocument, {
      studentName:  cert.user.name ?? "Alumno",
      courseName:   cert.courseTitle,
      certType:     cert.type as "COMPLETION" | "PROFESSIONAL",
      issuedAt:     format(cert.issuedAt, "d 'de' MMMM 'de' yyyy", { locale: es }),
      certId:       cert.id.slice(0, 12).toUpperCase(),
      signerName:   cert.course?.certSignerName  ?? "Director de Formación",
      signerTitle:  cert.course?.certSignerTitle ?? "Okeymas LMS",
      logoUrl:      org?.logoUrl ?? undefined,
      orgName:      org?.name ?? "Okeymas LMS",
    })
  );

  return new Response(pdfBuffer, {
    headers: {
      "Content-Type":        "application/pdf",
      "Content-Disposition": `attachment; filename="certificado-${cert.id.slice(0, 8)}.pdf"`,
    },
  });
}
