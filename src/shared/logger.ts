import pino from "pino";

const isDev = process.env.NODE_ENV !== "production";

const baseLogger = pino({
  level: process.env.LOG_LEVEL ?? (isDev ? "debug" : "info"),
  ...(isDev && {
    transport: {
      target: "pino/file",
      options: { destination: 1 },
    },
    formatters: {
      level(label: string) {
        return { level: label };
      },
    },
  }),
});

export const logger = {
  info: (event: string, data?: Record<string, unknown>) =>
    baseLogger.info({ event, ...data }),
  warn: (event: string, data?: Record<string, unknown>) =>
    baseLogger.warn({ event, ...data }),
  error: (event: string, data?: Record<string, unknown>) =>
    baseLogger.error({ event, ...data }),
  debug: (event: string, data?: Record<string, unknown>) =>
    baseLogger.debug({ event, ...data }),
  child: (bindings: Record<string, unknown>) => baseLogger.child(bindings),
};
