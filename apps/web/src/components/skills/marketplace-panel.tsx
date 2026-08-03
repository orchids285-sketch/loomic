"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDownToLine,
  Download,
  ExternalLink,
  Loader2,
  Package,
  Search,
  User,
} from "lucide-react";

import type { MarketplaceDetail, MarketplaceSkill } from "@loomic/shared";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/toast";
import {
  ApiApplicationError,
  getMarketplaceDetail,
  installMarketplaceSkill,
  searchMarketplace,
} from "@/lib/server-api";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MarketplacePanelProps {
  accessToken: () => string | undefined;
  onInstalled: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

// ---------------------------------------------------------------------------
// Debounce hook
// ---------------------------------------------------------------------------

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

// ---------------------------------------------------------------------------
// MarketplaceSkillCard
// ---------------------------------------------------------------------------

function MarketplaceSkillCard({
  skill,
  onClick,
}: {
  skill: MarketplaceSkill;
  onClick: (skill: MarketplaceSkill) => void;
}) {
  const formattedDownloads =
    skill.downloads >= 1000
      ? `${(skill.downloads / 1000).toFixed(1)}k`
      : String(skill.downloads);

  return (
    <motion.div
      variants={cardVariants}
      layout
      whileHover={{ y: -2, boxShadow: "0 4px 12px rgba(0,0,0,0.06)" }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      onClick={() => onClick(skill)}
      className="group cursor-pointer rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted/50"
    >
      {/* Header */}
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted">
            <Package className="size-3.5 text-muted-foreground" />
          </div>
          <span className="truncate text-sm font-medium text-foreground">
            {skill.name}
          </span>
        </div>
        <span className="shrink-0 text-[11px] text-muted-foreground">
          v{skill.version}
        </span>
      </div>

      {/* Description */}
      <p className="mb-3 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
        {skill.description}
      </p>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between">
        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
          <User className="size-3" />
          {skill.author}
        </span>
        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
          <Download className="size-3" />
          {formattedDownloads}
        </span>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// MarketplaceDetailDialog
// ---------------------------------------------------------------------------

function MarketplaceDetailDialog({
  skill,
  open,
  onOpenChange,
  onInstall,
}: {
  skill: MarketplaceDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInstall: (packageName: string) => Promise<void>;
}) {
  const [installing, setInstalling] = useState(false);

  const handleInstall = useCallback(async () => {
    if (!skill) return;
    setInstalling(true);
    try {
      await onInstall(skill.packageName);
    } finally {
      setInstalling(false);
    }
  }, [skill, onInstall]);

  if (!skill) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {skill.name}
            <span className="text-[11px] font-normal text-muted-foreground">
              v{skill.version}
            </span>
          </DialogTitle>
          <DialogDescription>{skill.description}</DialogDescription>
        </DialogHeader>

        {/* Meta grid */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="space-y-0.5">
            <span className="text-muted-foreground">Author</span>
            <p className="font-medium text-foreground">{skill.author}</p>
          </div>
          {skill.license && (
            <div className="space-y-0.5">
              <span className="text-muted-foreground">Licence</span>
              <p className="font-medium text-foreground">{skill.license}</p>
            </div>
          )}
          <div className="space-y-0.5">
            <span className="text-muted-foreground">Package</span>
            <p className="font-medium font-mono text-foreground">
              {skill.packageName}
            </p>
          </div>
          {skill.homepage && (
            <div className="space-y-0.5">
              <span className="text-muted-foreground">Home</span>
              <a
                href={skill.homepage}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium text-foreground hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                Link
                <ExternalLink className="size-3" />
              </a>
            </div>
          )}
        </div>

        {/* Keywords */}
        {skill.keywords.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {skill.keywords.map((kw: string) => (
              <span
                key={kw}
                className="rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground"
              >
                {kw}
              </span>
            ))}
          </div>
        )}

        {/* README */}
        {skill.readme && (
          <div className="space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              README
            </span>
            <pre className="max-h-64 overflow-auto rounded-lg border border-border bg-secondary p-3 font-mono text-xs leading-relaxed text-foreground whitespace-pre-wrap break-words">
              {skill.readme}
            </pre>
          </div>
        )}

        <DialogFooter>
          <Button
            size="sm"
            disabled={installing}
            onClick={handleInstall}
          >
            {installing ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Installing...
              </>
            ) : (
              <>
                <ArrowDownToLine className="size-3.5" />
                Install
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// MarketplacePanel
// ---------------------------------------------------------------------------

export function MarketplacePanel({
  accessToken,
  onInstalled,
}: MarketplacePanelProps) {
  const { success, error: showError } = useToast();

  // Search state
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);

  // Results state
  const [skills, setSkills] = useState<MarketplaceSkill[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Detail dialog state
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailSkill, setDetailSkill] = useState<MarketplaceDetail | null>(
    null,
  );

  // Prevent stale responses from overwriting newer queries
  const searchSeqRef = useRef(0);

  // ---------------------------------------------------------------------------
  // Search effect
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const token = accessToken();
    if (!token) return;

    const trimmed = debouncedQuery.trim();
    if (!trimmed) {
      setSkills([]);
      setTotal(0);
      setSearched(false);
      return;
    }

    const seq = ++searchSeqRef.current;

    (async () => {
      setLoading(true);
      try {
        const result = await searchMarketplace(token, trimmed);
        // Only apply if this is still the latest search
        if (seq === searchSeqRef.current) {
          setSkills(result.skills);
          setTotal(result.total);
          setSearched(true);
        }
      } catch (err) {
        console.error("[marketplace] search failed:", err);
        if (seq === searchSeqRef.current) {
          setSkills([]);
          setTotal(0);
          setSearched(true);
        }
      } finally {
        if (seq === searchSeqRef.current) {
          setLoading(false);
        }
      }
    })();
  }, [debouncedQuery, accessToken]);

  // ---------------------------------------------------------------------------
  // Detail
  // ---------------------------------------------------------------------------

  const handleCardClick = useCallback(
    async (skill: MarketplaceSkill) => {
      const token = accessToken();
      if (!token) return;

      setDetailLoading(true);
      setDetailOpen(true);

      try {
        const detail = await getMarketplaceDetail(token, skill.packageName);
        setDetailSkill(detail);
      } catch (err) {
        console.error("[marketplace] detail fetch failed:", err);
        // Fallback: construct a minimal detail object from the list item
        setDetailSkill({
          ...skill,
          readme: "",
          versions: [skill.version],
          tarballUrl: "",
        });
      } finally {
        setDetailLoading(false);
      }
    },
    [accessToken],
  );

  // ---------------------------------------------------------------------------
  // Install
  // ---------------------------------------------------------------------------

  const handleInstall = useCallback(
    async (packageName: string) => {
      const token = accessToken();
      if (!token) return;

      try {
        await installMarketplaceSkill(token, packageName);
        setDetailOpen(false);
        success("Skill installed");
        await onInstalled();
      } catch (err) {
        const msg =
          err instanceof ApiApplicationError
            ? err.message
            : "Install failed. Please try again.";
        showError(msg);
        console.error("[marketplace] install failed:", err);
      }
    },
    [accessToken, onInstalled, success, showError],
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div>
      {/* Search input */}
      <div className="relative mb-4 sm:mb-6 sm:max-w-md">
        <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search the skills.sh marketplace..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search marketplace skills"
          className="h-10 w-full rounded-lg border border-input bg-transparent pl-8 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 sm:h-8"
        />
        {loading && (
          <Loader2 className="absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Empty state - not yet searched */}
      {!searched && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Package className="size-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">
            Search community skills
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Search skills.sh for community skill packs
          </p>
        </motion.div>
      )}

      {/* Empty state - no results */}
      {searched && skills.length === 0 && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Search className="size-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">
            No matching skills
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Try different search terms
          </p>
        </motion.div>
      )}

      {/* Results count */}
      {searched && skills.length > 0 && (
        <p className="mb-4 text-xs text-muted-foreground">
          Found {total}  skills
        </p>
      )}

      {/* Results grid */}
      {skills.length > 0 && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2"
        >
          <AnimatePresence mode="popLayout">
            {skills.map((skill) => (
              <MarketplaceSkillCard
                key={skill.packageName}
                skill={skill}
                onClick={handleCardClick}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Detail dialog */}
      <MarketplaceDetailDialog
        skill={detailSkill}
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open);
          if (!open) setDetailSkill(null);
        }}
        onInstall={handleInstall}
      />

      {/* Loading overlay for detail fetch */}
      {detailLoading && detailOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
