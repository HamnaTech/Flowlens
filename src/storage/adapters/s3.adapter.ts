import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as AWS from 'aws-sdk';
import { PresignedUpload, StorageAdapter, UploadResult } from '../storage.interface';

@Injectable()
export class S3StorageAdapter implements StorageAdapter {
  private readonly s3: AWS.S3;
  private readonly bucket: string;

  constructor(private readonly config: ConfigService) {
    this.bucket = config.get<string>('storage.s3.bucket')!;
    this.s3 = new AWS.S3({
      region: config.get<string>('storage.s3.region'),
      accessKeyId: config.get<string>('storage.s3.accessKeyId'),
      secretAccessKey: config.get<string>('storage.s3.secretAccessKey'),
      endpoint: config.get<string>('storage.s3.endpoint'), // supports R2/MinIO-compatible endpoints
      s3ForcePathStyle: !!config.get<string>('storage.s3.endpoint'),
    });
  }

  async upload({ buffer, key, mimeType }: { buffer: Buffer; key: string; mimeType: string }): Promise<UploadResult> {
    await this.s3
      .putObject({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
        ServerSideEncryption: 'AES256',
      })
      .promise();

    return { storageKey: key, publicUrl: this.getPublicUrl(key), sizeBytes: buffer.byteLength };
  }

  async getPresignedUploadUrl({
    key,
    mimeType,
    expiresInSeconds = 300,
  }: {
    key: string;
    mimeType: string;
    expiresInSeconds?: number;
  }): Promise<PresignedUpload> {
    const uploadUrl = this.s3.getSignedUrl('putObject', {
      Bucket: this.bucket,
      Key: key,
      ContentType: mimeType,
      Expires: expiresInSeconds,
    });
    return { uploadUrl, storageKey: key, expiresInSeconds };
  }

  getPublicUrl(key: string): string {
    return `https://${this.bucket}.s3.amazonaws.com/${key}`;
  }

  async delete(key: string): Promise<void> {
    await this.s3.deleteObject({ Bucket: this.bucket, Key: key }).promise();
  }
}
