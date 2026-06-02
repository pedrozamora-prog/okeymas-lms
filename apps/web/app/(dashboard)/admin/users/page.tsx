import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, ShieldCheck, BookOpen, Trophy, Clock } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { UsersClient } from "./users-client";

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

  const [users, pendingInvitations] = await Promise.all([
    prisma.user.findMany({
      where:   { organizationId: user.organizationId },
      include: { _count: { select: { enrollments: true } }, points: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.invitation.findMany({
      where:   { organizationId: user.organizationId, acceptedAt: null },
      include: { invitedBy: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const stats = {
    total:       users.length,
    admins:      users.filter(u => ["SUPER_ADMIN","BRANCH_ADMIN"].includes(u.role)).length,
    instructors: users.filter(u => u.role === "INSTRUCTOR").length,
    employees:   users.filter(u => u.role === "EMPLOYEE").length,
  };

  const serializedInvitations = pendingInvitations.map(inv => ({
    id:        inv.id,
    email:     inv.email,
    role:      inv.role,
    invitedBy: inv.invitedBy.name ?? "Admin",
    expiresAt: inv.expiresAt.toISOString(),
    createdAt: inv.createdAt.toISOString(),
    expired:   new Date() > inv.expiresAt,
  }));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-foreground">Usuarios</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gestión de empleados y accesos de tu organización
          </p>
        </div>
        <UsersClient invitations={serializedInvitations} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total usuarios",  value: stats.total,       icon: Users,       color: "text-foreground"    },
          { label: "Administradores", value: stats.admins,      icon: ShieldCheck,  color: "text-yelau-yellow" },
          { label: "Instructores",    value: stats.instructors, icon: BookOpen,     color: "text-purple-400"   },
          { label: "Empleados",       value: stats.employees,   icon: Trophy,       color: "text-blue-400"     },
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

      {/* Invitaciones pendientes */}
      {serializedInvitations.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">
              Invitaciones pendientes
              <Badge variant="outline" className="ml-2 text-[10px]">{serializedInvitations.length}</Badge>
            </h2>
          </div>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {serializedInvitations.map(inv => (
                  <div key={inv.id} className="flex items-center gap-4 px-6 py-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-muted-foreground">
                        {inv.email.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{inv.email}</p>
                      <p className="text-[11px] text-muted-foreground">
                        Invitado por {inv.invitedBy} · {formatDistanceToNow(new Date(inv.createdAt), { addSuffix: true, locale: es })}
                      </p>
                    </div>
                    <Badge variant="outline" className={`text-[10px] flex-shrink-0 ${roleColor[inv.role] ?? ""}`}>
                      {roleLabel[inv.role] ?? inv.role}
                    </Badge>
                    <Badge variant="outline" className={`text-[10px] flex-shrink-0 ${
                      inv.expired
                        ? "border-red-500/30 text-red-400 bg-red-500/10"
                        : "border-amber-500/30 text-amber-500 bg-amber-500/10"
                    }`}>
                      {inv.expired ? "Caducada" : "Pendiente"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Listado de usuarios */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Listado de usuarios ({users.length})</CardTitle>
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
                <Badge variant="outline" className={`flex-shrink-0 text-[11px] ${roleColor[u.role] ?? ""}`}>
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
