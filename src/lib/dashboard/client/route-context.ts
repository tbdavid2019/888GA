import { getQueryClient } from "@/lib/query-client";

const ROUTE_CONTEXT_KEY = ["dashboard-route-context"] as const;

// Share reads across hover preloads and navigation, with the same bounded
// browser cache used by analytics. Server requests always read independently.
export function loadDashboardRouteContext<T>(
  key: readonly string[],
  read: () => Promise<T>,
): Promise<T> {
  if (typeof window === "undefined") return read();
  return getQueryClient().fetchQuery({
    queryKey: [...ROUTE_CONTEXT_KEY, ...key],
    queryFn: read,
    staleTime: 60_000,
    retry: false,
  });
}

export function seedDashboardRouteContext<T>(key: readonly string[], data: T) {
  if (typeof window === "undefined") return;
  const client = getQueryClient();
  const queryKey = [...ROUTE_CONTEXT_KEY, ...key];
  if (!client.getQueryState(queryKey)) client.setQueryData(queryKey, data);
}

export function invalidateDashboardRouteContexts(): Promise<void> {
  return getQueryClient().invalidateQueries({
    queryKey: ROUTE_CONTEXT_KEY,
    refetchType: "none",
  });
}
