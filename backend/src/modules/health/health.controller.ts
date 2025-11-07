import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Get health status of all services' })
  async check() {
    return this.healthService.checkHealth();
  }

  @Get('database')
  @ApiOperation({ summary: 'Check database connection' })
  async checkDatabase() {
    return this.healthService.checkDatabase();
  }

  @Get('redis')
  @ApiOperation({ summary: 'Check Redis connection' })
  async checkRedis() {
    return this.healthService.checkRedis();
  }
}
