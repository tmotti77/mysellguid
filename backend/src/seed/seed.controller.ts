import { Controller, Post, Query, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
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
      'Populates database with test users, stores, and sales. Requires SEED_SECRET in query param.',
  })
  @ApiQuery({ name: 'secret', required: true, description: 'Seed secret key' })
  async seed(@Query('secret') secret: string) {
    // Check for seed secret (works in all environments)
    const seedSecret = this.configService.get('SEED_SECRET');

    // If SEED_SECRET is set, require it
    if (seedSecret && secret !== seedSecret) {
      throw new ForbiddenException('Invalid seed secret');
    }

    // If no SEED_SECRET is set and we're in production, block
    if (!seedSecret && this.configService.get('NODE_ENV') === 'production') {
      throw new ForbiddenException(
        'Database seeding requires SEED_SECRET in production',
      );
    }

    const result = await this.seedService.seed();
    return {
      message: 'Database seeded successfully!',
      ...result,
    };
  }
}
