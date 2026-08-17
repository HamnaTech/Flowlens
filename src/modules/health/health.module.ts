import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { HealthService } from './health.service';
import { HealthController } from './health.controller';
import { QUEUE_AI_ANALYSIS } from '../jobs/queue.constants';

@Module({
  // Registering this queue here only gives HealthModule an injectable
  // reference to run a PING against — it does not create a second set of
  // processors. Same pattern already used in FrustrationLogsModule.
  imports: [BullModule.registerQueue({ name: QUEUE_AI_ANALYSIS })],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
