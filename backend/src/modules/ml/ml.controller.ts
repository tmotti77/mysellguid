import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MlService } from './ml.service';

@ApiTags('ML & AI')
@ApiBearerAuth('JWT-auth')
@Controller('ml')
export class MlController {
  constructor(private readonly mlService: MlService) {}

  @Post('analyze-image')
  @ApiOperation({ summary: 'Analyze sale image with AI' })
  async analyzeImage(@Body() body: { imageUrl: string }) {
    return this.mlService.analyzeImage(body.imageUrl);
  }

  @Get('recommendations/:userId')
  @ApiOperation({ summary: 'Get personalized sale recommendations' })
  async getRecommendations(@Param('userId') userId: string) {
    return this.mlService.getRecommendations(userId, {});
  }
}
