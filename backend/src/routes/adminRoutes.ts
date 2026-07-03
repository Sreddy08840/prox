import { Router } from 'express';
import { protect } from '../middlewares/auth';
import {
  getOrganizations,
  updateOrganization,
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  getUsers,
  createUser,
  updateUser,
  getApiKeys,
  createApiKey,
  deleteApiKey,
  getSystemSettings,
  updateSystemSettings,
  getAuditLogs,
  getFailedMessages,
  retryFailedMessage,
} from '../controllers/adminController';

const router = Router();

// Organizations management
router.get('/organizations', protect, getOrganizations);
router.put('/organizations/:id', protect, updateOrganization);

// Projects management
router.get('/projects', protect, getProjects);
router.post('/projects', protect, createProject);
router.put('/projects/:id', protect, updateProject);
router.delete('/projects/:id', protect, deleteProject);

// Users and roles management
router.get('/users', protect, getUsers);
router.post('/users', protect, createUser);
router.put('/users/:id', protect, updateUser);

// API Keys management
router.get('/apikeys', protect, getApiKeys);
router.post('/apikeys', protect, createApiKey);
router.delete('/apikeys/:id', protect, deleteApiKey);

// System Settings
router.get('/settings', protect, getSystemSettings);
router.put('/settings', protect, updateSystemSettings);

// Audit logs
router.get('/audit-logs', protect, getAuditLogs);

// Failed dispatches / delivery log queue
router.get('/failed-messages', protect, getFailedMessages);
router.post('/failed-messages/:id/retry', protect, retryFailedMessage);

export default router;
