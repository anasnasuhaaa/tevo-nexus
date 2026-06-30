"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  FileText,
  Home,
  ImageIcon,
  Landmark,
  LayoutDashboard,
  Newspaper,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

import { LogoutButton } from "@/components/dashboard/logout-button";
import { cn } from "@/lib/utils";

const dashboardMenus = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Data Anggota",
    href: "/dashboard/members",
    icon: UsersRound,
  },
  {
    title: "Birdep",
    href: "/dashboard/birdep",
    icon: Landmark,
  },
  {
    title: "Program Kerja",
    href: "/dashboard/programs",
    icon: FileText,
  },
  {
    title: "Progress",
    href: "/dashboard/progress",
    icon: BarChart3,
  },
  {
    title: "Media",
    href: "/dashboard/media",
    icon: ImageIcon,
  },
  {
    title: "Konten Tevo",
    href: "/dashboard/tevo",
    icon: Newspaper,
  },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r bg-sidebar text-sidebar-foreground lg:flex lg:flex-col">
      <div className="flex h-16 shrink-0 items-center gap-3 border-b px-5">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <ShieldCheck className="size-5" />
        </div>

        <div>
          <p className="font-black leading-none">Nexus</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Internal System
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-hidden px-3 py-4">
        {dashboardMenus.map((menu) => {
          const Icon = menu.icon;
          const active = isActivePath(pathname, menu.href);

          return (
            <Link
              key={menu.href}
              href={menu.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className="size-4" />
              {menu.title}
            </Link>
          );
        })}
      </nav>

      <div className="shrink-0 border-t p-3">
        <Link
          href="/"
          className="mb-2 flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <Home className="size-4" />
          Halaman Awal
        </Link>

        <LogoutButton />
      </div>
    </aside>
  );
}