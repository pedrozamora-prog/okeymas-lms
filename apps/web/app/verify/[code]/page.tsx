import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ShieldCheck, XCircle, Award, Calendar, Building2, User, BookOpen, Clock, ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";

interface Props { params: Promise<{ code: string }> }

const TYPE_LABELS: Record<string, string> = {
  COMPLETION:   "Certificado de Finalización",
  PROFESSIONAL: "Certificado Profesional",
};

export async function generateMetadata({ params }: Props) {
  const { code } = await params;
  return { title: `Verificación — ${code} · Formia` };
}

export default async function VerifyCertPage({ params }: Props) {
  const { code } = await params;
  const clean = code.toUpperCase();

  // Buscar por los primeros 12 chars del ID (formato usado en el PDF)
  const cert = await prisma.certificate.findFirst({
    where: {
      id: { startsWith: clean.toLowerCase() },
    },
    include: {
      user:   { select: { name: true, email: true } },
      course: { select: { title: true, description: true } },
    },
  });

  const now       = new Date();
  const isExpired = cert?.expiresAt ? cert.expiresAt < now : false;
  const isValid   = !!cert && !isExpired;

  return (
    <div className="min-h-screen bg-[#f8f8f8] flex flex-col">

      {/* Header */}
      <header className="bg-[#0C0C0C] px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <img src="/formia-logo.svg" alt="Formia" className="h-9 w-auto" />
          <Link
            href="/verify"
            className="flex items-center gap-1.5 text-[#666] hover:text-white transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Verificar otro
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-xl space-y-6">

          {/* Estado principal */}
          {isValid ? (
            <div className="bg-white rounded-2xl border-2 border-green-400 shadow-sm overflow-hidden">

              {/* Banner válido */}
              <div className="bg-green-500 px-6 py-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-white font-black text-lg leading-tight">Certificado verificado</p>
                  <p className="text-green-100 text-xs">Este certificado es auténtico y fue emitido por Formia</p>
                </div>
                <div className="ml-auto bg-white/20 rounded-full px-3 py-1">
                  <span className="text-white text-xs font-bold tracking-wider">VÁLIDO</span>
                </div>
              </div>

              {/* Datos del certificado */}
              <div className="p-6 space-y-5">

                {/* Tipo de certificado */}
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-[#A855F7]" />
                  <span className="font-black text-[#0C0C0C] text-lg">
                    {TYPE_LABELS[cert!.type] ?? cert!.type}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4">

                  {/* Empleado */}
                  <div className="flex items-start gap-3 p-4 bg-[#f8f8f8] rounded-xl">
                    <div className="w-9 h-9 rounded-full bg-[#A855F7]/20 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-[#0C0C0C]" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#999] uppercase tracking-wider mb-0.5">Emitido a</p>
                      <p className="font-bold text-[#0C0C0C]">{cert!.user.name}</p>
                      <p className="text-sm text-[#777]">{cert!.user.email}</p>
                    </div>
                  </div>

                  {/* Curso */}
                  <div className="flex items-start gap-3 p-4 bg-[#f8f8f8] rounded-xl">
                    <div className="w-9 h-9 rounded-full bg-[#A855F7]/20 flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-4 h-4 text-[#0C0C0C]" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#999] uppercase tracking-wider mb-0.5">Curso completado</p>
                      <p className="font-bold text-[#0C0C0C]">{cert!.courseTitle}</p>
                      {cert!.course?.description && (
                        <p className="text-xs text-[#888] mt-1 line-clamp-2">{cert!.course.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Fecha de emisión */}
                    <div className="flex items-start gap-3 p-4 bg-[#f8f8f8] rounded-xl">
                      <Calendar className="w-4 h-4 text-[#A855F7] flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-[#999] uppercase tracking-wider mb-0.5">Emitido el</p>
                        <p className="font-bold text-sm text-[#0C0C0C]">
                          {format(cert!.issuedAt, "d MMM yyyy", { locale: es })}
                        </p>
                      </div>
                    </div>

                    {/* Caducidad */}
                    <div className="flex items-start gap-3 p-4 bg-[#f8f8f8] rounded-xl">
                      <Clock className="w-4 h-4 text-[#A855F7] flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-[#999] uppercase tracking-wider mb-0.5">Válido hasta</p>
                        <p className="font-bold text-sm text-[#0C0C0C]">
                          {cert!.expiresAt
                            ? format(cert!.expiresAt, "d MMM yyyy", { locale: es })
                            : "Sin caducidad"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Código */}
                <div className="flex items-center justify-between pt-4 border-t border-[#eee]">
                  <div>
                    <p className="text-[10px] font-semibold text-[#999] uppercase tracking-wider">Código de verificación</p>
                    <p className="font-mono font-bold text-[#0C0C0C] tracking-widest text-sm mt-0.5">{clean}</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#999]">
                    <Building2 className="w-3.5 h-3.5" />
                    <span className="text-xs">Formia</span>
                  </div>
                </div>
              </div>
            </div>

          ) : cert && isExpired ? (
            /* Certificado caducado */
            <div className="bg-white rounded-2xl border-2 border-amber-400 shadow-sm overflow-hidden">
              <div className="bg-amber-500 px-6 py-4 flex items-center gap-3">
                <Clock className="w-8 h-8 text-white flex-shrink-0" />
                <div>
                  <p className="text-white font-black text-lg">Certificado caducado</p>
                  <p className="text-amber-100 text-xs">
                    Este certificado venció el {format(cert.expiresAt!, "d 'de' MMMM 'de' yyyy", { locale: es })}
                  </p>
                </div>
                <div className="ml-auto bg-white/20 rounded-full px-3 py-1">
                  <span className="text-white text-xs font-bold tracking-wider">CADUCADO</span>
                </div>
              </div>
              <div className="p-6 space-y-3">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-[#999]" />
                  <span className="text-sm text-[#444]">{cert.user.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#999]" />
                  <span className="text-sm text-[#444]">{cert.courseTitle}</span>
                </div>
                <p className="text-xs text-[#999] pt-2 border-t border-[#eee]">
                  El certificado fue emitido pero ha superado su fecha de validez. Contacta con la organización para renovarlo.
                </p>
              </div>
            </div>

          ) : (
            /* No encontrado */
            <div className="bg-white rounded-2xl border-2 border-red-300 shadow-sm overflow-hidden">
              <div className="bg-red-500 px-6 py-4 flex items-center gap-3">
                <XCircle className="w-8 h-8 text-white flex-shrink-0" />
                <div>
                  <p className="text-white font-black text-lg">Certificado no encontrado</p>
                  <p className="text-red-100 text-xs">No existe ningún certificado con el código <strong>{clean}</strong></p>
                </div>
                <div className="ml-auto bg-white/20 rounded-full px-3 py-1">
                  <span className="text-white text-xs font-bold tracking-wider">INVÁLIDO</span>
                </div>
              </div>
              <div className="p-6 space-y-3">
                <p className="text-sm text-[#555]">Posibles motivos:</p>
                <ul className="text-sm text-[#777] space-y-1.5 list-disc list-inside">
                  <li>El código fue introducido con errores — comprueba mayúsculas y números</li>
                  <li>El certificado puede haber sido revocado</li>
                  <li>El código no pertenece a un certificado emitido por Formia</li>
                </ul>
              </div>
            </div>
          )}

          {/* CTA volver */}
          <div className="text-center">
            <Link
              href="/verify"
              className="inline-flex items-center gap-2 text-sm text-[#666] hover:text-[#0C0C0C] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Verificar otro certificado
            </Link>
          </div>
        </div>
      </main>

      <footer className="py-6 px-4 border-t border-[#eee] text-center">
        <p className="text-xs text-[#999]">
          © {new Date().getFullYear()} Formia · Sistema de verificación de certificados
        </p>
      </footer>
    </div>
  );
}
