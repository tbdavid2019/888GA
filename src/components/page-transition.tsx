import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useRouterState } from "@tanstack/react-router";

import {
  type NavigateRequest,
  registerPageTransitionHandler,
} from "@/lib/page-transition";
import { useRouter } from "@/lib/router";

interface PageTransitionProps {
  children: React.ReactNode;
}

function isDashboardDetailRoute(pathname: string): boolean {
  return /\/(?:visitors|sessions)\/detail(?:\/|$)/.test(pathname);
}

function scrollPageToTop(behavior: ScrollBehavior) {
  const pageScrollContainer = document.querySelector<HTMLElement>(
    "[data-page-scroll-container], [data-dashboard-scroll-container]",
  );

  if (pageScrollContainer) {
    const scrollTarget =
      pageScrollContainer.querySelector<HTMLElement>(
        "[data-scrollbar-axis='vertical']",
      ) ?? pageScrollContainer;

    scrollTarget.scrollTo({
      top: 0,
      behavior,
    });
    return;
  }

  window.scrollTo({
    top: 0,
    behavior,
  });
}

export function PageTransition({ children }: PageTransitionProps) {
  const ENTER_DURATION_MS = 180;
  const resolvedLocation = useRouterState({
    select: (state) => state.resolvedLocation ?? state.location,
  });
  const pathname = resolvedLocation.pathname;
  const router = useRouter();
  const reduceMotion = useRef(false);
  const animatedDestinationRef = useRef<string | null>(null);
  const enterTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousPathnameRef = useRef(pathname);
  const [isReady, setIsReady] = useState(false);
  const [transitionState, setTransitionState] = useState<"idle" | "enter">(
    "idle",
  );
  const routeKey = `${resolvedLocation.pathname}${resolvedLocation.searchStr}${resolvedLocation.hash}`;
  const previousRouteKeyRef = useRef(routeKey);

  const performNavigation = useCallback(
    (request: NavigateRequest) => {
      const destination = new URL(request.href, window.location.href).pathname;
      animatedDestinationRef.current =
        destination === window.location.pathname ? null : destination;
      if (request.replace) {
        router.replace(request.href, { scroll: request.scroll });
        return;
      }
      router.push(request.href, { scroll: request.scroll });
    },
    [router],
  );

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      reduceMotion.current = media.matches;
    };

    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useLayoutEffect(() => {
    // Begin navigation immediately; the resolved page animates after arrival.
    const unregister = registerPageTransitionHandler(performNavigation);
    setIsReady(true);
    return unregister;
  }, [performNavigation]);

  useEffect(() => {
    if (previousRouteKeyRef.current === routeKey) return;
    previousRouteKeyRef.current = routeKey;
    const shouldAnimate = animatedDestinationRef.current === pathname;
    animatedDestinationRef.current = null;
    if (enterTimeoutRef.current) {
      clearTimeout(enterTimeoutRef.current);
      enterTimeoutRef.current = null;
    }
    if (shouldAnimate && !reduceMotion.current) {
      setTransitionState("enter");
      enterTimeoutRef.current = setTimeout(() => {
        setTransitionState("idle");
        enterTimeoutRef.current = null;
      }, ENTER_DURATION_MS);
      return;
    }

    setTransitionState("idle");
  }, [routeKey, pathname]);

  useEffect(() => {
    return () => {
      if (enterTimeoutRef.current) {
        clearTimeout(enterTimeoutRef.current);
        enterTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const previousPathname = previousPathnameRef.current;
    previousPathnameRef.current = pathname;
    if (
      isDashboardDetailRoute(previousPathname) ||
      isDashboardDetailRoute(pathname)
    ) {
      return;
    }

    scrollPageToTop(reduceMotion.current ? "auto" : "smooth");
  }, [pathname]);

  return (
    <div
      data-page-transition
      data-page-transition-ready={isReady || undefined}
      data-transition={transitionState}
    >
      {children}
    </div>
  );
}
