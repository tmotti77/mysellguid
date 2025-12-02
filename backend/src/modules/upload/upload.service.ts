import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import * as sharp from 'sharp';
import { envConfig } from '../../config/env.config';
import { promises as fs } from 'fs';
import { join } from 'path';

// Define our own MulterFile interface to avoid devDependency issues in production
export interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export interface UploadedImages {
  original: string;
  large: string;
  medium: string;
  thumbnail: string;
}

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private s3Client: S3Client | null = null;
  private bucket: string;
  private publicUrl: string;
  private storageType: 'r2' | 's3' | 'local';
  private localUploadPath: string;

  constructor() {
    this.storageType = envConfig.storage.type;
    this.bucket = envConfig.storage.bucket || 'mysellguid-images';
    this.publicUrl = envConfig.storage.publicUrl || '';
    this.localUploadPath = join(process.cwd(), 'uploads');

    if (this.storageType === 'r2' || this.storageType === 's3') {
      this.initializeS3Client();
    } else {
      this.logger.log('Using local storage for file uploads');
      this.ensureUploadDirectory();
    }
  }

  private initializeS3Client() {
    if (!envConfig.storage.accessKey || !envConfig.storage.secretKey) {
      this.logger.warn('S3/R2 credentials not configured, falling back to local storage');
      this.storageType = 'local';
      this.ensureUploadDirectory();
      return;
    }

    this.s3Client = new S3Client({
      region: envConfig.storage.region || 'auto',
      endpoint: envConfig.storage.endpoint,
      credentials: {
        accessKeyId: envConfig.storage.accessKey,
        secretAccessKey: envConfig.storage.secretKey,
      },
    });

    this.logger.log(
      `Initialized ${this.storageType.toUpperCase()} client for bucket: ${this.bucket}`,
    );
  }

  private async ensureUploadDirectory() {
    try {
      await fs.mkdir(this.localUploadPath, { recursive: true });
      this.logger.log(`Local upload directory ready: ${this.localUploadPath}`);
    } catch (error) {
      this.logger.error('Failed to create upload directory', error);
    }
  }

  /**
   * Upload image with automatic resizing to multiple sizes
   */
  async uploadImage(file: MulterFile, folder: string = 'sales'): Promise<UploadedImages> {
    // Validate file
    this.validateImage(file);

    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    const filename = `${folder}/${timestamp}-${randomId}`;

    this.logger.log(`Processing image upload: ${filename}`);

    // Process images in parallel
    const [original, large, medium, thumbnail] = await Promise.all([
      this.processAndUpload(file.buffer, `${filename}-original.jpg`, null),
      this.processAndUpload(file.buffer, `${filename}-large.jpg`, 1200),
      this.processAndUpload(file.buffer, `${filename}-medium.jpg`, 800),
      this.processAndUpload(file.buffer, `${filename}-thumb.jpg`, 300),
    ]);

    return {
      original: this.getPublicUrl(original),
      large: this.getPublicUrl(large),
      medium: this.getPublicUrl(medium),
      thumbnail: this.getPublicUrl(thumbnail),
    };
  }

  /**
   * Process image (resize, compress) and upload to storage
   */
  private async processAndUpload(
    buffer: Buffer,
    key: string,
    width: number | null,
  ): Promise<string> {
    let processedBuffer = buffer;

    try {
      if (width) {
        // Resize image
        processedBuffer = await sharp(buffer)
          .resize(width, null, {
            fit: 'inside',
            withoutEnlargement: true,
          })
          .jpeg({ quality: 85, progressive: true })
          .toBuffer();
      } else {
        // Original - just compress and convert to JPEG
        processedBuffer = await sharp(buffer).jpeg({ quality: 90, progressive: true }).toBuffer();
      }
    } catch (error) {
      this.logger.error(`Failed to process image: ${key}`, error);
      throw new BadRequestException('Failed to process image');
    }

    if (this.storageType === 'local') {
      return this.uploadToLocal(processedBuffer, key);
    } else {
      return this.uploadToS3(processedBuffer, key);
    }
  }

  /**
   * Upload to local filesystem
   */
  private async uploadToLocal(buffer: Buffer, key: string): Promise<string> {
    const filePath = join(this.localUploadPath, key);
    const directory = join(this.localUploadPath, key.split('/')[0]);

    try {
      await fs.mkdir(directory, { recursive: true });
      await fs.writeFile(filePath, buffer);
      this.logger.log(`Saved to local: ${key}`);
      return key;
    } catch (error) {
      this.logger.error(`Failed to save local file: ${key}`, error);
      throw new BadRequestException('Failed to save image');
    }
  }

  /**
   * Upload to S3/R2
   */
  private async uploadToS3(buffer: Buffer, key: string): Promise<string> {
    if (!this.s3Client) {
      throw new BadRequestException('S3 client not initialized');
    }

    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: buffer,
          ContentType: 'image/jpeg',
          CacheControl: 'public, max-age=31536000', // 1 year
        }),
      );

      this.logger.log(`Uploaded to ${this.storageType.toUpperCase()}: ${key}`);
      return key;
    } catch (error) {
      this.logger.error(`Failed to upload to ${this.storageType.toUpperCase()}: ${key}`, error);
      throw new BadRequestException('Failed to upload image');
    }
  }

  /**
   * Get public URL for uploaded file
   */
  private getPublicUrl(key: string): string {
    if (this.storageType === 'local') {
      // For local, return relative URL (served by NestJS static middleware)
      return `/uploads/${key}`;
    } else {
      // For S3/R2, return full CDN URL
      return `${this.publicUrl}/${key}`;
    }
  }

  /**
   * Delete image and all its variants
   */
  async deleteImage(url: string): Promise<void> {
    try {
      if (this.storageType === 'local') {
        await this.deleteFromLocal(url);
      } else {
        await this.deleteFromS3(url);
      }
      this.logger.log(`Deleted image: ${url}`);
    } catch (error) {
      this.logger.error(`Failed to delete image: ${url}`, error);
      // Don't throw error, log and continue
    }
  }

  /**
   * Delete from local filesystem
   */
  private async deleteFromLocal(url: string): Promise<void> {
    const key = url.replace('/uploads/', '');
    const baseKey = key.replace(/-(original|large|medium|thumb)\.jpg$/, '');

    await Promise.allSettled(
      ['original', 'large', 'medium', 'thumb'].map(async (variant) => {
        const filePath = join(this.localUploadPath, `${baseKey}-${variant}.jpg`);
        try {
          await fs.unlink(filePath);
        } catch (error) {
          // File might not exist, ignore
        }
      }),
    );
  }

  /**
   * Delete from S3/R2
   */
  private async deleteFromS3(url: string): Promise<void> {
    if (!this.s3Client) {
      return;
    }

    const key = url.replace(this.publicUrl + '/', '');
    const baseKey = key.replace(/-(original|large|medium|thumb)\.jpg$/, '');

    await Promise.allSettled(
      ['original', 'large', 'medium', 'thumb'].map(async (variant) => {
        try {
          await this.s3Client!.send(
            new DeleteObjectCommand({
              Bucket: this.bucket,
              Key: `${baseKey}-${variant}.jpg`,
            }),
          );
        } catch (error) {
          // Ignore if file doesn't exist
        }
      }),
    );
  }

  /**
   * Validate uploaded file
   */
  private validateImage(file: MulterFile): void {
    const maxSize = envConfig.app.maxFileSize;
    const allowedMimes = envConfig.app.allowedFileTypes;

    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException(`Only ${allowedMimes.join(', ')} images are allowed`);
    }

    if (file.size > maxSize) {
      throw new BadRequestException(
        `Image size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`,
      );
    }
  }

  /**
   * Upload multiple images
   */
  async uploadImages(files: MulterFile[], folder: string = 'sales'): Promise<string[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    if (files.length > 5) {
      throw new BadRequestException('Maximum 5 images allowed');
    }

    const uploads = await Promise.all(files.map((file) => this.uploadImage(file, folder)));

    // Return medium-sized URLs (good balance for mobile/web)
    return uploads.map((upload) => upload.medium);
  }
}
