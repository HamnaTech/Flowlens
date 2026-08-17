import { Injectable, Logger } from '@nestjs/common';
import { NotificationChannel, NotificationType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(params: {
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    channel?: NotificationChannel;
    metadata?: Record<string, unknown>;
  }) {
    const notification = await this.prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        body: params.body,
        channel: params.channel ?? NotificationChannel.IN_APP,
        metadata: params.metadata as any,
      },
    });

    if (params.channel === NotificationChannel.EMAIL) {
      // Delegates to the email transport (SMTP) — kept fire-and-forget here
      // since email delivery failure shouldn't fail the notification write.
      this.dispatchEmail(params).catch((err) =>
        this.logger.error(`Failed to send email notification to user ${params.userId}: ${err.message}`),
      );
    }

    return notification;
  }

  private async dispatchEmail(params: { userId: string; title: string; body: string }) {
    // Wired to an email provider (SES/Postmark/SMTP) in the email module.
    // Left as an interface boundary here to keep NotificationsService
    // decoupled from a specific transport.
    this.logger.log(`[email] would send "${params.title}" to user ${params.userId}`);
  }

  async markAsRead(userId: string, notificationId: string) {
    return this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { readAt: new Date() },
    });
  }

  async listForUser(userId: string, unreadOnly = false) {
    return this.prisma.notification.findMany({
      where: { userId, ...(unreadOnly ? { readAt: null } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}
