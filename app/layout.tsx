import type { Metadata } from "next";
import "./globals.css";
import "./auth.css";
import "./profile.css";
import "./app-shell.css";
import "./social-home.css";
import "./premium-ui.css";
import "./editorial-ui.css";
import SessionProviderWrapper from "@/components/session-provider";
import { ThemeProvider } from "@/components/theme-provider";
import AppShell from "@/components/app-shell";

export const metadata: Metadata = {
  title: "Trust.Me — Verified. Valuable. Yours.",
  description: "A premium marketplace for verified assets in Egypt.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><SessionProviderWrapper><ThemeProvider><AppShell>{children}</AppShell></ThemeProvider></SessionProviderWrapper></body></html>;
}
