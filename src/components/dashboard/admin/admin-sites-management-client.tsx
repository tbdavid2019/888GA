import { useEffect, useState } from "react";
import { AutoTransition } from "@insightflare/ui/auto-transition";
import { Button } from "@insightflare/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@insightflare/ui/card";
import { DataTableSwitch } from "@insightflare/ui/data-table-switch";
import { Input } from "@insightflare/ui/input";
import { Label } from "@insightflare/ui/label";
import { PageHeading } from "@insightflare/ui/page-heading";
import { Spinner } from "@insightflare/ui/spinner";
import { TableCell, TableHead, TableRow } from "@insightflare/ui/table";
import { TableActionButton } from "@insightflare/ui/table-action-button";
import {
  RiAddLine,
  RiCodeSSlashLine,
  RiExternalLinkLine,
  RiFileList3Line,
  RiLineChartLine,
  RiSettings4Line,
} from "@remixicon/react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { TrackingSnippetDialog } from "@/components/dashboard/admin/tracking-snippet-dialog";
import { useDashboardQueryControls } from "@/components/dashboard/shell/dashboard-query-provider";
import { shortDateTime } from "@/lib/dashboard/format";
import { requestAdminService } from "@/lib/dashboard-api/client/admin-service";
import type { SiteData, TeamData } from "@/lib/dashboard-api/client/edge";
import type { Locale } from "@/lib/i18n/config";
import type { AppMessages } from "@/lib/i18n/messages";
import { navigateWithTransition } from "@/lib/page-transition";
import { useRouter } from "@/lib/router";
interface AdminSitesManagementClientProps {
  locale: Locale;
  messages: AppMessages;
  activeTeam: TeamData;
  initialSites?: readonly SiteData[] | null;
}
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
function formatDomainHref(domain: string): string {
  const trimmed = String(domain || "").trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (
    /^localhost(:\d+)?$/i.test(trimmed) ||
    /^127\.0\.0\.1(:\d+)?$/i.test(trimmed)
  ) {
    return `http://${trimmed}`;
  }
  return `https://${trimmed}`;
}
async function fetchSites(
  teamId: string,
  signal?: AbortSignal,
): Promise<SiteData[]> {
  return requestAdminService<SiteData[]>("sites", {
    params: { teamId },
    signal,
  });
}
export function AdminSitesManagementClient({
  locale,
  messages,
  activeTeam,
  initialSites = null,
}: AdminSitesManagementClientProps) {
  const { timeZone } = useDashboardQueryControls();
  const router = useRouter();
  const t = messages.adminSites;
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [publicSlug, setPublicSlug] = useState("");
  const [snippetSite, setSnippetSite] = useState<SiteData | null>(null);
  const [isNewlyCreated, setIsNewlyCreated] = useState(false);
  const sitesQuery = useQuery({
    queryKey: ["dashboard", "admin-sites", activeTeam.id],
    queryFn: ({ signal }) => fetchSites(activeTeam.id, signal),
    initialData: initialSites ?? undefined,
    enabled: typeof window !== "undefined" && Boolean(activeTeam.id),
  });
  const sites = sitesQuery.data ?? [];
  const loading = sitesQuery.isPending;

  useEffect(() => {
    if (!sitesQuery.isError) return;
    const message =
      sitesQuery.error instanceof Error
        ? sitesQuery.error.message
        : t.loadFailed;
    toast.error(message || t.loadFailed);
  }, [
    sitesQuery.error,
    sitesQuery.errorUpdatedAt,
    sitesQuery.isError,
    t.loadFailed,
  ]);

  async function handleCreateSite() {
    const team = activeTeam;
    if (!team?.id) return;
    if (name.trim().length < 2 || domain.trim().length < 3) {
      toast.error(t.invalidInput);
      return;
    }

    setSubmitting(true);
    try {
      const data = await requestAdminService<SiteData>("sites", {
        method: "POST",
        body: {
          teamId: team.id,
          name: name.trim(),
          domain: domain.trim(),
          publicSlug: publicSlug.trim() || undefined,
        },
      });
      setName("");
      setDomain("");
      setPublicSlug("");
      toast.success(t.createSuccess);
      await sitesQuery.refetch();
      router.refresh();
      setIsNewlyCreated(true);
      setSnippetSite(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : t.createFailed;
      toast.error(message || t.createFailed);
    } finally {
      setSubmitting(false);
    }
  }

  const noDataText = t.noData;

  return (
    <div className="space-y-4">
      <PageHeading title={t.title} subtitle={t.subtitle} />

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle className="inline-flex items-center gap-2">
            <RiAddLine className="size-4" />
            {t.createTitle}
          </CardTitle>
          <CardDescription>{t.createSubtitle}</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-3 md:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              void handleCreateSite();
            }}
          >
            <div className="flex items-center gap-2 text-sm text-muted-foreground md:col-span-2">
              <span>{t.team}:</span>
              <span className="rounded border bg-muted/60 px-2 py-0.5 font-semibold text-foreground">
                {activeTeam.name}
              </span>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="admin-site-name">{t.name}</Label>
              <Input
                id="admin-site-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="admin-site-domain">{t.domain}</Label>
              <Input
                id="admin-site-domain"
                value={domain}
                onChange={(event) => setDomain(event.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="admin-site-public-slug">{t.publicSlug}</Label>
              <Input
                id="admin-site-public-slug"
                value={publicSlug}
                onChange={(event) => setPublicSlug(event.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" size="default" disabled={submitting}>
                <AutoTransition className="inline-flex items-center gap-[var(--button-content-gap)]">
                  {submitting ? (
                    <span
                      key="creating"
                      className="inline-flex items-center gap-[var(--button-content-gap)]"
                    >
                      <Spinner data-icon="inline-start" />
                      {t.creating}
                    </span>
                  ) : (
                    <span
                      key="create"
                      className="inline-flex items-center gap-[var(--button-content-gap)]"
                    >
                      <RiAddLine data-icon="inline-start" />
                      {t.create}
                    </span>
                  )}
                </AutoTransition>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="inline-flex items-center gap-2">
            <RiFileList3Line className="size-4" />
            {t.listTitle}
          </CardTitle>
          <CardDescription>{t.listSubtitle}</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTableSwitch
            loading={loading}
            hasContent={sites.length > 0}
            loadingLabel={messages.common.loading}
            emptyLabel={noDataText}
            colSpan={5}
            header={
              <TableRow>
                <TableHead>{t.columns.name}</TableHead>
                <TableHead>{t.columns.domain}</TableHead>
                <TableHead>{t.columns.slug}</TableHead>
                <TableHead>{t.columns.created}</TableHead>
                <TableHead className="text-right">{t.columns.action}</TableHead>
              </TableRow>
            }
            rows={sites.map((site) => (
              <TableRow key={site.id}>
                <TableCell className="font-medium">
                  <button
                    type="button"
                    onClick={() => {
                      navigateWithTransition(
                        router,
                        `/${locale}/app/${activeTeam.slug}/${siteSlug(site)}`,
                      );
                    }}
                    className="cursor-pointer text-left text-base font-semibold transition-colors hover:text-primary hover:underline"
                  >
                    {site.name}
                  </button>
                </TableCell>
                <TableCell className="font-mono text-sm">
                  <a
                    href={formatDomainHref(site.domain)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 hover:text-primary hover:underline"
                  >
                    <span>{site.domain}</span>
                    <RiExternalLinkLine className="size-3.5 text-muted-foreground" />
                  </a>
                </TableCell>
                <TableCell className="font-mono text-sm">{siteSlug(site)}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {shortDateTime(locale, site.createdAt, timeZone)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <TableActionButton
                      onClick={() => {
                        setIsNewlyCreated(false);
                        setSnippetSite(site);
                      }}
                      label={t.snippet}
                    >
                      <RiCodeSSlashLine className="size-4 text-primary" />
                    </TableActionButton>
                    {activeTeam ? (
                      <>
                        <TableActionButton
                          onClick={() => {
                            navigateWithTransition(
                              router,
                              `/${locale}/app/${activeTeam.slug}/${siteSlug(site)}`,
                            );
                          }}
                          label={t.open}
                        >
                          <RiLineChartLine className="size-4" />
                        </TableActionButton>
                        <TableActionButton
                          onClick={() => {
                            navigateWithTransition(
                              router,
                              `/${locale}/app/${activeTeam.slug}/${siteSlug(site)}/settings`,
                            );
                          }}
                          label={t.settings}
                        >
                          <RiSettings4Line className="size-4" />
                        </TableActionButton>
                      </>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          />
        </CardContent>
      </Card>

      <TrackingSnippetDialog
        open={Boolean(snippetSite)}
        onOpenChange={(open) => {
          if (!open) {
            setSnippetSite(null);
            setIsNewlyCreated(false);
          }
        }}
        site={snippetSite}
        isNewlyCreated={isNewlyCreated}
        locale={locale}
        teamSlug={activeTeam.slug}
        messages={messages}
      />
    </div>
  );
}
