import nodemailer from 'nodemailer';
import { env } from './env.js';

let transporter = null;

export function isSmtpConfigured() {
  return Boolean(env.smtp.host && env.smtp.user && env.smtp.pass);
}

export function getMailTransporter() {
  if (!isSmtpConfigured()) {
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.secure,
      auth: {
        user: env.smtp.user,
        pass: env.smtp.pass,
      },
    });
  }

  return transporter;
}

export async function verifySmtpConnection() {
  const client = getMailTransporter();
  if (!client) {
    return { configured: false, verified: false };
  }
  await client.verify();
  return { configured: true, verified: true };
}

export async function sendMail({ to, subject, html, text }) {
  const client = getMailTransporter();
  if (!client) {
    throw new Error('SMTP is not configured. Please set SMTP_HOST, SMTP_USER, and SMTP_PASS in backend/.env.');
  }

  return client.sendMail({
    from: `"${env.smtp.fromName}" <${env.smtp.fromEmail}>`,
    to,
    subject,
    html,
    text,
  });
}
