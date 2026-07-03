import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Prisma } from '@prisma/client';
import prisma from '../config/database';
import { sendEmail } from '../services/mailService';

// JWT Configuration Defaults
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m'; // Access token: short-lived (15 mins)
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'super-secret-refresh-key-change-in-production';
const REFRESH_TOKEN_EXPIRES_IN = '7d'; // Refresh token: long-lived (7 days)

// Helper: Generate Access Token
const generateAccessToken = (user: { id: string; email: string; role: string; organizationId: string | null }): string => {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    },
    JWT_SECRET,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { expiresIn: JWT_EXPIRES_IN as any },
  );
};

// Helper: Generate Refresh Token
const generateRefreshToken = (user: { id: string; tokenVersion: number }): string => {
  return jwt.sign(
    {
      userId: user.id,
      tokenVersion: user.tokenVersion,
    },
    REFRESH_TOKEN_SECRET,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { expiresIn: REFRESH_TOKEN_EXPIRES_IN as any },
  );
};

// Helper: Set Refresh Token Cookie
const setRefreshTokenCookie = (res: Response, token: string) => {
  res.cookie('propx_refresh_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  });
};

// Custom application exception helper
class AuthError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, AuthError.prototype);
  }
}

/**
 * Register a new Organization and its primary Owner (Admin user)
 */
export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { organizationName, organizationSlug, email, password, firstName, lastName } = req.body;

    // Check email availability
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new AuthError('Email address already registered', 400);
    }

    // Check organization slug uniqueness
    const existingOrg = await prisma.organization.findUnique({ where: { slug: organizationSlug } });
    if (existingOrg) {
      throw new AuthError('Organization URL identifier is already in use', 400);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create Org and User in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const newOrg = await tx.organization.create({
        data: {
          name: organizationName,
          slug: organizationSlug,
        },
      });

      const newUser = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          role: 'ADMIN', // Primary owner of the registration is the Admin
          status: 'ACTIVE',
          organizationId: newOrg.id,
        },
      });

      // Write Audit Log
      await tx.auditLog.create({
        data: {
          organizationId: newOrg.id,
          userId: newUser.id,
          action: 'ORGANIZATION_REGISTER',
          entityName: 'Organization',
          entityId: newOrg.id,
          newValues: { name: organizationName, slug: organizationSlug } as Prisma.InputJsonValue,
        },
      });

      return { user: newUser, organization: newOrg };
    });

    // Generate tokens
    const accessToken = generateAccessToken(result.user);
    const refreshToken = generateRefreshToken(result.user);

    setRefreshTokenCookie(res, refreshToken);

    res.status(201).json({
      success: true,
      data: {
        accessToken,
        user: {
          id: result.user.id,
          email: result.user.email,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
          role: result.user.role,
          organizationId: result.user.organizationId,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Log in an existing user and set JWT cookies
 */
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Find active user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || user.deletedAt) {
      throw new AuthError('Invalid email or password credentials', 401);
    }

    if (user.status === 'INACTIVE') {
      throw new AuthError('User account has been deactivated', 403);
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new AuthError('Invalid email or password credentials', 401);
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    setRefreshTokenCookie(res, refreshToken);

    // Audit Log login event
    if (user.organizationId) {
      await prisma.auditLog.create({
        data: {
          organizationId: user.organizationId,
          userId: user.id,
          action: 'USER_LOGIN',
          entityName: 'User',
          entityId: user.id,
        },
      });
    }

    res.status(200).json({
      success: true,
      data: {
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          organizationId: user.organizationId,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Request access token refresh
 */
export const refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const refreshToken = req.cookies.propx_refresh_token;

    if (!refreshToken) {
      throw new AuthError('Missing session refresh token', 401);
    }

    interface RefreshTokenPayload extends jwt.JwtPayload {
      userId: string;
      tokenVersion: number;
    }

    // Decode & verify
    let payload: RefreshTokenPayload;
    try {
      payload = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET) as RefreshTokenPayload;
    } catch (_err) {
      throw new AuthError('Invalid or expired refresh token session', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user || user.deletedAt || user.status === 'INACTIVE') {
      throw new AuthError('User account is invalid or no longer exists', 401);
    }

    // Check token version to verify if revoked
    if (user.tokenVersion !== payload.tokenVersion) {
      throw new AuthError('Session has been revoked due to security changes', 401);
    }

    // Issue new tokens
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    setRefreshTokenCookie(res, newRefreshToken);

    res.status(200).json({
      success: true,
      data: {
        accessToken: newAccessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Log out user and clear refresh token
 */
export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.clearCookie('propx_refresh_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate password reset token and send instructions
 */
export const forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.deletedAt) {
      // Return 200 OK even if not found to prevent user enumeration
      res.status(200).json({
        success: true,
        message: 'If the email matches an account, reset instructions have been sent.',
      });
      return;
    }

    // Generate random crypto reset token
    const rawResetToken = crypto.randomBytes(32).toString('hex');
    const hashedResetToken = crypto.createHash('sha256').update(rawResetToken).digest('hex');
    
    // Set expiry to 1 hour from now
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000);

    // Save to DB
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: hashedResetToken,
        resetPasswordExpires: resetExpires,
      },
    });

    // Mock reset email link
    const resetUrl = `http://localhost:5173/reset-password/${rawResetToken}`;
    await sendEmail({
      to: user.email,
      subject: 'PropX - Password Reset Link Request',
      text: `To reset your account password, click on this link: ${resetUrl}`,
      html: `<p>To reset your account password, click <a href="${resetUrl}">here</a>.</p>`,
    });

    res.status(200).json({
      success: true,
      message: 'If the email matches an account, reset instructions have been sent.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset password using verification token
 */
export const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find valid token user
    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new AuthError('Token is invalid or has expired', 400);
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update password, clear token, and increment tokenVersion (revokes all other active sessions)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
        tokenVersion: { increment: 1 },
      },
    });

    res.status(200).json({
      success: true,
      message: 'Password reset was successful. You may now log in.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Accept invitation using token
 */
export const acceptInvitation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token } = req.params;
    const { password, firstName, lastName } = req.body;

    const user = await prisma.user.findUnique({
      where: { invitationToken: token },
    });

    if (!user || user.deletedAt) {
      throw new AuthError('Invitation link is invalid or has been revoked', 400);
    }

    if (user.invitationExpires && user.invitationExpires < new Date()) {
      throw new AuthError('Invitation link has expired', 400);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update user profile, status, and clear invitation token
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        firstName: firstName || user.firstName,
        lastName: lastName || user.lastName,
        status: 'ACTIVE',
        invitationToken: null,
        invitationExpires: null,
      },
    });

    // Sign session tokens
    const accessToken = generateAccessToken(updatedUser);
    const refreshToken = generateRefreshToken(updatedUser);

    setRefreshTokenCookie(res, refreshToken);

    res.status(200).json({
      success: true,
      data: {
        accessToken,
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          role: updatedUser.role,
          organizationId: updatedUser.organizationId,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
