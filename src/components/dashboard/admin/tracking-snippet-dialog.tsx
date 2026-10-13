import { useEffect, useState } from "react";
import { Button } from "@insightflare/ui/button";
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@insightflare/ui/responsive-dialog";
import {
  RiCheckLine,
  RiCodeSSlashLine,
  RiFileCopyLine,
  RiLineChartLine,
  RiSettings4Line,
  RiSparklingLine,
} from "@remixicon/react";
import { toast } from "sonner";

import { HighlightedCode } from "@/components/code/highlighted-code";
import type { SiteData } from "@/lib/dashboard-api/client/edge";
import type { Locale } from "@/lib/i18n/config";
import type { AppMessages } from "@/lib/i18n/messages";
import { navigateWithTransition } from "@/lib/page-transition";
import { useRouter } from "@/lib/router";

function safeSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function siteSlug(site: SiteData): string {
  const domain = String(site.domain || "").trim();
  const candidate = safeSlug(domain);
  if (candidate.length > 0) return candidate;
  return site.id.slice(0, 8);
}

export interface TrackingSnippetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  site: SiteData | null;
  isNewlyCreated?: boolean;
  locale: Locale;
  teamSlug: string;
  messages: AppMessages;
}

export function TrackingSnippetDialog({
  open,
  onOpenChange,
  site,
  isNewlyCreated = false,
  locale,
  teamSlug,
  messages,
}: TrackingSnippetDialogProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const t = messages.adminSites;
  const dialogText = t.snippetDialog;

  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setCopied(false);
  }, [open, site?.id]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  if (!site) return null;

  const effectiveOrigin =
    origin ||
    (typeof window !== "undefined" && window.location.origin
      ? window.location.origin
      : "");
  const displayOrigin =
    effectiveOrigin || "https://insightflare.ai360.workers.dev";
  const safeSiteId = encodeURIComponent(site.id).replace(/["'<>\s]/g, "");
  const scriptSrc = `${displayOrigin}/script.js?siteId=${safeSiteId}`;
  const scriptSnippet = `<script defer src="${scriptSrc}"></script>`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(scriptSnippet);
      setCopied(true);
      toast.success(dialogText.copied);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(dialogText.copyFailed);
    }
  }

  const slug = siteSlug(site);
  const analyticsHref = `/${locale}/app/${teamSlug}/${slug}`;
  const settingsHref = `/${locale}/app/${teamSlug}/${slug}/settings`;

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent desktopClassName="max-w-xl">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle
            icon={isNewlyCreated ? RiSparklingLine : RiCodeSSlashLine}
          >
            {isNewlyCreated
              ? `${t.createSuccess} - ${dialogText.title}`
              : dialogText.title}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {dialogText.description}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <ResponsiveDialogBody className="space-y-4">
          {/* 站點基本資訊卡 */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded border bg-muted/40 px-3.5 py-2.5 text-sm">
            <div>
              <span className="font-semibold text-foreground">{site.name}</span>
              <span className="ml-2 font-mono text-xs text-muted-foreground">
                ({site.domain})
              </span>
            </div>
            <div className="font-mono text-xs text-muted-foreground">
              {dialogText.siteIdLabel || "Site ID"}:{" "}
              <code className="rounded bg-background px-1.5 py-0.5 font-bold text-foreground">
                {site.id}
              </code>
            </div>
          </div>

          {/* 代碼展示區塊 */}
          <div className="relative overflow-hidden rounded-lg border bg-zinc-950 p-3.5 font-mono text-xs text-zinc-100 dark:bg-zinc-900/90">
            <div className="mb-2 flex items-center justify-between border-b border-zinc-800 pb-2 text-zinc-400">
              <span className="text-[11px] font-medium tracking-wide uppercase">
                {dialogText.embedCodeLabel || "HTML Embed Code"}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 gap-1 px-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white"
                onClick={handleCopy}
              >
                {copied ? (
                  <>
                    <RiCheckLine className="size-3.5 text-emerald-400" />
                    <span className="text-emerald-400">
                      {dialogText.copied}
                    </span>
                  </>
                ) : (
                  <>
                    <RiFileCopyLine className="size-3.5" />
                    <span>{dialogText.copy}</span>
                  </>
                )}
              </Button>
            </div>
            <div className="overflow-x-auto py-1 text-sm leading-relaxed">
              <HighlightedCode
                source={scriptSnippet}
                className="whitespace-pre font-mono text-zinc-200"
              />
            </div>
          </div>

          {/* 安裝指引 3 步驟 */}
          <div className="space-y-2 rounded-lg border border-border/80 bg-background/50 p-3.5 text-xs text-muted-foreground">
            <h4 className="font-semibold text-foreground">
              💡 {dialogText.instructionsTitle}
            </h4>
            <ol className="grid list-decimal gap-1.5 pl-4 text-xs/relaxed">
              <li>{dialogText.step1}</li>
              <li>{dialogText.step2}</li>
              <li>{dialogText.step3}</li>
            </ol>
          </div>
        </ResponsiveDialogBody>

        <ResponsiveDialogFooter className="flex-col-reverse sm:flex-row sm:justify-between gap-2">
          <ResponsiveDialogClose asChild>
            <Button type="button" variant="outline" size="sm">
              {messages.common.close || "Close"}
            </Button>
          </ResponsiveDialogClose>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              data-testid="snippet-dialog-settings-btn"
              onClick={() => {
                onOpenChange(false);
                navigateWithTransition(router, settingsHref);
              }}
            >
              <RiSettings4Line data-icon="inline-start" className="size-4" />
              <span>{dialogText.goToSettings}</span>
            </Button>

            <Button
              type="button"
              size="sm"
              data-testid="snippet-dialog-analytics-btn"
              onClick={() => {
                onOpenChange(false);
                navigateWithTransition(router, analyticsHref);
              }}
            >
              <RiLineChartLine data-icon="inline-start" className="size-4" />
              <span>{dialogText.goToAnalytics}</span>
            </Button>
          </div>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
