import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import { UserRole } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-change-in-production';

// Interface extending standard Express Request
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    organizationId: string | null;
  };
}

interface DecodedToken extends jwt.JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  organizationId: string | null;
}

/**
 * Protect middleware: validates the JWT access token in the Authorization header
 */
export const protect = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    let token: string | undefined;

    // Retrieve token from Authorization header (Bearer <token>)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      res.status(401).json({
        success: false,
        error: { message: 'Authentication required. Please provide a bearer token.' },
      });
      return;
    }

    // Verify token signature
    let decoded: DecodedToken;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    } catch (_err) {
      res.status(401).json({
        success: false,
        error: { message: 'Authentication failed. Invalid or expired token.' },
      });
      return;
    }

    // Fetch user from DB
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        organizationId: true,
        deletedAt: true,
      },
    });

    if (!user || user.deletedAt) {
      res.status(401).json({
        success: false,
        error: { message: 'The user owning this session no longer exists.' },
      });
      return;
    }

    if (user.status === 'INACTIVE') {
      res.status(403).json({
        success: false,
        error: { message: 'Your account is deactivated.' },
      });
      return;
    }

    // Attach user profile to request context
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Restrict routes based on role permissions
 */
export const restrictTo = (...allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: 'Authentication required.' },
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: { message: 'Forbidden. You do not have permissions to access this route.' },
      });
      return;
    }

    next();
  };
};
