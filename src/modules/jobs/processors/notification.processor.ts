import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { NotificationsService } from '../../notifications/notifications.service';
import { JOB_SEND_NOTIFICATION, QUEUE_NOTIFICATIONS } from '../queue.constants';
import { NotificationChannel, NotificationType } from '@prisma/client';

interface SendNotificationJobData {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  channel?: NotificationChannel;
  metadata?: Record<string, unknown>;
}

// Thin queue wrapper around NotificationsService for notifications that
// should be scheduled/delayed (e.g. a "subscription expiring in 3 days"
// reminder queued with a delay) rather than fired synchronously.
@Processor(QUEUE_NOTIFICATIONS)
export class NotificationProcessor {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(private readonly notifications: NotificationsService) {}

  @Process(JOB_SEND_NOTIFICATION)
  async handleSendNotification(job: Job<SendNotificationJobData>) {
    await this.notifications.create(job.data);
    this.logger.debug(`Dispatched notification "${job.data.title}" to user ${job.data.userId}`);
  }
}
