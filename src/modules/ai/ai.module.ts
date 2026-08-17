import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AI_PROVIDER } from './ai-provider.interface';
import { OpenAiProvider } from './providers/openai.provider';
import { GeminiProvider } from './providers/gemini.provider';
import { GroqProvider } from './providers/groq.provider';
import { AiService } from './ai.service';

@Module({
  imports: [ConfigModule],
  providers: [
    OpenAiProvider,
    GeminiProvider,
    GroqProvider,
    {
      provide: AI_PROVIDER,
      inject: [ConfigService, OpenAiProvider, GeminiProvider, GroqProvider],
      useFactory: (config: ConfigService, openai: OpenAiProvider, gemini: GeminiProvider, groq: GroqProvider) => {
        switch (config.get<string>('ai.provider')) {
          case 'gemini':
            return gemini;
          case 'groq':
            return groq;
          case 'openai':
          default:
            return openai;
        }
      },
    },
    AiService,
  ],
  exports: [AiService],
})
export class AiModule {}
