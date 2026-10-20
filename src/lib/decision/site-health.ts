import { clampString } from "@/lib/edge/utils";

import type { ClefClient } from "./clef-client";
import { defaultClefClient } from "./clef-client";
import type {
  ChoiceAnswer,
  NoulAnswer,
  ScoreAnswer,
  SystemOneQuestion,
} from "./types";

export interface SiteMetricsInput {
  siteName: string;
  domain?: string;
  pageviews: number;
  visitors: number;
  bounceRate: number;
  avgDurationSec: number;
  p95LatencyMs?: number;
  recentErrorRate?: number;
  topReferrers?: Array<{ name: string; share?: number }>;
  timeRangeDescription?: string;
}

export type PrimaryBottleneck =
  | "high_bounce_rate"
  | "slow_performance"
  | "low_traffic_volume"
  | "elevated_error_rate"
  | "none_healthy";

export type TrafficAuthenticity =
  "human_predominant" | "crawler_heavy" | "suspected_spam_or_scraping";

export interface SiteHealthDiagnosis {
  healthScore: number;
  healthLevel: string;
  confidence: number;
  primaryBottleneck: PrimaryBottleneck;
  bottleneckConfidence: number;
  trafficAuthenticity: TrafficAuthenticity;
  needsUrgentAttention: boolean;
  attentionProbability: number;
  summaryRecommendation: string;
}

const HEALTH_LEVELS = [
  "Critical degradation (severe bounce, low retention, or high errors)",
  "Below average (concerning metrics requiring optimization)",
  "Average (typical standard performance)",
  "Good (healthy user engagement and smooth performance)",
  "Excellent (outstanding retention, fast response, and solid traffic)",
];

export async function diagnoseSiteHealth(
  metrics: SiteMetricsInput,
  client: ClefClient = defaultClefClient,
): Promise<SiteHealthDiagnosis | null> {
  const state = {
    site: clampString(metrics.siteName || "Site", 120),
    domain: metrics.domain ? clampString(metrics.domain, 120) : undefined,
    period: clampString(metrics.timeRangeDescription || "last 24 hours", 60),
    pageviews: metrics.pageviews,
    visitors: metrics.visitors,
    pages_per_visitor:
      metrics.visitors > 0
        ? Number((metrics.pageviews / metrics.visitors).toFixed(2))
        : 0,
    bounce_rate_percentage: `${(metrics.bounceRate * 100).toFixed(1)}%`,
    avg_session_duration_seconds: metrics.avgDurationSec,
    p95_latency_ms: metrics.p95LatencyMs ?? "unspecified",
    error_rate_percentage:
      metrics.recentErrorRate !== undefined
        ? `${(metrics.recentErrorRate * 100).toFixed(2)}%`
        : "unspecified",
    top_referrers: (metrics.topReferrers?.slice(0, 5) || []).map((r) => ({
      name: clampString(r.name, 120),
      share: r.share,
    })),
  };

  const questions: Record<string, SystemOneQuestion> = {
    health: {
      type: "score",
      instructions:
        "Evaluate the overall health and operational quality of this website based on the provided analytics telemetry.",
      criteria: HEALTH_LEVELS,
    },
    bottleneck: {
      type: "choice",
      instructions:
        "What is the single biggest performance or engagement bottleneck affecting this site?",
      criteria: {
        high_bounce_rate:
          "Visitors bounce unusually fast without exploring other pages",
        slow_performance: "High p95 latency or sluggish page response times",
        low_traffic_volume:
          "Extremely low visitors or engagement compared to normal baseline",
        elevated_error_rate: "Unacceptable spike in HTTP error rate",
        none_healthy:
          "No major bottleneck detected; site is performing healthily",
      },
    },
    authenticity: {
      type: "choice",
      instructions:
        "What is the assessed authenticity profile of the incoming traffic?",
      criteria: {
        human_predominant:
          "Primarily genuine human visitors with organic browsing patterns",
        crawler_heavy:
          "Noticeable share of benign automated search crawlers or indexers",
        suspected_spam_or_scraping:
          "Signs of referrer spam, automated scraping, or suspicious bursts",
      },
    },
    urgent_attention: {
      type: "noul",
      instructions:
        "Does this website have critical indicators that require urgent administrator intervention today?",
    },
  };

  const response = await client.evaluateDecision<{
    health: ScoreAnswer;
    bottleneck: ChoiceAnswer<PrimaryBottleneck>;
    authenticity: ChoiceAnswer<TrafficAuthenticity>;
    urgent_attention: NoulAnswer;
  }>(state, questions);

  if (!response?.answers) {
    return null;
  }

  const { health, bottleneck, authenticity, urgent_attention } =
    response.answers;

  if (!health || !bottleneck || !authenticity || !urgent_attention) {
    return null;
  }

  const rawScore =
    typeof health.score === "number" && Number.isFinite(health.score)
      ? health.score
      : 2;
  const healthConf =
    typeof health.confidence === "number" && Number.isFinite(health.confidence)
      ? health.confidence
      : 0;
  const bottleneckConf =
    typeof bottleneck.confidence === "number" &&
    Number.isFinite(bottleneck.confidence)
      ? bottleneck.confidence
      : 0;
  const urgentProb =
    typeof urgent_attention.noul === "number" &&
    Number.isFinite(urgent_attention.noul)
      ? urgent_attention.noul
      : 0;

  const scoreIndex = Math.min(
    Math.max(Math.round(rawScore), 0),
    HEALTH_LEVELS.length - 1,
  );
  const healthLevel = HEALTH_LEVELS[scoreIndex] ?? "Average";

  // Derive human recommendation string based on typed decisions
  let summaryRecommendation = "站點整體營運指標正常。";
  if (urgentProb > 0.6) {
    summaryRecommendation =
      "發現緊急異常指標，建議立即檢查源站日誌與連線狀態。";
  } else if (bottleneck.choice === "high_bounce_rate") {
    summaryRecommendation =
      "跳出率偏高，建議優化 Landing Page 內容黏著度與首屏載入引導。";
  } else if (bottleneck.choice === "slow_performance") {
    summaryRecommendation =
      "P95 延遲偏高，建議檢查靜態資源快取策略與邊緣邊界回應速度。";
  } else if (bottleneck.choice === "elevated_error_rate") {
    summaryRecommendation =
      "錯誤率上升，建議檢視近期發布紀錄或 API 源站服務健康度。";
  } else if (authenticity.choice === "suspected_spam_or_scraping") {
    summaryRecommendation =
      "偵測到可疑的爬蟲或推薦來源，建議啟用邊緣過濾或屏蔽規則。";
  }

  return {
    healthScore: Number(rawScore.toFixed(1)),
    healthLevel,
    confidence: Number(healthConf.toFixed(2)),
    primaryBottleneck: bottleneck.choice || "none_healthy",
    bottleneckConfidence: Number(bottleneckConf.toFixed(2)),
    trafficAuthenticity: authenticity.choice || "human_predominant",
    needsUrgentAttention: urgentProb >= 0.5,
    attentionProbability: Number(urgentProb.toFixed(2)),
    summaryRecommendation,
  };
}
