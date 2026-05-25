import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Award, Download, Calendar, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export const metadata = { title: "Certificados" };

export default async function CertificatesPage() {
  const session = await auth();
  const user = session?.user as { id: string; name?: string | null };

  const certificates = await prisma.certificate.findMany({
    where: { userId: user.id },
    orderBy: { issuedAt: "desc" },
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-foreground">Certificados</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Tus certificados de formación obtenidos en Okeymas LMS
        </p>
      </div>

      {certificates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <Award className="w-8 h-8 text-muted-foreground/40" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Aún no tienes certificados</p>
            <p className="text-sm text-muted-foreground mt-1">
              Completa un curso para obtener tu primer certificado
            </p>
          </div>
          <Button variant="outline" asChild>
            <a href="/dashboard/courses">Ver cursos disponibles</a>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {certificates.map(cert => {
            const isExpired = cert.expiresAt && new Date(cert.expiresAt) < new Date();
            const expiresSoon = cert.expiresAt &&
              !isExpired &&
              differenceInDays(new Date(cert.expiresAt), new Date()) <= 30;

            return (
              <Card key={cert.id} className={isExpired ? "opacity-60" : "hover:border-yelau-yellow/40 transition-colors"}>
                {/* Certificate header */}
                <div className="h-32 bg-gradient-to-br from-yelau-yellow/20 to-muted rounded-t-xl flex items-center justify-center relative">
                  <Award className="w-12 h-12 text-yelau-yellow/60" />
                  {isExpired && (
                    <Badge className="absolute top-2 right-2 bg-red-500 text-white text-[10px]">
                      Expirado
                    </Badge>
                  )}
                  {expiresSoon && (
                    <Badge className="absolute top-2 right-2 bg-orange-500 text-white text-[10px]">
                      Expira pronto
                    </Badge>
                  )}
                </div>

                <CardContent className="pt-4 pb-4 space-y-3">
                  <div>
                    <p className="font-semibold text-sm text-foreground line-clamp-2">{cert.courseTitle}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{user.name}</p>
                  </div>

                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3 h-3" />
                      Emitido: {format(cert.issuedAt, "d MMM yyyy", { locale: es })}
                    </div>
                    {cert.expiresAt && (
                      <div className={`flex items-center gap-1.5 ${isExpired || expiresSoon ? "text-orange-400" : ""}`}>
                        <AlertCircle className="w-3 h-3" />
                        Válido hasta: {format(cert.expiresAt, "d MMM yyyy", { locale: es })}
                      </div>
                    )}
                  </div>

                  <a
                    href={`/api/certificates/${cert.id}/pdf`}
                    download
                    className="inline-flex items-center justify-center gap-2 w-full h-8 px-3 text-xs font-medium rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Descargar PDF
                  </a>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function differenceInDays(a: Date, b: Date) {
  return Math.floor((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
}
