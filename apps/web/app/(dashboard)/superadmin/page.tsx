import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, BookOpen, Award, TrendingUp, Plus, Settings } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export const metadata = { title: "Super Admin — Formia" };

const PLAN_COLOR: Record<string, string> = {
  STARTER:      "bg-muted text-muted-foreground border-border",
  PROFESSIONAL: "bg-blue-50 text-blue-600 border-blue-200",
  CHAIN:        "bg-primary/10 text-primary border-primary/30",
  ENTERPRISE:   "bg-purple-50 text-purple-600 border-purple-200",
};

const PLAN_LABEL: Record<string, string> = {
  STARTER: "Starter", PROFESSIONAL: "Professional", CHAIN: "Chain", ENTERPRISE: "Enterprise",
};

export default async function SuperAdminPage() {
  const session = await auth();
  const user = session?.user as { role: string } | undefined;
  if (!user || user.role !== "SUPER_ADMIN") redirect("/dashboard");

  const orgs = await prisma.organization.findMany({
    include: {
      _count: { select: { users: true, courses: true } },
      users: {
        where: { role: "EMPLOYEE" },
        select: { id: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalOrgs     = orgs.length;
  const totalUsers    = orgs.reduce((a, o) => a + o._count.users, 0);
  const totalCourses  = orgs.reduce((a, o) => a + o._count.courses, 0);
  const activeOrgs    = orgs.filter(o => o.isActive).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground">Super Admin</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Panel de gestión de todas las organizaciones
          </p>
        </div>
        <Link
          href="/superadmin/orgs/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-yelau-black font-bold rounded-lg text-sm hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva organización
        </Link>
      </div>

      {/* KPIs globales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Organizaciones",  value: totalOrgs,   icon: Building2,  color: "text-blue-500",   bg: "bg-blue-50"   },
          { label: "Activas",         value: activeOrgs,  icon: TrendingUp, color: "text-green-600",  bg: "bg-green-50"  },
          { label: "Usuarios totales",value: totalUsers,  icon: Users,      color: "text-purple-500", bg: "bg-purple-50" },
          { label: "Cursos totales",  value: totalCourses,icon: BookOpen,   color: "text-primary",bg: "bg-primary/10" },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full ${s.bg} flex items-center justify-center flex-shrink-0`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div>
              <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabla de organizaciones */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left px-4 py-3 font-semibold text-foreground">Organización</th>
              <th className="text-left px-4 py-3 font-semibold text-foreground">Plan</th>
              <th className="text-left px-4 py-3 font-semibold text-foreground">Usuarios</th>
              <th className="text-left px-4 py-3 font-semibold text-foreground">Cursos</th>
              <th className="text-left px-4 py-3 font-semibold text-foreground">Vence</th>
              <th className="text-left px-4 py-3 font-semibold text-foreground">Estado</th>
              <th className="text-right px-4 py-3 font-semibold text-foreground">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {orgs.map((org, i) => {
              const pct = Math.round((org._count.users / org.maxUsers) * 100);
              const nearLimit = pct >= 80;
              return (
                <tr key={org.id} className={`border-b border-border last:border-0 ${i % 2 === 0 ? "" : "bg-muted/20"}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{org.name}</p>
                        <p className="text-xs text-muted-foreground">{org.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className={`text-[11px] ${PLAN_COLOR[org.plan]}`}>
                      {PLAN_LABEL[org.plan]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <span className={`text-sm font-semibold ${nearLimit ? "text-orange-500" : "text-foreground"}`}>
                        {org._count.users} / {org.maxUsers}
                      </span>
                      <div className="w-20 h-1 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${pct >= 100 ? "bg-red-500" : nearLimit ? "bg-orange-400" : "bg-green-500"}`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-foreground">{org._count.courses}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {org.planExpiresAt
                      ? format(new Date(org.planExpiresAt), "d MMM yyyy", { locale: es })
                      : <span className="text-green-500 text-xs">Sin vencimiento</span>
                    }
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className={org.isActive
                      ? "text-green-600 border-green-200 bg-green-50 text-[10px]"
                      : "text-muted-foreground text-[10px]"
                    }>
                      {org.isActive ? "Activa" : "Inactiva"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/superadmin/orgs/${org.id}`}
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      Gestionar
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
