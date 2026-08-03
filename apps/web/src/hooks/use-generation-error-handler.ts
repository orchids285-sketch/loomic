"use client";

import { useCallback } from "react";

import { ApiApplicationError } from "@/lib/server-api";
import { useToast } from "@/components/toast";

// The plan-limit codes are still reported by the server, but they no longer have a
// dedicated toast: with no plans in this build there is no upgrade to point at, so they
// are ordinary failures and say what went wrong in the same place as the others.
const SERVER_LIMIT_CODES = new Set([
  "concurrency_limit",
  "model_not_accessible",
  "resolution_not_allowed",
  "insufficient_credits",
]);

/**
 * Returns a handler function that inspects generation errors and routes them
 * to the appropriate UI:
 * - server limit codes -> shows the server's own message
 * - other errors -> shows a generic error toast
 *
 * @returns handleGenerationError(error) => boolean — true if the error was a
 *          known tier/credit limit (i.e. caller should NOT show its own error UI)
 */
export function useGenerationErrorHandler() {
  const { error: showErrorToast } = useToast();

  const handleGenerationError = useCallback(
    (error: unknown): boolean => {
      if (!(error instanceof ApiApplicationError)) {
        // Not an application error — log for debugging, show generic toast to user
        console.error("[generation-error] Unexpected error:", error);
        showErrorToast("Generation failed. Please try again.");
        return false;
      }

      if (SERVER_LIMIT_CODES.has(error.code)) {
        showErrorToast(error.message || "The server refused this request.");
        return true;
      }

      // Other application errors: log raw message, show generic toast to user
      console.error("[generation-error] Application error:", error.code, error.message);
      showErrorToast("Generation failed. Please try again.");
      return false;
    },
    [showErrorToast],
  );

  return { handleGenerationError };
}
