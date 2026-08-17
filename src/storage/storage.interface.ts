export interface UploadResult {
  storageKey: string;
  publicUrl: string;
  sizeBytes: number;
}

export interface PresignedUpload {
  uploadUrl: string;
  storageKey: string;
  expiresInSeconds: number;
}

/**
 * Every storage backend (S3, Cloudinary, local-disk-for-tests) implements
 * this. The rest of the app (AttachmentsService, AI transcription job)
 * depends only on this interface, never on a concrete SDK — swapping
 * STORAGE_PROVIDER in .env is the only change needed to switch backends.
 */
export interface StorageAdapter {
  upload(params: { buffer: Buffer; key: string; mimeType: string }): Promise<UploadResult>;
  getPresignedUploadUrl(params: { key: string; mimeType: string; expiresInSeconds?: number }): Promise<PresignedUpload>;
  getPublicUrl(key: string): string;
  delete(key: string): Promise<void>;
}

export const STORAGE_ADAPTER = Symbol('STORAGE_ADAPTER');
