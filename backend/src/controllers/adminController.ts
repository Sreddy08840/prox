import { Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AuthenticatedRequest } from '../middlewares/auth';
import { UserRole, UserStatus, ProjectStatus } from '@prisma/client';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { whatsappService } from '../services/whatsappService';

class AdminError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, AdminError.prototype);
  }
}

/**
 * Verify current user has ADMIN credentials
 */
const verifyAdminAccess = (req: AuthenticatedRequest) => {
  if (req.user?.role !== 'ADMIN') {
    throw new AdminError('Access denied. Administrator privileges required.', 403);
  }
  if (!req.user.organizationId) {
    throw new AdminError('User context has no organization details.', 400);
  }
  return req.user.organizationId;
};

// ==========================================
// 1. ORGANIZATIONS MANAGEMENT
// ==========================================
export const getOrganizations = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    verifyAdminAccess(req);

    const orgs = await prisma.organization.findMany({
      where: { deletedAt: null },
      include: {
        _count: {
          select: { users: true, projects: true, leads: true },
        },
      },
    });

    res.status(200).json({ success: true, data: orgs });
  } catch (error) {
    next(error);
  }
};

export const updateOrganization = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const activeOrgId = verifyAdminAccess(req);
    const { id } = req.params;
    const { name, slug } = req.body;

    // Organization admins can only update their own organization
    if (id !== activeOrgId) {
      throw new AdminError('Unauthorized to update this organization record.', 403);
    }

    const updated = await prisma.organization.update({
      where: { id },
      data: { name, slug },
    });

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 2. PROJECTS MANAGEMENT
// ==========================================
export const getProjects = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const orgId = verifyAdminAccess(req);

    const projects = await prisma.project.findMany({
      where: { organizationId: orgId, deletedAt: null },
      include: {
        _count: { select: { units: true } },
      },
    });

    res.status(200).json({ success: true, data: projects });
  } catch (error) {
    next(error);
  }
};

export const createProject = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const orgId = verifyAdminAccess(req);
    const { name, description, address, city, status } = req.body;

    const newProject = await prisma.project.create({
      data: {
        name,
        description,
        address,
        city,
        status: (status as ProjectStatus) || 'PLANNING',
        organizationId: orgId,
      },
    });

    res.status(201).json({ success: true, data: newProject });
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const orgId = verifyAdminAccess(req);
    const { id } = req.params;
    const { name, description, address, city, status } = req.body;

    const project = await prisma.project.findFirst({
      where: { id, organizationId: orgId, deletedAt: null },
    });

    if (!project) throw new AdminError('Project record not found.', 404);

    const updated = await prisma.project.update({
      where: { id },
      data: { name, description, address, city, status: status as ProjectStatus },
    });

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

export const deleteProject = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const orgId = verifyAdminAccess(req);
    const { id } = req.params;

    const project = await prisma.project.findFirst({
      where: { id, organizationId: orgId, deletedAt: null },
    });

    if (!project) throw new AdminError('Project record not found.', 404);

    await prisma.project.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    res.status(200).json({ success: true, message: 'Project record deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 3. USERS & ROLES MANAGEMENT
// ==========================================
export const getUsers = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const orgId = verifyAdminAccess(req);

    const users = await prisma.user.findMany({
      where: { organizationId: orgId, deletedAt: null },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    res.status(200).json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

export const createUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const orgId = verifyAdminAccess(req);
    const { email, password, firstName, lastName, role } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new AdminError('Email address already registered.', 400);

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password || 'TemporaryPassword123', salt);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: (role as UserRole) || 'VIEWER',
        status: 'ACTIVE',
        organizationId: orgId,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const orgId = verifyAdminAccess(req);
    const { id } = req.params;
    const { firstName, lastName, role, status } = req.body;

    const user = await prisma.user.findFirst({
      where: { id, organizationId: orgId, deletedAt: null },
    });

    if (!user) throw new AdminError('User profile not found.', 404);
    if (user.id === req.user?.id && role && role !== user.role) {
      throw new AdminError('Administrators cannot revoke their own admin permissions.', 400);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        firstName,
        lastName,
        role: role as UserRole,
        status: status as UserStatus,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
      },
    });

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 4. API KEYS MANAGEMENT
// ==========================================
export const getApiKeys = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const orgId = verifyAdminAccess(req);

    const apiKeys = await prisma.apiKey.findMany({
      where: { organizationId: orgId },
      select: {
        id: true,
        name: true,
        key: true, // Displaying masked values in frontend is done by key slice
        isActive: true,
        createdAt: true,
      },
    });

    res.status(200).json({ success: true, data: apiKeys });
  } catch (error) {
    next(error);
  }
};

export const createApiKey = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const orgId = verifyAdminAccess(req);
    const { name } = req.body;

    if (!name) throw new AdminError('API key label name is required.', 400);

    // Generate random secure token key
    const rawKey = 'pk_' + crypto.randomBytes(24).toString('hex');

    const apiKey = await prisma.apiKey.create({
      data: {
        name,
        key: rawKey,
        organizationId: orgId,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        id: apiKey.id,
        name: apiKey.name,
        key: rawKey, // Render raw key to user only once!
        createdAt: apiKey.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteApiKey = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const orgId = verifyAdminAccess(req);
    const { id } = req.params;

    const apiKey = await prisma.apiKey.findFirst({
      where: { id, organizationId: orgId },
    });

    if (!apiKey) throw new AdminError('API key not found.', 404);

    await prisma.apiKey.delete({ where: { id } });

    res.status(200).json({ success: true, message: 'API key revoked successfully' });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 5. SYSTEM SETTINGS MANAGEMENT
// ==========================================
export const getSystemSettings = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    verifyAdminAccess(req);

    const settings = await prisma.systemSetting.findMany();
    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
};

export const updateSystemSettings = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    verifyAdminAccess(req);
    const { key, value, description } = req.body;

    if (!key) throw new AdminError('Setting key identifier is required.', 400);

    const setting = await prisma.systemSetting.upsert({
      where: { key },
      update: { value, description },
      create: { key, value, description },
    });

    res.status(200).json({ success: true, data: setting });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 6. AUDIT TRAIL LOGGING
// ==========================================
export const getAuditLogs = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const orgId = verifyAdminAccess(req);

    const logs = await prisma.auditLog.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
    });

    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 7. FAILED DISPATCH LOGS & RETRY
// ==========================================
export const getFailedMessages = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    verifyAdminAccess(req);

    const messages = await prisma.failedMessage.findMany({
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ success: true, data: messages });
  } catch (error) {
    next(error);
  }
};

export const retryFailedMessage = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    verifyAdminAccess(req);
    const { id } = req.params;

    const msg = await prisma.failedMessage.findUnique({
      where: { id },
    });

    if (!msg) throw new AdminError('Failed message record not found.', 404);

    // Run retry logic
    const success = await whatsappService.sendMessage(msg.recipientPhone, msg.content);

    if (success) {
      const updated = await prisma.failedMessage.update({
        where: { id },
        data: { status: 'SENT', attempts: msg.attempts + 1 },
      });
      res.status(200).json({ success: true, message: 'Message retried and delivered successfully.', data: updated });
    } else {
      const updated = await prisma.failedMessage.update({
        where: { id },
        data: { attempts: msg.attempts + 1, status: msg.attempts + 1 >= 3 ? 'PERMANENT_FAILURE' : 'FAILED' },
      });
      res.status(202).json({ success: false, message: 'Message retry dispatch failed again.', data: updated });
    }
  } catch (error) {
    next(error);
  }
};
