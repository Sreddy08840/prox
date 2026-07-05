import rateLimit from 'express-rate-limit';

const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10); // Default 15 minutes
const max = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10); // Limit each IP to 100 requests per windowMs

export const rateLimiter = rateLimit({
  windowMs,
  max,
  skip: () => process.env.NODE_ENV === 'development',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    success: false,
    error: {
      message: 'Too many requests from this client. Please try again after 15 minutes.',
      code: 'TOO_MANY_REQUESTS',
    },
  },
});

export default rateLimiter;
