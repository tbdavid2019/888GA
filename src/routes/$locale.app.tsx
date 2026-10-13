import { useEffect } from "react";
import {
  createFileRoute,
  Outlet,
  useRouterState,
} from "@tanstack/react-router";

import { DashboardShell } from "@/components/dashboard/shell/dashboard-shell";
import {
  loadDashboardRouteContext,
  seedDashboardRouteContext,
} from "@/lib/dashboard/client/route-context";
import {
  loadDashboardInitialWindow,
  loadDashboardRoot,
} from "@/lib/dashboard/route-data";
import type { DashboardTeamContext } from "@/lib/dashboard/server";
import { buildManagementSections } from "@/lib/dashboard/team-sections";
import { usePathname } from "@/lib/router";
export const Route = createFileRoute("/$locale/app")({
  beforeLoad: () =>
    loadDashboardRouteContext(["root"], async () => {
      const [dashboardRoot, initialDashboardWindow] = await Promise.all([
        loadDashboardRoot(),
        loadDashboardInitialWindow(),
      ]);
      return { dashboardRoot, initialDashboardWindow };
    }),
  component: AppLayout,
});
function AppLayout() {
  const { locale, messages, dashboardRoot, initialDashboardWindow } =
    Route.useRouteContext();
  const pathname = usePathname();
  const teamRouteContext = useRouterState({
    select: ({ matches }) =>
      matches.find((match) => match.routeId === "/$locale/app/$teamSlug")
        ?.context as { teamContext?: DashboardTeamContext } | undefined,
  });
  const teamContext = teamRouteContext?.teamContext;

  useEffect(() => {
    seedDashboardRouteContext(["root"], {
      dashboardRoot,
      initialDashboardWindow,
    });
    if (teamContext) {
      seedDashboardRouteContext(
        ["team", teamContext.activeTeam.slug],
        teamContext,
      );
    }
  }, [dashboardRoot, initialDashboardWindow, teamContext]);

  const shellContext = dashboardRoot ?? teamContext;
  if (!shellContext) return <Outlet />;
  return (
    <DashboardShell
      locale={locale}
      pathname={pathname}
      messages={messages}
      user={shellContext.user}
      teams={shellContext.teams}
      teamGroups={shellContext.teamGroups}
      activeTeamSlug={dashboardRoot ? undefined : teamContext?.activeTeam.slug}
      sites={dashboardRoot ? undefined : teamContext?.sites}
      unreadAttentionCount={shellContext.unreadAttentionCount}
      initialQueryWindow={initialDashboardWindow}
      managementSections={
        shellContext.user.systemRole === "admin"
          ? buildManagementSections(locale, messages)
          : undefined
      }
    >
      <Outlet />
    </DashboardShell>
  );
}
