import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AiProvider,
  FrustrationLogInput,
  LogAnalysisResult,
  ReportGenerationInput,
  ReportGenerationResult,
} from '../ai-provider.interface';

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

@Injectable()
export class GeminiProvider implements AiProvider {
  private readonly logger = new Logger(GeminiProvider.name);
  private readonly apiKey: string;
  private readonly model = 'gemini-1.5-flash';

  constructor(private readonly config: ConfigService) {
    this.apiKey = config.get<string>('ai.gemini.apiKey')!;
  }

  private async generateJson(prompt: string): Promise<any> {
    const url = `${GEMINI_BASE_URL}/${this.model}:generateContent?key=${this.apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.3 },
      }),
    });
    if (!res.ok) {
      const txt = await res.text();
      // Map Gemini HTTP codes to friendly messages
      if (res.status === 401) {
        return { message: 'Invalid API key — the configured Gemini key is not valid.', type: 'authentication' };
      }
      if (res.status === 429) {
        return {
          message:
            'You have no credits remaining, or you have hit the rate limit. Add credits to continue using the API at https://makersuite.google.com/app/apikey.',
          type: 'credits',
        };
      }
      if (res.status === 500) {
        return { message: 'Gemini server error — please try again in a moment.', type: 'provider' };
      }
      return { message: `Gemini API error: ${res.status} ${txt}`, type: 'provider' };
    }
    const body = (await res.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{
            text?: string;
          }>;
        };
      }>;
    };
    const text = body.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
    try {
      return JSON.parse(text);
    } catch {
      return { message: 'Failed to parse Gemini response', type: 'parse' };
    }
  }

  async analyzeLog(input: FrustrationLogInput): Promise<LogAnalysisResult> {
    const prompt =
      `Classify this workplace frustration and return JSON only: ` +
      `{"suggestedCategory": string, "suggestedTags": string[], "severityScore": number(0-100), "preventabilityScore": number(0-100), "sentimentSummary": string}. ` +
      `Existing categories to prefer: ${input.existingCategories.join(', ') || 'none'}. ` +
      `Description: "${input.description}". Self-rated frustration: ${input.frustrationLevel}/10. Minutes lost: ${input.estimatedMinutesLost ?? 'unknown'}.`;
    try {
      return await this.generateJson(prompt);
    } catch (err) {
      this.logger.error(`Gemini analyzeLog failed: ${(err as Error).message}`);
      return { suggestedCategory: 'Other', suggestedTags: [], severityScore: input.frustrationLevel * 10, preventabilityScore: 50, sentimentSummary: '' };
    }
  }

  async generateReport(input: ReportGenerationInput): Promise<ReportGenerationResult> {
    const logLines = input.logs.map((l) => `- ${l.description} (${l.category ?? 'Uncategorized'}, ${l.estimatedMinutesLost ?? 0}min`).join('\n');
    const prompt =
      `Write a productivity report as JSON only: {"summary": string, "recommendations": [{"title": string, "description": string, "category": string}], "burnoutRiskScore": number(0-1)}. ` +
      `Period: ${input.periodLabel}. Logs:\n${logLines || '(none)'}`;
    try {
      return await this.generateJson(prompt);
    } catch (err) {
      this.logger.error(`Gemini generateReport failed: ${(err as Error).message}`);
      return { summary: 'Report generation failed.', recommendations: [], burnoutRiskScore: 0 };
    }
  }

  async createEmbedding(text: string): Promise<number[]> {
    const url = `${GEMINI_BASE_URL}/text-embedding-004:embedContent?key=${this.apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: { parts: [{ text }] } }),
    });
    if (!res.ok) {
      const txt = await res.text();
      if (res.status === 401) {
        this.logger.error('Gemini embedding: Invalid API key');
        return [];
      }
      if (res.status === 429) {
        this.logger.error('Gemini embedding: No credits / rate limit');
        return [];
      }
      this.logger.error(`Gemini embedding error: ${res.status}`);
      return [];
    }
    const body = (await res.json()) as { embedding?: { values?: number[] } };
    return body.embedding?.values ?? [];
  }

  async transcribeAudio(): Promise<string> {
    throw new Error('Gemini provider does not support audio transcription directly. Configure WHISPER_PROVIDER=openai.');
  }
}