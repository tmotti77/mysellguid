import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { MlService } from './ml.service';

@ApiTags('ML & AI')
@Controller('ml')
export class MlController {
  constructor(private readonly mlService: MlService) {}

  @Post('analyze-image')
  @ApiOperation({ summary: 'Analyze sale image with AI (from URL)' })
  @ApiBody({ schema: { type: 'object', properties: { imageUrl: { type: 'string' } } } })
  async analyzeImage(@Body() body: { imageUrl: string }) {
    return this.mlService.analyzeImage(body.imageUrl);
  }

  @Post('extract-from-url')
  @ApiOperation({ summary: 'Extract sale info from social media URL (Instagram, TikTok, etc.)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { url: { type: 'string', example: 'https://www.instagram.com/p/...' } },
    },
  })
  async extractFromUrl(@Body() body: { url: string }) {
    return this.mlService.extractFromUrl(body.url);
  }

  @Post('analyze-screenshot')
  @ApiOperation({ summary: 'Analyze screenshot/image (base64) to extract sale info' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        base64Data: { type: 'string', description: 'Base64-encoded image data' },
        mimeType: { type: 'string', example: 'image/jpeg', default: 'image/jpeg' },
      },
    },
  })
  async analyzeScreenshot(@Body() body: { base64Data: string; mimeType?: string }) {
    return this.mlService.analyzeBase64Image(body.base64Data, body.mimeType);
  }

  @Get('recommendations/:userId')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get personalized sale recommendations' })
  async getRecommendations(@Param('userId') userId: string) {
    return this.mlService.getRecommendations(userId, {});
  }
}
