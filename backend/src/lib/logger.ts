const isProduction = process.env.NODE_ENV === "production";

export const logger = {
  debug(...args: unknown[]) {
    if (!isProduction) console.debug(...args);
  },
  info(...args: unknown[]) {
    if (!isProduction) console.info(...args);
  },
  warn(...args: unknown[]) {
    console.warn(...args);
  },
  error(...args: unknown[]) {
    console.error(...args);
  },
};
