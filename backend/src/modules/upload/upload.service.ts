import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import { promises as fs } from 'fs';

@Injectable()
export class UploadService {
  private readonly uploadDir = './uploads';

  constructor(private configService: ConfigService) {
    // Ensure upload directory exists
    this.ensureUploadDir();
  }

  /**
   * Ensure upload directory exists
   */
  private async ensureUploadDir(): Promise<void> {
    try {
      await fs.access(this.uploadDir);
    } catch (error) {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Get full URL for an uploaded file
   */
  async getFileUrl(filename: string): Promise<string> {
    const apiUrl = this.configService.get('API_URL') || 'http://localhost:3000';
    const apiPrefix = this.configService.get('API_PREFIX') || 'api';

    return `${apiUrl}/${apiPrefix}/uploads/${filename}`;
  }

  /**
   * Delete a file
   */
  async deleteFile(filename: string): Promise<boolean> {
    try {
      const filePath = join(this.uploadDir, filename);
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  /**
   * Get file path
   */
  getFilePath(filename: string): string {
    return join(this.uploadDir, filename);
  }

  /**
   * Check if file exists
   */
  async fileExists(filename: string): Promise<boolean> {
    try {
      const filePath = this.getFilePath(filename);
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}
