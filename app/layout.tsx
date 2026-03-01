import type { Metadata } from "next";
import { Russo_One, Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const russoOne = Russo_One({
  weight: "400",
  variable: "--font-russo",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cheer Presença",
  description: "Sistema de controle de presença para cheerleading",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${russoOne.variable} ${inter.variable} antialiased`} suppressHydrationWarning>
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
