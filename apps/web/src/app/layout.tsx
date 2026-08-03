import type { Metadata } from "next";
import type { ReactNode } from "react";
import Script from "next/script";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

import { Providers } from "../components/providers";

import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

// No marks and no icon paths. The logo, favicon, apple-touch-icon and OG image were
// deleted with the rest of the branding, so declaring them here would be three 404s on
// every page load -- and an OG card is for sharing a public page, which this is not.
export const metadata: Metadata = {
  title: "Images",
  description: "Design on an infinite canvas.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={cn(geist.variable, "scroll-smooth")} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>{children}</Providers>
        <Script
          src="https://app.lemonsqueezy.com/js/lemon.js"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
