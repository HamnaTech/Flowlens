import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';

@Module({
  imports: [
    PinoLoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const isDev = config.get('nodeEnv') === 'development';
        return {
          pinoHttp: {
            level: config.get<string>('logLevel'),
            genReqId: (req: any) => req.id,
            transport: isDev
              ? { target: 'pino-pretty', options: { colorize: true, singleLine: true } }
              : undefined,
            redact: {
              paths: [
                'req.headers.authorization',
                'req.headers.cookie',
                'req.body.password',
                'req.body.refreshToken',
                'res.headers["set-cookie"]',
              ],
              censor: '[REDACTED]',
            },
            customProps: () => ({ service: 'flowlens-api' }),
            serializers: {
              req: (req: any) => ({ id: req.id, method: req.method, url: req.url }),
            },
          },
        };
      },
    }),
  ],
  exports: [PinoLoggerModule],
})
export class LoggerModule {}
