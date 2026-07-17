import { Response, NextFunction } from 'express';
import crypto from 'crypto';
import logger from '../utils/logger';
import { AuthenticatedRequest } from './auth';
import metrics from '../utils/metrics';

export const requestLogger = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const start = process.hrtime();
  
  // Assign or extract unique Request ID
  const requestId = (req.headers['x-request-id'] as string) || crypto.randomUUID();
  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-ID', requestId);

  // Hook into response finish event to write logs
  res.on('finish', () => {
    const diff = process.hrtime(start);
    const durationMs = Math.round((diff[0] * 1e9 + diff[1]) / 1e6);
    
    const logData = {
      requestId,
      method: req.method,
      url: req.originalUrl || req.url,
      status: res.statusCode,
      durationMs,
      ip: req.ip || req.socket.remoteAddress || '',
      userAgent: req.headers['user-agent'] || '',
      userId: req.user?.id || null,
      organizationId: req.user?.organizationId || null,
    };

    // Record metrics
    metrics.recordApiRequest(logData.method, logData.url, logData.status);
    metrics.recordApiLatency(logData.method, logData.url, logData.durationMs);

    const message = `${logData.method} ${logData.url} ${logData.status} - ${logData.durationMs}ms`;

    if (res.statusCode >= 500) {
      logger.error(message, logData);
    } else if (res.statusCode >= 400) {
      logger.warn(message, logData);
    } else {
      logger.info(message, logData);
    }
  });

  next();
};

export default requestLogger;
