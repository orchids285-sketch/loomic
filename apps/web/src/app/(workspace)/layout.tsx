"use client";

import type { ReactNode } from "react";

import { useAuth } from "@/lib/auth-context";
import { AppSidebar } from "@/components/app-sidebar";
import { CreditHeaderButton } from "@/components/credits/credit-header-button";
import { LoadingScreen } from "@/components/loading-screen";
import { PageTransition } from "@/components/page-transition";
import { isServerConfigured } from "@/lib/env";
import { isSupabaseConfigured } from "@/lib/supabase-browser";

/**
 * Says what is missing before the user finds out by clicking.
 *
 * Without these two services the interface renders but nothing can be created, and an
 * app that looks complete and quietly does nothing is harder to trust than one that
 * says which part is not connected yet. Rendered as a strip rather than a dialog: it is
 * a fact about this deployment, not an error the user caused or can dismiss into truth.
 */
function BackendNotice() {
  const missing = [
    isSupabaseConfigured() ? null : "workspace database",
    isServerConfigured() ? null : "agent server",
  ].filter(Boolean);
  if (missing.length === 0) return null;
  return (
    <div className="border-b border-border bg-muted/40 px-4 py-2 text-xs text-muted-foreground">
      Preview deployment -- the {missing.join(" and ")} {missing.length > 1 ? "are" : "is"} not
      connected yet, so projects, generation and history are unavailable.
    </div>
  );
}

export default function WorkspaceLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { loading } = useAuth();

  // No sign-in gate. This build has no accounts of its own: it runs inside a product the
  // user is already signed into, so a second login would be a second account to manage --
  // and with the gate in place every screen bounced to a page that no longer exists.
  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="flex h-[100dvh] flex-col md:flex-row">
      {/* Skip navigation link -- visible only on keyboard focus for a11y */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-background focus:text-foreground focus:rounded-md focus:shadow-lg"
      >
        Skip to main content
      </a>
      <AppSidebar />
      {/* pb-14 on mobile for the fixed bottom navigation bar, reset on md+ */}
      <main id="main" className="relative flex-1 overflow-auto pb-14 md:pb-0">
        <BackendNotice />
        {/* Top-right header credits button */}
        <div className="absolute right-4 top-3 z-10">
          <CreditHeaderButton />
        </div>
        <PageTransition>{children}</PageTransition>
      </main>
    </div>
  );
}
