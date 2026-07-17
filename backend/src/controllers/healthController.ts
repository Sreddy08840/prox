import { Request, Response } from 'express';
import prisma from '../config/database';

export const getHealth = async (req: Request, res: Response): Promise<void> => {
  const healthStatus: {
    status: string;
    timestamp: string;
    uptime: number;
    services: {
      database: string;
      redis: string;
    };
  } = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      database: 'unknown',
      redis: 'disabled', // Redis connection can be integrated when configured
    },
  };

  try {
    // Check Database connectivity via Prisma Raw Query
    await prisma.$queryRaw`SELECT 1`;
    healthStatus.services.database = 'connected';
  } catch (err) {
    healthStatus.status = 'unhealthy';
    healthStatus.services.database = 'disconnected';
  }

  const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(healthStatus);
};

export const getLiveness = (_req: Request, res: Response): void => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
};

import metrics from '../utils/metrics';

export const getMetrics = (_req: Request, res: Response): void => {
  res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
  res.status(200).send(metrics.getPrometheusFormat());
};

