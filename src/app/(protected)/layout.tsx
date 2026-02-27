"use client";

import { useAuth } from "@/context/auth-context";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import LoadingBar from "@/components/loading-bar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Video,
  Image as ImageIcon,
  TrendingUp,
  Menu,
  X,
  StickyNote,
  User,
  ChevronsLeft,
  ChevronsRight,
  House,
  PanelLeft,
  LogOut,
} from "lucide-react";

type NavItem = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  match: (path: string) => boolean;
};

type NavGroup = {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  match: (path: string) => boolean;
  children: { name: string; href: string; match: (path: string) => boolean }[];
};

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { logout, user } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [masterOpen, setMasterOpen] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const navigationItems: NavItem[] = useMemo(
    () => [
      {
        name: "Início",
        href: "/home",
        icon: House,
        match: (path) => path === "/home",
      },
      {
        name: "Pacotes de Vídeos",
        href: "/combos",
        icon: Video,
        match: (path) => path === "/combos" || path.startsWith("/videos"),
      },
      {
        name: "Artes",
        href: "/arts",
        icon: ImageIcon,
        match: (path) => path === "/arts",
      },
      {
        name: "Adesivos",
        href: "/stickers",
        icon: StickyNote,
        match: (path) => path === "/stickers",
      },
    ],
    []
  );

  const masterGroup: NavGroup = useMemo(
    () => ({
      name: "Master",
      icon: TrendingUp,
      match: (path) => path.startsWith("/master"),
      children: [
        {
          name: "Comissões Master",
          href: "/master/commissions",
          match: (path) => path.startsWith("/master/commissions"),
        },
        {
          name: "Controle Master",
          href: "/master/control",
          match: (path) => path.startsWith("/master/control"),
        },
        {
          name: "Divulgador Master",
          href: "/master/promoter",
          match: (path) => path.startsWith("/master/promoter"),
        },
      ],
    }),
    []
  );

  const renderSidebarContent = (isMobile = false) => (
    <div className="h-full flex flex-col">
      <div className="h-14 border-b px-3 flex items-center justify-between gap-2">
        <Link href="/home" className="flex items-center gap-2 min-w-0">
          <Image
            src="/logo.png"
            alt="Master Afiliados Logo"
            width={28}
            height={28}
            className="rounded-md"
          />
          {(!sidebarCollapsed || isMobile) && (
            <span className="font-semibold truncate">Master Afiliados</span>
          )}
        </Link>

        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarCollapsed((prev) => !prev)}
          >
            {sidebarCollapsed ? (
              <ChevronsRight className="w-4 h-4" />
            ) : (
              <ChevronsLeft className="w-4 h-4" />
            )}
          </Button>
        )}
      </div>

      <div className="px-3 pt-3 pb-2 border-b min-h-[98px]">
        {mounted && user && (!sidebarCollapsed || isMobile) ? (
          <div className="rounded-lg border border-border/70 bg-muted/20 p-3 space-y-2">
            <div className="text-sm font-medium truncate">
              {user?.name || user?.username || "Master Afiliados"}
            </div>
            <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
            <div className="inline-flex items-center rounded-md border border-blue-500/40 bg-blue-500/10 px-2 py-1 text-xs text-blue-300">
              Créditos de IA: {typeof user?.credits === "number" ? user.credits : 0}
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-2">
        {navigationItems.map((item) => {
          const active = item.match(pathname);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => isMobile && setMobileMenuOpen(false)}
              className={cn(
                "flex items-center rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
              )}
              title={sidebarCollapsed && !isMobile ? item.name : undefined}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {(!sidebarCollapsed || isMobile) && (
                <span className="ml-2 truncate">{item.name}</span>
              )}
            </Link>
          );
        })}

        <div className="pt-1">
          <button
            type="button"
            onClick={() => setMasterOpen((prev) => !prev)}
            className={cn(
              "w-full flex items-center rounded-md px-3 py-2 text-sm transition-colors",
              masterGroup.match(pathname)
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
            )}
            title={sidebarCollapsed && !isMobile ? masterGroup.name : undefined}
          >
            <masterGroup.icon className="w-4 h-4 shrink-0" />
            {(!sidebarCollapsed || isMobile) && (
              <>
                <span className="ml-2 truncate">{masterGroup.name}</span>
                <span className="ml-auto text-xs">{masterOpen ? "-" : "+"}</span>
              </>
            )}
          </button>

          {masterOpen && (!sidebarCollapsed || isMobile) && (
            <div className="mt-1 ml-5 border-l pl-2 space-y-1">
              {masterGroup.children.map((subItem) => {
                const active = subItem.match(pathname);
                return (
                  <Link
                    key={subItem.href}
                    href={subItem.href}
                    onClick={() => isMobile && setMobileMenuOpen(false)}
                    className={cn(
                      "block rounded-md px-2 py-1.5 text-sm transition-colors",
                      active
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
                    )}
                  >
                    {subItem.name}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="border-t p-2 space-y-1">
        <Link
          href="/profile"
          onClick={() => isMobile && setMobileMenuOpen(false)}
          className={cn(
            "flex items-center rounded-md px-3 py-2 text-sm transition-colors",
            pathname.startsWith("/profile")
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
          )}
          title={sidebarCollapsed && !isMobile ? "Perfil" : undefined}
        >
          <User className="w-4 h-4 shrink-0" />
          {(!sidebarCollapsed || isMobile) && <span className="ml-2">Perfil</span>}
        </Link>

        <button
          type="button"
          onClick={logout}
          className="w-full flex items-center rounded-md px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
          title={sidebarCollapsed && !isMobile ? "Sair" : undefined}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {(!sidebarCollapsed || isMobile) && <span className="ml-2">Sair</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-screen w-full bg-background text-foreground overflow-hidden">
      <LoadingBar />

      <div className="h-full flex">
        <aside
          className={cn(
            "hidden md:flex border-r bg-card h-full transition-[width] duration-200",
            sidebarCollapsed ? "w-16" : "w-64"
          )}
        >
          {renderSidebarContent(false)}
        </aside>

        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            <button
              type="button"
              aria-label="Fechar menu"
              className="absolute inset-0 bg-black/60"
              onClick={() => setMobileMenuOpen(false)}
            />
            <aside className="relative w-72 max-w-[85vw] h-full bg-card border-r z-10">
              {renderSidebarContent(true)}
            </aside>
          </div>
        )}

        <div className="flex-1 min-w-0 flex flex-col">
          <header className="h-14 border-b bg-background/95 backdrop-blur px-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="hidden md:inline-flex"
                onClick={() => setSidebarCollapsed((prev) => !prev)}
              >
                <PanelLeft className="w-4 h-4" />
              </Button>
            </div>

            <div className="hidden md:block flex-1" />

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </header>

          <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
