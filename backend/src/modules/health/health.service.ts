import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { User } from '../users/entities/user.entity';

@Injectable()
export class HealthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectQueue('notifications') private notificationsQueue: Queue,
  ) {}

  async checkHealth() {
    const [database, redis] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
    ]);

    const overall = database.status === 'healthy' && redis.status === 'healthy' ? 'healthy' : 'unhealthy';

    return {
      status: overall,
      timestamp: new Date().toISOString(),
      services: {
        database,
        redis,
      },
    };
  }

  async checkDatabase() {
    try {
      // Simple query to check database connection
      await this.usersRepository.query('SELECT 1');

      // Check PostGIS extension
      const postgisVersion = await this.usersRepository.query('SELECT PostGIS_Version()');

      return {
        status: 'healthy',
        message: 'Database connection successful',
        postgis: postgisVersion[0]?.postgis_version || 'unknown',
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Database connection failed: ${error.message}`,
      };
    }
  }

  async checkRedis() {
    try {
      // Check if queue client is connected
      const client = await this.notificationsQueue.client;
      await client.ping();

      return {
        status: 'healthy',
        message: 'Redis connection successful',
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Redis connection failed: ${error.message}`,
      };
    }
  }
}
