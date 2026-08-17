import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly from: string;

  constructor(private readonly config: ConfigService) {
    this.from = config.get<string>('email.from')!;
    this.transporter = nodemailer.createTransport({
      host: config.get<string>('email.smtpHost'),
      port: config.get<number>('email.smtpPort'),
      secure: config.get<number>('email.smtpPort') === 465,
      auth: {
        user: config.get<string>('email.smtpUser'),
        pass: config.get<string>('email.smtpPassword'),
      },
    });
  }

  private async send(to: string, subject: string, html: string): Promise<void> {
    try {
      await this.transporter.sendMail({ from: this.from, to, subject, html });
    } catch (err) {
      // Email failures should never throw out of an auth flow (e.g. don't
      // fail registration because the welcome email bounced) — log and
      // move on. The verification/reset TOKEN is already persisted in the
      // DB, so the user can request a resend.
      this.logger.error(`Failed to send email to ${to}: ${(err as Error).message}`);
    }
  }

  async sendVerificationEmail(to: string, token: string): Promise<void> {
    const link = `${this.appUrl()}/verify-email?token=${token}`;
    await this.send(
      to,
      'Verify your FlowLens AI email',
      `<p>Welcome to FlowLens AI. Confirm your email to get started:</p>
       <p><a href="${link}">${link}</a></p>
       <p>This link expires in 24 hours.</p>`,
    );
  }

  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    const link = `${this.appUrl()}/reset-password?token=${token}`;
    await this.send(
      to,
      'Reset your FlowLens AI password',
      `<p>We received a request to reset your password.</p>
       <p><a href="${link}">${link}</a></p>
       <p>This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>`,
    );
  }

  async sendPasswordChangedAlert(to: string): Promise<void> {
    await this.send(
      to,
      'Your FlowLens AI password was changed',
      `<p>Your password was just changed. If this wasn't you, reset your password immediately and contact support.</p>`,
    );
  }

  async sendTeamInviteEmail(to: string, orgName: string, inviterName: string, token: string): Promise<void> {
    const link = `${this.appUrl()}/invites/accept?token=${token}`;
    await this.send(
      to,
      `${inviterName} invited you to join ${orgName} on FlowLens AI`,
      `<p>${inviterName} has invited you to join <strong>${orgName}</strong> on FlowLens AI.</p>
       <p><a href="${link}">${link}</a></p>
       <p>This invite expires in 7 days.</p>`,
    );
  }

  private appUrl(): string {
    return this.config.get<string>('corsOrigins')?.[0] ?? 'http://localhost:3000';
  }
}
