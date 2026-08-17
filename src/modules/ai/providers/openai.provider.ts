import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import {
  AiProvider,
  FrustrationLogInput,
  LogAnalysisResult,
  ReportGenerationInput,
  ReportGenerationResult,
} from '../ai-provider.interface';

@Injectable()
export class OpenAiProvider implements AiProvider {
  private readonly logger = new Logger(OpenAiProvider.name);
  private readonly client: OpenAI;
  private readonly model: string;
  private readonly embeddingModel: string;

  constructor(private readonly config: ConfigService) {
    this.client = new OpenAI({ apiKey: config.get<string>('ai.openai.apiKey') });
    this.model = config.get<string>('ai.openai.model')!;
    this.embeddingModel = config.get<string>('ai.openai.embeddingModel')!;
  }

  private mapOpenAIError(error: any): { message: string; type: string } {
    if (error?.response?.status === 401) {
      return { message: 'Invalid API key — the configured OpenAI key is not valid.', type: 'authentication' };
    }
    if (error?.response?.status === 429) {
      const rateLimit = error?.response?.headers?.['ratelimit-remaining'];
      const reset = error?.response?.headers?.['ratelimit-reset'];
      return {
        message:
          'You have no credits remaining, or you have hit the rate limit. Add credits to continue using the API at https://platform.openai.com/settings/organization/billing/.',
        type: 'credits',
      };
    }
    if (error?.response?.status === 500) {
      return { message: 'OpenAI server error — please try again in a moment.', type: 'provider' };
    }
    // Network / timeout errors
    if (error?.message?.includes('timeout') || error?.code === 'ECONNREFUSED') {
      return { message: 'Network error — could not reach OpenAI. Please check your connection and try again.', type: 'network' };
    }
    // Generic fallback
    return {
      message: `OpenAI error: ${error?.message ?? 'unknown error'}`,
      type: 'provider',
    };
  }

  async analyzeLog(input: FrustrationLogInput): Promise<LogAnalysisResult> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        response_format: { type: 'json_object' },
        temperature: 0.2,
        messages: [
          {
            role: 'system',
            content:
              'You are a productivity analyst inside FlowLens AI. Given a logged workplace ' +
              'frustration, classify it and score it. Respond ONLY with JSON matching: ' +
              '{"suggestedCategory": string, "suggestedTags": string[], "severityScore": number(0-100), ' +
              '"preventabilityScore": number(0-100), "sentimentSummary": string}. ' +
              `Prefer these existing categories when they fit: ${input.existingCategories.join(', ') || 'none yet'}.`,
          },
          {
            role: 'user',
            content: `Description: "${input.description}"\nSelf-rated frustration (1-10): ${input.frustrationLevel}\nEstimated minutes lost: ${input.estimatedMinutesLost ?? 'unknown'}`,
          },
        ],
      });

      const raw = response.choices[0]?.message?.content ?? '{}';
      try {
        return JSON.parse(raw) as LogAnalysisResult;
      } catch (err) {
        this.logger.warn(`Failed to parse AI analysis response, falling back to defaults: ${raw}`);
        return {
          suggestedCategory: 'Other',
          suggestedTags: [],
          severityScore: input.frustrationLevel * 10,
          preventabilityScore: 50,
          sentimentSummary: 'Unable to analyze automatically.',
        };
      }
    } catch (error) {
      const mapped = this.mapOpenAIError(error);
      this.logger.error(`OpenAI analyzeLog failed [${mapped.type}]: ${mapped.message}`);
      // Return a deterministic fallback so the UI never breaks
      return {
        suggestedCategory: 'Other',
        suggestedTags: [],
        severityScore: input.frustrationLevel * 10,
        preventabilityScore: 50,
        sentimentSummary: mapped.message,
      };
    }
  }

  async generateReport(input: ReportGenerationInput): Promise<ReportGenerationResult> {
    try {
      const logLines = input.logs
        .map((l) => `- [${l.category ?? 'Uncategorized'}] ${l.description} (${l.estimatedMinutesLost ?? 0}min, score ${l.frictionScore ?? 'n/a'})`)
        .join('\n');

      const response = await this.client.chat.completions.create({
        model: this.model,
        response_format: { type: 'json_object' },
        temperature: 0.4,
        messages: [
          {
            role: 'system',
            content:
              'You write concise, actionable productivity reports for FlowLens AI. Respond ONLY with JSON: ' +
              '{"summary": string, "recommendations": [{"title": string, "description": string, "category": string}], ' +
              '"burnoutRiskScore": number(0-1)}. Keep the summary under 120 words. Give 2-4 recommendations, ' +
              'each specific and immediately actionable, grounded only in the logs provided.',
          },
          { role: 'user', content: `Period: ${input.periodLabel}\n\nLogged frustrations:\n${logLines || '(none logged this period)'}` },
        ],
      });

      const raw = response.choices[0]?.message?.content ?? '{}';
      try {
        return JSON.parse(raw) as ReportGenerationResult;
      } catch (err) {
        this.logger.warn(`Failed to parse AI report response, falling back to defaults: ${raw}`);
        return { summary: 'Not enough data to generate a detailed summary this period.', recommendations: [], burnoutRiskScore: 0 };
      }
    } catch (error) {
      const mapped = this.mapOpenAIError(error);
      this.logger.error(`OpenAI generateReport failed [${mapped.type}]: ${mapped.message}`);
      return {
        summary: mapped.message,
        recommendations: [],
        burnoutRiskScore: 0,
      };
    }
  }

  async createEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.client.embeddings.create({ model: this.embeddingModel, input: text });
      return response.data[0].embedding;
    } catch (error) {
      const mapped = this.mapOpenAIError(error);
      this.logger.error(`OpenAI createEmbedding failed [${mapped.type}]: ${mapped.message}`);
      return [];
    }
  }

  async transcribeAudio(audioBuffer: Buffer, mimeType: string): Promise<string> {
    try {
      const file = new File([audioBuffer], `audio.${mimeType.split('/')[1] ?? 'webm'}`, { type: mimeType });
      const response = await this.client.audio.transcriptions.create({ file, model: 'whisper-1' });
      return response.text;
    } catch (error) {
      const mapped = this.mapOpenAIError(error);
      this.logger.error(`OpenAI transcribeAudio failed [${mapped.type}]: ${mapped.message}`);
      return '';
    }
  }
}