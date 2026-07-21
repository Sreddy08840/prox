import prisma from '../config/database';
import logger from '../utils/logger';
import { notificationService } from './notificationService';

class FollowUpSchedulerService {
  private timer: NodeJS.Timeout | null = null;

  /**
   * Start background scheduler loop
   */
  public start(intervalMinutes = 30): void {
    if (this.timer) {
      logger.warn('[FollowUp Scheduler] Scheduler is already running.');
      return;
    }

    logger.info(`[FollowUp Scheduler] Starting background follow-up drip engine (Interval: ${intervalMinutes} mins)...`);
    
    // Initial run after server boot
    setTimeout(() => {
      this.runDripCycle().catch(err => {
        logger.error(`[FollowUp Scheduler] Error in initial drip run: ${err instanceof Error ? err.message : String(err)}`);
      });
    }, 10000);

    this.timer = setInterval(() => {
      this.runDripCycle().catch(err => {
        logger.error(`[FollowUp Scheduler] Error in drip run cycle: ${err instanceof Error ? err.message : String(err)}`);
      });
    }, intervalMinutes * 60 * 1000);
  }

  /**
   * Stop background scheduler
   */
  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      logger.info('[FollowUp Scheduler] Stopped background follow-up scheduler.');
    }
  }

  /**
   * Run a single follow-up drip cycle
   */
  public async runDripCycle(): Promise<{ processedLeadsCount: number }> {
    logger.info('[FollowUp Scheduler] Running automated follow-up drip check...');
    
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

    // Find leads with no activity in 24 hours that are still active
    const dormantLeads = await prisma.lead.findMany({
      where: {
        status: { in: ['NEW', 'CONTACTED', 'QUALIFIED'] },
        updatedAt: { lt: cutoffTime },
        deletedAt: null,
      },
      include: {
        assignedUser: true,
        organization: true,
      },
      take: 50,
    });

    let processedCount = 0;

    for (const lead of dormantLeads) {
      try {
        // Create an automated follow-up activity
        await prisma.leadActivity.create({
          data: {
            leadId: lead.id,
            type: 'TASK',
            description: `Automated Drip Follow-up: Buyer ${lead.firstName} ${lead.lastName} has been silent for >24h. Triggered automated re-engagement reminder.`,
          },
        });

        // Notify assigned user if present
        if (lead.assignedUserId) {
          await notificationService.sendNotification(
            lead.assignedUserId,
            'Automated Follow-up SLA Warning',
            `Lead ${lead.firstName} ${lead.lastName} has been inactive for over 24 hours. Automated follow-up task created.`,
          );
        }

        // Touch the lead's updatedAt timestamp to prevent duplicate notifications in short cycles
        await prisma.lead.update({
          where: { id: lead.id },
          data: { updatedAt: new Date() },
        });

        processedCount++;
      } catch (err) {
        logger.error(`[FollowUp Scheduler] Failed to process dormant lead ${lead.id}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    logger.info(`[FollowUp Scheduler] Drip check complete. Processed ${processedCount} dormant leads.`);
    return { processedLeadsCount: processedCount };
  }
}

export const followUpSchedulerService = new FollowUpSchedulerService();
export default followUpSchedulerService;
