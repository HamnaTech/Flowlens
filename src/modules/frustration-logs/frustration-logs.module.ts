import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { FrustrationLogsService } from './frustration-logs.service';
import { LogAttachmentsService } from './log-attachments.service';
import { FrustrationLogsController } from './frustration-logs.controller';
import { OrgFrustrationLogsController } from './org-frustration-logs.controller';
import { AiModule } from '../ai/ai.module';
import { StorageModule } from '../../storage/storage.module';
import { QUEUE_AI_ANALYSIS, QUEUE_ATTACHMENT_PROCESSING } from '../jobs/queue.constants';

@Module({
  imports: [
    // Registering these queues here does NOT duplicate the processors —
    // BullModule.registerQueue just gives this module an injectable Queue
    // reference to PRODUCE jobs onto. The actual @Processor consumers
    // live exclusively in QueueModule (already built), which is imported
    // once at the AppModule level.
    BullModule.registerQueue({ name: QUEUE_AI_ANALYSIS }, { name: QUEUE_ATTACHMENT_PROCESSING }),
    AiModule,
    StorageModule,
  ],
  controllers: [FrustrationLogsController, OrgFrustrationLogsController],
  providers: [FrustrationLogsService, LogAttachmentsService],
  exports: [FrustrationLogsService],
})
export class FrustrationLogsModule {}
