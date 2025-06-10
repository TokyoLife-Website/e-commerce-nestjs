import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Mailgen from 'mailgen';
import { User } from '../users/entities/user.entity';
import { Order } from '../orders/entities/order.entity';
import { formatCurrency } from 'src/common/utils/formatCurrency';
import { generateOrderEmailTemplate } from './templates/order-confirmation.template';

@Injectable()
export class EmailService {
  private mailGenerator: Mailgen;
  constructor(
    private readonly configService: ConfigService,
    private readonly mailerService: MailerService,
  ) {
    this.mailGenerator = new Mailgen({
      theme: 'default',
      product: {
        name: 'Tokyolife Ecomerce',
        link: this.configService.get<string>('CLIENT_BASE_URL'),
        logo: this.configService.get<string>('LOGO'),
        copyright: 'Copyright © 2025 Tokyolife Ecomerce. All rights reserved.',
      },
    });
  }

  generateResetPasswordTemplate(user: User, otp: string) {
    const mailBody = {
      body: {
        title: `HI ${user.firstName.toUpperCase()} ${user.lastName.toUpperCase()}`,
        name: user.email,
        intro:
          'You have requested to reset your password. Here is your OTP code:',
        action: {
          instructions: 'Click the button below to copy your OTP:',
          button: {
            color: '#22BC66',
            text: otp,
            link: '',
          },
        },
        outro: `This link will expire in ${this.configService.get<string>('RESET_PASSWORD_TOKEN_EXPIRES')} minutes. Please ignore this email if you did not request a password change`,
        greeting: 'Dear',
        signature: 'Sincerely',
      },
    };
    return this.mailGenerator.generate(mailBody);
  }

  async sendForgotPasswordEmail(user: User, otp: string): Promise<void> {
    const html = this.generateResetPasswordTemplate(user, otp);
    await this.mailerService.sendMail({
      to: user.email,
      from: '"Support Team" <support@vaccineportal.com>',
      subject: 'Reset password',
      html,
    });
  }

  async sendOrderConfirmationEmail(user: User, order: Order): Promise<void> {
    const html = generateOrderEmailTemplate(order);
    await this.mailerService.sendMail({
      to: user.email,
      from: '"Support Team" <support@vaccineportal.com>',
      subject: `Order Confirmation - Order #${order.code}`,
      html,
    });
  }
}
