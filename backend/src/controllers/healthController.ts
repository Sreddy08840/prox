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
