import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MlService, SaleAnalysisResult } from '../ml/ml.service';
import { Sale, SaleSource, SaleCategory, SaleStatus } from '../sales/entities/sale.entity';
import { Store, StoreCategory } from '../stores/entities/store.entity';

interface DiscoveredSale {
  source: string;
  sourceId: string;
  sourceUrl?: string;
  rawContent: string;
  extractedData?: SaleAnalysisResult;
  confidence: number;
  status: 'pending' | 'approved' | 'rejected' | 'auto_published';
  discoveredAt: Date;
}

interface TelegramChannel {
  id: string;
  username: string;
  name: string;
  lastMessageId?: number;
}

interface RssFeed {
  url: string;
  name: string;
  lastFetchedAt?: Date;
}

@Injectable()
export class DiscoveryService implements OnModuleInit {
  private readonly logger = new Logger(DiscoveryService.name);
  private readonly telegramBotToken: string;
  private readonly apifyToken: string;
  private readonly autoPublishThreshold = 0.75; // Auto-publish if confidence > 75%

  // Israeli Telegram deal channels (public)
  private readonly telegramChannels: TelegramChannel[] = [
    { id: '-1001234567890', username: 'DealsIL', name: 'Deals Israel' },
    { id: '-1001234567891', username: 'MivtzaimIsrael', name: 'מבצעים ישראל' },
    { id: '-1001234567892', username: 'KuponimIL', name: 'קופונים ישראל' },
    // Add more channels as discovered
  ];

  // RSS feeds from Israeli deal sites
  private readonly rssFeeds: RssFeed[] = [
    { url: 'https://www.walla.co.il/rss/deals', name: 'Walla Deals' },
    { url: 'https://www.ynet.co.il/rss/shopping', name: 'Ynet Shopping' },
    // Add more RSS feeds
  ];

  // In-memory queue for discovered sales (in production, use Redis/DB)
  private discoveryQueue: DiscoveredSale[] = [];
  private processedSourceIds: Set<string> = new Set();

  constructor(
    private configService: ConfigService,
    private mlService: MlService,
    @InjectRepository(Sale)
    private salesRepository: Repository<Sale>,
    @InjectRepository(Store)
    private storesRepository: Repository<Store>,
  ) {
    this.telegramBotToken = this.configService.get('TELEGRAM_BOT_TOKEN', '');
    this.apifyToken = this.configService.get('APIFY_TOKEN', '');

    // Load channel config from env if provided
    const channelConfig = this.configService.get('DISCOVERY_TELEGRAM_CHANNELS', '');
    if (channelConfig) {
      try {
        const channels = JSON.parse(channelConfig);
        this.telegramChannels.push(...channels);
      } catch (e) {
        this.logger.warn('Invalid DISCOVERY_TELEGRAM_CHANNELS config');
      }
    }
  }

  async onModuleInit() {
    this.logger.log('Sales Discovery Engine initialized');
    this.logger.log(`Monitoring ${this.telegramChannels.length} Telegram channels`);
    this.logger.log(`Monitoring ${this.rssFeeds.length} RSS feeds`);
    this.logger.log(`Auto-publish threshold: ${this.autoPublishThreshold * 100}%`);
  }

  /**
   * Main discovery job - runs every 5 minutes
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async runDiscovery() {
    this.logger.log('Starting discovery cycle...');

    const results = await Promise.allSettled([
      this.discoverFromTelegram(),
      this.discoverFromRss(),
      this.discoverFromApify(),
    ]);

    const successCount = results.filter(r => r.status === 'fulfilled').length;
    this.logger.log(`Discovery cycle complete. ${successCount}/${results.length} sources succeeded`);

    // Process the queue
    await this.processDiscoveryQueue();
  }

  /**
   * Discover sales from Telegram public channels
   */
  async discoverFromTelegram(): Promise<number> {
    if (!this.telegramBotToken) {
      this.logger.debug('Telegram discovery skipped - no bot token');
      return 0;
    }

    let discovered = 0;

    for (const channel of this.telegramChannels) {
      try {
        // Use getUpdates or channel history API
        const messages = await this.fetchTelegramChannelMessages(channel);

        for (const message of messages) {
          const sourceId = `telegram:${channel.username}:${message.message_id}`;

          if (this.processedSourceIds.has(sourceId)) continue;

          const content = message.text || message.caption || '';
          if (!content || content.length < 20) continue;

          // Quick heuristic check - does it look like a sale?
          if (!this.looksLikeSale(content)) continue;

          this.discoveryQueue.push({
            source: 'telegram',
            sourceId,
            sourceUrl: `https://t.me/${channel.username}/${message.message_id}`,
            rawContent: content,
            confidence: 0,
            status: 'pending',
            discoveredAt: new Date(),
          });

          this.processedSourceIds.add(sourceId);
          discovered++;
        }

        this.logger.debug(`Discovered ${discovered} potential sales from ${channel.name}`);
      } catch (error) {
        this.logger.error(`Error fetching from ${channel.name}:`, error);
      }
    }

    return discovered;
  }

  /**
   * Discover sales from RSS feeds
   */
  async discoverFromRss(): Promise<number> {
    let discovered = 0;

    for (const feed of this.rssFeeds) {
      try {
        const items = await this.fetchRssFeed(feed.url);

        for (const item of items) {
          const sourceId = `rss:${feed.name}:${item.guid || item.link}`;

          if (this.processedSourceIds.has(sourceId)) continue;

          const content = `${item.title}\n${item.description || ''}`;

          this.discoveryQueue.push({
            source: 'rss',
            sourceId,
            sourceUrl: item.link,
            rawContent: content,
            confidence: 0,
            status: 'pending',
            discoveredAt: new Date(),
          });

          this.processedSourceIds.add(sourceId);
          discovered++;
        }

        feed.lastFetchedAt = new Date();
      } catch (error) {
        this.logger.error(`Error fetching RSS ${feed.name}:`, error);
      }
    }

    return discovered;
  }

  /**
   * Discover sales from Apify actors (Instagram, etc.)
   */
  async discoverFromApify(): Promise<number> {
    if (!this.apifyToken) {
      this.logger.debug('Apify discovery skipped - no token');
      return 0;
    }

    let discovered = 0;

    try {
      // Run Instagram hashtag scraper
      const instagramResults = await this.runApifyActor('instagram-hashtag-scraper', {
        hashtags: ['מבצע', 'הנחה', 'סייל', 'sale', 'discount'],
        resultsLimit: 50,
        location: 'Israel',
      });

      for (const post of instagramResults) {
        const sourceId = `instagram:${post.id}`;

        if (this.processedSourceIds.has(sourceId)) continue;

        const content = post.caption || '';
        if (!content || !this.looksLikeSale(content)) continue;

        this.discoveryQueue.push({
          source: 'instagram',
          sourceId,
          sourceUrl: post.url,
          rawContent: content,
          confidence: 0,
          status: 'pending',
          discoveredAt: new Date(),
        });

        this.processedSourceIds.add(sourceId);
        discovered++;
      }
    } catch (error) {
      this.logger.error('Apify discovery error:', error);
    }

    return discovered;
  }

  /**
   * Process the discovery queue - extract, validate, and publish
   */
  async processDiscoveryQueue(): Promise<void> {
    const batchSize = 10;
    const batch = this.discoveryQueue.splice(0, batchSize);

    if (batch.length === 0) return;

    this.logger.log(`Processing ${batch.length} discovered items...`);

    for (const item of batch) {
      try {
        // Extract sale info using AI
        const extracted = await this.mlService.extractFromUrl(
          item.sourceUrl || `${item.source}:content:${item.rawContent.substring(0, 500)}`
        );

        item.extractedData = extracted;
        item.confidence = extracted.confidence;

        // Decide what to do based on confidence
        if (extracted.confidence >= this.autoPublishThreshold) {
          await this.autoPublishSale(item);
          item.status = 'auto_published';
          this.logger.log(`Auto-published sale: ${extracted.title} (${Math.round(extracted.confidence * 100)}%)`);
        } else if (extracted.confidence >= 0.4) {
          // Queue for review
          item.status = 'pending';
          await this.queueForReview(item);
          this.logger.debug(`Queued for review: ${extracted.title} (${Math.round(extracted.confidence * 100)}%)`);
        } else {
          item.status = 'rejected';
          this.logger.debug(`Rejected low-confidence item: ${extracted.confidence}`);
        }
      } catch (error) {
        this.logger.error(`Error processing item ${item.sourceId}:`, error);
      }
    }
  }

  /**
   * Auto-publish a high-confidence sale
   */
  private async autoPublishSale(item: DiscoveredSale): Promise<void> {
    const data = item.extractedData!;

    // Try to find or create a store
    let store = await this.findOrCreateStore(data.storeName, data.storeAddress);

    if (!store) {
      // Create a generic "Discovered Sales" store for unmatched sales
      store = await this.getOrCreateDiscoveredSalesStore();
    }

    // Create the sale
    const sale = this.salesRepository.create({
      title: data.title || 'Discovered Sale',
      description: data.description || item.rawContent.substring(0, 500),
      store,
      storeId: store.id,
      category: this.mapCategory(data.category) as SaleCategory,
      discountPercentage: data.discountPercentage,
      originalPrice: data.originalPrice,
      salePrice: data.salePrice,
      currency: 'ILS',
      images: (data as any).imageUrls || [],
      latitude: store.latitude,
      longitude: store.longitude,
      location: `POINT(${store.longitude} ${store.latitude})`,
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      status: SaleStatus.ACTIVE,
      source: SaleSource.AUTO_DISCOVERED,
      sourceUrl: item.sourceUrl,
      sourceType: item.source,
      autoDiscovered: true,
      aiMetadata: {
        extractedText: item.rawContent.substring(0, 1000),
        confidence: data.confidence,
        processingDate: new Date(),
      },
    });

    await this.salesRepository.save(sale);
  }

  /**
   * Queue item for admin review
   */
  private async queueForReview(item: DiscoveredSale): Promise<void> {
    // In production, save to a review_queue table
    // For now, just log it
    this.logger.log(`Review needed: ${item.extractedData?.title} from ${item.source}`);
  }

  /**
   * Find existing store or create new one
   */
  private async findOrCreateStore(name?: string, address?: string): Promise<Store | null> {
    if (!name) return null;

    // Try to find by name
    const existing = await this.storesRepository.findOne({
      where: { name: name },
    });

    if (existing) return existing;

    // For now, return null - in production, could create new store
    return null;
  }

  /**
   * Get or create a placeholder store for discovered sales
   */
  private async getOrCreateDiscoveredSalesStore(): Promise<Store> {
    const placeholderName = 'Discovered Sales';

    let store = await this.storesRepository.findOne({
      where: { name: placeholderName },
    });

    if (!store) {
      store = this.storesRepository.create({
        name: placeholderName,
        description: 'Sales discovered automatically from social media and deal sites',
        address: 'Various Locations',
        city: 'Israel',
        country: 'Israel',
        latitude: 32.0853, // Tel Aviv
        longitude: 34.7818,
        category: StoreCategory.OTHER,
        isVerified: false,
      });
      await this.storesRepository.save(store);
    }

    return store;
  }

  /**
   * Fetch messages from a Telegram channel
   */
  private async fetchTelegramChannelMessages(channel: TelegramChannel): Promise<any[]> {
    // Note: For public channels, we need to use getUpdates or a user bot
    // The Bot API can only get messages from channels where bot is admin
    // Alternative: Use MTProto API or Telegram's public embed

    try {
      // Try to fetch via public embed/web preview
      const response = await fetch(`https://t.me/s/${channel.username}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; MySellGuid/1.0)',
        },
      });

      const html = await response.text();
      return this.parseTelegramWebMessages(html);
    } catch (error) {
      this.logger.error(`Failed to fetch Telegram channel ${channel.username}:`, error);
      return [];
    }
  }

  /**
   * Parse messages from Telegram's public web preview
   */
  private parseTelegramWebMessages(html: string): any[] {
    const messages: any[] = [];

    // Extract message content from the HTML
    const messageRegex = /<div class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
    const idRegex = /data-post="([^"]+)"/g;

    let match;
    let idMatch;
    const ids: string[] = [];

    while ((idMatch = idRegex.exec(html)) !== null) {
      ids.push(idMatch[1]);
    }

    let index = 0;
    while ((match = messageRegex.exec(html)) !== null) {
      const text = match[1]
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (text.length > 20) {
        messages.push({
          message_id: ids[index] || `msg_${index}`,
          text,
        });
      }
      index++;
    }

    return messages.slice(0, 20); // Limit to last 20 messages
  }

  /**
   * Fetch and parse RSS feed
   */
  private async fetchRssFeed(url: string): Promise<any[]> {
    try {
      const response = await fetch(url);
      const xml = await response.text();
      return this.parseRssXml(xml);
    } catch (error) {
      this.logger.error(`Failed to fetch RSS ${url}:`, error);
      return [];
    }
  }

  /**
   * Parse RSS XML
   */
  private parseRssXml(xml: string): any[] {
    const items: any[] = [];

    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    let match;

    while ((match = itemRegex.exec(xml)) !== null) {
      const itemXml = match[1];

      const title = this.extractXmlTag(itemXml, 'title');
      const link = this.extractXmlTag(itemXml, 'link');
      const description = this.extractXmlTag(itemXml, 'description');
      const guid = this.extractXmlTag(itemXml, 'guid');

      if (title) {
        items.push({ title, link, description, guid });
      }
    }

    return items.slice(0, 20);
  }

  private extractXmlTag(xml: string, tag: string): string {
    const regex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>|<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i');
    const match = xml.match(regex);
    return match ? (match[1] || match[2] || '').trim() : '';
  }

  /**
   * Run an Apify actor
   */
  private async runApifyActor(actorId: string, input: any): Promise<any[]> {
    if (!this.apifyToken) return [];

    try {
      const response = await fetch(
        `https://api.apify.com/v2/acts/${actorId}/runs?token=${this.apifyToken}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...input,
            proxyConfiguration: { useApifyProxy: true },
          }),
        }
      );

      const run = await response.json();

      // Wait for completion (simplified - in production use webhooks)
      await new Promise(resolve => setTimeout(resolve, 30000));

      // Fetch results
      const resultsResponse = await fetch(
        `https://api.apify.com/v2/datasets/${run.data.defaultDatasetId}/items?token=${this.apifyToken}`
      );

      return await resultsResponse.json();
    } catch (error) {
      this.logger.error('Apify actor error:', error);
      return [];
    }
  }

  /**
   * Quick heuristic to check if text looks like a sale
   */
  private looksLikeSale(text: string): boolean {
    const saleKeywords = [
      'מבצע', 'הנחה', 'סייל', 'sale', 'discount', '%', 'off',
      'חינם', 'free', '1+1', 'קנה', 'buy', 'save', 'חסכו',
      '₪', 'שקל', 'מחיר', 'price', 'deal', 'דיל', 'קופון', 'coupon'
    ];

    const lowerText = text.toLowerCase();
    return saleKeywords.some(keyword => lowerText.includes(keyword.toLowerCase()));
  }

  /**
   * Map extracted category to our categories
   */
  private mapCategory(category?: string): string {
    const categoryMap: Record<string, string> = {
      'clothing': 'clothing',
      'fashion': 'clothing',
      'shoes': 'shoes',
      'electronics': 'electronics',
      'tech': 'electronics',
      'home': 'home_goods',
      'home_goods': 'home_goods',
      'beauty': 'beauty',
      'cosmetics': 'beauty',
      'sports': 'sports',
      'fitness': 'sports',
      'food': 'food',
      'grocery': 'food',
    };

    return categoryMap[category?.toLowerCase() || ''] || 'other';
  }

  /**
   * Get discovery statistics
   */
  getStats() {
    return {
      queueSize: this.discoveryQueue.length,
      processedCount: this.processedSourceIds.size,
      sources: {
        telegram: this.telegramChannels.length,
        rss: this.rssFeeds.length,
        apify: this.apifyToken ? 'configured' : 'not configured',
      },
      autoPublishThreshold: this.autoPublishThreshold,
    };
  }

  /**
   * Manually trigger discovery (for testing)
   */
  async triggerDiscovery() {
    await this.runDiscovery();
    return this.getStats();
  }

  /**
   * Add a new Telegram channel to monitor
   */
  addTelegramChannel(channel: TelegramChannel) {
    if (!this.telegramChannels.find(c => c.username === channel.username)) {
      this.telegramChannels.push(channel);
      this.logger.log(`Added Telegram channel: ${channel.name}`);
    }
  }

  /**
   * Add a new RSS feed to monitor
   */
  addRssFeed(feed: RssFeed) {
    if (!this.rssFeeds.find(f => f.url === feed.url)) {
      this.rssFeeds.push(feed);
      this.logger.log(`Added RSS feed: ${feed.name}`);
    }
  }
}
