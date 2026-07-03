import { Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '../config/database';
import { AuthenticatedRequest } from '../middlewares/auth';
import { sendEmail } from '../services/mailService';
import { UserRole, UserStatus } from '@prisma/client';

class OrgError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, OrgError.prototype);
  }
}

/**
 * Get current organization details
 */
export const getOrganization = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const orgId = req.user?.organizationId;
    if (!orgId) {
      throw new OrgError('User is not associated with an organization', 400);
    }

    const org = await prisma.organization.findUnique({
      where: { id: orgId },
    });

    if (!org || org.deletedAt) {
      throw new OrgError('Organization not found or has been deleted', 404);
    }

    res.status(200).json({
      success: true,
      data: org,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update current organization details
 */
export const updateOrganization = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const orgId = req.user?.organizationId;
    if (!orgId) {
      throw new OrgError('User is not associated with an organization', 400);
    }

    const { name, slug } = req.body;

    if (slug) {
      // Ensure slug uniqueness
      const existing = await prisma.organization.findUnique({ where: { slug } });
      if (existing && existing.id !== orgId) {
        throw new OrgError('Organization URL slug is already taken', 400);
      }
    }

    const updatedOrg = await prisma.organization.update({
      where: { id: orgId },
      data: {
        name,
        slug,
      },
    });

    res.status(200).json({
      success: true,
      data: updatedOrg,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List all members of the organization
 */
export const getMembers = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const orgId = req.user?.organizationId;
    if (!orgId) {
      throw new OrgError('User is not associated with an organization', 400);
    }

    const members = await prisma.user.findMany({
      where: {
        organizationId: orgId,
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    res.status(200).json({
      success: true,
      data: members,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Invite a new member to the organization
 */
export const inviteMember = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const orgId = req.user?.organizationId;
    if (!orgId) {
      throw new OrgError('User is not associated with an organization', 400);
    }

    const { email, firstName, lastName, role } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser && !existingUser.deletedAt) {
      throw new OrgError('A user with this email address already exists', 400);
    }

    // Generate secure random invitation token
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 Hours expiry

    // Generate strong temporary password hash (cleared upon invite accept)
    const salt = await bcrypt.genSalt(10);
    const tempPassword = await bcrypt.hash(crypto.randomBytes(24).toString('hex'), salt);

    let newUser;
    if (existingUser && existingUser.deletedAt) {
      // Re-create soft-deleted user
      newUser = await prisma.user.update({
        where: { email },
        data: {
          password: tempPassword,
          firstName,
          lastName,
          role: role as UserRole,
          status: 'INVITED',
          organizationId: orgId,
          invitationToken: token,
          invitationExpires: expires,
          deletedAt: null,
        },
      });
    } else {
      newUser = await prisma.user.create({
        data: {
          email,
          password: tempPassword,
          firstName,
          lastName,
          role: role as UserRole,
          status: 'INVITED',
          organizationId: orgId,
          invitationToken: token,
          invitationExpires: expires,
        },
      });
    }

    // Print link out to development logs
    const inviteUrl = `http://localhost:5173/accept-invitation/${token}`;
    await sendEmail({
      to: email,
      subject: 'PropX - Join Your Property Team',
      text: `You have been invited to join PropX organization. Accept invitation and choose your password at: ${inviteUrl}`,
      html: `<p>You have been invited to join PropX. Click <a href="${inviteUrl}">here</a> to accept and set up your password.</p>`,
    });

    res.status(201).json({
      success: true,
      data: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Modify role of an organization member
 */
export const updateMemberRole = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const orgId = req.user?.organizationId;
    if (!orgId) {
      throw new OrgError('User is not associated with an organization', 400);
    }

    const { id } = req.params;
    const { role } = req.body;

    const member = await prisma.user.findFirst({
      where: {
        id,
        organizationId: orgId,
        deletedAt: null,
      },
    });

    if (!member) {
      throw new OrgError('Team member not found or is outside your organization', 404);
    }

    if (member.id === req.user?.id) {
      throw new OrgError('You cannot change your own role', 400);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role: role as UserRole },
    });

    res.status(200).json({
      success: true,
      data: {
        id: updated.id,
        email: updated.email,
        role: updated.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle status of a member (Deactivate / Reactivate)
 */
export const updateMemberStatus = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const orgId = req.user?.organizationId;
    if (!orgId) {
      throw new OrgError('User is not associated with an organization', 400);
    }

    const { id } = req.params;
    const { status } = req.body; // ACTIVE or INACTIVE

    const member = await prisma.user.findFirst({
      where: {
        id,
        organizationId: orgId,
        deletedAt: null,
      },
    });

    if (!member) {
      throw new OrgError('Team member not found or is outside your organization', 404);
    }

    if (member.id === req.user?.id) {
      throw new OrgError('You cannot deactivate/activate your own account', 400);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        status: status as UserStatus,
        // Invalidate sessions on deactivation by bumping tokenVersion
        ...(status === 'INACTIVE' && { tokenVersion: { increment: 1 } }),
      },
    });

    res.status(200).json({
      success: true,
      data: {
        id: updated.id,
        email: updated.email,
        status: updated.status,
      },
    });
  } catch (error) {
    next(error);
  }
};
