import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  invalidateDashboardRouteContexts,
  loadDashboardRouteContext,
  seedDashboardRouteContext,
} from "@/lib/dashboard/client/route-context";
import { getQueryClient } from "@/lib/query-client";

describe("dashboard route context cache", () => {
  beforeEach(() => {
    getQueryClient().clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    getQueryClient().clear();
  });

  it("shares a pending read between hover preload and navigation", async () => {
    let resolve!: (value: string) => void;
    const read = vi.fn(
      () =>
        new Promise<string>((done) => {
          resolve = done;
        }),
    );
    const preload = loadDashboardRouteContext(["team", "360"], read);
    const navigation = loadDashboardRouteContext(["team", "360"], read);
    resolve("team context");
    expect(await Promise.all([preload, navigation])).toEqual([
      "team context",
      "team context",
    ]);
    expect(read).toHaveBeenCalledTimes(1);
  });

  it("reuses fresh contexts and refreshes them after one minute", async () => {
    const read = vi.fn().mockResolvedValueOnce("old").mockResolvedValue("new");
    expect(await loadDashboardRouteContext(["root"], read)).toBe("old");
    vi.advanceTimersByTime(59_999);
    expect(await loadDashboardRouteContext(["root"], read)).toBe("old");
    vi.advanceTimersByTime(1);
    expect(await loadDashboardRouteContext(["root"], read)).toBe("new");
    expect(read).toHaveBeenCalledTimes(2);
  });

  it("uses the SSR snapshot for the first client navigation", async () => {
    const read = vi.fn().mockResolvedValue("network");
    seedDashboardRouteContext(["root"], "hydrated");
    expect(await loadDashboardRouteContext(["root"], read)).toBe("hydrated");
    expect(read).not.toHaveBeenCalled();
    seedDashboardRouteContext(["root"], "older snapshot");
    expect(await loadDashboardRouteContext(["root"], read)).toBe("hydrated");
  });

  it("refreshes contexts after a settings mutation", async () => {
    const read = vi
      .fn()
      .mockResolvedValueOnce("old")
      .mockResolvedValue("updated");
    await loadDashboardRouteContext(["team", "360"], read);
    await invalidateDashboardRouteContexts();
    expect(await loadDashboardRouteContext(["team", "360"], read)).toBe(
      "updated",
    );
  });

  it("keeps team contexts separate and clears them when the session changes", async () => {
    const first = vi.fn().mockResolvedValue("first team");
    const second = vi.fn().mockResolvedValue("second team");
    await loadDashboardRouteContext(["team", "360"], first);
    expect(await loadDashboardRouteContext(["team", "other"], second)).toBe(
      "second team",
    );
    getQueryClient().clear();
    first.mockResolvedValue("new session");
    expect(await loadDashboardRouteContext(["team", "360"], first)).toBe(
      "new session",
    );
  });

  it("allows a later navigation to retry a failed context read", async () => {
    const read = vi
      .fn()
      .mockRejectedValueOnce(new Error("unavailable"))
      .mockResolvedValue("recovered");
    await expect(loadDashboardRouteContext(["root"], read)).rejects.toThrow(
      "unavailable",
    );
    expect(await loadDashboardRouteContext(["root"], read)).toBe("recovered");
  });

  it("reads each SSR request independently", async () => {
    vi.stubGlobal("window", undefined);
    const requestQueryClient = getQueryClient();
    expect(getQueryClient()).not.toBe(requestQueryClient);
    const read = vi
      .fn()
      .mockResolvedValueOnce("user A")
      .mockResolvedValueOnce("user B");
    expect(await loadDashboardRouteContext(["root"], read)).toBe("user A");
    expect(await loadDashboardRouteContext(["root"], read)).toBe("user B");
    seedDashboardRouteContext(["root"], "SSR does not seed the browser cache");
  });
});
