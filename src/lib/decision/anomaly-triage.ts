import { clampString } from "@/lib/edge/utils";

import type { ClefClient } from "./clef-client";
import { defaultClefClient } from "./clef-client";
import type { ChoiceAnswer, NoulAnswer, SystemOneQuestion } from "./types";

export interface AnomalyTriageInput {
  siteName: string;
  metric: string;
  window: string;
  currentValue: number;
  targetValue: number;
  operator: string;
  timestamp?: number;
  timeZone?: string;
  additionalContext?: Record<string, unknown>;
}

export type AnomalyUrgency =
  "p0_critical" | "p1_warning" | "p2_info" | "transient_noise";

export type AnomalySuspectedCause =
  | "origin_outage_or_spike"
  | "bot_or_crawler_surge"
  | "marketing_campaign_traffic"
  | "tracking_snippet_failure"
  | "normal_business_hours_fluctuation";

export interface AnomalyTriageResult {
  isActionable: boolean;
  actionableProbability: number;
  urgency: AnomalyUrgency;
  urgencyConfidence: number;
  suspectedCause: AnomalySuspectedCause;
  causeConfidence: number;
  diagnosticExplanation: string;
}

export async function triageAnomalyAlert(
  input: AnomalyTriageInput,
  client: ClefClient = defaultClefClient,
): Promise<AnomalyTriageResult | null> {
  let deviation = 0;
  if (
    Number.isFinite(input.currentValue) &&
    Number.isFinite(input.targetValue)
  ) {
    if (Math.abs(input.targetValue) > 0) {
      deviation =
        ((input.currentValue - input.targetValue) /
          Math.abs(input.targetValue)) *
        100;
    } else {
      deviation = input.currentValue === 0 ? 0 : 100;
    }
  }

  const rawTs = typeof input.timestamp === "number" ? input.timestamp : null;
  const normalizedMs =
    rawTs !== null ? (rawTs < 1e11 ? rawTs * 1000 : rawTs) : Date.now();

  const state = {
    site: clampString(input.siteName || "Unknown", 120),
    metric: clampString(input.metric || "unknown", 60),
    window: clampString(input.window || "last_1h", 30),
    operator: clampString(input.operator || ">=", 10),
    current_value: input.currentValue,
    threshold_value: input.targetValue,
    deviation_percentage: `${deviation.toFixed(1)}%`,
    time: new Date(normalizedMs).toISOString(),
    timezone: clampString(input.timeZone || "UTC", 40),
    context: input.additionalContext || {},
  };

  const questions: Record<string, SystemOneQuestion> = {
    actionable: {
      type: "noul",
      instructions:
        "Is this metric breach an actionable incident that genuinely requires on-call engineer or site-owner attention, rather than benign expected fluctuation?",
    },
    urgency: {
      type: "choice",
      instructions: "What is the operational urgency level of this incident?",
      criteria: {
        p0_critical:
          "Severe incident causing major user-facing outage or complete data loss",
        p1_warning:
          "Significant anomaly or performance degradation requiring investigation",
        p2_info: "Minor or noteworthy deviation worth logging but not urgent",
        transient_noise:
          "Transient edge jitter, off-peak baseline drop, or benign fluctuation",
      },
    },
    cause: {
      type: "choice",
      instructions:
        "What is the most likely root cause category for this anomaly?",
      criteria: {
        origin_outage_or_spike:
          "Origin server downtime, error spike, or severe degradation",
        bot_or_crawler_surge:
          "Sudden scraper, SEO crawler, or bot volume flooding the site",
        marketing_campaign_traffic:
          "Legitimate traffic influx from a promotion, link share, or campaign",
        tracking_snippet_failure:
          "JavaScript tracker uninstalled, misconfigured, or script blocked",
        normal_business_hours_fluctuation:
          "Expected drop during late night or weekend off-peak hours",
      },
    },
  };

  const response = await client.evaluateDecision<{
    actionable: NoulAnswer;
    urgency: ChoiceAnswer<AnomalyUrgency>;
    cause: ChoiceAnswer<AnomalySuspectedCause>;
  }>(state, questions);

  if (!response?.answers) {
    return null;
  }

  const { actionable, urgency, cause } = response.answers;

  if (!actionable || !urgency || !cause) {
    return null;
  }

  const actionableProb =
    typeof actionable.noul === "number" && Number.isFinite(actionable.noul)
      ? actionable.noul
      : 0;
  const urgencyConf =
    typeof urgency.confidence === "number" &&
    Number.isFinite(urgency.confidence)
      ? urgency.confidence
      : 0;
  const causeConf =
    typeof cause.confidence === "number" && Number.isFinite(cause.confidence)
      ? cause.confidence
      : 0;

  const CAUSE_EXPLANATIONS: Record<AnomalySuspectedCause, string> = {
    origin_outage_or_spike: "源站異常或連線中斷引發之劇烈波動",
    bot_or_crawler_surge: "自動化爬蟲或機器人突發流量激增",
    marketing_campaign_traffic: "行銷推廣、社群轉發或活動導入的真實流量增長",
    tracking_snippet_failure: "埋點腳本可能遺失或被阻擋，導致指標歸零",
    normal_business_hours_fluctuation: "離峰時段（深夜/週末）的常態性週期波動",
  };

  const selectedCause = cause.choice || "normal_business_hours_fluctuation";

  return {
    isActionable: actionableProb >= 0.5,
    actionableProbability: Number(actionableProb.toFixed(2)),
    urgency: urgency.choice || "p2_info",
    urgencyConfidence: Number(urgencyConf.toFixed(2)),
    suspectedCause: selectedCause,
    causeConfidence: Number(causeConf.toFixed(2)),
    diagnosticExplanation:
      CAUSE_EXPLANATIONS[selectedCause] || "指標波動，建議檢視即時日誌",
  };
}
