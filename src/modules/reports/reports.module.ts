import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ReportsService } from './reports.service';
import { ReportsController, OrgReportsController } from './reports.controller';
import { QUEUE_REPORT_GENERATION } from '../jobs/queue.constants';

@Module({
    imports: [BullModule.registerQueue({ name: QUEUE_REPORT_GENERATION })],
    controllers: [ReportsController, OrgReportsController],
    providers: [ReportsService],
    exports: [ReportsService],
})
export class ReportsModule { }