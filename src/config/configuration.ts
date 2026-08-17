export default () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '4000', 10),
  apiPrefix: process.env.API_PREFIX ?? 'api',
  apiDefaultVersion: process.env.API_DEFAULT_VERSION ?? '1',
  corsOrigins: (process.env.CORS_ORIGINS ?? '').split(',').filter(Boolean),

  database: {
    url: process.env.DATABASE_URL,
    poolMax: parseInt(process.env.DATABASE_POOL_MAX ?? '20', 10),
  },

  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    tls: process.env.REDIS_TLS === 'true',
    cacheTtlSeconds: parseInt(process.env.REDIS_CACHE_TTL_SECONDS ?? '60', 10),
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '30d',
  },

  passwordHash: {
    memoryCost: parseInt(process.env.PASSWORD_HASH_MEMORY_COST ?? '19456', 10),
    timeCost: parseInt(process.env.PASSWORD_HASH_TIME_COST ?? '2', 10),
  },

  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackUrl: process.env.GOOGLE_CALLBACK_URL,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackUrl: process.env.GITHUB_CALLBACK_URL,
    },
  },

  storage: {
    provider: process.env.STORAGE_PROVIDER ?? 's3',
    maxUploadSizeMb: parseInt(process.env.MAX_UPLOAD_SIZE_MB ?? '50', 10),
    s3: {
      bucket: process.env.S3_BUCKET,
      region: process.env.S3_REGION,
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      endpoint: process.env.S3_ENDPOINT || undefined,
    },
    cloudinary: {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      apiSecret: process.env.CLOUDINARY_API_SECRET,
    },
  },

  ai: {
    provider: process.env.AI_PROVIDER ?? 'openai',
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
      embeddingModel: process.env.OPENAI_EMBEDDING_MODEL ?? 'text-embedding-3-small',
    },
    gemini: { apiKey: process.env.GEMINI_API_KEY },
    groq: { apiKey: process.env.GROQ_API_KEY },
    whisperProvider: process.env.WHISPER_PROVIDER ?? 'openai',
  },

  throttle: {
    ttlSeconds: parseInt(process.env.THROTTLE_TTL_SECONDS ?? '60', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT ?? '100', 10),
  },

  logLevel: process.env.LOG_LEVEL ?? 'info',

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  },

  email: {
    smtpHost: process.env.SMTP_HOST,
    smtpPort: parseInt(process.env.SMTP_PORT ?? '587', 10),
    smtpUser: process.env.SMTP_USER,
    smtpPassword: process.env.SMTP_PASSWORD,
    from: process.env.EMAIL_FROM ?? 'FlowLens AI <noreply@flowlens.ai>',
  },
});
