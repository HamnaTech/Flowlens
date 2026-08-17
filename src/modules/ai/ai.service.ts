import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  AI_PROVIDER,
  AiProvider,
  FrustrationLogInput,
  LogAnalysisResult,
  ReportGenerationInput,
  ReportGenerationResult,
} from './ai-provider.interface';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(@Inject(AI_PROVIDER) private readonly provider: AiProvider) {}

  async analyzeLog(input: FrustrationLogInput): Promise<LogAnalysisResult> {
    return this.provider.analyzeLog(input);
  }

  async generateReport(input: ReportGenerationInput): Promise<ReportGenerationResult> {
    return this.provider.generateReport(input);
  }

  async createEmbedding(text: string): Promise<number[]> {
    return this.provider.createEmbedding(text);
  }

  async transcribeAudio(buffer: Buffer, mimeType: string): Promise<string> {
    try {
      return await this.provider.transcribeAudio(buffer, mimeType);
    } catch (err) {
      this.logger.error(`Transcription failed: ${(err as Error).message}`);
      return '';
    }
  }

  /**
   * Friction Score formula — deterministic, not LLM-derived, so it's cheap
   * to recompute and stays consistent even if the AI provider changes.
   * The AI supplies severity/preventability inputs; frequency comes from a
   * DB aggregate the caller passes in.
   */
  computeFrictionScore(params: {
    severityScore: number; // 0-100
    frequencyCount: number; // occurrences of similar friction in the period
    minutesLost: number;
    preventabilityScore: number; // 0-100
  }): number {
    const severityWeight = 0.35;
    const frequencyWeight = 0.25;
    const timeWeight = 0.25;
    const preventabilityWeight = 0.15;

    const normalizedFrequency = Math.min(100, params.frequencyCount * 10);
    const normalizedTime = Math.min(100, (params.minutesLost / 60) * 20); // 5hrs lost = 100

    const score =
      params.severityScore * severityWeight +
      normalizedFrequency * frequencyWeight +
      normalizedTime * timeWeight +
      params.preventabilityScore * preventabilityWeight;

    return Math.round(Math.min(100, Math.max(0, score)) * 10) / 10;
  }
}
