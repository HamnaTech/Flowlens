import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { STORAGE_ADAPTER } from './storage.interface';
import { S3StorageAdapter } from './adapters/s3.adapter';
import { CloudinaryStorageAdapter } from './adapters/cloudinary.adapter';
import { StorageService } from './storage.service';

@Module({
  imports: [ConfigModule],
  providers: [
    S3StorageAdapter,
    CloudinaryStorageAdapter,
    {
      provide: STORAGE_ADAPTER,
      inject: [ConfigService, S3StorageAdapter, CloudinaryStorageAdapter],
      useFactory: (config: ConfigService, s3: S3StorageAdapter, cloudinary: CloudinaryStorageAdapter) => {
        return config.get<string>('storage.provider') === 'cloudinary' ? cloudinary : s3;
      },
    },
    StorageService,
  ],
  exports: [StorageService],
})
export class StorageModule {}
