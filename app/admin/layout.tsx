"use client";

import { useLayoutEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const navItems = [
  {
    href: "/admin/integrantes",
    label: "Integrantes",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="size-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    href: "/admin/treinos",
    label: "Treinos",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="size-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
  },
  {
    href: "/admin/relatorio",
    label: "Relatório",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="size-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
      </svg>
    ),
  },
  {
    href: "/admin/configuracoes",
    label: "Configurações",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="size-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    ),
  },
];

// Ícone de seta (chevron duplo)
function ChevronIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="size-4 shrink-0"
      style={{ transform: collapsed ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 300ms" }}
      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
      strokeLinecap="round" strokeLinejoin="round"
    >
      <polyline points="11 17 6 12 11 7"/><polyline points="18 17 13 12 18 7"/>
    </svg>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  // useLayoutEffect roda antes do browser pintar → sem flash
  useLayoutEffect(() => {
    setCollapsed(localStorage.getItem("admin-sidebar-collapsed") === "true");
  }, []);

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("admin-sidebar-collapsed", String(next));
      return next;
    });
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* ── Sidebar (só desktop) ─────────────────────────────────────────────── */}
      <aside
        style={{ width: collapsed ? 64 : 240 }}
        className="hidden md:flex shrink-0 bg-[#152426] text-[#F5F5F5] flex-col transition-[width] duration-300 overflow-hidden"
      >
        {/* ── Topo: logo + botão de colapso ─────────────────────────────────── */}
        <div className={`flex items-center p-3 gap-2 ${collapsed ? "justify-center" : "justify-between"}`}>
          {/* Logo + nome */}
          <Link
            href="/"
            title="Ir para o totem"
            className="flex items-center gap-2 group min-w-0"
          >
            <Image
              src="/logo.png"
              alt="Cheer"
              width={32}
              height={32}
              className="object-contain shrink-0"
            />
            {!collapsed && (
              <span className="font-display text-sm text-[#23ADBA] group-hover:text-[#59BED0] transition-colors leading-none whitespace-nowrap overflow-hidden">
                Cheer Presença
              </span>
            )}
          </Link>

          {/* Botão colapsar — sempre visível no topo */}
          <button
            onClick={toggle}
            title={collapsed ? "Expandir menu" : "Recolher menu"}
            className="cursor-pointer shrink-0 p-1.5 rounded-md text-[#96D3DE]/60 hover:bg-[#1e3537] hover:text-[#96D3DE] transition-colors"
          >
            <ChevronIcon collapsed={collapsed} />
          </button>
        </div>

        <div className="mx-3 h-px bg-[#1e3537]" />

        {/* ── Nav ────────────────────────────────────────────────────────────── */}
        <nav className="flex flex-col gap-1 p-2 flex-1 mt-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={`cursor-pointer flex items-center gap-3 rounded-md text-sm font-medium transition-colors whitespace-nowrap
                  ${collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2"}
                  ${isActive
                    ? "bg-[#23ADBA] text-[#F5F5F5]"
                    : "text-[#96D3DE] hover:bg-[#1e3537] hover:text-[#F5F5F5]"
                  }`}
              >
                {item.icon}
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 p-4 md:p-8 min-w-0 pb-20 md:pb-8">{children}</main>

      {/* ── Bottom nav (só mobile) ───────────────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#152426] border-t border-[#1e3537] flex">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors ${
                isActive
                  ? "text-[#23ADBA]"
                  : "text-[#96D3DE]/60 hover:text-[#96D3DE]"
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
