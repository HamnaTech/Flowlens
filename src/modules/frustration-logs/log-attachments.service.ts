import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { AttachmentKind, AttachmentStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../storage/storage.service';
import {
  QUEUE_ATTACHMENT_PROCESSING,
  JOB_PROCESS_IMAGE,
  JOB_TRANSCRIBE_AUDIO,
} from '../jobs/queue.constants';

const ALLOWED_MIME_PREFIXES = ['image/', 'audio/', 'video/'];

@Injectable()
export class LogAttachmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    @InjectQueue(QUEUE_ATTACHMENT_PROCESSING) private readonly attachmentQueue: Queue,
  ) {}

  async upload(userId: string, logId: string, file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file was provided. Attach it under the "file" field.');
    if (!ALLOWED_MIME_PREFIXES.some((prefix) => file.mimetype.startsWith(prefix))) {
      throw new BadRequestException('Only image, audio, and video attachments are supported.');
    }

    const log = await this.prisma.frustrationLog.findFirst({ where: { id: logId }, select: { id: true, userId: true } });
    if (!log) throw new NotFoundException('Frustration log not found.');
    if (log.userId !== userId) {
      // Same rationale as FrustrationLogsService.assertOwnership — 404,
      // not 403, so existence of another user's log is never confirmed.
      throw new NotFoundException('Frustration log not found.');
    }

    const uploadResult = await this.storage.uploadForLog({
      userId,
      logId,
      buffer: file.buffer,
      mimeType: file.mimetype,
      originalName: file.originalname,
    });

    const kind = this.inferKind(file.mimetype);

    const attachment = await this.prisma.attachment.create({
      data: {
        frustrationLogId: logId,
        kind,
        status: AttachmentStatus.UPLOADING,
        storageProvider: 's3', // reflects STORAGE_PROVIDER at write time; adapter abstracts actual backend
        storageKey: uploadResult.storageKey,
        publicUrl: uploadResult.publicUrl,
        mimeType: file.mimetype,
        sizeBytes: uploadResult.sizeBytes,
      },
    });

    // Kick off async post-processing on the SAME queue/processor already
    // built in the Jobs module — this service only enqueues, it never
    // transcribes or resizes anything itself.
    if (kind === AttachmentKind.AUDIO) {
      await this.attachmentQueue.add(JOB_TRANSCRIBE_AUDIO, { attachmentId: attachment.id });
    } else if (kind === AttachmentKind.IMAGE) {
      await this.attachmentQueue.add(JOB_PROCESS_IMAGE, { attachmentId: attachment.id });
    } else {
      // Video: mark ready immediately for this reference implementation —
      // a dedicated transcoding job is a reasonable future addition but
      // out of scope for the core logging flow.
      await this.prisma.attachment.update({ where: { id: attachment.id }, data: { status: AttachmentStatus.READY } });
    }

    return attachment;
  }

  async delete(userId: string, logId: string, attachmentId: string): Promise<void> {
    const attachment = await this.prisma.attachment.findUnique({
      where: { id: attachmentId },
      include: { frustrationLog: { select: { userId: true, id: true } } },
    });
    if (!attachment || attachment.frustrationLogId !== logId) {
      throw new NotFoundException('Attachment not found.');
    }
    if (attachment.frustrationLog.userId !== userId) {
      throw new ForbiddenException('You do not have permission to delete this attachment.');
    }

    await this.storage.delete(attachment.storageKey);
    await this.prisma.attachment.delete({ where: { id: attachmentId } });
  }

  private inferKind(mimeType: string): AttachmentKind {
    if (mimeType.startsWith('image/')) return AttachmentKind.IMAGE;
    if (mimeType.startsWith('audio/')) return AttachmentKind.AUDIO;
    if (mimeType.startsWith('video/')) return AttachmentKind.VIDEO;
    return AttachmentKind.DOCUMENT;
  }
}
