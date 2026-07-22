import rateLimit from 'express-rate-limit';
import { Request } from 'express';

const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10); // Default 15 minutes
const max = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '5000', 10); // Limit each IP to 5000 requests per windowMs

export const rateLimiter = rateLimit({
  windowMs,
  max,
  skip: (req: Request) => {
    // Skip in development mode
    if (process.env.NODE_ENV === 'development') return true;

    // Skip health check, liveness probes, metrics, root landing page, and frequent UI polling endpoints
    const path = req.originalUrl || req.url || '';
    if (
      path === '/' ||
      path.includes('/health') ||
      path.includes('/liveness') ||
      path.includes('/metrics') ||
      path.includes('/unread-count')
    ) {
      return true;
    }
    return false;
  },
  keyGenerator: (req: Request): string => {
    // Extract actual client IP behind proxy (Nginx / Render load balancer)
    const xForwardedFor = req.headers['x-forwarded-for'];
    if (xForwardedFor) {
      const rawIp = Array.isArray(xForwardedFor) ? xForwardedFor[0] : xForwardedFor;
      const clientIp = rawIp.split(',')[0].trim();
      if (clientIp) return clientIp;
    }
    return req.ip || req.socket.remoteAddress || '127.0.0.1';
  },
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

