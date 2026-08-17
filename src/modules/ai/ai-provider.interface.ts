export interface FrustrationLogInput {
  description: string;
  frustrationLevel: number;
  estimatedMinutesLost?: number | null;
  existingCategories: string[];
}

export interface LogAnalysisResult {
  suggestedCategory: string;
  suggestedTags: string[];
  severityScore: number; // 0-100
  preventabilityScore: number; // 0-100, how avoidable this was
  sentimentSummary: string;
}

export interface ReportGenerationInput {
  periodLabel: string;
  logs: Array<{
    description: string;
    category: string | null;
    frictionScore: number | null;
    estimatedMinutesLost: number | null;
    occurredAt: Date;
  }>;
}

export interface ReportGenerationResult {
  summary: string;
  recommendations: Array<{ title: string; description: string; category?: string }>;
  burnoutRiskScore: number; // 0-1
}

/**
 * Every LLM provider (OpenAI, Gemini, Groq, self-hosted Ollama) implements
 * this contract. AiService depends only on this interface — swapping
 * AI_PROVIDER in .env requires no changes to business logic, only a new
 * class registered in AiModule's factory.
 */
export interface AiProvider {
  analyzeLog(input: FrustrationLogInput): Promise<LogAnalysisResult>;
  generateReport(input: ReportGenerationInput): Promise<ReportGenerationResult>;
  createEmbedding(text: string): Promise<number[]>;
  transcribeAudio(audioBuffer: Buffer, mimeType: string): Promise<string>;
}

export const AI_PROVIDER = Symbol('AI_PROVIDER');
