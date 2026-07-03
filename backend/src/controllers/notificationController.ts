import { Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AuthenticatedRequest } from '../middlewares/auth';
import { notificationService } from '../services/notificationService';

class NotificationError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, NotificationError.prototype);
  }
}

/**
 * Get all notifications for the authenticated user
 */
export const getNotifications = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new NotificationError('Unauthenticated user context', 401);
    }

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get the count of unread notifications
 */
export const getUnreadCount = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new NotificationError('Unauthenticated user context', 401);
    }

    const count = await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    res.status(200).json({
      success: true,
      data: { count },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark a specific notification as read
 */
export const markRead = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      throw new NotificationError('Unauthenticated user context', 401);
    }

    const notif = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notif || notif.userId !== userId) {
      throw new NotificationError('Notification record not found or inaccessible', 404);
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark all notifications for the user as read
 */
export const markAllRead = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new NotificationError('Unauthenticated user context', 401);
    }

    const updatedInfo = await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: { isRead: true },
    });

    res.status(200).json({
      success: true,
      data: {
        count: updatedInfo.count,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Trigger daily summary pipeline report manually
 */
export const triggerDailySummary = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const orgId = req.user?.organizationId;
    if (!orgId) {
      throw new NotificationError('User is not associated with an organization', 400);
    }

    await notificationService.sendDailySummary(orgId);

    res.status(200).json({
      success: true,
      message: 'Daily pipeline summary report has been triggered successfully',
    });
  } catch (error) {
    next(error);
  }
};
