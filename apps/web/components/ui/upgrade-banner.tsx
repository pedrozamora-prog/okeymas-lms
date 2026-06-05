import { Lock, Zap } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface UpgradeBannerProps {
  feature:      string;       // Human-readable feature name
  requiredPlan: string;       // e.g. "Professional"
  currentPlan:  string;       // e.g. "Starter"
  className?:   string;
  compact?:     boolean;      // Inline/badge variant
}

export function UpgradeBanner({ feature, requiredPlan, currentPlan, className, compact = false }: UpgradeBannerProps) {
  if (compact) {
    return (
      <span className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold",
        "bg-amber-500/10 text-amber-600 border border-amber-500/20",
        className
      )}>
        <Lock className="w-2.5 h-2.5" />
        {requiredPlan}+
      </span>
    );
  }

  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-20 gap-5 text-center",
      className
    )}>
      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
        <Lock className="w-7 h-7 text-amber-500" />
      </div>
      <div className="max-w-sm">
        <p className="text-lg font-bold text-foreground">{feature}</p>
        <p className="text-sm text-muted-foreground mt-1">
          Esta función requiere el plan{" "}
          <span className="font-semibold text-amber-600">{requiredPlan}</span> o superior.
          Tu plan actual es <span className="font-semibold">{currentPlan}</span>.
        </p>
      </div>
      <Link
        href="/admin/settings?tab=plan"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-yelau-black font-bold rounded-lg text-sm hover:bg-primary/90 transition-colors"
      >
        <Zap className="w-4 h-4" />
        Actualizar plan
      </Link>
    </div>
  );
}
