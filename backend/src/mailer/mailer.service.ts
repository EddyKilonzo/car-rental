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
  /**
   * Initializes the nodemailer transporter with configuration from environment variables.
   */

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
  /**
   * Renders an EJS template with the provided data.
   * @param templateName Name of the template file (without extension).
   * @param data Data to be injected into the template.
   * @returns Rendered HTML string.
   */
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
  /**
   * Sends a welcome email to the user after registration.
   * @param userData User information including name and email.
   * @returns Promise resolving to the sent message info.
   */

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
  /**
   * Sends an agent application email to the applicant.
   * @param applicationData Application data including name, email, application ID, and date.
   * @returns Promise resolving to the sent message info.
   */

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
  /**
   * Sends a response to the agent application.
   * @param responseData Response data including name, email, status, and reason (if denied).
   * @returns Promise resolving to the sent message info.
   */
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
  /**
   * Sends a booking confirmation email to the customer.
   * @param bookingData Booking information including customer details, booking ID, dates, vehicle details, and agent contact.
   * @returns Promise resolving to the sent message info.
   */
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
  /**
   * Sends a password reset email with a reset code.
   * @param emailData Email data including email address, name, and reset code.
   * @returns Promise resolving to the sent message info.
   */
  async sendPasswordResetEmail(emailData: {
    email: string;
    name: string;
    resetCode: string;
  }): Promise<SentMessageInfo> {
    const html = this.renderTemplate('password-reset', {
      name: emailData.name,
      email: emailData.email,
      resetCode: emailData.resetCode,
    });
    return this.sendEmail(
      emailData.email,
      '🔐 Password Reset Code - CarRental',
      html,
    );
  }

  /**
   * Sends all email templates for testing purposes.
   * @returns Promise resolving to the sent message info.
   */
  async sendAllEmailTemplates(): Promise<void> {
    console.log('🚀 Starting to send all email templates...\n');

    try {
      // Test Welcome Email
      await this.sendWelcomeEmail({
        name: 'Eddy Max',
        email: 'eddymax3715@gmail.com',
      });
      console.log('✅ Welcome email sent successfully!');

      // Test Booking Confirmed Email
      await this.sendBookingConfirmationEmail({
        customerName: 'Eddy Max',
        customerEmail: 'eddymax3715@gmail.com',
        bookingId: 'TEST-BOOKING-123',
        pickupDate: '2025-01-15',
        returnDate: '2025-01-20',
        totalPrice: 25000,
        pickupLocation: 'Nairobi Airport',
        vehicleMake: 'Toyota',
        vehicleModel: 'Camry',
        vehicleYear: 2022,
        licensePlate: 'KCA 123A',
        vehicleColor: 'Silver',
        fuelType: 'Petrol',
        agentName: 'John Doe',
        agentEmail: 'john.doe@example.com',
        agentPhone: '+254 700 000 000',
      });
      console.log('✅ Booking confirmed email sent successfully!');

      // Test Agent Application Email
      await this.sendAgentApplicationEmail({
        name: 'Eddy Max',
        email: 'eddymax3715@gmail.com',
        applicationId: 'APP-123',
        applicationDate: '2025-01-15',
      });
      console.log('✅ Agent application email sent successfully!');

      // Test Agent Response Approved Email
      await this.sendAgentApplicationResponse({
        name: 'Eddy Max',
        email: 'eddymax3715@gmail.com',
        status: 'Approved',
      });
      console.log('✅ Agent response approved email sent successfully!');

      // Test Agent Response Denied Email
      await this.sendAgentApplicationResponse({
        name: 'Eddy Max',
        email: 'eddymax3715@gmail.com',
        status: 'Denied',
        reason: 'Insufficient documentation provided',
      });
      console.log('✅ Agent response denied email sent successfully!');

      // Test Password Reset Email
      await this.sendPasswordResetEmail({
        name: 'Eddy Max',
        email: 'eddymax3715@gmail.com',
        resetCode: '123456',
      });
      console.log('✅ Password reset email sent successfully!');

      console.log('\n🎉 All test emails sent successfully!');
      console.log('📧 Check your email: eddymax3715@gmail.com');
    } catch (error) {
      console.error('\n💥 Error sending test emails:', error);
      throw error;
    }
  }
}
