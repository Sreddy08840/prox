/**
 * Mock Mailer Service
 * Implements clean interface to print email messages to development console.
 */
export interface SendMailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export const sendEmail = async (options: SendMailOptions): Promise<void> => {
  // In production, configure nodemailer or SendGrid / AWS SES here
  // For local development foundation:
  // eslint-disable-next-line no-console
  console.info(`
============================================================
[MOCK EMAIL SENT]
To:      ${options.to}
Subject: ${options.subject}
Message: ${options.text}
============================================================
  `);
};
