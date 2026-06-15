import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Users, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TiltCard } from "@/components/ui/tilt-card";

interface CourseCardProps {
  course: {
    id: string;
    title: string;
    description?: string | null;
    thumbnailUrl?: string | null;
    isRequired: boolean;
    modules: { lessons: { id: string }[] }[];
    _count: { enrollments: number };
  };
  enrolled: boolean;
  progress: number;
  avgRating?: number | null;
  ratingCount?: number;
}

export function CourseCard({ course, enrolled, progress, avgRating, ratingCount = 0 }: CourseCardProps) {
  const totalLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0);

  return (
    <div className="@container">
      <TiltCard>
      <Card className="flex flex-col h-full hover:border-primary/50 transition-colors group">
        {/* Thumbnail */}
        <div className="h-36 rounded-t-xl relative overflow-hidden bg-gradient-to-br from-muted to-muted/50">
          {course.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={course.thumbnailUrl}
              alt={course.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <BookOpen className="w-10 h-10 text-muted-foreground/30 group-hover:text-primary/50 transition-colors" />
            </div>
          )}
          {course.isRequired && (
            <Badge className="absolute top-3 left-3 bg-primary text-yelau-black text-[10px] font-bold">
              Obligatorio
            </Badge>
          )}
          {enrolled && progress === 100 && (
            <Badge className="absolute top-3 right-3 bg-green-500 text-white text-[10px]">
              Completado
            </Badge>
          )}
        </div>

        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold leading-snug line-clamp-2">
            {course.title}
          </CardTitle>
          {course.description && (
            <CardDescription className="text-xs line-clamp-2">
              {course.description}
            </CardDescription>
          )}
        </CardHeader>

        <CardContent className="flex flex-col gap-3 mt-auto">
          {/* Meta */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              {totalLessons} lecciones
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {course._count.enrollments}
            </span>
            {avgRating != null && (
              <span className="flex items-center gap-1 ml-auto text-yellow-500 font-semibold">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                {avgRating.toFixed(1)}
                {ratingCount > 0 && (
                  <span className="text-muted-foreground font-normal">({ratingCount})</span>
                )}
              </span>
            )}
          </div>

          {/* Barra de progreso si inscrito */}
          {enrolled && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Progreso</span>
                <span className="font-semibold text-foreground">{progress}%</span>
              </div>
              <Progress value={progress} className="h-1.5" />
            </div>
          )}

          {/* CTA */}
          <Button
            asChild
            variant={enrolled ? "default" : "outline"}
            size="sm"
            className="w-full mt-1"
          >
            <Link href={`/dashboard/courses/${course.id}`}>
              {enrolled ? (progress > 0 ? "Continuar" : "Empezar") : "Ver curso"}
            </Link>
          </Button>
        </CardContent>
      </Card>
      </TiltCard>
    </div>
  );
}
