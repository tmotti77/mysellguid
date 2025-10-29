import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ScrapingService } from './scraping.service';
import { ScrapingController } from './scraping.controller';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'scraping',
    }),
  ],
  controllers: [ScrapingController],
  providers: [ScrapingService],
  exports: [ScrapingService],
})
export class ScrapingModule {}
