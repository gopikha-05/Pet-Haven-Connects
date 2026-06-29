import nodemailer from 'nodemailer';
import SmtpSettings from '../models/SmtpSettings.js';

// Helper function to build transporter based on SMTP configuration
const getTransporterAndSettings = async () => {
  console.log('[EmailService] Using SMTP configuration.');
  let settings = await SmtpSettings.findOne({});
  
  if (!settings || settings.smtp_username === 'your-email@gmail.com') {
    console.warn('[EmailService] No SMTP settings found in database or placeholder detected. Using default configuration.');
    settings = {
      smtp_host: process.env.SMTP_HOST || 'smtp.gmail.com',
      smtp_port: parseInt(process.env.SMTP_PORT || '587'),
      smtp_username: process.env.SMTP_USER || 'gobi.obtl@gmail.com',
      smtp_password: process.env.SMTP_PASSWORD || 'ldjv yvkm frpk fsdd'
    };
  }

  console.log(`[EmailService] Creating SMTP transporter for host: ${settings.smtp_host}, port: ${settings.smtp_port}, user: ${settings.smtp_username}`);

  const transporter = nodemailer.createTransport({
    host: settings.smtp_host,
    port: settings.smtp_port,
    secure: settings.smtp_port === 465,
    auth: {
      user: settings.smtp_username,
      pass: settings.smtp_password,
    },
    tls: {
      rejectUnauthorized: false // Helps prevent SSL issues on local development
    }
  });

  return { transporter, settings };
};

/**
 * Reusable email sending helper.
 */
export const sendEmail = async ({ to, subject, text, html, attachments }) => {
  try {
    const { transporter, settings } = await getTransporterAndSettings();
    const mailOptions = {
      from: `"Pet Haven Connect" <${settings.smtp_username}>`,
      to,
      subject,
      text,
      html,
      attachments
    };
    const info = await transporter.sendMail(mailOptions);
    console.log(`[EmailService] SES/SMTP email sent successfully to ${to}. MessageID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`[EmailService] SES/SMTP email delivery failed to ${to}:`, error.message);
    throw error;
  }
};

export const sendVerificationEmail = async (toEmail, token, userName) => {
  try {
    const { transporter, settings } = await getTransporterAndSettings();
    const verificationUrl = `http://localhost:5173/verify-email/${token}`;

    const mailOptions = {
      from: `"PetHaven Connect" <${settings.smtp_username}>`,
      to: toEmail,
      subject: 'Verify Your Email - Pet Haven Connect',
      text: `Hello ${userName || 'there'},\n\nPlease verify your email to continue using PetHaven Connect.\n\nClick the link below to verify your email:\n\n${verificationUrl}\n\nThis link will expire in 24 hours.\n\nIf you did not create an account, please ignore this email.\n\nThank you,\nThe PetHaven Connect Team`,
      html: `
        <div style="background-color: #f1f5f9; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; min-height: 100%;">
          <div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
            
            <!-- Header Section -->
            <div style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); padding: 35px 40px; text-align: center; color: #ffffff;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">PetHaven Connect</h1>
              <p style="margin: 5px 0 0 0; font-size: 14px; color: #e0e7ff; font-weight: 500;">Connecting Hearts, Sheltering Lives</p>
            </div>

            <!-- Content Body -->
            <div style="padding: 40px; color: #334155;">
              <h2 style="margin-top: 0; margin-bottom: 15px; font-size: 20px; font-weight: 600; color: #0f172a;">Verify Your Email Address</h2>
              <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 25px;">
                Hello ${userName || 'there'}, please verify your email to continue using PetHaven Connect.
              </p>

              <!-- Verify Email Button -->
              <div style="text-align: center; margin-bottom: 25px;">
                <a href="${verificationUrl}" target="_blank" style="background-color: #4f46e5; color: #ffffff; padding: 14px 28px; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 12px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2), 0 2px 4px -1px rgba(79, 70, 229, 0.1);">
                  Verify Email
                </a>
              </div>

              <!-- Expiry Notice -->
              <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 12px; padding: 16px; margin-bottom: 25px;">
                <p style="font-size: 13px; color: #92400e; margin: 0; line-height: 1.5;">
                  <strong>⏰ This link will expire in 24 hours.</strong> Please verify your email before the link expires.
                </p>
              </div>

              <!-- Security Notice -->
              <div style="border-left: 4px solid #ef4444; background-color: #fef2f2; padding: 12px 16px; border-radius: 4px 8px 8px 4px;">
                <p style="font-size: 13px; color: #991b1b; margin: 0; line-height: 1.5;">
                  <strong>Security notice:</strong> If you did not create an account with PetHaven Connect, please ignore this email or contact support if you suspect unauthorized activity.
                </p>
              </div>

              <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-top: 25px; margin-bottom: 0;">
                Warmly,<br />
                <strong>The PetHaven Connect Team</strong>
              </p>
            </div>

            <!-- Footer Section -->
            <div style="background-color: #f8fafc; padding: 20px 40px; text-align: center; border-top: 1px solid #f1f5f9;">
              <p style="font-size: 12px; color: #94a3b8; margin: 0;">
                This is an automated security message. Please do not reply directly to this mail.
              </p>
              <p style="font-size: 11px; color: #cbd5e1; margin-top: 8px; margin-bottom: 0;">
                © 2026 PetHaven Connect. All rights reserved.
              </p>
            </div>

          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[EmailService] Verification email sent successfully to ${toEmail}. MessageID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[EmailService] Error sending verification email:', error);
    throw new Error(`Failed to send verification email: ${error.message}`);
  }
};

export const sendOTPEmail = async (toEmail, otp, userName) => {
  try {
    const { transporter, settings } = await getTransporterAndSettings();

    const mailOptions = {
      from: `"PetHaven Connect" <${settings.smtp_username}>`,
      to: toEmail,
      subject: 'Your Verification Code - Pet Haven Connect',
      text: `Hello ${userName || 'there'},\n\nYour verification code is:\n\n${otp}\n\nThis code expires in 5 minutes.\n\nIf you did not request this code, please ignore this email.\n\nThank you,\nThe PetHaven Connect Team`,
      html: `
        <div style="background-color: #f1f5f9; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; min-height: 100%;">
          <div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
            
            <!-- Header Section -->
            <div style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); padding: 35px 40px; text-align: center; color: #ffffff;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">PetHaven Connect</h1>
              <p style="margin: 5px 0 0 0; font-size: 14px; color: #e0e7ff; font-weight: 500;">Connecting Hearts, Sheltering Lives</p>
            </div>

            <!-- Content Body -->
            <div style="padding: 40px; color: #334155;">
              <h2 style="margin-top: 0; margin-bottom: 15px; font-size: 20px; font-weight: 600; color: #0f172a;">Your Verification Code</h2>
              <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 25px;">
                Hello ${userName || 'there'}, your verification code is below.
              </p>

              <!-- Verification Code Display -->
              <div style="background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%); border: 2px dashed #cbd5e1; border-radius: 16px; padding: 30px; margin-bottom: 25px; text-align: center;">
                <p style="font-size: 14px; color: #64748b; margin: 0 0 10px 0; font-weight: 500;">Verification Code</p>
                <div style="font-size: 36px; font-weight: 700; color: #0f172a; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                  ${otp}
                </div>
              </div>

              <!-- Expiry Notice -->
              <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 12px; padding: 16px; margin-bottom: 25px;">
                <p style="font-size: 13px; color: #92400e; margin: 0; line-height: 1.5;">
                  <strong>⏰ This code expires in 5 minutes.</strong> Please use it before it expires.
                </p>
              </div>

              <!-- Security Notice -->
              <div style="border-left: 4px solid #ef4444; background-color: #fef2f2; padding: 12px 16px; border-radius: 4px 8px 8px 4px;">
                <p style="font-size: 13px; color: #991b1b; margin: 0; line-height: 1.5;">
                  <strong>Security notice:</strong> If you did not request this code, please ignore this email or contact support if you suspect unauthorized activity.
                </p>
              </div>

              <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-top: 25px; margin-bottom: 0;">
                Warmly,<br />
                <strong>The PetHaven Connect Team</strong>
              </p>
            </div>

            <!-- Footer Section -->
            <div style="background-color: #f8fafc; padding: 20px 40px; text-align: center; border-top: 1px solid #f1f5f9;">
              <p style="font-size: 12px; color: #94a3b8; margin: 0;">
                This is an automated security message. Please do not reply directly to this mail.
              </p>
              <p style="font-size: 11px; color: #cbd5e1; margin-top: 8px; margin-bottom: 0;">
                © 2026 PetHaven Connect. All rights reserved.
              </p>
            </div>

          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[EmailService] OTP email sent successfully to ${toEmail}. MessageID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[EmailService] Error sending OTP email:', error);
    throw new Error(`Failed to send OTP email: ${error.message}`);
  }
};

export const sendApprovalEmail = async (toEmail, userName, role) => {
  try {
    const { transporter, settings } = await getTransporterAndSettings();
    const roleLabel = role === 'shelter' ? 'Shelter Staff' : 'Veterinarian';

    const mailOptions = {
      from: `"PetHaven Connect" <${settings.smtp_username}>`,
      to: toEmail,
      subject: 'PetHaven Connect - Account Approved! 🎉',
      text: `Congratulations ${userName}!\n\nYour account as a ${roleLabel} has been reviewed and approved by the PetHaven administrator. You can now log in to the portal.\n\nThank you for joining us,\nThe PetHaven Connect Team`,
      html: `
        <div style="background-color: #f1f5f9; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; min-height: 100%;">
          <div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
            
            <!-- Header Section with soft green gradient for success -->
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 35px 40px; text-align: center; color: #ffffff;">
              <div style="font-size: 32px; margin-bottom: 10px; display: inline-block;">🎉</div>
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">Account Approved!</h1>
              <p style="margin: 5px 0 0 0; font-size: 14px; color: #d1fae5; font-weight: 500;">Welcome to the PetHaven Connect Family</p>
            </div>

            <!-- Content Body -->
            <div style="padding: 40px; color: #334155;">
              <h2 style="margin-top: 0; margin-bottom: 15px; font-size: 20px; font-weight: 600; color: #0f172a;">Hello ${userName},</h2>
              <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 20px;">
                Great news! Our administration team has successfully reviewed your details and verified your professional license. Your account registration as a <strong>${roleLabel}</strong> has been fully approved.
              </p>

              <!-- Success Card -->
              <div style="background: #f0fdf4; border: 1px solid #d1fae5; border-radius: 16px; padding: 25px; text-align: center; margin-bottom: 25px;">
                <p style="font-size: 14px; font-weight: 600; color: #065f46; margin: 0 0 10px 0;">YOUR PORTAL ACCESS IS NOW ACTIVE</p>
                <p style="font-size: 13px; color: #047857; margin: 0;">You can now log in to manage your listings, view requests, and connect with pet adopters.</p>
              </div>

              <!-- Button Link to portal -->
              <div style="text-align: center; margin-bottom: 25px;">
                <a href="http://localhost:5173/login" target="_blank" style="background-color: #10b981; color: #ffffff; padding: 14px 28px; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 12px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.2), 0 2px 4px -1px rgba(16, 185, 129, 0.1);">
                  Go to Login Portal
                </a>
              </div>

              <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 0;">
                Warmly,<br />
                <strong>The PetHaven Connect Team</strong>
              </p>
            </div>

            <!-- Footer Section -->
            <div style="background-color: #f8fafc; padding: 20px 40px; text-align: center; border-top: 1px solid #f1f5f9;">
              <p style="font-size: 11px; color: #cbd5e1; margin: 0;">
                © 2026 PetHaven Connect. All rights reserved.
              </p>
            </div>

          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[EmailService] Approval email sent successfully to ${toEmail}. MessageID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[EmailService] Error sending approval email:', error);
    throw new Error(`Failed to send approval email: ${error.message}`);
  }
};

export const sendRejectionEmail = async (toEmail, userName, role, reason) => {
  try {
    const { transporter, settings } = await getTransporterAndSettings();
    const roleLabel = role === 'shelter' ? 'Shelter Staff' : 'Veterinarian';

    const mailOptions = {
      from: `"PetHaven Connect" <${settings.smtp_username}>`,
      to: toEmail,
      subject: 'PetHaven Connect - Application Update ⚠️',
      text: `Hello ${userName},\n\nYour application as a ${roleLabel} could not be approved at this time.\n\nReason: ${reason}\n\nIf you have corrected the details, please reach out to us.\n\nRegards,\nThe PetHaven Connect Team`,
      html: `
        <div style="background-color: #f1f5f9; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; min-height: 100%;">
          <div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
            
            <!-- Header Section with soft red/rose gradient for rejection -->
            <div style="background: linear-gradient(135deg, #f43f5e 0%, #e11d48 100%); padding: 35px 40px; text-align: center; color: #ffffff;">
              <div style="font-size: 32px; margin-bottom: 10px; display: inline-block;">⚠️</div>
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">Application Status Update</h1>
              <p style="margin: 5px 0 0 0; font-size: 14px; color: #ffe4e6; font-weight: 500;">Regarding your registration details</p>
            </div>

            <!-- Content Body -->
            <div style="padding: 40px; color: #334155;">
              <h2 style="margin-top: 0; margin-bottom: 15px; font-size: 20px; font-weight: 600; color: #0f172a;">Hello ${userName},</h2>
              <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 20px;">
                Thank you for your interest in registering as a <strong>${roleLabel}</strong> with PetHaven Connect. Our administration team has reviewed your professional license application.
              </p>
              
              <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 20px;">
                Unfortunately, we were unable to approve your credentials at this time due to the following reason:
              </p>

              <!-- Rejection Reason Card -->
              <div style="background: #fff5f5; border: 1px solid #fed7d7; border-radius: 16px; padding: 25px; margin-bottom: 25px;">
                <p style="font-size: 12px; font-weight: 600; color: #c53030; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 0; margin-bottom: 8px;">Reason for Rejection</p>
                <p style="font-size: 15px; color: #9b2c2c; margin: 0; font-style: italic; font-weight: 500;">
                  "${reason || 'Invalid license format or details could not be verified.'}"
                </p>
              </div>

              <p style="font-size: 14px; line-height: 1.6; color: #64748b; margin-bottom: 0;">
                If you believe this is a mistake or have additional documents to provide, please contact our support team at <a href="mailto:support@pethaven.com" style="color: #4f46e5; text-decoration: underline;">support@pethaven.com</a>.
              </p>
            </div>

            <!-- Footer Section -->
            <div style="background-color: #f8fafc; padding: 20px 40px; text-align: center; border-top: 1px solid #f1f5f9;">
              <p style="font-size: 11px; color: #cbd5e1; margin: 0;">
                © 2026 PetHaven Connect. All rights reserved.
              </p>
            </div>

          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[EmailService] Rejection email sent successfully to ${toEmail}. MessageID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[EmailService] Error sending rejection email:', error);
    throw new Error(`Failed to send rejection email: ${error.message}`);
  }
};

export const sendAdoptionStatusEmail = async (toEmail, adopterName, petName, shelterName, status, timelineNote) => {
  try {
    const { transporter, settings } = await getTransporterAndSettings();
    const isApproved = status === 'approved';
    const isRejected = status === 'rejected';
    const isCompleted = status === 'completed';

    let subject = `PetHaven Connect - Adoption Application ${status.toUpperCase()} 🐾`;
    let headerBg = 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)';
    let emoji = '🐾';
    let subTitle = `Adoption Application Status Update`;

    if (isApproved) {
      subject = `Good News! Your Adoption Application for ${petName} is Approved! 🎉`;
      headerBg = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
      emoji = '🎉';
      subTitle = 'Congratulations! Your application is approved';
    } else if (isRejected) {
      subject = `Update on your Adoption Application for ${petName} ⚠️`;
      headerBg = 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)';
      emoji = '⚠️';
      subTitle = 'Adoption Application Status Update';
    } else if (isCompleted) {
      subject = `Adoption Completed! Welcome Home, ${petName}! ❤️`;
      headerBg = 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)';
      emoji = '❤️';
      subTitle = 'Payment received. Adoption successfully completed!';
    }

    const mailOptions = {
      from: `"PetHaven Connect" <${settings.smtp_username}>`,
      to: toEmail,
      subject: subject,
      text: `Hello ${adopterName},\n\nYour adoption application for ${petName} at ${shelterName} has been updated to: ${status.toUpperCase()}.\n\nNote: ${timelineNote || 'No additional notes provided'}\n\nWarmly,\nThe PetHaven Connect Team`,
      html: `
        <div style="background-color: #f1f5f9; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; min-height: 100%;">
          <div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
            <div style="background: ${headerBg}; padding: 35px 40px; text-align: center; color: #ffffff;">
              <div style="font-size: 32px; margin-bottom: 10px; display: inline-block;">${emoji}</div>
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">Application ${status.toUpperCase()}</h1>
              <p style="margin: 5px 0 0 0; font-size: 14px; font-weight: 500;">${subTitle}</p>
            </div>
            <div style="padding: 40px; color: #334155;">
              <h2 style="margin-top: 0; margin-bottom: 15px; font-size: 20px; font-weight: 600; color: #0f172a;">Hello ${adopterName},</h2>
              <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 20px;">
                Your adoption application for the pet <strong style="color: #4f46e5;">${petName}</strong> at <strong>${shelterName}</strong> has been updated.
              </p>
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 25px; margin-bottom: 25px;">
                <p style="font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 0; margin-bottom: 8px;">Status Update & Notes</p>
                <p style="font-size: 15px; color: #1e293b; margin: 0; font-weight: 500;">
                  Status: <span style="text-transform: capitalize; color: ${isApproved ? '#059669' : isRejected ? '#e11d48' : '#1d4ed8'}; font-weight: 700;">${status}</span>
                </p>
                <p style="font-size: 14px; color: #475569; margin: 8px 0 0 0;">
                  Note: "${timelineNote || 'Your application timeline has been updated.'}"
                </p>
              </div>
              ${isApproved ? `
              <div style="text-align: center; margin-bottom: 25px;">
                <a href="http://localhost:5173/adopter/applications" target="_blank" style="background-color: #10b981; color: #ffffff; padding: 14px 28px; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 12px; display: inline-block;">
                  Select Delivery & Pay Adoption Fee
                </a>
              </div>
              ` : ''}
              <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 0;">
                Warmly,<br />
                <strong>The PetHaven Connect Team</strong>
              </p>
            </div>
            <div style="background-color: #f8fafc; padding: 20px 40px; text-align: center; border-top: 1px solid #f1f5f9;">
              <p style="font-size: 11px; color: #cbd5e1; margin: 0;">
                © 2026 PetHaven Connect. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[EmailService] Adoption status email sent successfully to ${toEmail}. MessageID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[EmailService] Error sending adoption status email:', error);
    throw new Error(`Failed to send adoption status email: ${error.message}`);
  }
};

export const sendVetAppointmentStatusEmail = async (toEmail, adopterName, vetName, status, date, time, reason) => {
  try {
    const { transporter, settings } = await getTransporterAndSettings();
    const isConfirmed = status === 'confirmed';
    const isRescheduled = status === 'rescheduled';
    const isCancelled = status === 'cancelled' || status === 'rejected';

    let subject = `PetHaven Connect - Vet Appointment ${status.toUpperCase()} 🩺`;
    let headerBg = 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)';
    let emoji = '🩺';
    let subTitle = `Appointment Status Update`;

    if (isConfirmed) {
      subject = `Confirmed: Your Vet Appointment with Dr. ${vetName} is Confirmed! 📅`;
      headerBg = 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)';
      emoji = '📅';
      subTitle = 'Your appointment has been confirmed';
    } else if (isRescheduled) {
      subject = `Action Required: Vet Appointment Rescheduled by Dr. ${vetName} 🕒`;
      headerBg = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
      emoji = '🕒';
      subTitle = 'Your appointment has been rescheduled';
    } else if (isCancelled) {
      subject = `Update: Vet Appointment Cancelled/Rejected by Dr. ${vetName} ⚠️`;
      headerBg = 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)';
      emoji = '⚠️';
      subTitle = 'Your appointment could not be scheduled';
    }

    const mailOptions = {
      from: `"PetHaven Connect" <${settings.smtp_username}>`,
      to: toEmail,
      subject: subject,
      text: `Hello ${adopterName},\n\nYour veterinary appointment with Dr. ${vetName} has been updated to: ${status.toUpperCase()}.\n\nDate: ${date}\nTime: ${time}\nReason/Note: ${reason || 'No additional details provided'}\n\nRegards,\nThe PetHaven Connect Team`,
      html: `
        <div style="background-color: #f1f5f9; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; min-height: 100%;">
          <div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
            <div style="background: ${headerBg}; padding: 35px 40px; text-align: center; color: #ffffff;">
              <div style="font-size: 32px; margin-bottom: 10px; display: inline-block;">${emoji}</div>
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">Appointment ${status.toUpperCase()}</h1>
              <p style="margin: 5px 0 0 0; font-size: 14px; font-weight: 500;">${subTitle}</p>
            </div>
            <div style="padding: 40px; color: #334155;">
              <h2 style="margin-top: 0; margin-bottom: 15px; font-size: 20px; font-weight: 600; color: #0f172a;">Hello ${adopterName},</h2>
              <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 20px;">
                Your appointment request with <strong style="color: #4f46e5;">Dr. ${vetName}</strong> has been updated.
              </p>
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 25px; margin-bottom: 25px;">
                <p style="font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 0; margin-bottom: 8px;">Appointment Details</p>
                <p style="font-size: 14px; color: #1e293b; margin: 0;">
                  <strong>Status:</strong> <span style="text-transform: capitalize; color: ${isConfirmed ? '#1d4ed8' : isRescheduled ? '#d97706' : '#e11d48'}; font-weight: 700;">${status}</span>
                </p>
                <p style="font-size: 14px; color: #1e293b; margin: 5px 0 0 0;">
                  <strong>Date:</strong> ${date}
                </p>
                <p style="font-size: 14px; color: #1e293b; margin: 5px 0 0 0;">
                  <strong>Time:</strong> ${time}
                </p>
                ${reason ? `
                  <p style="font-size: 14px; color: #475569; margin: 10px 0 0 0; font-style: italic;">
                    <strong>Note:</strong> "${reason}"
                  </p>
                ` : ''}
              </div>
              <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 0;">
                Warmly,<br />
                <strong>The PetHaven Connect Team</strong>
              </p>
            </div>
            <div style="background-color: #f8fafc; padding: 20px 40px; text-align: center; border-top: 1px solid #f1f5f9;">
              <p style="font-size: 11px; color: #cbd5e1; margin: 0;">
                © 2026 PetHaven Connect. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[EmailService] Vet appointment email sent successfully to ${toEmail}. MessageID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[EmailService] Error sending vet appointment email:', error);
    throw new Error(`Failed to send vet appointment email: ${error.message}`);
  }
};

export const sendPasswordResetEmail = async (toEmail, userName, resetToken) => {
  try {
    console.log(`[EmailService] sendPasswordResetEmail called for: ${toEmail}`);
    const { transporter, settings } = await getTransporterAndSettings();
    const resetUrl = `http://localhost:5173/reset-password?token=${resetToken}`;
    
    console.log(`[EmailService] SMTP Settings loaded:`, {
      host: settings.smtp_host,
      port: settings.smtp_port,
      username: settings.smtp_username,
      password: settings.smtp_password ? '***HIDDEN***' : 'MISSING'
    });
    console.log(`[EmailService] Reset URL: ${resetUrl}`);

    const mailOptions = {
      from: `"PetHaven Connect" <${settings.smtp_username}>`,
      to: toEmail,
      subject: 'Reset Your Password - Pet Haven Connect',
      text: `Hello ${userName || 'there'},\n\nWe received a request to reset your password for your PetHaven Connect account.\n\nClick the link below to reset your password:\n\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you did not request a password reset, please ignore this email or contact support if you suspect unauthorized activity.\n\nThank you,\nThe PetHaven Connect Team`,
      html: `
        <div style="background-color: #f1f5f9; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; min-height: 100%;">
          <div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
            
            <!-- Header Section -->
            <div style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); padding: 35px 40px; text-align: center; color: #ffffff;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">PetHaven Connect</h1>
              <p style="margin: 5px 0 0 0; font-size: 14px; color: #e0e7ff; font-weight: 500;">Password Reset Request</p>
            </div>

            <!-- Content Body -->
            <div style="padding: 40px; color: #334155;">
              <h2 style="margin-top: 0; margin-bottom: 15px; font-size: 20px; font-weight: 600; color: #0f172a;">Reset Your Password</h2>
              <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 25px;">
                Hello ${userName || 'there'}, we received a request to reset your password for your PetHaven Connect account.
              </p>

              <!-- Reset Password Button -->
              <div style="text-align: center; margin-bottom: 25px;">
                <a href="${resetUrl}" target="_blank" style="background-color: #4f46e5; color: #ffffff; padding: 14px 28px; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 12px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2), 0 2px 4px -1px rgba(79, 70, 229, 0.1);">
                  Reset Password
                </a>
              </div>

              <!-- Expiry Notice -->
              <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 12px; padding: 16px; margin-bottom: 25px;">
                <p style="font-size: 13px; color: #92400e; margin: 0; line-height: 1.5;">
                  <strong>⏰ This link will expire in 1 hour.</strong> Please reset your password before the link expires.
                </p>
              </div>

              <!-- Security Notice -->
              <div style="border-left: 4px solid #ef4444; background-color: #fef2f2; padding: 12px 16px; border-radius: 4px 8px 8px 4px;">
                <p style="font-size: 13px; color: #991b1b; margin: 0; line-height: 1.5;">
                  <strong>Security notice:</strong> If you did not request a password reset, please ignore this email or contact support if you suspect unauthorized activity.
                </p>
              </div>

              <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-top: 25px; margin-bottom: 0;">
                Warmly,<br />
                <strong>The PetHaven Connect Team</strong>
              </p>
            </div>

            <!-- Footer Section -->
            <div style="background-color: #f8fafc; padding: 20px 40px; text-align: center; border-top: 1px solid #f1f5f9;">
              <p style="font-size: 12px; color: #94a3b8; margin: 0;">
                This is an automated security message. Please do not reply directly to this mail.
              </p>
              <p style="font-size: 11px; color: #cbd5e1; margin-top: 8px; margin-bottom: 0;">
                © 2026 PetHaven Connect. All rights reserved.
              </p>
            </div>

          </div>
        </div>
      `
    };

    console.log(`[EmailService] Attempting to send email via nodemailer...`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`[EmailService] Password reset email sent successfully to ${toEmail}. MessageID: ${info.messageId}`);
    console.log(`[EmailService] SMTP response:`, {
      accepted: info.accepted,
      rejected: info.rejected,
      response: info.response
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[EmailService] Error sending password reset email:', error);
    console.error('[EmailService] Error details:', {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      stack: error.stack
    });
    throw new Error(`Failed to send password reset email: ${error.message}`);
  }
};

export const sendComplaintEmail = async (toEmail, userName, complaintTitle, againstName, category, priority) => {
  try {
    const { transporter, settings } = await getTransporterAndSettings();

    const mailOptions = {
      from: `"PetHaven Connect" <${settings.smtp_username}>`,
      to: toEmail,
      subject: `New Complaint Filed: ${complaintTitle} ⚠️`,
      text: `Hello ${userName},\n\nA new complaint has been filed against you regarding "${complaintTitle}".\n\nCategory: ${category}\nPriority: ${priority}\n\nPlease log in to your dashboard to view the details and respond.\n\nRegards,\nThe PetHaven Connect Team`,
      html: `
        <div style="background-color: #f1f5f9; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; min-height: 100%;">
          <div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
            
            <!-- Header Section -->
            <div style="background: linear-gradient(135deg, #f43f5e 0%, #e11d48 100%); padding: 35px 40px; text-align: center; color: #ffffff;">
              <div style="font-size: 32px; margin-bottom: 10px; display: inline-block;">⚠️</div>
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">New Complaint Filed</h1>
              <p style="margin: 5px 0 0 0; font-size: 14px; color: #ffe4e6; font-weight: 500;">Action Required</p>
            </div>

            <!-- Content Body -->
            <div style="padding: 40px; color: #334155;">
              <h2 style="margin-top: 0; margin-bottom: 15px; font-size: 20px; font-weight: 600; color: #0f172a;">Hello ${userName},</h2>
              <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 20px;">
                A new complaint has been filed against you. Please review the details below and take appropriate action.
              </p>

              <!-- Complaint Details Card -->
              <div style="background: #fff5f5; border: 1px solid #fed7d7; border-radius: 16px; padding: 25px; margin-bottom: 25px;">
                <p style="font-size: 12px; font-weight: 600; color: #c53030; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 0; margin-bottom: 8px;">Complaint Details</p>
                <p style="font-size: 15px; color: #9b2c2c; margin: 0; font-weight: 500;">
                  <strong>Title:</strong> "${complaintTitle}"
                </p>
                <p style="font-size: 14px; color: #9b2c2c; margin: 8px 0 0 0;">
                  <strong>Category:</strong> ${category}
                </p>
                <p style="font-size: 14px; color: #9b2c2c; margin: 5px 0 0 0;">
                  <strong>Priority:</strong> ${priority}
                </p>
              </div>

              <!-- Action Button -->
              <div style="text-align: center; margin-bottom: 25px;">
                <a href="http://localhost:5173/login" target="_blank" style="background-color: #e11d48; color: #ffffff; padding: 14px 28px; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 12px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(225, 29, 72, 0.2), 0 2px 4px -1px rgba(225, 29, 72, 0.1);">
                  View Complaint in Dashboard
                </a>
              </div>

              <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 0;">
                Warmly,<br />
                <strong>The PetHaven Connect Team</strong>
              </p>
            </div>

            <!-- Footer Section -->
            <div style="background-color: #f8fafc; padding: 20px 40px; text-align: center; border-top: 1px solid #f1f5f9;">
              <p style="font-size: 11px; color: #cbd5e1; margin: 0;">
                © 2026 PetHaven Connect. All rights reserved.
              </p>
            </div>

          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[EmailService] Complaint email sent successfully to ${toEmail}. MessageID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[EmailService] Error sending complaint email:', error);
    throw new Error(`Failed to send complaint email: ${error.message}`);
  }
};

export const sendComplaintResponseEmail = async (toEmail, userName, complaintId, complaintTitle, category, status, responseMessage, adminName) => {
  try {
    const { transporter, settings } = await getTransporterAndSettings();

    const mailOptions = {
      from: `"Pet Haven Connect" <${settings.smtp_username}>`,
      to: toEmail,
      subject: `Update on Your Complaint #${complaintId}`,
      text: `Hello ${userName},\n\nYour complaint has been reviewed by our support team.\n\nComplaint ID: ${complaintId}\nCategory: ${category}\nStatus: ${status}\n\nAdmin Response:\n${responseMessage}\n\nSubmitted By: ${adminName}\nDate: ${new Date().toLocaleString()}\n\nIf you have additional questions, please reply to this email or contact our support team.\n\nThank you,\nPet Haven Connect Support Team`,
      html: `
        <div style="background-color: #f1f5f9; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; min-height: 100%;">
          <div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
            
            <!-- Header Section -->
            <div style="background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); padding: 35px 40px; text-align: center; color: #ffffff;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">Pet Haven Connect</h1>
              <p style="margin: 5px 0 0 0; font-size: 14px; color: #ccfbf1; font-weight: 500;">Complaint Response Update</p>
            </div>

            <!-- Content Body -->
            <div style="padding: 40px; color: #334155;">
              <h2 style="margin-top: 0; margin-bottom: 15px; font-size: 20px; font-weight: 600; color: #0f172a;">Hello ${userName},</h2>
              <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 25px;">
                Our support team has reviewed your complaint and provided a response.
              </p>

              <!-- Complaint Details Card -->
              <div style="background: #f0fdfa; border: 1px solid #ccfbf1; border-radius: 16px; padding: 25px; margin-bottom: 25px;">
                <p style="font-size: 12px; font-weight: 600; color: #0f766e; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 0; margin-bottom: 12px;">Complaint Details</p>
                <p style="font-size: 14px; color: #115e59; margin: 0;">
                  <strong>Complaint ID:</strong> #${complaintId}
                </p>
                <p style="font-size: 14px; color: #115e59; margin: 5px 0 0 0;">
                  <strong>Title:</strong> "${complaintTitle}"
                </p>
                <p style="font-size: 14px; color: #115e59; margin: 5px 0 0 0;">
                  <strong>Category:</strong> ${category}
                </p>
                <p style="font-size: 14px; color: #115e59; margin: 5px 0 0 0;">
                  <strong>Status:</strong> <span style="text-transform: capitalize; color: #0d9488; font-weight: 700;">${status}</span>
                </p>
              </div>

              <!-- Staff Response Card -->
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 25px; margin-bottom: 25px;">
                <p style="font-size: 12px; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 0; margin-bottom: 12px;">Staff Response</p>
                <p style="font-size: 15px; color: #1e293b; margin: 0; line-height: 1.6;">
                  ${responseMessage}
                </p>
              </div>

              <!-- Response Info -->
              <div style="background: #fef9c3; border: 1px solid #fde047; border-radius: 12px; padding: 16px; margin-bottom: 25px;">
                <p style="font-size: 13px; color: #854d0e; margin: 0; line-height: 1.5;">
                  <strong>Responded By:</strong> ${adminName}<br />
                  <strong>Date:</strong> ${new Date().toLocaleString()}
                </p>
              </div>

              <!-- Action Button -->
              <div style="text-align: center; margin-bottom: 25px;">
                <a href="http://localhost:5173/adopter/complaints/${complaintId}" target="_blank" style="background-color: #0d9488; color: #ffffff; padding: 14px 28px; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 12px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(13, 148, 136, 0.2), 0 2px 4px -1px rgba(13, 148, 136, 0.1);">
                  View Complaint Details
                </a>
              </div>

              <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 0;">
                If you have additional questions, please reply to this email or contact our support team.
              </p>

              <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-top: 25px; margin-bottom: 0;">
                Thank you,<br />
                <strong>Pet Haven Connect Support Team</strong>
              </p>
            </div>

            <!-- Footer Section -->
            <div style="background-color: #f8fafc; padding: 20px 40px; text-align: center; border-top: 1px solid #f1f5f9;">
              <p style="font-size: 12px; color: #94a3b8; margin: 0;">
                This is an automated email. Please do not reply directly to this mail.
              </p>
              <p style="font-size: 11px; color: #cbd5e1; margin-top: 8px; margin-bottom: 0;">
                © 2026 PetHaven Connect. All rights reserved.
              </p>
            </div>

          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[EmailService] Complaint response email sent successfully to ${toEmail}. MessageID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[EmailService] Error sending complaint response email:', error);
    throw new Error(`Failed to send complaint response email: ${error.message}`);
  }
};
