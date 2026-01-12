import { Controller, Post, Body, Get, Query, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiQuery } from '@nestjs/swagger';
import { TelegramService } from './telegram.service';
import { ConfigService } from '@nestjs/config';

@ApiTags('Telegram Bot')
@Controller('telegram')
export class TelegramController {
  private readonly logger = new Logger(TelegramController.name);
  private readonly webhookSecret: string;

  constructor(
    private readonly telegramService: TelegramService,
    private configService: ConfigService,
  ) {
    this.webhookSecret = this.configService.get('TELEGRAM_WEBHOOK_SECRET', '');
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Telegram webhook endpoint for receiving updates' })
  @ApiBody({ description: 'Telegram Update object' })
  async handleWebhook(@Body() update: any) {
    this.logger.log(`Received webhook update: ${update.update_id}`);

    try {
      await this.telegramService.handleUpdate(update);
      return { ok: true };
    } catch (error) {
      this.logger.error('Webhook error:', error);
      // Always return 200 to Telegram to prevent retry loops
      return { ok: true, error: 'Internal error' };
    }
  }

  @Get('set-webhook')
  @ApiOperation({ summary: 'Set webhook URL (admin only)' })
  @ApiQuery({ name: 'secret', required: true })
  @ApiQuery({ name: 'url', required: true })
  async setWebhook(
    @Query('secret') secret: string,
    @Query('url') url: string,
  ) {
    if (!this.webhookSecret || secret !== this.webhookSecret) {
      return { ok: false, error: 'Invalid secret' };
    }

    try {
      const result = await this.telegramService.setWebhook(url);
      this.logger.log(`Webhook set to: ${url}`);
      return { ok: true, result };
    } catch (error: any) {
      this.logger.error('Failed to set webhook:', error);
      return { ok: false, error: error.message };
    }
  }

  @Get('delete-webhook')
  @ApiOperation({ summary: 'Delete webhook (admin only)' })
  @ApiQuery({ name: 'secret', required: true })
  async deleteWebhook(@Query('secret') secret: string) {
    if (!this.webhookSecret || secret !== this.webhookSecret) {
      return { ok: false, error: 'Invalid secret' };
    }

    try {
      const result = await this.telegramService.deleteWebhook();
      this.logger.log('Webhook deleted');
      return { ok: true, result };
    } catch (error: any) {
      this.logger.error('Failed to delete webhook:', error);
      return { ok: false, error: error.message };
    }
  }

  @Get('status')
  @ApiOperation({ summary: 'Get bot status' })
  async getStatus() {
    try {
      const me = await this.telegramService.getMe();
      return {
        ok: true,
        bot: me,
        status: 'running',
      };
    } catch (error: any) {
      return {
        ok: false,
        status: 'not configured or error',
        error: error.message,
      };
    }
  }
}
