"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ImageGenerationPreference, VideoGenerationPreference } from "@loomic/shared";

import type { ReadyAttachment } from "@/hooks/use-image-attachments";
import { useAuth } from "@/lib/auth-context";
import { isServerConfigured } from "@/lib/env";
import { isSupabaseConfigured } from "@/lib/supabase-browser";
import { useToast } from "@/components/toast";
import { ApiAuthError, createProject } from "@/lib/server-api";

/** sessionStorage key used to pass attachments from Home → Canvas auto-send. */
export const INITIAL_ATTACHMENTS_KEY = "loomic:initial-attachments";
export const INITIAL_IMAGE_GENERATION_PREFERENCE_KEY =
  "loomic:initial-image-generation-preference";
export const INITIAL_VIDEO_GENERATION_PREFERENCE_KEY =
  "loomic:initial-video-generation-preference";
export const INITIAL_AGENT_MODEL_KEY = "loomic:initial-agent-model";

/**
 * Shared hook for creating an Untitled project and navigating to its canvas.
 * Used by Home page, Projects page, and Canvas logo menu.
 */
export function useCreateProject() {
  const { session } = useAuth();
  const router = useRouter();
  const { error: toastError } = useToast();
  const [creating, setCreating] = useState(false);

  const routerRef = useRef(router);
  routerRef.current = router;

  const create = useCallback(
    async (opts?: {
      prompt?: string;
      attachments?: ReadyAttachment[];
      imageGenerationPreference?: ImageGenerationPreference;
      videoGenerationPreference?: VideoGenerationPreference;
      model?: string;
    }) => {
      if (creating) return;

      // This used to be `if (!token || creating) return` -- a silent no-op. With no
      // backend there is no session, so pressing Send did nothing at all and said
      // nothing at all, which reads as a broken button rather than a missing service.
      // Both causes are named separately because they need different fixes.
      if (!isSupabaseConfigured()) {
        toastError("This deployment has no workspace database yet, so projects cannot be created.");
        return;
      }
      if (!isServerConfigured()) {
        toastError("This deployment has no agent server yet, so projects cannot be created.");
        return;
      }

      const token = session?.access_token;
      if (!token) {
        toastError("No workspace session -- reload the tool to get a new one.");
        return;
      }

      // Persist attachments in sessionStorage BEFORE window.open so the
      // new tab's cloned sessionStorage already contains them.
      // (sessionStorage is per-tab; new tabs get a snapshot at open time.)
      if (opts?.attachments && opts.attachments.length > 0) {
        try {
          sessionStorage.setItem(
            INITIAL_ATTACHMENTS_KEY,
            JSON.stringify(opts.attachments),
          );
        } catch {
          // sessionStorage write failure is non-fatal
        }
      } else {
        sessionStorage.removeItem(INITIAL_ATTACHMENTS_KEY);
      }

      if (opts?.imageGenerationPreference) {
        try {
          sessionStorage.setItem(
            INITIAL_IMAGE_GENERATION_PREFERENCE_KEY,
            JSON.stringify(opts.imageGenerationPreference),
          );
        } catch {
          // sessionStorage write failure is non-fatal
        }
      } else {
        sessionStorage.removeItem(INITIAL_IMAGE_GENERATION_PREFERENCE_KEY);
      }

      if (opts?.videoGenerationPreference) {
        try {
          sessionStorage.setItem(
            INITIAL_VIDEO_GENERATION_PREFERENCE_KEY,
            JSON.stringify(opts.videoGenerationPreference),
          );
        } catch {
          // sessionStorage write failure is non-fatal
        }
      } else {
        sessionStorage.removeItem(INITIAL_VIDEO_GENERATION_PREFERENCE_KEY);
      }

      if (opts?.model) {
        try {
          sessionStorage.setItem(INITIAL_AGENT_MODEL_KEY, opts.model);
        } catch {
          // sessionStorage write failure is non-fatal
        }
      } else {
        sessionStorage.removeItem(INITIAL_AGENT_MODEL_KEY);
      }

      // Open the new tab synchronously within the user gesture so the
      // browser popup-blocker doesn't intervene. We'll set the real URL
      // once the API call returns.
      const newTab = window.open("/loading-preview", "_blank");

      setCreating(true);
      try {
        const result = await createProject(token, { name: "Untitled" });
        const canvasId = result.project.primaryCanvas.id;

        const url = opts?.prompt
          ? `/canvas?id=${canvasId}&prompt=${encodeURIComponent(opts.prompt)}`
          : `/canvas?id=${canvasId}`;

        if (newTab) {
          newTab.location.href = url;
        } else {
          // Popup was blocked despite sync open — fallback to in-page navigation
          routerRef.current.push(url);
        }
        setCreating(false);
      } catch (err) {
        // Close the blank tab on failure
        newTab?.close();
        if (err instanceof ApiAuthError) {
        // A 401 has nowhere to send anyone in a build with no sign-in, so it is
        // reported like any other failure instead of quietly dropping the session.
          /* no sign-in screen in this build -- staying put beats bouncing to a 404 */
          return;
        }
        toastError("Could not create the project");
        setCreating(false);
      }
    },
    [session?.access_token, creating, toastError],
  );

  return { create, creating };
}
