import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Trophy, Award, BookOpen, CheckCircle, Star, Download,
  Mail, Phone, Building2, Calendar, Medal, GraduationCap, MessageCircle,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { EditProfileDialog } from "@/components/profile/edit-profile-dialog";

const ROLE_LABEL: Record<string, string> = {
  EMPLOYEE:     "Empleado",
  INSTRUCTOR:   "Instructor",
  BRANCH_ADMIN: "Admin de sede",
  SUPER_ADMIN:  "Super admin",
  MANAGER:      "Manager",
};

export default async function ProfilePage() {
  const session = await auth();
  const user = session?.user as { id: string; name?: string | null; email?: string | null; role?: string; organizationId?: string } | undefined;
  if (!user?.id) redirect("/login");

  const [dbUser, userPoints, certificates, userBadges, enrollments] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true, name: true, email: true, image: true, role: true,
        phone: true, whatsappPhone: true, createdAt: true,
        department: { select: { name: true } },
        organization: { select: { name: true } },
      },
    }),
    prisma.userPoints.findUnique({ where: { userId: user.id } }),
    prisma.certificate.findMany({
      where: { userId: user.id },
      orderBy: { issuedAt: "desc" },
    }),
    prisma.userBadge.findMany({
      where: { userId: user.id },
      include: { badge: true },
      orderBy: { earnedAt: "desc" },
    }),
    prisma.enrollment.findMany({
      where: { userId: user.id },
      include: {
        course: {
          include: {
            modules: {
              include: { lessons: { select: { id: true } } },
            },
          },
        },
      },
    }),
  ]);

  if (!dbUser) redirect("/login");

  // Progreso por curso
  const allLessonIds = enrollments.flatMap(e =>
    e.course.modules.flatMap(m => m.lessons.map(l => l.id))
  );
  const completedProgress = allLessonIds.length > 0
    ? await prisma.lessonProgress.findMany({
        where: { userId: user.id, lessonId: { in: allLessonIds }, completed: true },
        select: { lessonId: true },
      })
    : [];
  const completedSet = new Set(completedProgress.map(p => p.lessonId));

  const courseStats = enrollments.map(e => {
    const lessonIds = e.course.modules.flatMap(m => m.lessons.map(l => l.id));
    const done = lessonIds.filter(id => completedSet.has(id)).length;
    return { courseId: e.courseId, title: e.course.title, total: lessonIds.length, done };
  });

  const completedCourses = courseStats.filter(c => c.total > 0 && c.done === c.total).length;
  const initials = (dbUser.name ?? "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* Header: avatar + datos personales */}
      <Card>
        <CardContent className="pt-6 pb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">

            {/* Avatar */}
            <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/20">
              <span className="text-yelau-black text-2xl font-black">{initials}</span>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h1 className="text-xl font-black text-foreground leading-tight">{dbUser.name}</h1>
                  <p className="text-sm text-muted-foreground mt-0.5">{ROLE_LABEL[dbUser.role] ?? dbUser.role}</p>
                </div>
                <Badge variant="outline" className="text-xs border-primary/30 text-primary bg-primary/5 flex-shrink-0">
                  {dbUser.organization?.name}
                </Badge>
              </div>
              <div className="flex flex-col sm:flex-row gap-x-4 gap-y-1 text-xs text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-primary/60" /> {dbUser.email}
                </span>
                {dbUser.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-primary/60" /> {dbUser.phone}
                  </span>
                )}
                {(dbUser as { whatsappPhone?: string | null }).whatsappPhone && (
                  <span className="flex items-center gap-1.5 text-green-500">
                    <MessageCircle className="w-3.5 h-3.5" />
                    {(dbUser as { whatsappPhone?: string | null }).whatsappPhone}
                  </span>
                )}
                {dbUser.department && (
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-primary/60" /> {dbUser.department.name}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-primary/60" />
                  Miembro desde {format(dbUser.createdAt, "MMM yyyy", { locale: es })}
                </span>
              </div>
              <div className="mt-3">
                <EditProfileDialog
                  initialName={dbUser.name ?? ""}
                  initialPhone={dbUser.phone ?? null}
                  initialWhatsappPhone={(dbUser as { whatsappPhone?: string | null }).whatsappPhone ?? null}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Puntos XP",      value: userPoints?.total ?? 0,    icon: Trophy,       color: "text-yellow-400",  bg: "bg-yellow-400/10"  },
          { label: "Cursos completos",value: completedCourses,          icon: CheckCircle,  color: "text-green-400",   bg: "bg-green-400/10"   },
          { label: "Certificados",    value: certificates.length,       icon: Award,        color: "text-orange-400",  bg: "bg-orange-400/10"  },
          { label: "Insignias",       value: userBadges.length,         icon: Medal,        color: "text-primary",     bg: "bg-primary/10"     },
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="hover:border-border/80 transition-colors">
              <CardContent className="flex items-center gap-3 pt-4 pb-4">
                <div className={`p-2.5 rounded-xl ${stat.bg} flex-shrink-0`}>
                  <Icon className={`w-4 h-4 ${stat.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-xl font-black text-foreground leading-none">{stat.value}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Insignias */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Medal className="w-4 h-4 text-primary" />
            Mis insignias
          </CardTitle>
        </CardHeader>
        <CardContent>
          {userBadges.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
              <Medal className="w-8 h-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Aún no has ganado ninguna insignia.</p>
              <p className="text-xs text-muted-foreground/60">Completa cursos y actividades para desbloquearlas.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {userBadges.map(ub => (
                <div key={ub.badgeId} className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border/50">
                  {ub.badge.imageUrl ? (
                    <img src={ub.badge.imageUrl} alt={ub.badge.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Star className="w-5 h-5 text-primary" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{ub.badge.name}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {format(new Date(ub.earnedAt), "d MMM yyyy", { locale: es })}
                    </p>
                    {ub.badge.points > 0 && (
                      <p className="text-[10px] text-yellow-400">+{ub.badge.points} XP</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Certificados */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Award className="w-4 h-4 text-primary" />
            Mis certificados
          </CardTitle>
        </CardHeader>
        <CardContent>
          {certificates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
              <GraduationCap className="w-8 h-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Aún no tienes certificados.</p>
              <p className="text-xs text-muted-foreground/60">Completa un curso para obtener el tuyo.</p>
              <Button asChild size="sm" variant="outline" className="mt-1">
                <Link href="/dashboard/courses">Ver cursos</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {certificates.map(cert => (
                <div key={cert.id} className="flex items-center gap-4 p-3 rounded-xl bg-muted/40 border border-border/50">
                  <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                    <Award className="w-5 h-5 text-orange-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{cert.courseTitle}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Emitido el {format(new Date(cert.issuedAt), "d MMM yyyy", { locale: es })}
                      {cert.expiresAt && (
                        <span className="ml-2 text-amber-500">
                          · Válido hasta {format(new Date(cert.expiresAt), "d MMM yyyy", { locale: es })}
                        </span>
                      )}
                    </p>
                  </div>
                  {cert.fileUrl && (
                    <Button asChild size="sm" variant="outline" className="gap-1.5 flex-shrink-0 text-xs">
                      <a href={cert.fileUrl} target="_blank" rel="noopener noreferrer">
                        <Download className="w-3.5 h-3.5" />
                        Descargar
                      </a>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Progreso en cursos */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center justify-between">
            <span className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              Mis cursos
            </span>
            <Link href="/dashboard/courses" className="text-xs text-primary/70 hover:text-primary font-normal transition-colors">
              Ver todos →
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {courseStats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
              <BookOpen className="w-8 h-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No estás inscrito en ningún curso.</p>
              <Button asChild size="sm" variant="outline" className="mt-1">
                <Link href="/dashboard/courses">Explorar cursos</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {courseStats.map(c => {
                const pct = c.total > 0 ? Math.round((c.done / c.total) * 100) : 0;
                const isCompleted = c.total > 0 && c.done === c.total;
                return (
                  <Link key={c.courseId} href={`/dashboard/courses/${c.courseId}`}>
                    <div className="p-3 rounded-xl bg-muted/40 border border-border/50 hover:border-primary/30 hover:bg-muted/60 transition-all space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-foreground truncate">{c.title}</p>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {isCompleted && (
                            <Badge className="text-[10px] bg-green-500/10 text-green-400 border-green-500/20 border">
                              <CheckCircle className="w-2.5 h-2.5 mr-1" />
                              Completado
                            </Badge>
                          )}
                          <span className="text-xs font-bold text-primary">{pct}%</span>
                        </div>
                      </div>
                      <Progress value={pct} className="h-1.5" />
                      <p className="text-[11px] text-muted-foreground">{c.done} de {c.total} lecciones</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
