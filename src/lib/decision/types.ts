export type QuestionType = "noul" | "choice" | "score";

/**
 * Binary yes/no question returning a probability float in [0.0, 1.0].
 * "noul" represents Clef/SystemOne's probability scoring primitive.
 */
export interface NoulQuestion {
  type: "noul";
  instructions?: string | Record<string, unknown> | unknown[] | null;
  criteria?: Record<string, unknown> | null;
}

/**
 * Categorical question returning an option choice, full probability distribution, and confidence.
 */
export interface ChoiceQuestion {
  type: "choice";
  instructions?: string | Record<string, unknown> | unknown[] | null;
  criteria: Record<string, string | null>;
}

/**
 * Ordinal rating question (2 to 10 ordered levels) returning a continuous weighted score.
 */
export interface ScoreQuestion {
  type: "score";
  instructions?: string | Record<string, unknown> | unknown[] | null;
  criteria: Array<string | Record<string, unknown>>;
}

export type SystemOneQuestion = NoulQuestion | ChoiceQuestion | ScoreQuestion;

export interface NoulAnswer {
  type: "noul";
  noul: number;
}

export interface ChoiceAnswer<TChoice extends string = string> {
  type: "choice";
  choice: TChoice;
  probabilities: Record<TChoice, number>;
  confidence: number;
}

export interface ScoreAnswer {
  type: "score";
  score: number;
  legend: Record<string, unknown>;
  probabilities: Record<string, number>;
  confidence: number;
}

export type SystemOneAnswer = NoulAnswer | ChoiceAnswer | ScoreAnswer;

export interface SystemOneRequest {
  model?: "clef-flash";
  state: unknown;
  questions: Record<string, SystemOneQuestion>;
  images?: string[] | null;
}

export interface SystemOneResponse<
  TAnswers extends Record<string, SystemOneAnswer> = Record<
    string,
    SystemOneAnswer
  >,
> {
  model: string;
  answers: TAnswers;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
}

export interface ClefEndpointConfig {
  url: string;
  authHeaderKey?: string;
  authHeaderPrefix?: string;
  apiKey?: string;
}

export interface ClefClientOptions {
  primaryUrl?: string;
  fallbackUrl?: string;
  typesafeUrl?: string;
  typesafeApiKey?: string;
  timeoutMs?: number;
  fetchFn?: typeof fetch;
}
