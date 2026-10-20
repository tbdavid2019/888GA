import { describe, expect, it, vi } from "vitest";

import {
  ClefClient,
  DEFAULT_CLEF_FALLBACK_URL,
  DEFAULT_CLEF_PRIMARY_URL,
  DEFAULT_TYPESAFE_FALLBACK_URL,
} from "@/lib/decision/clef-client";
import type {
  ChoiceQuestion,
  NoulQuestion,
  ScoreQuestion,
} from "@/lib/decision/types";

describe("ClefClient", () => {
  it("initializes with default endpoints", () => {
    const client = new ClefClient();
    expect(client).toBeDefined();
  });

  it("checks health successfully", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: "ok" }),
    });

    const client = new ClefClient({
      fetchFn: mockFetch as unknown as typeof fetch,
    });
    const healthy = await client.checkHealth();

    expect(healthy).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith(
      "https://clef.create360.ai/health",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("evaluates decision using primary endpoint when available", async () => {
    const mockResponse = {
      model: "clef-flash",
      answers: {
        is_bot: { type: "noul", noul: 0.88 },
      },
      usage: { input_tokens: 150, output_tokens: 0 },
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const client = new ClefClient({
      fetchFn: mockFetch as unknown as typeof fetch,
    });

    const questions: Record<string, NoulQuestion> = {
      is_bot: { type: "noul", instructions: "Is this a bot?" },
    };

    const result = await client.evaluateDecision(
      { ua: "curl/7.68.0" },
      questions,
    );

    expect(result).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      DEFAULT_CLEF_PRIMARY_URL,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          model: "clef-flash",
          state: { ua: "curl/7.68.0" },
          questions,
        }),
      }),
    );
  });

  it("falls back to secondary endpoint if primary fails", async () => {
    const mockResponse = {
      model: "clef-flash",
      answers: {
        is_bot: { type: "noul", noul: 0.12 },
      },
    };

    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 503 })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

    const client = new ClefClient({
      fetchFn: mockFetch as unknown as typeof fetch,
    });

    const result = await client.evaluateDecision(
      { ua: "Mozilla/5.0" },
      { is_bot: { type: "noul" } },
    );

    expect(result).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenNthCalledWith(
      1,
      DEFAULT_CLEF_PRIMARY_URL,
      expect.anything(),
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      DEFAULT_CLEF_FALLBACK_URL,
      expect.anything(),
    );
  });

  it("falls back to typesafe third endpoint with API key when both primary and secondary fail", async () => {
    const mockResponse = {
      model: "clef-flash",
      answers: {
        is_bot: { type: "noul", noul: 0.5 },
      },
    };

    const mockFetch = vi
      .fn()
      .mockRejectedValueOnce(new Error("Primary network error"))
      .mockResolvedValueOnce({ ok: false, status: 502 })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

    const client = new ClefClient({
      typesafeApiKey: "test-typesafe-key-123",
      fetchFn: mockFetch as unknown as typeof fetch,
    });

    const result = await client.evaluateDecision(
      { ua: "Chrome" },
      { is_bot: { type: "noul" } },
    );

    expect(result).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledTimes(3);
    expect(mockFetch).toHaveBeenNthCalledWith(
      3,
      DEFAULT_TYPESAFE_FALLBACK_URL,
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer test-typesafe-key-123",
        }),
      }),
    );
  });

  it("askProbability returns single probability float", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        model: "clef-flash",
        answers: {
          prob: { type: "noul", noul: 0.94 },
        },
      }),
    });

    const client = new ClefClient({
      fetchFn: mockFetch as unknown as typeof fetch,
    });
    const prob = await client.askProbability(
      { status: 500 },
      "Is this an error?",
    );
    expect(prob).toBe(0.94);
  });

  it("askChoice returns structured choice and distribution", async () => {
    const mockChoice = {
      type: "choice" as const,
      choice: "critical",
      probabilities: { critical: 0.85, warning: 0.1, info: 0.05 },
      confidence: 0.85,
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        model: "clef-flash",
        answers: { result: mockChoice },
      }),
    });

    const client = new ClefClient({
      fetchFn: mockFetch as unknown as typeof fetch,
    });
    const choice = await client.askChoice({ cpu: 99 }, "Urgency level?", {
      critical: "Severe",
      warning: "Moderate",
      info: "Low",
    });

    expect(choice).toEqual(mockChoice);
  });

  it("askScore returns numeric score and confidence", async () => {
    const mockScore = {
      type: "score" as const,
      score: 4.2,
      legend: {},
      probabilities: { "4": 0.8, "5": 0.2 },
      confidence: 0.8,
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        model: "clef-flash",
        answers: { score: mockScore },
      }),
    });

    const client = new ClefClient({
      fetchFn: mockFetch as unknown as typeof fetch,
    });
    const score = await client.askScore({ lcp: 1200 }, "Rate performance", [
      "Bad",
      "Poor",
      "Fair",
      "Good",
      "Excellent",
    ]);

    expect(score).toEqual(mockScore);
  });
});
