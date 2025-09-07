import nodemailer from 'nodemailer';

interface EmailConfig {
  service?: string;
  host?: string;
  port?: number;
  secure?: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private isConfigured = false;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const emailHost = process.env.EMAIL_HOST?.trim();
    const emailPort = process.env.EMAIL_PORT?.trim();
    const emailUser = process.env.EMAIL_USER?.trim();
    const emailPass = process.env.EMAIL_PASS?.trim();
    const emailService = process.env.EMAIL_SERVICE?.trim(); // e.g., 'gmail', 'outlook', etc.

    console.log('Email configuration check:');
    console.log('- EMAIL_HOST:', emailHost ? `✓ set: "${emailHost}"` : '✗ not set');
    console.log('- EMAIL_PORT:', emailPort ? `✓ set: "${emailPort}"` : '✗ not set');
    console.log('- EMAIL_USER:', emailUser ? `✓ set: "${emailUser}"` : '✗ not set');
    console.log('- EMAIL_PASS:', emailPass ? '✓ set (hidden)' : '✗ not set');
    console.log('- EMAIL_SERVICE:', emailService ? `✓ set: "${emailService}"` : '✗ not set');

    if (!emailUser || !emailPass) {
      console.warn('Email service not configured: EMAIL_USER and EMAIL_PASS environment variables are required');
      return;
    }

    try {
      const config: EmailConfig = {
        auth: {
          user: emailUser,
          pass: emailPass,
        }
      };

      // If using a well-known service like Gmail
      if (emailService) {
        config.service = emailService;
      } else if (emailHost) {
        // Custom SMTP configuration
        config.host = emailHost;
        config.port = emailPort ? parseInt(emailPort) : 587;
        config.secure = config.port === 465; // true for 465, false for other ports
      } else {
        throw new Error('Either EMAIL_SERVICE or EMAIL_HOST must be provided');
      }

      this.transporter = nodemailer.createTransport(config);
      this.isConfigured = true;

      // Verify configuration
      this.transporter.verify((error, success) => {
        if (error) {
          console.error('Email service configuration error:', error);
          this.isConfigured = false;
        } else {
          console.log('Email service is ready to send emails');
        }
      });
    } catch (error) {
      console.error('Failed to initialize email service:', error);
      this.isConfigured = false;
    }
  }

  async sendPasswordResetEmail(to: string, resetUrl: string): Promise<boolean> {
    console.log('Attempting to send email to:', to);
    console.log('Email service configured:', this.isConfigured);
    console.log('Transporter exists:', !!this.transporter);
    
    if (!this.isConfigured || !this.transporter) {
      console.error('Email service is not configured. Please set up EMAIL_USER and EMAIL_PASS environment variables.');
      return false;
    }

    const mailOptions = {
      from: {
        name: 'Motor Claims Platform',
        address: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@claims.com'
      },
      to: to,
      subject: 'Password Reset Request - Motor Claims Platform',
      html: this.generatePasswordResetHTML(resetUrl),
      text: this.generatePasswordResetText(resetUrl)
    };

    try {
      console.log('Sending email with options:', {
        from: mailOptions.from,
        to: mailOptions.to,
        subject: mailOptions.subject
      });
      const info = await this.transporter.sendMail(mailOptions);
      console.log('✓ Password reset email sent successfully:', info.messageId);
      return true;
    } catch (error) {
      console.error('✗ Failed to send password reset email:', error);
      return false;
    }
  }

  private generatePasswordResetHTML(resetUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset Request</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #0079F2; color: white; padding: 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 20px; }
            .button { display: inline-block; background: #0079F2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <h2>Reset Your Password</h2>
              <p>You have requested a password reset for your Motor Claims Platform account. Click the button below to create a new password:</p>
              
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </div>
              
              <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
              <p style="word-break: break-all; background: #f5f5f5; padding: 10px; border-radius: 3px;">${resetUrl}</p>
              
              <div class="warning">
                <p><strong>Security Notice:</strong></p>
                <ul>
                  <li>This link will expire in 1 hour for security reasons</li>
                  <li>If you didn't request this password reset, please ignore this email</li>
                  <li>Never share this link with anyone</li>
                </ul>
              </div>
            </div>
            <div class="footer">
              <p>This email was sent by Motor Claims Platform</p>
              <p>If you have questions, please contact our support team</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private generatePasswordResetText(resetUrl: string): string {
    return `
Password Reset Request - Motor Claims Platform

You have requested a password reset for your Motor Claims Platform account. 

To reset your password, click this link or copy it into your browser:
${resetUrl}

SECURITY NOTICE:
- This link will expire in 1 hour for security reasons
- If you didn't request this password reset, please ignore this email
- Never share this link with anyone

If you have questions, please contact our support team.

Motor Claims Platform
    `;
  }

  isReady(): boolean {
    return this.isConfigured;
  }
}

// Export a singleton instance
export const emailService = new EmailService();