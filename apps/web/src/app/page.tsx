"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * The product IS the canvas.
 *
 * This route used to be a marketing landing page — hero, pricing preview, testimonials —
 * which is what an open-source project needs and what an embedded tool must not have. A
 * user who reaches this app has already chosen it; showing them a page that sells it again
 * is a detour to the thing they came for.
 *
 * It lands on /home, not /canvas: a canvas needs a project id, and /canvas without one
 * renders "No canvas ID specified" -- a dead end as the front door. /home is the shell the
 * canvas opens from.
 */
export default function RootPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/home");
  }, [router]);
  return null;
}
