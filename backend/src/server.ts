import app from './app';
import prisma from './config/database';

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.info(`[Server] PropX Backend listening on port ${PORT} in ${process.env.NODE_ENV} mode`);
});

// Daily summaries background task scheduler
import notificationService from './services/notificationService';

const runDailySummaries = async () => {
  try {
    const orgs = await prisma.organization.findMany({
      select: { id: true },
    });
    for (const org of orgs) {
      await notificationService.sendDailySummary(org.id);
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Failed to run daily summaries background task:', err);
  }
};

// Run every 24 hours
setInterval(runDailySummaries, 24 * 60 * 60 * 1000);

// In local development, execute after 5 seconds of uptime to verify mail delivery
if (process.env.NODE_ENV !== 'production') {
  setTimeout(() => {
    // eslint-disable-next-line no-console
    console.info('[Server] Bootstrapping initial development Daily Summary check...');
    runDailySummaries();
  }, 5000);
}

import whatsappService from './services/whatsappService';

// Background retry loop for WhatsApp dispatches (runs every 60 seconds)
setInterval(() => {
  whatsappService.retryFailedMessages();
}, 60000);

// Handle graceful shutdown
const gracefulShutdown = async () => {
  // eslint-disable-next-line no-console
  console.info('[Server] Shutting down server gracefully...');
  server.close(async () => {
    // eslint-disable-next-line no-console
    console.info('[Server] HTTP server closed.');
    await prisma.$disconnect();
    // eslint-disable-next-line no-console
    console.info('[Server] Prisma database disconnected.');
    process.exit(0);
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
