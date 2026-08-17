import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { AttachmentKind, AttachmentStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { AiService } from '../../ai/ai.service';
import { StorageService } from '../../../storage/storage.service';
import { JOB_PROCESS_IMAGE, JOB_TRANSCRIBE_AUDIO, QUEUE_ATTACHMENT_PROCESSING } from '../queue.constants';

interface AttachmentJobData {
  attachmentId: string;
}

@Processor(QUEUE_ATTACHMENT_PROCESSING)
export class AttachmentProcessingProcessor {
  private readonly logger = new Logger(AttachmentProcessingProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
    private readonly storage: StorageService,
  ) {}

  @Process(JOB_TRANSCRIBE_AUDIO)
  async handleTranscribeAudio(job: Job<AttachmentJobData>) {
    const attachment = await this.prisma.attachment.findUnique({ where: { id: job.data.attachmentId } });
    if (!attachment || attachment.kind !== AttachmentKind.AUDIO) return;

    await this.prisma.attachment.update({ where: { id: attachment.id }, data: { status: AttachmentStatus.PROCESSING } });

    try {
      const response = await fetch(attachment.publicUrl!);
      const buffer = Buffer.from(await response.arrayBuffer());
      const transcript = await this.ai.transcribeAudio(buffer, attachment.mimeType);

      await this.prisma.attachment.update({
        where: { id: attachment.id },
        data: { transcript, status: AttachmentStatus.READY },
      });
      this.logger.log(`Transcribed attachment ${attachment.id} (${transcript.length} chars).`);
    } catch (err) {
      this.logger.error(`Transcription failed for attachment ${attachment.id}: ${(err as Error).message}`);
      await this.prisma.attachment.update({ where: { id: attachment.id }, data: { status: AttachmentStatus.FAILED } });
    }
  }

  @Process(JOB_PROCESS_IMAGE)
  async handleProcessImage(job: Job<AttachmentJobData>) {
    const attachment = await this.prisma.attachment.findUnique({ where: { id: job.data.attachmentId } });
    if (!attachment || attachment.kind !== AttachmentKind.IMAGE) return;

    await this.prisma.attachment.update({ where: { id: attachment.id }, data: { status: AttachmentStatus.PROCESSING } });

    try {
      // Thumbnail generation / virus scan hook point. Sharp-based resize
      // pipeline is invoked here in production; kept to a status flip for
      // this reference implementation's scope.
      await this.prisma.attachment.update({ where: { id: attachment.id }, data: { status: AttachmentStatus.READY } });
      this.logger.log(`Processed image attachment ${attachment.id}.`);
    } catch (err) {
      this.logger.error(`Image processing failed for attachment ${attachment.id}: ${(err as Error).message}`);
      await this.prisma.attachment.update({ where: { id: attachment.id }, data: { status: AttachmentStatus.FAILED } });
    }
  }
}
