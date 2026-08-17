import { Global, Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-yet';
import { CacheHelperService } from './cache-helper.service';

@Global()
@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        store: await redisStore({
          socket: {
            host: config.get<string>('redis.host'),
            port: config.get<number>('redis.port'),
            // Managed Redis providers (Upstash, Redis Cloud, Render Redis)
            // require TLS. REDIS_TLS=true enables it; local Redis stays
            // plaintext by default.
            tls: config.get<boolean>('redis.tls') || undefined,
          },
          password: config.get<string>('redis.password'),
        }),
        ttl: config.get<number>('redis.cacheTtlSeconds', 60) * 1000,
      }),
    }),
  ],
  providers: [CacheHelperService],
  exports: [CacheHelperService, CacheModule],
})
export class RedisCacheModule { }
