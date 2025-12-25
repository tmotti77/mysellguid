import { Controller, Post, Query, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { SeedService } from './seed.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sale } from '../modules/sales/entities/sale.entity';

@ApiTags('Seed')
@Controller('seed')
export class SeedController {
  constructor(
    private readonly seedService: SeedService,
    private readonly configService: ConfigService,
    @InjectRepository(Sale)
    private readonly salesRepository: Repository<Sale>,
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

  @Post('extend-sales')
  @ApiOperation({
    summary: 'Extend expired sale dates (safe for production)',
    description:
      'Extends all expired active sales by the specified number of days. Does NOT delete any data.',
  })
  @ApiQuery({ name: 'secret', required: true, description: 'Seed secret key' })
  @ApiQuery({ name: 'days', required: false, description: 'Number of days to extend (default: 30, max: 365)' })
  async extendSales(
    @Query('secret') secret: string,
    @Query('days') days = 30,
  ) {
    // Same security check as seed
    const seedSecret = this.configService.get('SEED_SECRET');
    if (seedSecret && secret !== seedSecret) {
      throw new ForbiddenException('Invalid seed secret');
    }
    if (!seedSecret && this.configService.get('NODE_ENV') === 'production') {
      throw new ForbiddenException('Requires SEED_SECRET in production');
    }

    // Validate and clamp days parameter
    let daysNum = Number(days);
    if (!Number.isFinite(daysNum) || daysNum < 1) {
      daysNum = 30; // Default fallback
    }
    daysNum = Math.min(Math.max(daysNum, 1), 365); // Clamp between 1 and 365

    // Extend expired active sales
    const result = await this.salesRepository
      .createQueryBuilder()
      .update(Sale)
      .set({
        startDate: () => 'NOW()',
        endDate: () => `NOW() + INTERVAL '${daysNum} days'`,
      })
      .where('status = :status', { status: 'active' })
      .andWhere('"endDate" < NOW()')
      .execute();

    return {
      message: `Extended ${result.affected} expired sales by ${daysNum} days`,
      affected: result.affected,
    };
  }
}
