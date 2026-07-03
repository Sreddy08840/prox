import axios from 'axios';
import prisma from '../config/database';

interface AxiosErrorLike {
  response?: {
    data?: {
      error?: {
        message?: string;
      };
    };
  };
}

class WhatsAppService {
  private get apiConfig() {
    return {
      token: process.env.WHATSAPP_TOKEN || 'mock_token',
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || 'mock_number_id',
    };
  }

  /**
   * Send a WhatsApp message to a recipient
   */
  async sendMessage(to: string, text: string): Promise<boolean> {
    const { token, phoneNumberId } = this.apiConfig;

    const sanitizedTo = to.replace(/[\s-+]/g, '');

    // Bypass integration if no tokens configured
    if (!token || token === 'mock_token' || token.startsWith('your_')) {
      // eslint-disable-next-line no-console
      console.info(`
============================================================
[MOCK WHATSAPP OUTBOUND SENT]
To:      ${sanitizedTo}
Message: ${text}
============================================================
      `);
      return true;
    }

    try {
      const response = await axios.post(
        `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: sanitizedTo,
          type: 'text',
          text: {
            preview_url: false,
            body: text,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        },
      );

      return response.status === 200 || response.status === 201;
    } catch (err) {
      const errorMsg = (err as AxiosErrorLike).response?.data?.error?.message || (err as Error).message;
      // eslint-disable-next-line no-console
      console.error(`[WhatsApp Service] Message dispatch failed to ${sanitizedTo}:`, errorMsg);

      // Log failure to retry queue
      await prisma.failedMessage.create({
        data: {
          recipientPhone: sanitizedTo,
          content: text,
          errorMsg,
          attempts: 1,
          status: 'FAILED',
        },
      });

      return false;
    }
  }

  /**
   * Retrieve and retry sending failed messages
   */
  async retryFailedMessages(): Promise<void> {
    try {
      const failed = await prisma.failedMessage.findMany({
        where: {
          status: { in: ['FAILED', 'RETRYING'] },
          attempts: { lt: 3 },
        },
      });

      if (failed.length === 0) return;

      // eslint-disable-next-line no-console
      console.info(`[WhatsApp Service] Retrying ${failed.length} failed message(s)...`);

      for (const msg of failed) {
        const nextAttempt = msg.attempts + 1;

        // Mark as retrying
        await prisma.failedMessage.update({
          where: { id: msg.id },
          data: {
            status: 'RETRYING',
            attempts: nextAttempt,
          },
        });

        // Try dispatching
        const success = await this.sendMessageDirectly(msg.recipientPhone, msg.content);

        if (success) {
          await prisma.failedMessage.update({
            where: { id: msg.id },
            data: { status: 'SENT' },
          });
        } else {
          await prisma.failedMessage.update({
            where: { id: msg.id },
            data: {
              status: nextAttempt >= 3 ? 'PERMANENT_FAILURE' : 'FAILED',
            },
          });
        }
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[WhatsApp Service] Background retry error:', err);
    }
  }

  /**
   * Helper to send without registering a retry loop in case of failure
   */
  private async sendMessageDirectly(to: string, text: string): Promise<boolean> {
    const { token, phoneNumberId } = this.apiConfig;
    if (!token || token === 'mock_token' || token.startsWith('your_')) return true;

    try {
      const response = await axios.post(
        `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to,
          type: 'text',
          text: { body: text },
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        },
      );
      return response.status === 200 || response.status === 201;
    } catch (_err) {
      return false;
    }
  }
}

export const whatsappService = new WhatsAppService();
export default whatsappService;
