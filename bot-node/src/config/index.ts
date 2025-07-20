export const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || '';

export const GROQ_API_KEY = process.env.GROQ_API_KEY || '';

export const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'ctesf5',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'root',
};
