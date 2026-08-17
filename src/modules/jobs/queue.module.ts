import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  QUEUE_AI_ANALYSIS,
  QUEUE_ATTACHMENT_PROCESSING,
  QUEUE_NOTIFICATIONS,
  QUEUE_REPORT_GENERATION,
} from './queue.constants';
import { AiAnalysisProcessor } from './processors/ai-analysis.processor';
import { ReportGenerationProcessor } from './processors/report-generation.processor';
import { NotificationProcessor } from './processors/notification.processor';
import { AttachmentProcessingProcessor } from './processors/attachment-processing.processor';
import { PrismaModule } from '../../prisma/prisma.module';
import { AiModule } from '../ai/ai.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { StorageModule } from '../../storage/storage.module';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        redis: {
          host: config.get<string>('redis.host'),
          port: config.get<number>('redis.port'),
          password: config.get<string>('redis.password'),
          // Managed Redis providers (Upstash, Redis Cloud, Render Redis)
          // require TLS. REDIS_TLS=true enables it; local Redis stays
          // plaintext by default.
          tls: config.get<boolean>('redis.tls') ? {} : undefined,
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
          removeOnComplete: 500, // keep recent history for debugging, don't grow unbounded
          removeOnFail: 1000,
        },
      }),
    }),
    BullModule.registerQueue(
      { name: QUEUE_AI_ANALYSIS },
      { name: QUEUE_REPORT_GENERATION },
      { name: QUEUE_NOTIFICATIONS },
      { name: QUEUE_ATTACHMENT_PROCESSING },
    ),
    PrismaModule,
    AiModule,
    NotificationsModule,
    StorageModule,
  ],
  providers: [AiAnalysisProcessor, ReportGenerationProcessor, NotificationProcessor, AttachmentProcessingProcessor],
  exports: [BullModule],
})
export class QueueModule {}
