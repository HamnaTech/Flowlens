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

// Groq exposes an OpenAI-compatible chat completions API, so we reuse the
// official `openai` SDK pointed at Groq's base URL rather than hand-rolling
// a fetch client.
@Injectable()
export class GroqProvider implements AiProvider {
  private readonly logger = new Logger(GroqProvider.name);
  private readonly client: OpenAI;
  private readonly model = 'llama-3.1-70b-versatile';

  constructor(private readonly config: ConfigService) {
    this.client = new OpenAI({
      apiKey: config.get<string>('ai.groq.apiKey'),
      baseURL: 'https://api.groq.com/openai/v1',
    });
  }

  async analyzeLog(input: FrustrationLogInput): Promise<LogAnalysisResult> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'Classify workplace frustrations. Respond ONLY with JSON: {"suggestedCategory": string, ' +
            '"suggestedTags": string[], "severityScore": number(0-100), "preventabilityScore": number(0-100), "sentimentSummary": string}.',
        },
        { role: 'user', content: `"${input.description}" — frustration ${input.frustrationLevel}/10, ${input.estimatedMinutesLost ?? 'unknown'} min lost.` },
      ],
    });
    try {
      return JSON.parse(response.choices[0]?.message?.content ?? '{}');
    } catch {
      return { suggestedCategory: 'Other', suggestedTags: [], severityScore: input.frustrationLevel * 10, preventabilityScore: 50, sentimentSummary: '' };
    }
  }

  async generateReport(input: ReportGenerationInput): Promise<ReportGenerationResult> {
    const logLines = input.logs.map((l) => `- ${l.description} (${l.category ?? 'Uncategorized'})`).join('\n');
    const response = await this.client.chat.completions.create({
      model: this.model,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'Write a productivity report as JSON: {"summary": string, "recommendations": [{"title": string, "description": string, "category": string}], "burnoutRiskScore": number(0-1)}.',
        },
        { role: 'user', content: `${input.periodLabel}:\n${logLines}` },
      ],
    });
    try {
      return JSON.parse(response.choices[0]?.message?.content ?? '{}');
    } catch {
      return { summary: '', recommendations: [], burnoutRiskScore: 0 };
    }
  }

  async createEmbedding(): Promise<number[]> {
    throw new Error('Groq does not provide an embeddings endpoint. Semantic search falls back to OPENAI_API_KEY if set.');
  }

  async transcribeAudio(audioBuffer: Buffer, mimeType: string): Promise<string> {
    // Groq hosts a fast Whisper-large-v3 endpoint, compatible with the same route.
    const file = new File([audioBuffer], `audio.${mimeType.split('/')[1] ?? 'webm'}`, { type: mimeType });
    const response = await this.client.audio.transcriptions.create({ file, model: 'whisper-large-v3' });
    return response.text;
  }
}
