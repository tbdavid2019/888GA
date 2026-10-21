import { useCallback, useEffect, useRef, useState } from "react";
import { AutoTransition } from "@insightflare/ui/auto-transition";
import { Button } from "@insightflare/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@insightflare/ui/dialog";
import { Input } from "@insightflare/ui/input";
import { Label } from "@insightflare/ui/label";
import { Spinner } from "@insightflare/ui/spinner";
import {
  RiLoginBoxLine,
  RiRefreshLine,
  RiShieldCrossLine,
  RiSparklingLine,
} from "@remixicon/react";
import { toast } from "sonner";

import type { Locale } from "@/lib/i18n/config";
import { navigateWithTransition } from "@/lib/page-transition";
import { getQueryClient } from "@/lib/query-client";
import { useRouter } from "@/lib/router";

interface LoginFormProps {
  locale: Locale;
  nextPath: string;
  usernameLabel: string;
  passwordLabel: string;
  signInLabel: string;
  signingInLabel: string;
  verifyingSecurityLabel: string;
  securityVerificationFailedLabel: string;
  securityVerificationTitleLabel: string;
  retrySecurityLabel: string;
  redirectingLabel: string;
  invalidCredentialsLabel: string;
  failedLabel: string;
}

interface LoginResponse {
  ok: boolean;
  data?: {
    next: string;
  };
  error?: string | { code?: string; message?: string };
  message?: string;
}

type LoginTurnstileClientConfig =
  { enabled: false } | { enabled: true; siteKey: string; mode: "invisible" };

type TurnstileStatus =
  "checking" | "disabled" | "loading" | "running" | "verified" | "error";

interface TurnstilePublicResponse {
  ok?: boolean;
  data?: {
    turnstile?: {
      enabled?: boolean;
      siteKey?: string;
      mode?: string;
    };
  };
}

interface TurnstileApi {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      size: "invisible";
      callback: (token: string) => void;
      "error-callback": () => void;
      "expired-callback": () => void;
    },
  ) => string;
  execute: (widgetId: string) => void;
  reset: (widgetId: string) => void;
  remove?: (widgetId: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const TURNSTILE_SCRIPT_ID = "cloudflare-turnstile-script";
const TURNSTILE_TOKEN_TTL_MS = 240_000;
let turnstileScriptPromise: Promise<void> | null = null;

const DEMO_LOCALIZED_CONTENT: Record<
  Locale,
  {
    badge: string;
    action: string;
    quickFill: string;
    quickFillSuccess: string;
    description: string;
    divider: string;
  }
> = {
  "zh-tw": {
    badge: "展示環境體驗",
    action: "以 Demo 示範帳號一鍵進入",
    quickFill: "填入帳密",
    quickFillSuccess: "已填入示範帳密 (demo / demo)",
    description:
      "無需註冊，即刻進入完整指標儀表板、示範站點與 Clef AI 診斷環境（唯讀保護）。",
    divider: "或使用示範帳號",
  },
  zh: {
    badge: "演示环境体验",
    action: "以 Demo 演示账号一键进入",
    quickFill: "填入账密",
    quickFillSuccess: "已填入演示账密 (demo / demo)",
    description:
      "无需注册，即刻进入完整指标仪表板、演示站点与 Clef AI 诊断环境（只读保护）。",
    divider: "或使用演示账号",
  },
  en: {
    badge: "Live Demo Access",
    action: "One-click Sign in as Demo",
    quickFill: "Fill credentials",
    quickFillSuccess: "Demo credentials filled (demo / demo)",
    description:
      "No signup required. Instantly explore real-time analytics, mock sites, and Clef AI diagnosis (read-only).",
    divider: "Or Explore with Demo",
  },
  ja: {
    badge: "デモ環境を体験",
    action: "Demo アカウントでワンクリック体験",
    quickFill: "自動入力",
    quickFillSuccess: "デモ用認証情報を入力しました (demo / demo)",
    description:
      "登録不要。完全なサイト分析ダッシュボード、デモサイト群、Clef AI 診断をすぐに体験できます（読み取り専用）。",
    divider: "またはデモアカウントで試す",
  },
};

function apiErrorCode(payload: LoginResponse): string {
  if (typeof payload.error === "string") return payload.error;
  if (
    payload.error &&
    typeof payload.error === "object" &&
    "code" in payload.error
  ) {
    const code = (payload.error as { code?: unknown }).code;
    return typeof code === "string" ? code : "";
  }
  return "";
}

async function fetchLoginTurnstileConfig(): Promise<LoginTurnstileClientConfig> {
  const response = await fetch("/api/public/login-security", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });
  const payload = (await response.json()) as TurnstilePublicResponse;
  const turnstile = payload.data?.turnstile;
  if (!response.ok || payload.ok !== true || !turnstile?.enabled) {
    return { enabled: false };
  }
  return turnstile.siteKey
    ? { enabled: true, siteKey: turnstile.siteKey, mode: "invisible" }
    : { enabled: false };
}

function loadTurnstileScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (turnstileScriptPromise) return turnstileScriptPromise;

  turnstileScriptPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById(
      TURNSTILE_SCRIPT_ID,
    ) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("load")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.id = TURNSTILE_SCRIPT_ID;
    script.src =
      "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener("error", () => reject(new Error("load")), {
      once: true,
    });
    document.head.appendChild(script);
  });

  return turnstileScriptPromise;
}

export function LoginForm({
  locale,
  nextPath,
  usernameLabel,
  passwordLabel,
  signInLabel,
  signingInLabel,
  verifyingSecurityLabel,
  securityVerificationFailedLabel,
  securityVerificationTitleLabel,
  retrySecurityLabel,
  redirectingLabel,
  invalidCredentialsLabel,
  failedLabel,
}: LoginFormProps) {
  const router = useRouter();
  const turnstileRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const verificationPromiseRef = useRef<Promise<string> | null>(null);
  const tokenRef = useRef<{ token: string; issuedAt: number } | null>(null);
  const configRef = useRef<LoginTurnstileClientConfig>({ enabled: false });
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [turnstileConfig, setTurnstileConfig] =
    useState<LoginTurnstileClientConfig>({ enabled: false });
  const [turnstileStatus, setTurnstileStatus] =
    useState<TurnstileStatus>("checking");
  const [securityDialogOpen, setSecurityDialogOpen] = useState(false);

  useEffect(() => {
    configRef.current = turnstileConfig;
  }, [turnstileConfig]);

  const clearToken = useCallback(() => {
    tokenRef.current = null;
  }, []);

  const resetTurnstile = useCallback(() => {
    clearToken();
    const widgetId = widgetIdRef.current;
    if (widgetId && window.turnstile) {
      window.turnstile.reset(widgetId);
    }
  }, [clearToken]);

  const runTurnstile = useCallback(async (): Promise<string> => {
    const currentConfig = configRef.current;
    if (!currentConfig.enabled) return "";

    const existing = tokenRef.current;
    if (existing && Date.now() - existing.issuedAt < TURNSTILE_TOKEN_TTL_MS) {
      return existing.token;
    }
    if (verificationPromiseRef.current) return verificationPromiseRef.current;

    setTurnstileStatus((status) =>
      status === "loading" ? "loading" : "running",
    );

    const promise = new Promise<string>((resolve, reject) => {
      const container = turnstileRef.current;
      const turnstile = window.turnstile;
      if (!container || !turnstile) {
        reject(new Error("turnstile_unavailable"));
        return;
      }

      const callbacks = {
        callback: (token: string) => {
          tokenRef.current = { token, issuedAt: Date.now() };
          setTurnstileStatus("verified");
          verificationPromiseRef.current = null;
          resolve(token);
        },
        "error-callback": () => {
          clearToken();
          setTurnstileStatus("error");
          verificationPromiseRef.current = null;
          reject(new Error("turnstile_error"));
        },
        "expired-callback": () => {
          clearToken();
          setTurnstileStatus("error");
          verificationPromiseRef.current = null;
        },
      };

      if (!widgetIdRef.current) {
        widgetIdRef.current = turnstile.render(container, {
          sitekey: currentConfig.siteKey,
          size: "invisible",
          ...callbacks,
        });
      }
      turnstile.execute(widgetIdRef.current);
    });

    verificationPromiseRef.current = promise;
    return promise;
  }, [clearToken]);

  const initializeTurnstile = useCallback(async () => {
    try {
      const config = await fetchLoginTurnstileConfig();
      setTurnstileConfig(config);
      configRef.current = config;
      if (!config.enabled) {
        setTurnstileStatus("disabled");
        return;
      }
      setTurnstileStatus("loading");
      await loadTurnstileScript();
      await runTurnstile();
    } catch {
      clearToken();
      setTurnstileStatus("error");
    }
  }, [clearToken, runTurnstile]);

  useEffect(() => {
    void initializeTurnstile();
    return () => {
      const widgetId = widgetIdRef.current;
      if (widgetId && window.turnstile?.remove) {
        window.turnstile.remove(widgetId);
      }
      widgetIdRef.current = null;
      verificationPromiseRef.current = null;
    };
  }, [initializeTurnstile]);

  async function retrySecurityVerification() {
    setSecurityDialogOpen(false);
    resetTurnstile();
    setTurnstileStatus("running");
    try {
      await runTurnstile();
    } catch {
      setTurnstileStatus("error");
      setSecurityDialogOpen(true);
    }
  }

  const demoCopy = DEMO_LOCALIZED_CONTENT[locale] ?? DEMO_LOCALIZED_CONTENT.en;

  const isDemoCredentials = (u: string, p: string) =>
    u.trim().toLowerCase() === "demo" && p.trim() === "demo";

  async function handleLogin(
    targetUsername = username,
    targetPassword = password,
  ) {
    if (pending || redirecting) return;
    setPending(true);
    let loginSucceeded = false;
    try {
      const isDemo = isDemoCredentials(targetUsername, targetPassword);
      const currentConfig = configRef.current;
      const turnstileToken =
        !isDemo && currentConfig.enabled ? await runTurnstile() : "";
      const response = await fetch("/api/public/session", {
        method: "POST",
        credentials: "include",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          username: targetUsername,
          password: targetPassword,
          next: nextPath,
          ...(!isDemo && currentConfig.enabled ? { turnstileToken } : {}),
        }),
      });
      if (currentConfig.enabled) clearToken();
      const payload = (await response.json()) as LoginResponse;
      if (!response.ok || !payload.ok || !payload.data) {
        const code = apiErrorCode(payload);
        if (code === "turnstile_failed" || code === "turnstile_required") {
          resetTurnstile();
          setTurnstileStatus("error");
          setSecurityDialogOpen(true);
          throw new Error(securityVerificationFailedLabel);
        }
        const message =
          code === "invalid_credentials" ||
          payload.error === "invalid_credentials"
            ? invalidCredentialsLabel
            : payload.message || failedLabel;
        throw new Error(message);
      }
      setRedirecting(true);
      loginSucceeded = true;
      getQueryClient().clear();
      navigateWithTransition(router, payload.data.next || `/${locale}/app`);
    } catch (error) {
      const message = error instanceof Error ? error.message : failedLabel;
      toast.error(message || failedLabel);
    } finally {
      if (!loginSucceeded) setPending(false);
    }
  }

  function handleFillDemo() {
    setUsername("demo");
    setPassword("demo");
    toast.success(demoCopy.quickFillSuccess);
  }

  function handleOneClickDemo() {
    setUsername("demo");
    setPassword("demo");
    void handleLogin("demo", "demo");
  }

  const isDemoInput = isDemoCredentials(username, password);
  const securityBlocking =
    !isDemoInput &&
    turnstileConfig.enabled &&
    (turnstileStatus === "checking" ||
      turnstileStatus === "loading" ||
      turnstileStatus === "running");
  const buttonDisabled = pending || redirecting || securityBlocking;
  const buttonLabel = redirecting
    ? redirectingLabel
    : securityBlocking
      ? verifyingSecurityLabel
      : pending
        ? signingInLabel
        : signInLabel;
  const showButtonSpinner = pending || redirecting || securityBlocking;

  return (
    <>
      <form
        className="space-y-4"
        method="post"
        action="/api/public/session"
        onSubmit={(event) => {
          event.preventDefault();
          void handleLogin();
        }}
      >
        <input type="hidden" name="next" value={nextPath} />
        <div className="space-y-2">
          <Label htmlFor="username">{usernameLabel}</Label>
          <Input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">{passwordLabel}</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={buttonDisabled}>
          <AutoTransition className="inline-flex items-center gap-[var(--button-content-gap)]">
            {showButtonSpinner ? (
              <span
                key={buttonLabel}
                className="inline-flex items-center gap-[var(--button-content-gap)]"
              >
                <Spinner data-icon="inline-start" />
                {buttonLabel}
              </span>
            ) : (
              <span
                key="idle"
                className="inline-flex items-center gap-[var(--button-content-gap)]"
              >
                <RiLoginBoxLine data-icon="inline-start" />
                {buttonLabel}
              </span>
            )}
          </AutoTransition>
        </Button>
        {turnstileConfig.enabled ? (
          <div ref={turnstileRef} className="hidden" aria-hidden="true" />
        ) : null}
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border/70" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-card px-2.5 text-muted-foreground font-mono">
            {demoCopy.divider}
          </span>
        </div>
      </div>

      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3 transition-colors hover:border-primary/30">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <RiSparklingLine className="size-3.5 text-primary shrink-0" />
            {demoCopy.badge}
          </span>
          <button
            type="button"
            onClick={handleFillDemo}
            className="text-xs text-primary font-medium hover:underline hover:text-primary/80 transition-colors"
          >
            {demoCopy.quickFill}
          </button>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full justify-between h-9 text-xs border-primary/30 bg-background/80 hover:bg-primary/10 hover:border-primary/50 text-foreground transition-all group"
          onClick={handleOneClickDemo}
          disabled={pending || redirecting}
        >
          <span className="inline-flex items-center gap-1.5 font-medium">
            <RiSparklingLine className="size-3.5 text-primary group-hover:rotate-12 transition-transform" />
            <span>{demoCopy.action}</span>
          </span>
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground group-hover:text-foreground">
            demo / demo
          </code>
        </Button>

        <p className="text-[11px] leading-relaxed text-muted-foreground">
          {demoCopy.description}
        </p>
      </div>

      <Dialog open={securityDialogOpen} onOpenChange={setSecurityDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle
              icon={RiShieldCrossLine}
              iconClassName="text-destructive"
            >
              {securityVerificationTitleLabel}
            </DialogTitle>
            <DialogDescription>
              {securityVerificationFailedLabel}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              onClick={() => {
                void retrySecurityVerification();
              }}
            >
              <RiRefreshLine data-icon="inline-start" />
              {retrySecurityLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
