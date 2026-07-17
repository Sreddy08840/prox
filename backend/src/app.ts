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
import tenantRouter from './routes/tenantRoutes';
import helmet from 'helmet';
import rateLimiter from './middlewares/rateLimiter';
import healthRouter from './routes/healthRoutes';
import requestLogger from './middlewares/requestLogger';
import logger from './utils/logger';

dotenv.config();

const app = express();

app.set('trust proxy', true);

// Configure Helmet with robust CSP
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'", "http:", "https:", "data:", "blob:", "'unsafe-inline'", "'unsafe-eval'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
  })
);

app.use(rateLimiter);

// Configure CORS dynamically to protect origins
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:5000'];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Structured logger middleware
app.use(requestLogger);

// Friendly root endpoint
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    name: 'PropX API Gateway',
    version: '1.0.0',
    status: 'operational',
    endpoints: {
      liveness: '/api/v1/liveness',
      health: '/api/v1/health',
      metrics: '/api/v1/metrics',
    },
  });
});

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
app.use('/api/v1/tenants', tenantRouter);

interface AppError extends Error {
  statusCode?: number;
}

// Global Error Handler
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  const statusCode = (err as AppError).statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  // Log error using structured logger
  logger.error(`Error on request ${req.headers['x-request-id'] || 'N/A'}: ${message}`, {
    requestId: req.headers['x-request-id'] || null,
    path: req.originalUrl,
    method: req.method,
    statusCode,
    stack: err.stack,
  });
  
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
});

export default app;
