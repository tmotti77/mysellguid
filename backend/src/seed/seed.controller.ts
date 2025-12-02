import { Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SeedService } from './seed.service';

@ApiTags('Seed')
@Controller('seed')
export class SeedController {
  constructor(private readonly seedService: SeedService) {}

  @Post()
  @ApiOperation({
    summary: 'Seed database with test data',
    description:
      'Populates database with test users, stores, and sales in Tel Aviv. ⚠️ DEVELOPMENT ONLY - Clears existing data!',
  })
  async seed() {
    const result = await this.seedService.seed();
    return {
      message: 'Database seeded successfully!',
      ...result,
    };
  }
}
