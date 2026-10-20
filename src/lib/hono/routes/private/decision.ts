import { Hono } from "hono";

import {
  classifyVisitorBot,
  ClefClient,
  diagnoseSiteHealth,
  triageAnomalyAlert,
} from "@/lib/decision";
import { resolvePrivateSiteMiddleware } from "@/lib/hono/middleware/site";
import type { AppEnv } from "@/lib/hono/types";
import { bad, jsonResponseFor } from "@/lib/response";

function parseJsonObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export const privateDecisionRoutes = new Hono<AppEnv>();

// GET /api/private/decision/health - check Clef upstream status
privateDecisionRoutes.get("/health", async (c) => {
  const client = ClefClient.fromEnv(c.env);
  const healthy = await client.checkHealth();
  return jsonResponseFor(
    c.req.raw,
    { ok: true, data: { status: healthy ? "ok" : "degraded" } },
    healthy ? 200 : 503,
  );
});

// POST /api/private/decision/site-health - AI health diagnosis for a site
privateDecisionRoutes.post(
  "/site-health",
  resolvePrivateSiteMiddleware(),
  async (c) => {
    const site = c.get("privateSite");
    if (!site) {
      return bad("Site context is required", undefined, c.req.raw);
    }

    const rawJson = await c.req.raw
      .clone()
      .json()
      .catch(() => null);
    const body = parseJsonObject(rawJson);

    const client = ClefClient.fromEnv(c.env);

    const diagnosis = await diagnoseSiteHealth(
      {
        siteName: site.name || "Site",
        domain: site.domain || undefined,
        pageviews: Number(body.pageviews || 0),
        visitors: Number(body.visitors || 0),
        bounceRate: Number(body.bounceRate || 0),
        avgDurationSec: Number(body.avgDurationSec || 0),
        p95LatencyMs:
          body.p95LatencyMs !== undefined
            ? Number(body.p95LatencyMs)
            : undefined,
        recentErrorRate:
          body.recentErrorRate !== undefined
            ? Number(body.recentErrorRate)
            : undefined,
        topReferrers: Array.isArray(body.topReferrers)
          ? (body.topReferrers as Array<{ name: string; share?: number }>)
          : undefined,
        timeRangeDescription:
          typeof body.timeRange === "string" ? body.timeRange : undefined,
      },
      client,
    );

    if (!diagnosis) {
      return jsonResponseFor(
        c.req.raw,
        {
          ok: false,
          error: "decision_inference_failed",
          message: "Clef decision inference unavailable",
        },
        502,
      );
    }

    return jsonResponseFor(c.req.raw, {
      ok: true,
      data: diagnosis,
    });
  },
);

// POST /api/private/decision/anomaly-triage - evaluate alert priority & cause
privateDecisionRoutes.post("/anomaly-triage", async (c) => {
  const rawJson = await c.req.raw
    .clone()
    .json()
    .catch(() => null);
  const body = parseJsonObject(rawJson);

  const metric = String(body.metric || "");
  const currentValue = Number(body.currentValue ?? 0);
  const targetValue = Number(body.targetValue ?? 0);

  if (!metric) {
    return bad("metric is required", undefined, c.req.raw);
  }

  const client = ClefClient.fromEnv(c.env);

  const triage = await triageAnomalyAlert(
    {
      siteName: String(body.siteName || "Unknown Site"),
      metric,
      window: String(body.window || "last_1h"),
      currentValue,
      targetValue,
      operator: String(body.operator || ">="),
      timestamp:
        typeof body.timestamp === "number" ? body.timestamp : undefined,
      timeZone: typeof body.timeZone === "string" ? body.timeZone : undefined,
      additionalContext:
        body.context && typeof body.context === "object"
          ? (body.context as Record<string, unknown>)
          : undefined,
    },
    client,
  );

  if (!triage) {
    return jsonResponseFor(
      c.req.raw,
      {
        ok: false,
        error: "decision_inference_failed",
        message: "Clef decision inference unavailable",
      },
      502,
    );
  }

  return jsonResponseFor(c.req.raw, {
    ok: true,
    data: triage,
  });
});

// POST /api/private/decision/bot-defense - classify visitor telemetry
privateDecisionRoutes.post("/bot-defense", async (c) => {
  const rawJson = await c.req.raw
    .clone()
    .json()
    .catch(() => null);
  const body = parseJsonObject(rawJson);

  const userAgent = String(body.userAgent || "");
  const path = String(body.path || "/");

  const client = ClefClient.fromEnv(c.env);

  const result = await classifyVisitorBot(
    {
      userAgent,
      path,
      ipAsn: typeof body.ipAsn === "string" ? body.ipAsn : undefined,
      requestsPerMin:
        typeof body.requestsPerMin === "number"
          ? body.requestsPerMin
          : undefined,
      referer: typeof body.referer === "string" ? body.referer : undefined,
      clientHints:
        body.clientHints && typeof body.clientHints === "object"
          ? (body.clientHints as Record<string, unknown>)
          : undefined,
      headers:
        body.headers && typeof body.headers === "object"
          ? (body.headers as Record<string, string>)
          : undefined,
    },
    client,
  );

  if (!result) {
    return jsonResponseFor(
      c.req.raw,
      {
        ok: false,
        error: "decision_inference_failed",
        message: "Clef decision inference unavailable",
      },
      502,
    );
  }

  return jsonResponseFor(c.req.raw, {
    ok: true,
    data: result,
  });
});
