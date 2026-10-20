import { describe, expect, it, vi } from "vitest";

import { triageAnomalyAlert } from "@/lib/decision/anomaly-triage";
import { classifyVisitorBot } from "@/lib/decision/bot-defense";
import { ClefClient } from "@/lib/decision/clef-client";
import { diagnoseSiteHealth } from "@/lib/decision/site-health";

describe("Domain Decision Features", () => {
  it("diagnoses site health properly", async () => {
    const mockResponse = {
      model: "clef-flash",
      answers: {
        health: {
          type: "score",
          score: 3.8,
          legend: {},
          probabilities: {},
          confidence: 0.78,
        },
        bottleneck: {
          type: "choice",
          choice: "high_bounce_rate",
          probabilities: { high_bounce_rate: 0.72 },
          confidence: 0.72,
        },
        authenticity: {
          type: "choice",
          choice: "human_predominant",
          probabilities: { human_predominant: 0.85 },
          confidence: 0.85,
        },
        urgent_attention: {
          type: "noul",
          noul: 0.15,
        },
      },
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const client = new ClefClient({
      fetchFn: mockFetch as unknown as typeof fetch,
    });

    const diagnosis = await diagnoseSiteHealth(
      {
        siteName: "My Blog",
        pageviews: 12500,
        visitors: 4800,
        bounceRate: 0.65,
        avgDurationSec: 42,
      },
      client,
    );

    expect(diagnosis).not.toBeNull();
    expect(diagnosis?.healthScore).toBe(3.8);
    expect(diagnosis?.primaryBottleneck).toBe("high_bounce_rate");
    expect(diagnosis?.needsUrgentAttention).toBe(false);
    expect(diagnosis?.summaryRecommendation).toContain("跳出率偏高");
  });

  it("triages anomaly alert correctly", async () => {
    const mockResponse = {
      model: "clef-flash",
      answers: {
        actionable: { type: "noul", noul: 0.89 },
        urgency: {
          type: "choice",
          choice: "p0_critical",
          probabilities: {},
          confidence: 0.85,
        },
        cause: {
          type: "choice",
          choice: "origin_outage_or_spike",
          probabilities: {},
          confidence: 0.9,
        },
      },
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const client = new ClefClient({
      fetchFn: mockFetch as unknown as typeof fetch,
    });

    const result = await triageAnomalyAlert(
      {
        siteName: "Main Store",
        metric: "views",
        window: "last_1h",
        currentValue: 0,
        targetValue: 500,
        operator: "<",
      },
      client,
    );

    expect(result).not.toBeNull();
    expect(result?.isActionable).toBe(true);
    expect(result?.urgency).toBe("p0_critical");
    expect(result?.suspectedCause).toBe("origin_outage_or_spike");
    expect(result?.diagnosticExplanation).toContain("源站異常或連線中斷");
  });

  it("classifies visitor bot accurately", async () => {
    const mockResponse = {
      model: "clef-flash",
      answers: {
        is_bot: { type: "noul", noul: 0.96 },
        bot_type: {
          type: "choice",
          choice: "automated_scraper",
          probabilities: {},
          confidence: 0.88,
        },
        risk_level: {
          type: "score",
          score: 3.2,
          legend: {},
          probabilities: {},
          confidence: 0.75,
        },
      },
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const client = new ClefClient({
      fetchFn: mockFetch as unknown as typeof fetch,
    });

    const classification = await classifyVisitorBot(
      {
        userAgent: "HeadlessChrome/120.0.0.0",
        path: "/pricing",
        requestsPerMin: 180,
      },
      client,
    );

    expect(classification).not.toBeNull();
    expect(classification?.isBot).toBe(true);
    expect(classification?.botType).toBe("automated_scraper");
    expect(classification?.suggestedAction).toBe("challenge_turnstile");
  });
});
