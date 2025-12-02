import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UploadService, MulterFile } from './upload.service';

@ApiTags('Upload')
@Controller('upload')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('image')
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload a single image',
    description: 'Upload an image and get back multiple sizes (original, large, medium, thumbnail)',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
          description: 'Image file (JPEG, PNG, WebP)',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Image uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        original: { type: 'string', example: '/uploads/sales/123-abc-original.jpg' },
        large: { type: 'string', example: '/uploads/sales/123-abc-large.jpg' },
        medium: { type: 'string', example: '/uploads/sales/123-abc-medium.jpg' },
        thumbnail: { type: 'string', example: '/uploads/sales/123-abc-thumb.jpg' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid file type or size',
  })
  async uploadImage(@UploadedFile() file: MulterFile) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    return this.uploadService.uploadImage(file, 'sales');
  }

  @Post('images')
  @UseInterceptors(FilesInterceptor('images', 5)) // Max 5 images
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload multiple images (max 5)',
    description: 'Upload multiple images for a sale. Returns medium-sized URLs.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        images: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: 'Image files (JPEG, PNG, WebP)',
          maxItems: 5,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Images uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        urls: {
          type: 'array',
          items: { type: 'string' },
          example: ['/uploads/sales/123-abc-medium.jpg', '/uploads/sales/124-def-medium.jpg'],
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid files or too many files (max 5)',
  })
  async uploadImages(@UploadedFiles() files: MulterFile[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    const urls = await this.uploadService.uploadImages(files, 'sales');

    return { urls };
  }

  @Post('store-logo')
  @UseInterceptors(FileInterceptor('logo'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload store logo',
    description: 'Upload a logo for a store',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        logo: {
          type: 'string',
          format: 'binary',
          description: 'Logo image file (JPEG, PNG, WebP)',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Logo uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        url: { type: 'string', example: '/uploads/stores/123-abc-medium.jpg' },
      },
    },
  })
  async uploadStoreLogo(@UploadedFile() file: MulterFile) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const images = await this.uploadService.uploadImage(file, 'stores');
    return { url: images.medium };
  }

  @Post('user-avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload user avatar',
    description: 'Upload a profile picture for a user',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        avatar: {
          type: 'string',
          format: 'binary',
          description: 'Avatar image file (JPEG, PNG, WebP)',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Avatar uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        url: { type: 'string', example: '/uploads/users/123-abc-medium.jpg' },
      },
    },
  })
  async uploadUserAvatar(@UploadedFile() file: MulterFile) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const images = await this.uploadService.uploadImage(file, 'users');
    return { url: images.thumbnail }; // Use thumbnail for avatars
  }
}
