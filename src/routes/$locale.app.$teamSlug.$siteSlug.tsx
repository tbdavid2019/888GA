import { createFileRoute, notFound, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/$locale/app/$teamSlug/$siteSlug")({
  beforeLoad: ({ params, context }) => {
    const teamContext = context.teamContext;
    const activeSite =
      teamContext.sites.find((site) => site.slug === params.siteSlug) ??
      teamContext.sites.find((site) => site.id === params.siteSlug);
    if (!activeSite) throw notFound();
    // The parent already resolved the authorized team and its sites.
    return { siteContext: { ...teamContext, activeSite } };
  },
  head: ({ match }) => ({
    meta: [{ title: match.context.siteContext.activeSite.name }],
  }),
  component: Outlet,
});
