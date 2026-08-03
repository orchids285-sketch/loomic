"use client";

/**
 * Full-screen loading state.
 *
 * The animated mascot that used to sit here — blob, sparkling star eye, drawn-in smile —
 * was the product's logo, and the logo is what a white-labelled tool must not show. The
 * three dots were already underneath it and say the same thing: something is happening,
 * wait a moment.
 */
export function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <div className="flex items-center gap-1">
        <span className="h-1 w-1 rounded-full bg-foreground/30 animate-loading-dot [animation-delay:0ms]" />
        <span className="h-1 w-1 rounded-full bg-foreground/30 animate-loading-dot [animation-delay:160ms]" />
        <span className="h-1 w-1 rounded-full bg-foreground/30 animate-loading-dot [animation-delay:320ms]" />
      </div>
    </div>
  );
}
