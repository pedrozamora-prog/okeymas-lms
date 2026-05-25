"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
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
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
}

const navItems: NavItem[] = [
  { href: "/dashboard",             label: "Inicio",               icon: LayoutDashboard },
  { href: "/dashboard/courses",     label: "Mis cursos",           icon: BookOpen },
  { href: "/dashboard/live",        label: "Clases en directo",    icon: Video },
  { href: "/dashboard/paths",       label: "Rutas de aprendizaje", icon: GraduationCap },
  { href: "/dashboard/achievements",label: "Logros",               icon: Trophy },
  { href: "/dashboard/certificates",label: "Certificados",         icon: Award },
];

const adminItems: NavItem[] = [
  { href: "/admin/courses",       label: "Gestión cursos", icon: LibraryBig, roles: ["SUPER_ADMIN", "BRANCH_ADMIN", "INSTRUCTOR"] },
  { href: "/admin/certificates",  label: "Certificados",   icon: Award,      roles: ["SUPER_ADMIN", "BRANCH_ADMIN"] },
  { href: "/admin/users",         label: "Usuarios",       icon: Users,      roles: ["SUPER_ADMIN", "BRANCH_ADMIN"] },
  { href: "/admin/reports",       label: "Reportes",       icon: BarChart3,  roles: ["SUPER_ADMIN", "BRANCH_ADMIN"] },
  { href: "/admin/settings",      label: "Configuración",  icon: Settings,   roles: ["SUPER_ADMIN"] },
];

interface SidebarProps {
  userRole: string;
  userName: string;
  userEmail: string;
}

export function Sidebar({ userRole, userName, userEmail }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

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
      <div className="p-4 border-b border-border flex-shrink-0">
        <Link href="/dashboard" className="flex items-center gap-3">
          <Image src="/logo.png" alt="Okeymas LMS" width={44} height={44} className="h-11 w-11 object-contain flex-shrink-0" priority />
          <div className="leading-tight">
            <p className="text-sm font-black tracking-widest uppercase text-foreground">OKEYMAS</p>
            <p className="text-xs font-bold tracking-widest uppercase text-yelau-yellow">LMS</p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item, i) => (
          <SidebarLink key={item.href} item={item} pathname={pathname} index={i} open={open} />
        ))}

        {visibleAdminItems.length > 0 && (
          <>
            <div className="pt-5 pb-1.5 px-3">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                Administración
              </p>
            </div>
            {visibleAdminItems.map((item, i) => (
              <SidebarLink key={item.href} item={item} pathname={pathname} index={navItems.length + i + 1} open={open} />
            ))}
          </>
        )}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-border flex-shrink-0">
        <div className="flex items-center gap-3 px-2 mb-1">
          <div className="w-8 h-8 rounded-full bg-yelau-yellow flex items-center justify-center flex-shrink-0">
            <span className="text-yelau-black font-bold text-sm">
              {userName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{userName}</p>
            <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-2.5 w-full min-h-[44px] px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          Cerrar sesión
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* ── MOBILE TOP BAR ──────────────────────────────────────────── */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-card border-b border-border flex items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center">
          <Image src="/logo.png" alt="Okeymas LMS" width={100} height={32} className="h-7 w-auto object-contain" priority />
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

function SidebarLink({ item, pathname, index = 0, open = true }: {
  item: NavItem;
  pathname: string;
  index?: number;
  open?: boolean;
}) {
  const isActive =
    pathname === item.href ||
    (item.href !== "/dashboard" && pathname.startsWith(item.href));
  const Icon = item.icon;

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
          ? "bg-yelau-yellow text-yelau-black shadow-sm shadow-yelau-yellow/30"
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
      )}
    >
      <Icon className={cn("w-4 h-4 flex-shrink-0 transition-transform duration-200", isActive && "scale-110")} />
      {item.label}
    </Link>
  );
}
