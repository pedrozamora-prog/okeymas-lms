import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { BarChart3 } from "lucide-react";
import { ReportExport } from "@/components/admin/report-export";

export const metadata = { title: "Informes — Mi equipo" };

export default async function ManagerReportsPage() {
  const session = await auth();
  const user = session?.user as { id: string; role: string; organizationId: string } | undefined;
  if (!user || user.role !== "MANAGER") redirect("/dashboard");

  const manager = await prisma.user.findUnique({
    where: { id: user.id },
    select: { department: true },
  });

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-yelau-yellow" />
          Informes de mi equipo
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Descarga el informe de formación filtrado a tu departamento
        </p>
      </div>

      <ReportExport fixedDept={manager?.department ?? undefined} />
    </div>
  );
}
