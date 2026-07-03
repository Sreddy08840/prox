import winston from 'winston';

const isProduction = process.env.NODE_ENV === 'production';

// Define custom levels and colors
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

// Define log formats
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  isProduction
    ? winston.format.json() // Structured JSON logs in production
    : winston.format.combine(
        winston.format.colorize({ all: true }),
        winston.format.printf(
          (info) => `[${info.timestamp}] [${info.level}]: ${info.message}`,
        ),
      ),
);

// Define transports
const transports = [
  new winston.transports.Console(),
];

// Create the logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  levels,
  format,
  transports,
});

export default logger;
