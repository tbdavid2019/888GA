import { createRouter } from "@tanstack/react-router";

import { ErrorPage, NotFoundPage } from "@/routes/__root";
import { routeTree } from "@/routeTree.gen";

export function getRouter() {
  return createRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 60_000,
    defaultStaleTime: 30_000,
    defaultNotFoundComponent: NotFoundPage,
    defaultErrorComponent: ErrorPage,
  });
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
