import { createFileRoute, notFound, Outlet } from "@tanstack/react-router";

import { loadDashboardSite } from "@/lib/dashboard/route-data";

let clientSiteCache: {
  teamSlug: string;
  siteSlug: string;
  siteContext: unknown;
} | null = null;

export const Route = createFileRoute("/$locale/app/$teamSlug/$siteSlug")({
  beforeLoad: async ({ params }) => {
    if (
      typeof window !== "undefined" &&
      clientSiteCache &&
      clientSiteCache.teamSlug === params.teamSlug &&
      clientSiteCache.siteSlug === params.siteSlug
    ) {
      return { siteContext: clientSiteCache.siteContext };
    }
    const siteContext = await loadDashboardSite({
      data: { teamSlug: params.teamSlug, siteSlug: params.siteSlug },
    });
    if (!siteContext) throw notFound();
    if (typeof window !== "undefined") {
      clientSiteCache = {
        teamSlug: params.teamSlug,
        siteSlug: params.siteSlug,
        siteContext,
      };
    }
    return { siteContext };
  },
  head: ({ match }) => ({
    meta: [{ title: match.context.siteContext.activeSite.name }],
  }),
  component: Outlet,
});
