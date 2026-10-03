export const config = {
  DATABASE_URL: process.env.DATABASE_URL || '',
  JWT_SECRET: process.env.JWT_SECRET || 'healthcart-super-secret-jwt-key-2024-change-in-prod',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'healthcart-refresh-secret-jwt-key-2024-change-in-prod',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  PORT: Number(process.env.PORT || 3000),
  NODE_ENV: process.env.NODE_ENV || 'development',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
  SMTP_PORT: Number(process.env.SMTP_PORT || 587),
  SMTP_SECURE: process.env.SMTP_SECURE === 'true',
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  EMAIL_FROM: process.env.EMAIL_FROM || 'HealthCart <noreply@healthcart.com>',
  DEFAULT_SLOT_DURATION_MINUTES: Number(process.env.DEFAULT_SLOT_DURATION_MINUTES || 30),
  CANCELLATION_CUTOFF_HOURS: Number(process.env.CANCELLATION_CUTOFF_HOURS || 24),
};

export default config;
