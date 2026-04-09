import pino from 'pino';

export const logger = pino({
  name: 'criteria-api',
  level: process.env.LOG_LEVEL ?? 'info',
});
