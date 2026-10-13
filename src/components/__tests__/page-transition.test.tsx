import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { router, state } = vi.hoisted(() => ({
  router: { push: vi.fn(), replace: vi.fn(), preload: vi.fn() },
  state: {
    status: "idle",
    location: {
      pathname: "/zh-tw/app/360/site/pages",
      searchStr: "",
      hash: "",
    },
    resolvedLocation: {
      pathname: "/zh-tw/app/360/site/pages",
      searchStr: "",
      hash: "",
    },
  },
}));
vi.mock("@/lib/router", () => ({ useRouter: () => router }));
vi.mock("@tanstack/react-router", () => ({
  useRouterState: ({ select }: { select: (value: typeof state) => unknown }) =>
    select(state),
}));

import { PageTransition } from "@/components/page-transition";
import { navigateWithTransition } from "@/lib/page-transition";

describe("page transition responsiveness", () => {
  let root: Root;
  let container: HTMLDivElement;
  beforeEach(() => {
    vi.clearAllMocks();
    router.preload.mockResolvedValue(undefined);
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    vi.useFakeTimers();
    state.resolvedLocation = {
      pathname: "/zh-tw/app/360/site/pages",
      searchStr: "",
      hash: "",
    };
    window.history.replaceState(null, "", state.location.pathname);
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    act(() =>
      root.render(
        <PageTransition>
          <button>Current page</button>
        </PageTransition>,
      ),
    );
  });
  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("starts navigation on click without waiting for an exit animation", () => {
    act(() => navigateWithTransition(router, "/zh-tw/app/360/site/referrers"));
    expect(router.push).toHaveBeenCalledWith("/zh-tw/app/360/site/referrers", {
      scroll: undefined,
    });
    expect(
      container
        .querySelector("[data-page-transition]")
        ?.getAttribute("data-transition"),
    ).not.toBe("exit");
  });

  it("accepts a newer destination while the first navigation is pending", () => {
    act(() => {
      navigateWithTransition(router, "/zh-tw/app/360/site/referrers");
      vi.advanceTimersByTime(60);
      navigateWithTransition(router, "/zh-tw/app/360/site/visitors");
    });
    expect(router.push).toHaveBeenLastCalledWith(
      "/zh-tw/app/360/site/visitors",
      { scroll: undefined },
    );
    expect(router.push).toHaveBeenCalledTimes(2);
  });

  it("keeps direct analytics tab navigation free of page animations", () => {
    state.resolvedLocation = {
      ...state.resolvedLocation,
      pathname: "/zh-tw/app/360/site/referrers",
    };
    act(() =>
      root.render(
        <PageTransition>
          <button>New page</button>
        </PageTransition>,
      ),
    );
    expect(
      container
        .querySelector("[data-page-transition]")
        ?.getAttribute("data-transition"),
    ).toBe("idle");
  });

  it("animates a requested page after arrival and finishes the animation", () => {
    act(() => navigateWithTransition(router, "/zh-tw/app/360/site/referrers"));
    state.resolvedLocation = {
      ...state.resolvedLocation,
      pathname: "/zh-tw/app/360/site/referrers",
    };
    act(() =>
      root.render(
        <PageTransition>
          <button>New page</button>
        </PageTransition>,
      ),
    );
    expect(
      container
        .querySelector("[data-page-transition]")
        ?.getAttribute("data-transition"),
    ).toBe("enter");
    act(() => vi.advanceTimersByTime(180));
    expect(
      container
        .querySelector("[data-page-transition]")
        ?.getAttribute("data-transition"),
    ).toBe("idle");
  });
});
