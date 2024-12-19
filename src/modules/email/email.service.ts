import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Mailgen from 'mailgen';
import { User } from '../users/entities/user.entity';

@Injectable()
export class EmailService {
  private mailGenerator: Mailgen;
  constructor(
    private readonly configService: ConfigService,
    private readonly mailerService: MailerService,
  ) {
    this.mailGenerator = new Mailgen({
      theme: 'neopolitan',
      product: {
        name: 'Covid Tracker',
        link: this.configService.get<string>('CLIENT_BASE_URL'),
        logo: this.configService.get<string>('LOGO'),
        logoHeight: '150px',
        copyright: 'Copyright © 2024 Covid tracker. All rights reserved.',
      },
    });
  }

  generateResetPasswordTemplate(user: User, token: string) {
    const resetPasswordLink = `${this.configService.get<string>('CLIENT_BASE_URL')}/reset-password/${token}`;
    const mailBody = {
      body: {
        title: `HI ${user.firstName.toUpperCase()} ${user.lastName.toUpperCase()},`,
        intro: [
          'Forgot your password?',
          'We received a request to reset the password for your account.',
        ],
        action: {
          instructions: 'To reset the password, please click the button below:',
          button: {
            color: '#22BC66',
            text: 'Reset password your account',
            link: resetPasswordLink,
          },
        },
        outro:
          'This link will expire in 5 minutes. Please ignore this email if you did not request a password change',
        greeting: 'Dear',
        signature: 'Sincerely',
      },
    };
    return this.mailGenerator.generate(mailBody);
  }

  async sendForgotPasswordEmail(user: User, token: string): Promise<void> {
    const html = this.generateResetPasswordTemplate(user, token);
    await this.mailerService.sendMail({
      to: user.email,
      from: '"Support Team" <support@vaccineportal.com>',
      subject: 'Reset password',
      html,
    });
  }
}
