import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MlService, SaleAnalysisResult } from '../ml/ml.service';

interface TelegramMessage {
  message_id: number;
  from?: {
    id: number;
    first_name: string;
    username?: string;
  };
  chat: {
    id: number;
    type: string;
    title?: string;
    username?: string;
  };
  date: number;
  text?: string;
  photo?: Array<{
    file_id: string;
    file_unique_id: string;
    width: number;
    height: number;
  }>;
  caption?: string;
  forward_from_chat?: {
    id: number;
    title: string;
    username?: string;
    type: string;
  };
  entities?: Array<{
    type: string;
    offset: number;
    length: number;
    url?: string;
  }>;
}

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  channel_post?: TelegramMessage;
}

interface PendingSale {
  chatId: number;
  messageId: number;
  extractedData: SaleAnalysisResult;
  originalText?: string;
  imageFileId?: string;
  sourceUrl?: string;
  timestamp: number;
}

@Injectable()
export class TelegramService implements OnModuleInit {
  private readonly logger = new Logger(TelegramService.name);
  private readonly botToken: string;
  private readonly baseUrl: string;
  private readonly pendingSales: Map<string, PendingSale> = new Map();
  private readonly monitoredChannels: string[] = [];

  constructor(
    private configService: ConfigService,
    private mlService: MlService,
  ) {
    this.botToken = this.configService.get('TELEGRAM_BOT_TOKEN', '');
    this.baseUrl = `https://api.telegram.org/bot${this.botToken}`;

    // Israeli deal channels to monitor (can be configured via env)
    const channels = this.configService.get('TELEGRAM_MONITORED_CHANNELS', '');
    if (channels) {
      this.monitoredChannels = channels.split(',').map((c: string) => c.trim());
    }
  }

  async onModuleInit() {
    if (!this.botToken) {
      this.logger.warn('TELEGRAM_BOT_TOKEN not configured - Telegram bot disabled');
      return;
    }

    try {
      const me = await this.getMe();
      this.logger.log(`Telegram bot initialized: @${me.username}`);
    } catch (error) {
      this.logger.error('Failed to initialize Telegram bot:', error);
    }
  }

  private async apiCall(method: string, body?: any): Promise<any> {
    if (!this.botToken) {
      throw new Error('Telegram bot not configured');
    }

    const response = await fetch(`${this.baseUrl}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();
    if (!data.ok) {
      throw new Error(data.description || 'Telegram API error');
    }
    return data.result;
  }

  async getMe() {
    return this.apiCall('getMe');
  }

  async sendMessage(chatId: number | string, text: string, options?: any) {
    return this.apiCall('sendMessage', {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      ...options,
    });
  }

  async getFile(fileId: string) {
    return this.apiCall('getFile', { file_id: fileId });
  }

  async downloadFile(filePath: string): Promise<Buffer> {
    const url = `https://api.telegram.org/file/bot${this.botToken}/${filePath}`;
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  /**
   * Set webhook URL for receiving updates
   */
  async setWebhook(url: string) {
    return this.apiCall('setWebhook', {
      url,
      allowed_updates: ['message', 'channel_post'],
    });
  }

  /**
   * Delete webhook (for polling mode)
   */
  async deleteWebhook() {
    return this.apiCall('deleteWebhook');
  }

  /**
   * Process incoming webhook update
   */
  async handleUpdate(update: TelegramUpdate): Promise<void> {
    const message = update.message || update.channel_post;
    if (!message) return;

    this.logger.log(`Received update from ${message.chat.type}: ${message.chat.id}`);

    try {
      // Handle commands
      if (message.text?.startsWith('/')) {
        await this.handleCommand(message);
        return;
      }

      // Handle forwarded messages (user forwarding sales)
      if (message.forward_from_chat) {
        await this.handleForwardedMessage(message);
        return;
      }

      // Handle photos (screenshots)
      if (message.photo && message.photo.length > 0) {
        await this.handlePhoto(message);
        return;
      }

      // Handle text with URLs
      if (message.text && this.containsUrl(message.text)) {
        await this.handleUrlMessage(message);
        return;
      }

      // Handle channel posts (from monitored channels)
      if (update.channel_post && this.isMonitoredChannel(message.chat)) {
        await this.handleChannelPost(message);
        return;
      }

      // Default: help message for private chats
      if (message.chat.type === 'private') {
        await this.sendHelpMessage(message.chat.id);
      }
    } catch (error) {
      this.logger.error('Error handling update:', error);
      if (message.chat.type === 'private') {
        await this.sendMessage(
          message.chat.id,
          'Sorry, something went wrong. Please try again.'
        );
      }
    }
  }

  private async handleCommand(message: TelegramMessage) {
    const command = message.text!.split(' ')[0].toLowerCase();
    const chatId = message.chat.id;

    switch (command) {
      case '/start':
        await this.sendMessage(chatId, `
Welcome to MySellGuid Bot!

I help you submit sales and deals to the MySellGuid app.

<b>How to use:</b>
1. Forward a sale post from any channel
2. Send a screenshot of a sale
3. Paste a link from Instagram/TikTok/Facebook

<b>Commands:</b>
/help - Show this message
/submit - Start manual sale submission
/status - Check your submissions

Share deals and help others save money!
        `);
        break;

      case '/help':
        await this.sendHelpMessage(chatId);
        break;

      case '/submit':
        await this.sendMessage(chatId, `
<b>Submit a Sale</b>

You can submit a sale in several ways:

1. <b>Forward a post</b> - Forward any sale/deal post from Telegram channels

2. <b>Screenshot</b> - Send a photo/screenshot of a sale from Instagram, TikTok, etc.

3. <b>Paste a link</b> - Send a URL to a social media post

I'll extract the sale details automatically using AI!
        `);
        break;

      case '/status':
        await this.sendMessage(chatId, 'Status feature coming soon! You\'ll be able to track your submissions and earn points.');
        break;

      default:
        await this.sendMessage(chatId, 'Unknown command. Use /help to see available commands.');
    }
  }

  private async sendHelpMessage(chatId: number) {
    await this.sendMessage(chatId, `
<b>MySellGuid Bot Help</b>

<b>Submit sales:</b>
• Forward a message from a deals channel
• Send a screenshot of a sale
• Send a link to Instagram/TikTok/Facebook post

<b>Commands:</b>
/start - Welcome message
/help - This help message
/submit - How to submit sales

<b>Supported platforms:</b>
Instagram, TikTok, Facebook, Telegram

Questions? Visit mysellguid.com
    `);
  }

  private async handleForwardedMessage(message: TelegramMessage) {
    const chatId = message.chat.id;
    const text = message.text || message.caption || '';

    await this.sendMessage(chatId, 'Analyzing forwarded message...');

    try {
      // Extract sale info using AI
      const result = await this.mlService.extractFromUrl(`telegram:forwarded:${text}`);

      if (result.confidence > 0.3) {
        await this.sendExtractedSaleConfirmation(chatId, message.message_id, result, text);
      } else {
        await this.sendMessage(chatId, `
I couldn't confidently identify this as a sale.

<b>Extracted text:</b>
${text.substring(0, 500)}

Would you like to submit it manually? Send /submit for instructions.
        `);
      }
    } catch (error) {
      this.logger.error('Error processing forwarded message:', error);
      await this.sendMessage(chatId, 'Failed to analyze the message. Please try again or submit manually.');
    }
  }

  private async handlePhoto(message: TelegramMessage) {
    const chatId = message.chat.id;

    await this.sendMessage(chatId, 'Analyzing screenshot...');

    try {
      // Get the largest photo
      const photo = message.photo![message.photo!.length - 1];
      const file = await this.getFile(photo.file_id);
      const imageBuffer = await this.downloadFile(file.file_path);
      const base64 = imageBuffer.toString('base64');

      // Analyze with AI
      const result = await this.mlService.analyzeBase64Image(base64, 'image/jpeg');

      if (result.confidence > 0.3) {
        await this.sendExtractedSaleConfirmation(chatId, message.message_id, result, message.caption, photo.file_id);
      } else {
        await this.sendMessage(chatId, `
I couldn't identify a sale in this image.

Make sure the screenshot clearly shows:
• Store/brand name
• Discount or sale price
• Product details

Try sending a clearer image or submit manually with /submit
        `);
      }
    } catch (error) {
      this.logger.error('Error processing photo:', error);
      await this.sendMessage(chatId, 'Failed to analyze the image. Please try again.');
    }
  }

  private async handleUrlMessage(message: TelegramMessage) {
    const chatId = message.chat.id;
    const url = this.extractUrl(message.text!);

    if (!url) {
      await this.sendMessage(chatId, 'Please send a valid URL.');
      return;
    }

    await this.sendMessage(chatId, `Extracting sale info from: ${url}`);

    try {
      const result = await this.mlService.extractFromUrl(url);

      if (result.confidence > 0.3) {
        await this.sendExtractedSaleConfirmation(chatId, message.message_id, result, message.text, undefined, url);
      } else {
        await this.sendMessage(chatId, `
Couldn't extract sale information from this link.

The page might not contain sale/discount information, or it might be blocked.

Try:
• Taking a screenshot and sending it
• Forwarding the original post
        `);
      }
    } catch (error) {
      this.logger.error('Error processing URL:', error);
      await this.sendMessage(chatId, 'Failed to fetch the URL. Please try with a screenshot instead.');
    }
  }

  private async handleChannelPost(message: TelegramMessage) {
    // Process posts from monitored channels automatically
    const text = message.text || message.caption || '';

    this.logger.log(`Processing channel post from ${message.chat.title}: ${text.substring(0, 100)}`);

    try {
      const result = await this.mlService.extractFromUrl(`telegram:channel:${text}`);

      if (result.confidence > 0.5) {
        // Store for admin review or auto-submit based on confidence
        this.logger.log(`High-confidence sale from ${message.chat.title}:`, result);
        // TODO: Auto-submit to database or queue for review
      }
    } catch (error) {
      this.logger.error('Error processing channel post:', error);
    }
  }

  private async sendExtractedSaleConfirmation(
    chatId: number,
    messageId: number,
    result: SaleAnalysisResult,
    originalText?: string,
    imageFileId?: string,
    sourceUrl?: string,
  ) {
    // Store pending sale for confirmation
    const key = `${chatId}:${messageId}`;
    this.pendingSales.set(key, {
      chatId,
      messageId,
      extractedData: result,
      originalText,
      imageFileId,
      sourceUrl,
      timestamp: Date.now(),
    });

    // Clean up old pending sales (older than 1 hour)
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    for (const [k, v] of this.pendingSales.entries()) {
      if (v.timestamp < oneHourAgo) {
        this.pendingSales.delete(k);
      }
    }

    const confidence = Math.round(result.confidence * 100);

    await this.sendMessage(chatId, `
<b>Sale Extracted! (${confidence}% confidence)</b>

<b>Title:</b> ${result.title || 'Not detected'}
<b>Store:</b> ${result.storeName || 'Not detected'}
<b>Category:</b> ${result.category || 'Other'}
<b>Discount:</b> ${result.discountPercentage ? `${result.discountPercentage}%` : 'Not specified'}
<b>Price:</b> ${result.salePrice ? `₪${result.salePrice}` : 'Not specified'}${result.originalPrice ? ` (was ₪${result.originalPrice})` : ''}

<b>Description:</b>
${result.description?.substring(0, 300) || 'No description'}

---
To submit this sale to MySellGuid, open the app and confirm the details.

<i>Feature: Direct submission from Telegram coming soon!</i>
    `, {
      reply_to_message_id: messageId,
    });
  }

  private containsUrl(text: string): boolean {
    const urlRegex = /(https?:\/\/[^\s]+)/gi;
    return urlRegex.test(text);
  }

  private extractUrl(text: string): string | null {
    const urlRegex = /(https?:\/\/[^\s]+)/gi;
    const match = text.match(urlRegex);
    return match ? match[0] : null;
  }

  private isMonitoredChannel(chat: { id: number; username?: string; title?: string }): boolean {
    if (this.monitoredChannels.length === 0) return false;

    return this.monitoredChannels.some(
      (channel) =>
        channel === chat.username ||
        channel === chat.id.toString() ||
        channel === chat.title
    );
  }

  /**
   * Get pending sale for confirmation
   */
  getPendingSale(chatId: number, messageId: number): PendingSale | undefined {
    return this.pendingSales.get(`${chatId}:${messageId}`);
  }

  /**
   * Confirm and submit a pending sale
   */
  async confirmSale(chatId: number, messageId: number): Promise<boolean> {
    const key = `${chatId}:${messageId}`;
    const pending = this.pendingSales.get(key);

    if (!pending) {
      return false;
    }

    // TODO: Submit to sales database
    this.logger.log('Sale confirmed:', pending.extractedData);
    this.pendingSales.delete(key);

    await this.sendMessage(chatId, 'Sale submitted successfully! Thank you for contributing.');
    return true;
  }
}
