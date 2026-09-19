export default () => ({
  port: parseInt(process.env.PORT ?? '3001', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  database: {
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    username: process.env.DB_USERNAME ?? 'tcg',
    password: process.env.DB_PASSWORD ?? 'tcg_password',
    database: process.env.DB_DATABASE ?? 'test_case_generator',
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY ?? '',
    model: process.env.GEMINI_MODEL ?? 'gemini-3.6-flash',
  },
  upload: {
    maxSizeBytes: parseInt(process.env.MAX_UPLOAD_SIZE_BYTES ?? '5242880', 10),
  },
});
