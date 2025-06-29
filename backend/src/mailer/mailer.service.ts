import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { SentMessageInfo } from 'nodemailer';
import * as ejs from 'ejs';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class MailerService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('MAIL_HOST') || 'smtp.gmail.com',
      port: parseInt(this.configService.get<string>('MAIL_PORT') || '587'),
      secure: this.configService.get<string>('MAIL_SECURE') === 'true',
      auth: {
        user: this.configService.get<string>('MAIL_USER') || 'carrent@info.com',
        pass:
          this.configService.get<string>('MAIL_PASSWORD') ||
          'your-app-password',
      },
    });
  }

  private renderTemplate(
    templateName: string,
    data: Record<string, any>,
  ): string {
    // Use process.cwd() to get the project root and navigate to templates
    const templatePath = path.join(
      process.cwd(),
      'src',
      'mailer',
      'templates',
      `${templateName}.ejs`,
    );

    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template ${templateName} not found at ${templatePath}`);
    }

    const template = fs.readFileSync(templatePath, 'utf8');
    return ejs.render(template, data as ejs.Data);
  }

  private async sendEmail(
    to: string,
    subject: string,
    html: string,
  ): Promise<SentMessageInfo> {
    const mailOptions = {
      from:
        this.configService.get<string>('MAIL_FROM') ||
        'CarRental <carrent@info.com>',
      to,
      subject,
      html,
    };

    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const result = await this.transporter.sendMail(mailOptions);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      console.log('Email sent successfully:', result.messageId);

      return result;
    } catch (error: unknown) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  async sendWelcomeEmail(userData: {
    name: string;
    email: string;
  }): Promise<SentMessageInfo> {
    const html = this.renderTemplate('welcome', {
      name: userData.name,
      email: userData.email,
      loginUrl: `${this.configService.get<string>('FRONTEND_URL') || 'http://localhost:4200'}/login`,
    });
    return this.sendEmail(userData.email, 'Welcome to CarRental! 🚗', html);
  }

  async sendAgentApplicationEmail(applicationData: {
    name: string;
    email: string;
    applicationId: string;
    applicationDate: string;
  }): Promise<SentMessageInfo> {
    const html = this.renderTemplate('agent-application', {
      name: applicationData.name,
      email: applicationData.email,
      applicationId: applicationData.applicationId,
      applicationDate: applicationData.applicationDate,
    });
    return this.sendEmail(
      applicationData.email,
      'Agent Application Received - CarRental',
      html,
    );
  }

  async sendAgentApplicationResponse(responseData: {
    name: string;
    email: string;
    status: 'Approved' | 'Denied';
    reason?: string;
  }): Promise<SentMessageInfo> {
    const html = this.renderTemplate('agent-response', {
      name: responseData.name,
      email: responseData.email,
      status: responseData.status,
      reason: responseData.reason,
      dashboardUrl: `${this.configService.get<string>('FRONTEND_URL') || 'http://localhost:4200'}/agent/dashboard`,
    });
    const subject =
      responseData.status === 'Approved'
        ? '🎉 Agent Application Approved - CarRental'
        : 'Agent Application Update - CarRental';
    return this.sendEmail(responseData.email, subject, html);
  }

  async sendBookingConfirmationEmail(bookingData: {
    customerName: string;
    customerEmail: string;
    bookingId: string;
    pickupDate: string;
    returnDate: string;
    totalPrice: number;
    pickupLocation: string;
    vehicleMake: string;
    vehicleModel: string;
    vehicleYear: number;
    licensePlate: string;
    vehicleColor: string;
    fuelType: string;
    agentName: string;
    agentEmail: string;
    agentPhone?: string;
  }): Promise<SentMessageInfo> {
    const html = this.renderTemplate('booking-confirmed', {
      customerName: bookingData.customerName,
      customerEmail: bookingData.customerEmail,
      bookingId: bookingData.bookingId,
      pickupDate: bookingData.pickupDate,
      returnDate: bookingData.returnDate,
      totalPrice: bookingData.totalPrice.toFixed(2),
      pickupLocation: bookingData.pickupLocation,
      vehicleMake: bookingData.vehicleMake,
      vehicleModel: bookingData.vehicleModel,
      vehicleYear: bookingData.vehicleYear,
      licensePlate: bookingData.licensePlate,
      vehicleColor: bookingData.vehicleColor,
      fuelType: bookingData.fuelType,
      agentName: bookingData.agentName,
      agentEmail: bookingData.agentEmail,
      agentPhone: bookingData.agentPhone,
      bookingUrl: `${this.configService.get<string>('FRONTEND_URL') || 'http://localhost:4200'}/my-bookings`,
    });
    return this.sendEmail(
      bookingData.customerEmail,
      '🎉 Your Car Rental is Confirmed!',
      html,
    );
  }

  async sendPasswordResetEmail(emailData: {
    email: string;
    name: string;
    resetCode: string;
  }): Promise<SentMessageInfo> {
    const html = this.renderTemplate('password-reset', {
      name: emailData.name,
      resetCode: emailData.resetCode,
    });
    return this.sendEmail(
      emailData.email,
      '🔐 Password Reset Code - CarRental',
      html,
    );
  }
}
