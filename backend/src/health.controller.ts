import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './modules/users/entities/user.entity';

@Controller('health')
export class HealthController {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  @Get()
  async check() {
    // Check database connection
    try {
      await this.usersRepository.query('SELECT 1');

      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: 'connected',
        uptime: process.uptime(),
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        },
      };
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: error.message,
      };
    }
  }

  @Get('ready')
  async ready() {
    // Readiness probe - check if app can serve requests
    try {
      await this.usersRepository.query('SELECT 1');
      return { ready: true };
    } catch {
      return { ready: false };
    }
  }

  @Get('live')
  async live() {
    // Liveness probe - check if app is running
    return { alive: true };
  }
}
