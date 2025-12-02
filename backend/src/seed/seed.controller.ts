import { Controller, Post, UseGuards, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { SeedService } from './seed.service';

@ApiTags('Seed')
@Controller('seed')
export class SeedController {
  constructor(
    private readonly seedService: SeedService,
    private readonly configService: ConfigService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Seed database with test data',
    description:
      'Populates database with test users, stores, and sales in Tel Aviv. ⚠️ DEVELOPMENT ONLY - Clears existing data!',
  })
  async seed() {
    // Only allow seeding in development environment
    if (this.configService.get('NODE_ENV') === 'production') {
      throw new ForbiddenException(
        'Database seeding is disabled in production environment',
      );
    }
    const result = await this.seedService.seed();
    return {
      message: 'Database seeded successfully!',
      ...result,
    };
  }
}
