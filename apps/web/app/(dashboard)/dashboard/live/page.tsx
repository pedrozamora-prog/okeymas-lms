import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Video, Calendar, Clock, Users, Radio, PlayCircle } from "lucide-react";
import { format, isToday, isTomorrow, differenceInMinutes } from "date-fns";
import { es } from "date-fns/locale";
import { JoinClassButton } from "@/components/live/join-class-button";

export const metadata = { title: "Clases en Directo" };

export default async function LivePage() {
  const session = await auth();
  const user = session?.user as { id: string; organizationId: string };

  const now = new Date();

  const [upcoming, past] = await Promise.all([
    prisma.liveClass.findMany({
      where: { organizationId: user.organizationId, scheduledAt: { gte: new Date(now.getTime() - 30 * 60 * 1000) } },
      include: {
        instructor: { select: { name: true, image: true } },
        _count: { select: { attendance: true } },
      },
      orderBy: { scheduledAt: "asc" },
      take: 20,
    }),
    prisma.liveClass.findMany({
      where: { organizationId: user.organizationId, scheduledAt: { lt: new Date(now.getTime() - 30 * 60 * 1000) }, recordingUrl: { not: null } },
      include: { instructor: { select: { name: true } } },
      orderBy: { scheduledAt: "desc" },
      take: 10,
    }),
  ]);

  function getDateLabel(date: Date) {
    if (isToday(date)) return "Hoy";
    if (isTomorrow(date)) return "Mañana";
    return format(date, "EEEE d MMMM", { locale: es });
  }

  function isLive(cls: { scheduledAt: Date; durationMins: number }) {
    const start = cls.scheduledAt.getTime();
    const end = start + cls.durationMins * 60 * 1000;
    return now.getTime() >= start && now.getTime() <= end;
  }

  function minutesUntil(date: Date) {
    return differenceInMinutes(date, now);
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-foreground">Clases en Directo</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Únete a clases en tiempo real con tus instructores
        </p>
      </div>

      {/* Próximas clases */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Calendar className="w-4 h-4 text-yelau-yellow" />
          Próximas clases
        </h2>

        {upcoming.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <Video className="w-10 h-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No hay clases programadas próximamente</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {upcoming.map(cls => {
              const live = isLive(cls);
              const minsUntil = minutesUntil(cls.scheduledAt);
              const startsSoon = minsUntil > 0 && minsUntil <= 15;

              return (
                <Card key={cls.id} className={live ? "border-yelau-yellow/60 shadow-[0_0_20px_rgba(252,233,0,0.1)]" : ""}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <CardTitle className="text-sm font-semibold leading-snug">{cls.title}</CardTitle>
                      {live ? (
                        <Badge className="bg-red-500 text-white flex-shrink-0 animate-pulse">
                          <Radio className="w-3 h-3 mr-1" /> EN DIRECTO
                        </Badge>
                      ) : startsSoon ? (
                        <Badge className="bg-yelau-yellow text-yelau-black flex-shrink-0">
                          Empieza en {minsUntil}min
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="flex-shrink-0 text-xs">
                          {getDateLabel(cls.scheduledAt)}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {format(cls.scheduledAt, "HH:mm")} · {cls.durationMins}min
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" />
                        {cls._count.attendance} asistentes
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-yelau-yellow flex items-center justify-center flex-shrink-0">
                        <span className="text-yelau-black font-bold text-[10px]">
                          {cls.instructor.name.charAt(0)}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">{cls.instructor.name}</span>
                    </div>
                    <JoinClassButton
                      liveClassId={cls.id}
                      roomUrl={cls.roomUrl}
                      isLive={live}
                      scheduledAt={cls.scheduledAt.toISOString()}
                    />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Grabaciones */}
      {past.length > 0 && (
        <>
          <Separator />
          <section className="space-y-4">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <PlayCircle className="w-4 h-4 text-muted-foreground" />
              Grabaciones disponibles
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {past.map(cls => (
                <Card key={cls.id} className="hover:border-border/80 transition-colors">
                  <CardContent className="pt-4 pb-4 space-y-2">
                    <p className="text-sm font-medium text-foreground line-clamp-2">{cls.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(cls.scheduledAt, "d MMM yyyy · HH:mm", { locale: es })}
                    </p>
                    <Button variant="outline" size="sm" className="w-full mt-2" asChild>
                      <a href={cls.recordingUrl!} target="_blank" rel="noopener noreferrer">
                        <PlayCircle className="w-3.5 h-3.5" /> Ver grabación
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
