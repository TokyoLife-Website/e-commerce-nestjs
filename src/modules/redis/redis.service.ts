import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  private redis: Redis;
  constructor(private readonly configService: ConfigService) {
    const redisHost = configService.get('REDIS_HOST');
    const redisPort = configService.get('REDIS_PORT');
    const redisPass = configService.get('REDIS_PASSWORD');
    const redisUser = configService.get('REDIS_USER');
    this.redis = new Redis({
      host: redisHost,
      port: redisPort,
      password: redisPass,
      username: redisUser,
      tls: {},
      enableTLSForSentinelMode: false,
    });
  }
  async rateLimiter(
    userId: number,
    limit: number,
    duration: number,
  ): Promise<void> {
    const key = `forgotPassword:${userId}`;
    const current = await this.redis.incr(key);
    if (current === 1) await this.redis.expire(key, duration);
    if (current > limit)
      throw new HttpException(
        `You have exceeded the limit of ${limit} requests within ${duration} seconds.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
  }
}
