import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable } from '@nestjs/common';
import { EmailService } from '../email/email.service';
import { queueName } from 'src/common/constants/queueName';

@Injectable()
@Processor(queueName.MAIL)
export class MailConsumer extends WorkerHost {
  constructor(private readonly emailService: EmailService) {
    super();
  }
  async process(job: Job<any>): Promise<void> {
    switch (job.name) {
      case 'sendForgotPasswordEmail':
        const { user, otp } = job.data;
        await this.emailService.sendForgotPasswordEmail(user, otp);
        break;
      case 'sendOrderConfirmationEmail':
        const { user: orderUser, order } = job.data;
        await this.emailService.sendOrderConfirmationEmail(orderUser, order);
        break;
      default:
        throw new Error(`Unknown job name: ${job.name}`);
    }
  }
}
