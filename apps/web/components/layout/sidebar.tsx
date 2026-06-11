"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/layout/notification-bell";
import { GlobalSearch } from "@/components/layout/global-search";
import { useI18n, LOCALES } from "@/lib/i18n-context";
import {
  LayoutDashboard,
  BookOpen,
  Video,
  Trophy,
  Award,
  Users,
  Settings,
  LogOut,
  GraduationCap,
  BarChart3,
  Menu,
  X,
  LibraryBig,
  ShieldCheck,
  HardHat,
  Zap,
  Building2,
  AlertTriangle,
  Globe,
  ChevronDown,
  Target,
  Briefcase,
  ScrollText,
  GitBranch,
  Store,
  CreditCard,
  Plug,
  MessageSquare,
  Sparkles,
  UserCircle,
  BellRing,
} from "lucide-react";

interface NavItem {
  href: string;
  labelKey: string;
  labelFallback: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
}

const navItems: NavItem[] = [
  { href: "/dashboard",             labelKey: "nav.home",          labelFallback: "Inicio",               icon: LayoutDashboard },
  { href: "/dashboard/courses",     labelKey: "nav.myCourses",     labelFallback: "Mis cursos",           icon: BookOpen },
  { href: "/dashboard/live",        labelKey: "nav.liveClasses",   labelFallback: "Clases en directo",    icon: Video },
  { href: "/dashboard/paths",       labelKey: "nav.learningPaths", labelFallback: "Rutas de aprendizaje", icon: GraduationCap },
  { href: "/dashboard/achievements",labelKey: "nav.achievements",  labelFallback: "Logros",               icon: Trophy },
  { href: "/dashboard/certificates",labelKey: "nav.certificates",  labelFallback: "Certificados",         icon: Award  },
  { href: "/dashboard/skills",       labelKey: "nav.skills",        labelFallback: "Mis competencias",     icon: Target },
  { href: "/dashboard/simulations", labelKey: "",                  labelFallback: "Simulador IA",         icon: MessageSquare },
  { href: "/dashboard/leaderboard", labelKey: "",                  labelFallback: "Clasificación",        icon: Trophy },
  { href: "/dashboard/profile",     labelKey: "",                  labelFallback: "Mi perfil",            icon: UserCircle },
];

const adminItems: NavItem[] = [
  { href: "/admin/insights",           labelKey: "",                    labelFallback: "Insights IA",       icon: Sparkles,        roles: ["SUPER_ADMIN", "BRANCH_ADMIN"] },
  { href: "/admin/inactivity",         labelKey: "",                    labelFallback: "Inactividad",       icon: BellRing,        roles: ["SUPER_ADMIN", "BRANCH_ADMIN"] },
  { href: "/admin/scenarios",        labelKey: "",                    labelFallback: "Simulador IA",      icon: MessageSquare,   roles: ["SUPER_ADMIN", "BRANCH_ADMIN"] },
  { href: "/admin/courses",          labelKey: "admin.manageCourses", labelFallback: "Gestión cursos",    icon: LibraryBig,      roles: ["SUPER_ADMIN", "BRANCH_ADMIN", "INSTRUCTOR"] },
  { href: "/admin/certificates",     labelKey: "nav.certificates",    labelFallback: "Certificados",      icon: Award,           roles: ["SUPER_ADMIN", "BRANCH_ADMIN"] },
  { href: "/admin/compliance",       labelKey: "admin.compliance",    labelFallback: "Cumplimiento",      icon: ShieldCheck,     roles: ["SUPER_ADMIN", "BRANCH_ADMIN"] },
  { href: "/admin/prl",              labelKey: "admin.prl",           labelFallback: "PRL / Seguridad",   icon: HardHat,         roles: ["SUPER_ADMIN", "BRANCH_ADMIN"] },
  { href: "/admin/alerts",           labelKey: "admin.riskAlerts",    labelFallback: "Alertas de riesgo", icon: AlertTriangle,   roles: ["SUPER_ADMIN", "BRANCH_ADMIN"] },
  { href: "/admin/enrollment-rules", labelKey: "admin.autoEnroll",    labelFallback: "Auto-inscripción",  icon: Zap,             roles: ["SUPER_ADMIN", "BRANCH_ADMIN"] },
  { href: "/admin/users",            labelKey: "admin.users",         labelFallback: "Usuarios",          icon: Users,           roles: ["SUPER_ADMIN", "BRANCH_ADMIN"] },
  { href: "/admin/reports",          labelKey: "admin.reports",       labelFallback: "Reportes",          icon: BarChart3,       roles: ["SUPER_ADMIN", "BRANCH_ADMIN"] },
  { href: "/admin/competencies",     labelKey: "admin.competencies",  labelFallback: "Competencias",      icon: Target,          roles: ["SUPER_ADMIN", "BRANCH_ADMIN"] },
  { href: "/admin/job-roles",        labelKey: "admin.jobRoles",      labelFallback: "Puestos de trabajo",icon: Briefcase,       roles: ["SUPER_ADMIN", "BRANCH_ADMIN"] },
  { href: "/admin/learning-paths",   labelKey: "admin.learningPaths", labelFallback: "Rutas de aprendizaje", icon: GitBranch,   roles: ["SUPER_ADMIN", "BRANCH_ADMIN"] },
  { href: "/admin/departments",        labelKey: "",                    labelFallback: "Departamentos",     icon: Building2,       roles: ["SUPER_ADMIN", "BRANCH_ADMIN"] },
  { href: "/admin/integrations",      labelKey: "",                    labelFallback: "Integraciones HRIS",icon: Plug,            roles: ["SUPER_ADMIN", "BRANCH_ADMIN"] },
  { href: "/admin/marketplace",       labelKey: "admin.marketplace",   labelFallback: "Marketplace",       icon: Store,           roles: ["SUPER_ADMIN", "BRANCH_ADMIN"] },
  { href: "/admin/billing",           labelKey: "",                    labelFallback: "Facturación",        icon: CreditCard,      roles: ["SUPER_ADMIN"] },
  { href: "/admin/audit-logs",       labelKey: "admin.auditLogs",     labelFallback: "Logs de auditoría", icon: ScrollText,      roles: ["SUPER_ADMIN"] },
  { href: "/admin/settings",         labelKey: "admin.settings",      labelFallback: "Configuración",     icon: Settings,        roles: ["SUPER_ADMIN"] },
  { href: "/__divider_formia__",     labelKey: "",                    labelFallback: "──── Formia ────",  icon: Building2,       roles: ["SUPER_ADMIN"] },
  { href: "/superadmin",             labelKey: "",                    labelFallback: "Organizaciones",    icon: Building2,       roles: ["SUPER_ADMIN"] },
  { href: "/superadmin/marketplace", labelKey: "",                   labelFallback: "Publicar al marketplace", icon: Store,      roles: ["SUPER_ADMIN"] },
  { href: "/manager/team",           labelKey: "admin.myTeam",        labelFallback: "Mi equipo",         icon: Users,           roles: ["MANAGER"] },
  { href: "/manager/compliance",     labelKey: "admin.compliance",    labelFallback: "Cumplimiento",      icon: ShieldCheck,     roles: ["MANAGER"] },
  { href: "/manager/reports",        labelKey: "admin.reports",       labelFallback: "Informes",          icon: BarChart3,       roles: ["MANAGER"] },
];

interface SidebarProps {
  userRole:    string;
  userName:    string;
  userEmail:   string;
  orgLogoUrl?: string | null;
  orgName?:    string | null;
}

export function Sidebar({ userRole, userName, userEmail, orgLogoUrl, orgName }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const { t, locale, setLocale } = useI18n();

  // Cierra el drawer al navegar
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  // Bloquea scroll del body cuando el drawer está abierto
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const visibleAdminItems = adminItems.filter(
    (item) => !item.roles || item.roles.includes(userRole)
  );

  const NavContent = ({ open }: { open: boolean }) => (
    <>
      {/* Logo */}
      <div className="px-4 py-3 border-b border-border flex-shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0">
          {orgLogoUrl ? (
            <img src={orgLogoUrl} alt={orgName ?? "Logo"} className="h-9 w-auto object-contain max-w-[160px]" />
          ) : (
            <Image src="/logo.png" alt="Formia" width={400} height={100} className="w-full h-auto object-contain object-left" priority />
          )}
        </Link>
      </div>

      {/* Búsqueda global */}
      <div className="px-3 pt-2 pb-1">
        <GlobalSearch />
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item, i) => (
          <SidebarLink key={item.href} item={item} pathname={pathname} index={i} open={open} t={t} />
        ))}

        {visibleAdminItems.length > 0 && (
          <>
            <div className="pt-5 pb-1.5 px-3">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                {t("admin.administration")}
              </p>
            </div>
            {visibleAdminItems.map((item, i) => (
              <SidebarLink key={item.href} item={item} pathname={pathname} index={navItems.length + i + 1} open={open} t={t} />
            ))}
          </>
        )}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-border flex-shrink-0">
        <div className="flex items-center justify-between px-2 mb-2">
          <NotificationBell />
        </div>
        <Link href="/dashboard/profile" className="flex items-center gap-3 px-2 mb-1 rounded-md hover:bg-muted py-1.5 transition-colors group">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 group-hover:ring-2 group-hover:ring-primary/40 transition-all">
            <span className="text-yelau-black font-bold text-sm">
              {userName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{userName}</p>
            <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
          </div>
        </Link>

        {/* Language selector */}
        <div className="mb-1">
          <button
            onClick={() => setLangOpen((v) => !v)}
            className="flex items-center gap-2.5 w-full min-h-[44px] px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
          >
            <Globe className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1 text-left">{t("common.language")}</span>
            <span className="text-base leading-none">{LOCALES.find((l) => l.value === locale)?.flag}</span>
            <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200", langOpen && "rotate-180")} />
          </button>
          {langOpen && (
            <div className="mt-0.5 rounded-md overflow-hidden border border-border bg-card">
              {LOCALES.map((loc) => (
                <button
                  key={loc.value}
                  onClick={() => { setLocale(loc.value); setLangOpen(false); }}
                  className={cn(
                    "flex items-center gap-2.5 w-full px-3 py-2 text-sm transition-colors",
                    locale === loc.value
                      ? "bg-primary text-yelau-black font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <span className="text-base">{loc.flag}</span>
                  {loc.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-2.5 w-full min-h-[44px] px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {t("nav.logout")}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* ── MOBILE TOP BAR ──────────────────────────────────────────── */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-card border-b border-border flex items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <img src="/Formia-mark.svg" alt="" className="h-8 w-8 flex-shrink-0" />
          <span className="text-[16px] font-black tracking-tight leading-none">
            <span className="text-primary">For</span><span className="text-foreground">mia</span>
          </span>
        </Link>
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Abrir menú"
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md hover:bg-muted transition-colors"
        >
          <Menu className="w-5 h-5 text-foreground" />
        </button>
      </header>

      {/* ── MOBILE DRAWER OVERLAY ────────────────────────────────────── */}
      <div
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
        className={cn(
          "lg:hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-sm",
          "transition-opacity duration-300",
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
      />

      {/* ── MOBILE DRAWER ────────────────────────────────────────────── */}
      <aside
        className={cn(
          "lg:hidden fixed top-0 left-0 z-50 h-full w-72 bg-card border-r border-border flex flex-col",
          "transition-all duration-500",
          mobileOpen
            ? "translate-x-0 shadow-2xl shadow-black/50"
            : "-translate-x-full shadow-none"
        )}
        style={{ transitionTimingFunction: mobileOpen ? "cubic-bezier(0.34,1.56,0.64,1)" : "cubic-bezier(0.4,0,0.2,1)" }}
        aria-label="Menú de navegación"
      >
        {/* Close button */}
        <button
          onClick={() => setMobileOpen(false)}
          aria-label="Cerrar menú"
          className="absolute top-3 right-3 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md hover:bg-muted transition-colors"
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </button>
        <NavContent open={mobileOpen} />
      </aside>

      {/* ── DESKTOP SIDEBAR ──────────────────────────────────────────── */}
      <aside className="hidden lg:flex w-64 min-h-screen bg-card border-r border-border flex-col flex-shrink-0">
        <NavContent open={true} />
      </aside>
    </>
  );
}

function SidebarLink({ item, pathname, index = 0, open = true, t }: {
  item: NavItem;
  pathname: string;
  index?: number;
  open?: boolean;
  t: (key: string) => string;
}) {
  if (item.href.startsWith("/__divider_")) {
    return (
      <div className="pt-4 pb-1 px-3">
        <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest">
          {item.labelFallback}
        </p>
      </div>
    );
  }

  const isActive =
    pathname === item.href ||
    (item.href !== "/dashboard" && pathname.startsWith(item.href));
  const Icon = item.icon;
  const label = item.labelKey ? t(item.labelKey) : item.labelFallback;

  return (
    <Link
      href={item.href}
      style={{
        transitionDelay: open ? `${index * 40}ms` : "0ms",
        transform: open ? "translateX(0) scale(1)" : "translateX(-8px) scale(0.97)",
        opacity: open ? 1 : 0,
        transition: "transform 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.25s ease, background-color 0.15s ease, color 0.15s ease",
      }}
      className={cn(
        "flex items-center gap-3 px-3 rounded-md text-sm font-medium",
        "min-h-[44px]",
        "hover:scale-[1.02] active:scale-[0.98]",
        isActive
          ? "bg-primary text-yelau-black shadow-sm shadow-primary/30"
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
      )}
    >
      <Icon className={cn("w-4 h-4 flex-shrink-0 transition-transform duration-200", isActive && "scale-110")} />
      {label}
    </Link>
  );
}
