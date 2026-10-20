import type { Env } from "@/lib/edge/types";

import type {
  ChoiceAnswer,
  ChoiceQuestion,
  ClefClientOptions,
  ClefEndpointConfig,
  NoulAnswer,
  NoulQuestion,
  ScoreAnswer,
  ScoreQuestion,
  SystemOneAnswer,
  SystemOneQuestion,
  SystemOneRequest,
  SystemOneResponse,
} from "./types";

export const DEFAULT_CLEF_PRIMARY_URL =
  "https://clef.create360.ai/v1/systemone";
export const DEFAULT_CLEF_FALLBACK_URL = "https://clef.aiurl.tw/v1/systemone";
export const DEFAULT_TYPESAFE_FALLBACK_URL =
  "https://api.typesafe.ai/v1/systemone";

export const DEFAULT_TIMEOUT_MS = 2500;

export class ClefClient {
  private readonly endpoints: ClefEndpointConfig[];
  private readonly timeoutMs: number;
  private readonly fetchFn: typeof fetch;

  constructor(options?: ClefClientOptions) {
    this.timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.fetchFn = options?.fetchFn ?? fetch;

    this.endpoints = [
      {
        url: options?.primaryUrl || DEFAULT_CLEF_PRIMARY_URL,
      },
      {
        url: options?.fallbackUrl || DEFAULT_CLEF_FALLBACK_URL,
      },
      {
        url: options?.typesafeUrl || DEFAULT_TYPESAFE_FALLBACK_URL,
        authHeaderKey: "Authorization",
        authHeaderPrefix: "Bearer ",
        apiKey: options?.typesafeApiKey,
      },
    ];
  }

  static fromEnv(env?: Partial<Env>, options?: ClefClientOptions): ClefClient {
    return new ClefClient({
      ...options,
      primaryUrl: options?.primaryUrl || env?.CLEF_API_URL,
      fallbackUrl: options?.fallbackUrl || env?.CLEF_FALLBACK_URL,
      typesafeApiKey: options?.typesafeApiKey || env?.TYPESAFE_API_KEY,
    });
  }

  async checkHealth(healthEndpointUrl?: string): Promise<boolean> {
    try {
      const targetUrl =
        healthEndpointUrl ||
        this.endpoints[0]?.url.replace(/\/v1\/systemone\/?$/, "/health") ||
        "https://clef.create360.ai/health";
      const res = await this.fetchFn(targetUrl, {
        method: "GET",
        signal: AbortSignal.timeout(this.timeoutMs),
      });
      if (!res.ok) {
        await res.body?.cancel().catch(() => {});
        return false;
      }
      const data = (await res.json().catch(() => ({}))) as { status?: string };
      return data.status === "ok";
    } catch {
      return false;
    }
  }

  async evaluateDecision<
    TAnswers extends Record<string, SystemOneAnswer> = Record<
      string,
      SystemOneAnswer
    >,
  >(
    state: unknown,
    questions: Record<string, SystemOneQuestion>,
    options?: { images?: string[] | null },
  ): Promise<SystemOneResponse<TAnswers> | null> {
    const payload: SystemOneRequest = {
      model: "clef-flash",
      state,
      questions,
      images: options?.images,
    };

    const bodyString = JSON.stringify(payload);

    for (const ep of this.endpoints) {
      // If endpoint requires an API key but none is configured, skip to next fallback
      if (ep.authHeaderKey && !ep.apiKey) {
        continue;
      }

      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          Accept: "application/json",
        };

        if (ep.authHeaderKey && ep.apiKey) {
          headers[ep.authHeaderKey] =
            `${ep.authHeaderPrefix ?? ""}${ep.apiKey}`;
        }

        const response = await this.fetchFn(ep.url, {
          method: "POST",
          headers,
          body: bodyString,
          signal: AbortSignal.timeout(this.timeoutMs),
        });

        if (!response.ok) {
          await response.body?.cancel().catch(() => {});
          // Client errors (400, 404, 422) indicate malformed question schema or token limits; do not retry fallbacks
          if (
            response.status >= 400 &&
            response.status < 500 &&
            response.status !== 429
          ) {
            return null;
          }
          continue;
        }

        const data = (await response.json()) as SystemOneResponse<TAnswers>;
        if (
          data &&
          typeof data === "object" &&
          data.answers &&
          typeof data.answers === "object"
        ) {
          return data;
        }
      } catch {
        // Try next fallback on network error or timeout
        continue;
      }
    }

    return null;
  }

  async askProbability(
    state: unknown,
    instructions: string,
    criteria?: Record<string, unknown>,
  ): Promise<number | null> {
    const question: NoulQuestion = {
      type: "noul",
      instructions,
      criteria,
    };

    const response = await this.evaluateDecision<{ prob: NoulAnswer }>(state, {
      prob: question,
    });

    return response?.answers.prob?.noul ?? null;
  }

  async askChoice<TChoice extends string = string>(
    state: unknown,
    instructions: string,
    criteria: Record<TChoice, string | null>,
  ): Promise<ChoiceAnswer<TChoice> | null> {
    const question: ChoiceQuestion = {
      type: "choice",
      instructions,
      criteria,
    };

    const response = await this.evaluateDecision<{
      result: ChoiceAnswer<TChoice>;
    }>(state, {
      result: question,
    });

    return response?.answers.result ?? null;
  }

  async askScore(
    state: unknown,
    instructions: string,
    levels: Array<string | Record<string, unknown>>,
  ): Promise<ScoreAnswer | null> {
    const question: ScoreQuestion = {
      type: "score",
      instructions,
      criteria: levels,
    };

    const response = await this.evaluateDecision<{ score: ScoreAnswer }>(
      state,
      {
        score: question,
      },
    );

    return response?.answers.score ?? null;
  }
}

export const defaultClefClient = new ClefClient();
