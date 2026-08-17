import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { PresignedUpload, StorageAdapter, UploadResult } from '../storage.interface';

@Injectable()
export class CloudinaryStorageAdapter implements StorageAdapter {
  constructor(private readonly config: ConfigService) {
    cloudinary.config({
      cloud_name: config.get<string>('storage.cloudinary.cloudName'),
      api_key: config.get<string>('storage.cloudinary.apiKey'),
      api_secret: config.get<string>('storage.cloudinary.apiSecret'),
    });
  }

  async upload({ buffer, key, mimeType }: { buffer: Buffer; key: string; mimeType: string }): Promise<UploadResult> {
    const resourceType = mimeType.startsWith('video') ? 'video' : mimeType.startsWith('audio') ? 'video' : 'image';
    const result = await new Promise<any>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { public_id: key, resource_type: resourceType as any },
        (err, res) => (err ? reject(err) : resolve(res)),
      );
      stream.end(buffer);
    });

    return { storageKey: result.public_id, publicUrl: result.secure_url, sizeBytes: result.bytes };
  }

  async getPresignedUploadUrl(): Promise<PresignedUpload> {
    // Cloudinary uses signed upload params rather than a presigned PUT URL;
    // for direct-from-browser uploads, generate a signature here instead.
    // Omitted for brevity — direct server-side upload() is the primary path.
    throw new Error('Direct presigned uploads are not implemented for the Cloudinary adapter. Use server-side upload().');
  }

  getPublicUrl(key: string): string {
    return cloudinary.url(key, { secure: true });
  }

  async delete(key: string): Promise<void> {
    await cloudinary.uploader.destroy(key);
  }
}
