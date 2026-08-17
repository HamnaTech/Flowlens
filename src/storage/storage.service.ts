import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { STORAGE_ADAPTER, StorageAdapter, UploadResult } from './storage.interface';

@Injectable()
export class StorageService {
  constructor(
    @Inject(STORAGE_ADAPTER) private readonly adapter: StorageAdapter,
    private readonly config: ConfigService,
  ) {}

  async uploadForLog(params: { userId: string; logId: string; buffer: Buffer; mimeType: string; originalName: string }): Promise<UploadResult> {
    const maxBytes = this.config.get<number>('storage.maxUploadSizeMb')! * 1024 * 1024;
    if (params.buffer.byteLength > maxBytes) {
      throw new BadRequestException(`File exceeds the maximum upload size of ${this.config.get('storage.maxUploadSizeMb')}MB.`);
    }

    const ext = params.originalName.split('.').pop() ?? 'bin';
    // Namespaced key: attachments/{userId}/{logId}/{uuid}.{ext} — keeps
    // per-user data groupable for GDPR export/delete and avoids collisions.
    const key = `attachments/${params.userId}/${params.logId}/${randomUUID()}.${ext}`;

    return this.adapter.upload({ buffer: params.buffer, key, mimeType: params.mimeType });
  }

  async uploadAvatar(params: { userId: string; buffer: Buffer; mimeType: string; originalName: string }): Promise<UploadResult> {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(params.mimeType)) {
      throw new BadRequestException('Avatar must be a JPEG, PNG, or WebP image.');
    }
    const maxAvatarBytes = 5 * 1024 * 1024; // 5MB, independent of the general upload cap
    if (params.buffer.byteLength > maxAvatarBytes) {
      throw new BadRequestException('Avatar image must be under 5MB.');
    }

    const ext = params.originalName.split('.').pop() ?? 'jpg';
    // Fixed key (not randomized) so re-uploading an avatar overwrites the
    // previous file rather than accumulating orphaned blobs per user.
    const key = `avatars/${params.userId}/avatar.${ext}`;

    return this.adapter.upload({ buffer: params.buffer, key, mimeType: params.mimeType });
  }

  async delete(storageKey: string): Promise<void> {
    return this.adapter.delete(storageKey);
  }

  getPublicUrl(storageKey: string): string {
    return this.adapter.getPublicUrl(storageKey);
  }
}
