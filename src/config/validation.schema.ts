import * as Joi from 'joi';

// Validated once at bootstrap (see main.ts / AppModule ConfigModule.forRoot).
// A missing or malformed critical var (DB url, JWT secrets) crashes the
// process immediately with a readable error instead of failing obscurely
// on the first request that needs it.
export const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().default(4000),
  API_PREFIX: Joi.string().default('api'),
  API_DEFAULT_VERSION: Joi.string().default('1'),
  CORS_ORIGINS: Joi.string().allow('').default(''),

  DATABASE_URL: Joi.string().uri().required(),
  DATABASE_POOL_MAX: Joi.number().default(20),

  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').optional(),
  REDIS_CACHE_TTL_SECONDS: Joi.number().default(60),

  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('30d'),

  STORAGE_PROVIDER: Joi.string().valid('s3', 'cloudinary').default('s3'),
  MAX_UPLOAD_SIZE_MB: Joi.number().default(50),

  AI_PROVIDER: Joi.string().valid('openai', 'gemini', 'groq').default('openai'),

  THROTTLE_TTL_SECONDS: Joi.number().default(60),
  THROTTLE_LIMIT: Joi.number().default(100),

  LOG_LEVEL: Joi.string().valid('fatal', 'error', 'warn', 'info', 'debug', 'trace').default('info'),
}).unknown(true); // allow provider-specific keys (OPENAI_API_KEY etc.) without enumerating all
