"use client";

import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";

import { AuthProvider } from "../lib/auth-context";
import { ToastProvider } from "./toast";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark" enableSystem={false}>
      <AuthProvider>
        <ToastProvider>
          {children}
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
