"use client";

import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Link2,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/toast";
import { ApiApplicationError, importSkillFromUrl } from "@/lib/server-api";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ImportPanelProps {
  accessToken: () => string | undefined;
  onImported: () => Promise<void>;
  /** Optional: switch to installed tab after successful import */
  onSwitchToInstalled?: () => void;
}

// ---------------------------------------------------------------------------
// Import states
// ---------------------------------------------------------------------------

type ImportState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; skillName: string }
  | { status: "error"; message: string };

// ---------------------------------------------------------------------------
// ImportPanel
// ---------------------------------------------------------------------------

export function ImportPanel({
  accessToken,
  onImported,
  onSwitchToInstalled,
}: ImportPanelProps) {
  const { success, error: showError } = useToast();

  const [url, setUrl] = useState("");
  const [importState, setImportState] = useState<ImportState>({
    status: "idle",
  });

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleImport = useCallback(async () => {
    const token = accessToken();
    if (!token) return;

    const trimmed = url.trim();
    if (!trimmed) return;

    // Basic URL validation
    try {
      new URL(trimmed);
    } catch {
      setImportState({ status: "error", message: "Enter a valid URL" });
      return;
    }

    setImportState({ status: "loading" });

    try {
      const result = await importSkillFromUrl(token, trimmed);
      setImportState({ status: "success", skillName: result.skill.name });
      success(`Skill "${result.skill.name}" Imported`);
      await onImported();
    } catch (err) {
      const msg =
        err instanceof ApiApplicationError
          ? err.message
          : "Import failed. Check the URL and try again.";
      setImportState({ status: "error", message: msg });
      showError(msg);
      console.error("[import] skill import failed:", err);
    }
  }, [accessToken, url, onImported, success, showError]);

  const handleReset = useCallback(() => {
    setUrl("");
    setImportState({ status: "idle" });
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && url.trim()) {
        handleImport();
      }
    },
    [handleImport, url],
  );

  const isLoading = importState.status === "loading";
  const isSuccess = importState.status === "success";
  const isError = importState.status === "error";

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="max-w-lg">
      {/* Import card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="rounded-xl border border-border bg-card p-6"
      >
        {/* Header */}
        <div className="mb-5 flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
            <Link2 className="size-4 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-foreground">
              Import a skill from a URL
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              GitHub repository URLs and npm tarball URLs are supported
            </p>
          </div>
        </div>

        {/* Input row */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <ExternalLink className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="url"
              placeholder="https://github.com/user/repo/tree/main/skills/my-skill"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                // Clear error state when user starts typing
                if (isError) {
                  setImportState({ status: "idle" });
                }
              }}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              aria-label="Skill URL"
              className={cn(
                "h-8 w-full rounded-lg border bg-transparent pl-8 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50",
                isError
                  ? "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20"
                  : "border-input",
              )}
            />
          </div>
          <Button
            size="default"
            disabled={!url.trim() || isLoading}
            onClick={handleImport}
          >
            {isLoading ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                Import
                <ArrowRight className="size-3.5" />
              </>
            )}
          </Button>
        </div>

        {/* Error message */}
        {isError && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 text-xs text-destructive"
          >
            {importState.message}
          </motion.p>
        )}

        {/* Success state */}
        {isSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-4 flex items-center justify-between rounded-lg border border-border bg-muted/50 px-4 py-3"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-500" />
              <span className="text-sm font-medium text-foreground">
                {importState.skillName}
              </span>
              <span className="text-xs text-muted-foreground">Imported</span>
            </div>
            <div className="flex items-center gap-2">
              {onSwitchToInstalled && (
                <Button
                  variant="outline"
                  size="xs"
                  onClick={onSwitchToInstalled}
                >
                  View installed
                </Button>
              )}
              <Button variant="ghost" size="xs" onClick={handleReset}>
                Import another
              </Button>
            </div>
          </motion.div>
        )}

        {/* Hint examples */}
        <div className="mt-4 space-y-1.5">
          <p className="text-[11px] font-medium text-muted-foreground">
            Supported formats
          </p>
          <div className="space-y-1">
            <p className="font-mono text-[11px] text-muted-foreground/70">
              https://github.com/user/repo/tree/main/skills/my-skill
            </p>
            <p className="font-mono text-[11px] text-muted-foreground/70">
              https://registry.npmjs.org/package/-/package-1.0.0.tgz
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
