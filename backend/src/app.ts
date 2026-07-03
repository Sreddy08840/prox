import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import authRouter from './routes/authRoutes';
import orgRouter from './routes/orgRoutes';
import projectRouter from './routes/projectRoutes';
import unitRouter from './routes/unitRoutes';
import leadRouter from './routes/leadRoutes';
import aiRouter from './routes/aiRoutes';
import conversationRouter from './routes/conversationRoutes';
import dashboardRouter from './routes/dashboardRoutes';
import notificationRouter from './routes/notificationRoutes';
import whatsappRouter from './routes/whatsappRoutes';
import adminRouter from './routes/adminRoutes';
import helmet from 'helmet';
import rateLimiter from './middlewares/rateLimiter';
import healthRouter from './routes/healthRoutes';

dotenv.config();

const app = express();

// Standard Middlewares
app.use(helmet());
app.use(rateLimiter);
app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Route
app.use('/api/v1', healthRouter);

// Mount Routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/organizations', orgRouter);
app.use('/api/v1/projects', projectRouter);
app.use('/api/v1/leads', leadRouter);
app.use('/api/v1/leads', aiRouter);
app.use('/api/v1', conversationRouter);
app.use('/api/v1', unitRouter);
app.use('/api/v1/dashboard', dashboardRouter);
app.use('/api/v1/notifications', notificationRouter);
app.use('/api/v1/whatsapp', whatsappRouter);
app.use('/api/v1/admin', adminRouter);

interface AppError extends Error {
  statusCode?: number;
}

// Global Error Handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  const statusCode = (err as AppError).statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
});

export default app;
