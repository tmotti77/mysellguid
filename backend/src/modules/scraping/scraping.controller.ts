import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ScrapingService } from './scraping.service';

@ApiTags('Scraping')
@ApiBearerAuth('JWT-auth')
@Controller('scraping')
export class ScrapingController {
  constructor(private readonly scrapingService: ScrapingService) {}

  @Post('instagram')
  @ApiOperation({ summary: 'Scrape Instagram account' })
  async scrapeInstagram(@Body() body: { username: string }) {
    return this.scrapingService.scrapeInstagramAccount(body.username);
  }

  @Post('facebook')
  @ApiOperation({ summary: 'Scrape Facebook page' })
  async scrapeFacebook(@Body() body: { pageId: string }) {
    return this.scrapingService.scrapeFacebookPage(body.pageId);
  }
}
