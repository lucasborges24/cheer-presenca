"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/admin/integrantes", label: "Integrantes" },
  { href: "/admin/treinos", label: "Treinos" },
  { href: "/admin/relatorio", label: "Relatório" },
  { href: "/admin/configuracoes", label: "Configurações" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <aside className="w-full md:w-60 shrink-0 bg-[#152426] text-[#F5F5F5]">
        <div className="p-5">
          {/* Logo + marca */}
          <Link href="/" className="flex items-center gap-3 mb-7 group">
            <Image
              src="/logo.png"
              alt="Cheer logo"
              width={38}
              height={38}
              className="object-contain rounded-sm"
            />
            <span className="font-display text-lg text-[#23ADBA] group-hover:text-[#59BED0] transition-colors leading-none">
              Cheer Presença
            </span>
          </Link>

          <p className="text-xs text-[#96D3DE]/50 uppercase tracking-wider mb-3">Admin</p>
          <nav className="flex md:flex-col gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`cursor-pointer px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname === item.href
                    ? "bg-[#23ADBA] text-[#F5F5F5]"
                    : "text-[#96D3DE] hover:bg-[#1e3537] hover:text-[#F5F5F5]"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </aside>
      <main className="flex-1 p-6 md:p-8">{children}</main>
    </div>
  );
}
