import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, ShieldCheck, BookOpen, Trophy } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export const metadata = { title: "Usuarios" };

const roleLabel: Record<string, string> = {
  SUPER_ADMIN:  "Super Admin",
  BRANCH_ADMIN: "Admin",
  MANAGER:      "Mánager",
  INSTRUCTOR:   "Instructor",
  EMPLOYEE:     "Empleado",
};
const roleColor: Record<string, string> = {
  SUPER_ADMIN:  "bg-yelau-yellow/20 text-yelau-yellow border-yelau-yellow/30",
  BRANCH_ADMIN: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  MANAGER:      "bg-green-500/20 text-green-600 border-green-500/30",
  INSTRUCTOR:   "bg-purple-500/20 text-purple-400 border-purple-500/30",
  EMPLOYEE:     "bg-muted text-muted-foreground",
};

export default async function UsersPage() {
  const session = await auth();
  const user = session?.user as { id: string; role: string; organizationId: string };

  if (!["SUPER_ADMIN", "BRANCH_ADMIN"].includes(user.role)) redirect("/dashboard");

  const users = await prisma.user.findMany({
    where: { organizationId: user.organizationId },
    include: {
      _count: { select: { enrollments: true } },
      points: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const stats = {
    total:       users.length,
    admins:      users.filter(u => ["SUPER_ADMIN","BRANCH_ADMIN"].includes(u.role)).length,
    instructors: users.filter(u => u.role === "INSTRUCTOR").length,
    employees:   users.filter(u => u.role === "EMPLOYEE").length,
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground">Usuarios</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gestión de empleados y accesos de tu organización
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total usuarios",  value: stats.total,       icon: Users,      color: "text-foreground"    },
          { label: "Administradores", value: stats.admins,      icon: ShieldCheck, color: "text-yelau-yellow" },
          { label: "Instructores",    value: stats.instructors, icon: BookOpen,    color: "text-purple-400"   },
          { label: "Empleados",       value: stats.employees,   icon: Trophy,      color: "text-blue-400"     },
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="pt-5 pb-5 flex flex-col items-center text-center gap-2">
                <Icon className={`w-5 h-5 ${stat.color}`} />
                <p className="text-2xl font-black text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* User table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Listado de usuarios</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {users.map(u => (
              <div key={u.id} className="flex items-center gap-4 px-6 py-4 hover:bg-muted/30 transition-colors">
                <Avatar className="h-9 w-9 flex-shrink-0">
                  <AvatarFallback className="bg-yelau-yellow/20 text-yelau-yellow font-bold text-sm">
                    {(u.name ?? u.email).charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{u.name ?? "—"}</p>
                  <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                </div>

                <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-muted-foreground">{u._count.enrollments} cursos</span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">{u.points?.total ?? 0} pts</span>
                </div>

                <Badge
                  variant="outline"
                  className={`flex-shrink-0 text-[11px] ${roleColor[u.role] ?? ""}`}
                >
                  {roleLabel[u.role] ?? u.role}
                </Badge>

                <p className="hidden lg:block text-xs text-muted-foreground flex-shrink-0 w-24 text-right">
                  {format(u.createdAt, "d MMM yyyy", { locale: es })}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
