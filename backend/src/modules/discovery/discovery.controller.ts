import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DiscoveryService } from './discovery.service';
import { ConfigService } from '@nestjs/config';

@ApiTags('Sales Discovery')
@Controller('discovery')
export class DiscoveryController {
  private readonly adminSecret: string;

  constructor(
    private readonly discoveryService: DiscoveryService,
    private configService: ConfigService,
  ) {
    this.adminSecret = this.configService.get('ADMIN_SECRET', '');
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get discovery engine statistics' })
  getStats() {
    return this.discoveryService.getStats();
  }

  @Post('trigger')
  @ApiOperation({ summary: 'Manually trigger discovery cycle (admin only)' })
  @ApiQuery({ name: 'secret', required: true })
  async triggerDiscovery(@Query('secret') secret: string) {
    if (!this.adminSecret || secret !== this.adminSecret) {
      return { ok: false, error: 'Invalid admin secret' };
    }

    const stats = await this.discoveryService.triggerDiscovery();
    return { ok: true, stats };
  }

  @Post('add-channel')
  @ApiOperation({ summary: 'Add Telegram channel to monitor (admin only)' })
  @ApiQuery({ name: 'secret', required: true })
  async addChannel(
    @Query('secret') secret: string,
    @Body() channel: { id: string; username: string; name: string },
  ) {
    if (!this.adminSecret || secret !== this.adminSecret) {
      return { ok: false, error: 'Invalid admin secret' };
    }

    this.discoveryService.addTelegramChannel(channel);
    return { ok: true, message: `Added channel: ${channel.name}` };
  }

  @Post('add-rss')
  @ApiOperation({ summary: 'Add RSS feed to monitor (admin only)' })
  @ApiQuery({ name: 'secret', required: true })
  async addRssFeed(
    @Query('secret') secret: string,
    @Body() feed: { url: string; name: string },
  ) {
    if (!this.adminSecret || secret !== this.adminSecret) {
      return { ok: false, error: 'Invalid admin secret' };
    }

    this.discoveryService.addRssFeed(feed);
    return { ok: true, message: `Added RSS feed: ${feed.name}` };
  }
}
