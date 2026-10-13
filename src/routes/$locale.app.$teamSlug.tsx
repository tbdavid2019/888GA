import { createFileRoute, notFound, Outlet } from "@tanstack/react-router";

import { loadDashboardTeam } from "@/lib/dashboard/route-data";

let clientTeamCache: { teamSlug: string; teamContext: unknown } | null = null;

export const Route = createFileRoute("/$locale/app/$teamSlug")({
  beforeLoad: async ({ params }) => {
    if (
      typeof window !== "undefined" &&
      clientTeamCache &&
      clientTeamCache.teamSlug === params.teamSlug
    ) {
      return { teamContext: clientTeamCache.teamContext };
    }
    const teamContext = await loadDashboardTeam({
      data: { teamSlug: params.teamSlug },
    });
    if (!teamContext) throw notFound();
    if (typeof window !== "undefined") {
      clientTeamCache = { teamSlug: params.teamSlug, teamContext };
    }
    return { teamContext };
  },
  head: ({ match }) => {
    const title = match.context.teamContext?.activeTeam?.name;
    return { meta: title ? [{ title }] : [] };
  },
  component: Outlet,
});
