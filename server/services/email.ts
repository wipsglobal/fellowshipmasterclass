import nodemailer from 'nodemailer';
import { ENV } from '../_core/env';

// Email transporter configuration
const transporter = nodemailer.createTransport({
  host: ENV.smtpHost,
  port: 465,
  secure: true, // use SSL
  auth: {
    user: ENV.smtpUser,
    pass: ENV.smtpPassword,
  },
});

// Email template styles
const emailStyles = `
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f4f4f4;
    }
    .email-container {
      max-width: 600px;
      margin: 20px auto;
      background: #ffffff;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .email-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
    }
    .logo {
      max-width: 150px;
      margin-bottom: 20px;
    }
    .email-header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .email-body {
      padding: 40px 30px;
    }
    .email-body h2 {
      color: #667eea;
      font-size: 24px;
      margin-top: 0;
      margin-bottom: 20px;
    }
    .email-body p {
      margin: 15px 0;
      font-size: 16px;
      line-height: 1.8;
    }
    .info-box {
      background: #f8f9fa;
      border-left: 4px solid #667eea;
      padding: 20px;
      margin: 25px 0;
      border-radius: 5px;
    }
    .info-box strong {
      color: #667eea;
      display: block;
      margin-bottom: 5px;
    }
    .button {
      display: inline-block;
      padding: 14px 35px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white !important;
      text-decoration: none;
      border-radius: 25px;
      font-weight: 600;
      margin: 20px 0;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
      transition: all 0.3s ease;
    }
    .button:hover {
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
      transform: translateY(-2px);
    }
    .status-badge {
      display: inline-block;
      padding: 8px 20px;
      border-radius: 20px;
      font-weight: 600;
      font-size: 14px;
      margin: 10px 0;
    }
    .status-approved {
      background: #d4edda;
      color: #155724;
    }
    .status-pending {
      background: #fff3cd;
      color: #856404;
    }
    .status-rejected {
      background: #f8d7da;
      color: #721c24;
    }
    .footer {
      background: #f8f9fa;
      padding: 30px;
      text-align: center;
      font-size: 14px;
      color: #666;
      border-top: 1px solid #dee2e6;
    }
    .footer-links {
      margin: 15px 0;
    }
    .footer-links a {
      color: #667eea;
      text-decoration: none;
      margin: 0 10px;
    }
    .divider {
      height: 1px;
      background: linear-gradient(to right, transparent, #dee2e6, transparent);
      margin: 30px 0;
    }
    .highlight {
      background: linear-gradient(120deg, #667eea20 0%, #764ba220 100%);
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 600;
    }
  </style>
`;

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

async function sendEmail(options: EmailOptions): Promise<void> {
  try {
    await transporter.sendMail({
      from: `"IBAKM Fellowship Program" <${ENV.emailFrom}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
    console.log(`[Email] ✓ Sent to ${options.to}: ${options.subject}`);
  } catch (error) {
    console.error('[Email] Failed to send:', error);
    throw error;
  }
}

// Application Submission Confirmation
export async function sendApplicationSubmittedEmail(
  recipientEmail: string,
  recipientName: string,
  applicationNumber: string
): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      ${emailStyles}
    </head>
    <body>
      <div class="email-container">
        <div class="email-header">
          <img src="https://res.cloudinary.com/dgkuwgrrx/image/upload/v1/fellowship-assets/ibakm-logo.png" alt="IBAKM Logo" class="logo">
          <h1>Application Received!</h1>
        </div>
        
        <div class="email-body">
          <h2>Dear ${recipientName},</h2>
          
          <p>Thank you for submitting your application to the <span class="highlight">IBAKM Fellowship Masterclass Program</span>. We are excited about your interest in joining our community of emerging leaders!</p>
          
          <div class="info-box">
            <strong>Your Application Details:</strong>
            Application Number: <span class="highlight">${applicationNumber}</span><br>
            Status: <span class="status-badge status-pending">Under Review</span><br>
            Submitted: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
          
          <p>Your application is now being reviewed by our selection committee. This process typically takes <strong>5-7 business days</strong>.</p>
          
          <p><strong>What happens next?</strong></p>
          <ul style="line-height: 2;">
            <li>Our team will carefully review your application and supporting documents</li>
            <li>You will receive an email notification once a decision has been made</li>
            <li>If approved, you'll receive detailed information about the next steps</li>
          </ul>
          
          <div class="divider"></div>
          
          <p>In the meantime, you can track your application status on your dashboard.</p>
          
          <center>
            <a href="http://localhost:3000/dashboard" class="button">View Application Status</a>
          </center>
          
          <p style="margin-top: 30px;">If you have any questions, please don't hesitate to reach out to our admissions team.</p>
        </div>
        
        <div class="footer">
          <strong>IBAKM Fellowship Masterclass Program</strong><br>
          Building the next generation of leaders
          
          <div class="footer-links">
            <a href="http://localhost:3000">Website</a> |
            <a href="mailto:fellowshipmastercertificates@ibakmglobal.com">Contact Us</a> |
            <a href="http://localhost:3000/faq">FAQ</a>
          </div>
          
          <p style="margin-top: 15px; font-size: 12px; color: #999;">
            This is an automated message. Please do not reply to this email.<br>
            © ${new Date().getFullYear()} IBAKM Global. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: recipientEmail,
    subject: `Application Received - ${applicationNumber}`,
    html,
  });
}

// Application Approved
export async function sendApplicationApprovedEmail(
  recipientEmail: string,
  recipientName: string,
  applicationNumber: string,
  cohortName: string,
  startDate: string
): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      ${emailStyles}
    </head>
    <body>
      <div class="email-container">
        <div class="email-header">
          <img src="https://res.cloudinary.com/dgkuwgrrx/image/upload/v1/fellowship-assets/ibakm-logo.png" alt="IBAKM Logo" class="logo">
          <h1>🎉 Congratulations!</h1>
        </div>
        
        <div class="email-body">
          <h2>Dear ${recipientName},</h2>
          
          <p>We are thrilled to inform you that your application to the <span class="highlight">IBAKM Fellowship Masterclass Program</span> has been <strong>approved</strong>!</p>
          
          <div class="info-box" style="border-left-color: #28a745;">
            <strong>🎊 Application Status:</strong>
            Application Number: <span class="highlight">${applicationNumber}</span><br>
            Status: <span class="status-badge status-approved">✓ Approved</span><br>
            Cohort: <span class="highlight">${cohortName}</span><br>
            Program Start Date: <span class="highlight">${startDate}</span>
          </div>
          
          <p>After careful consideration of all applications, we believe you have the potential and passion to make the most of this fellowship experience.</p>
          
          <p><strong>Next Steps:</strong></p>
          <ol style="line-height: 2;">
            <li><strong>Confirm Your Participation:</strong> Please confirm your attendance by clicking the button below</li>
            <li><strong>Complete Onboarding:</strong> You'll receive a welcome package with program details and pre-fellowship materials</li>
            <li><strong>Join Our Community:</strong> Connect with fellow participants and mentors before the program begins</li>
            <li><strong>Prepare:</strong> Review the pre-fellowship reading materials and complete any required forms</li>
          </ol>
          
          <center>
            <a href="http://localhost:3000/dashboard" class="button">Confirm Participation</a>
          </center>
          
          <div class="divider"></div>
          
          <div style="background: linear-gradient(120deg, #667eea10 0%, #764ba210 100%); padding: 25px; border-radius: 8px; margin: 25px 0;">
            <p style="margin: 0; font-size: 18px;"><strong>📅 Important Dates:</strong></p>
            <p style="margin: 10px 0;">
              <strong>Program Orientation:</strong> ${new Date(startDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}<br>
              <strong>Fellowship Duration:</strong> 5 days<br>
              <strong>Confirmation Deadline:</strong> ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          
          <p>We're excited to have you join us on this transformative journey! If you have any questions, our team is here to help.</p>
          
          <p style="font-style: italic; color: #666; margin-top: 30px;">
            "Leadership is not about being in charge. It's about taking care of those in your charge." - Simon Sinek
          </p>
        </div>
        
        <div class="footer">
          <strong>IBAKM Fellowship Masterclass Program</strong><br>
          Building the next generation of leaders
          
          <div class="footer-links">
            <a href="http://localhost:3000">Website</a> |
            <a href="mailto:fellowshipmastercertificates@ibakmglobal.com">Contact Us</a> |
            <a href="http://localhost:3000/faq">FAQ</a>
          </div>
          
          <p style="margin-top: 15px; font-size: 12px; color: #999;">
            This is an automated message. Please do not reply to this email.<br>
            © ${new Date().getFullYear()} IBAKM Global. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: recipientEmail,
    subject: `🎉 Congratulations! Your Fellowship Application Has Been Approved`,
    html,
  });
}

// Application Rejected
export async function sendApplicationRejectedEmail(
  recipientEmail: string,
  recipientName: string,
  applicationNumber: string
): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      ${emailStyles}
    </head>
    <body>
      <div class="email-container">
        <div class="email-header">
          <img src="https://res.cloudinary.com/dgkuwgrrx/image/upload/v1/fellowship-assets/ibakm-logo.png" alt="IBAKM Logo" class="logo">
          <h1>Application Update</h1>
        </div>
        
        <div class="email-body">
          <h2>Dear ${recipientName},</h2>
          
          <p>Thank you for your interest in the <span class="highlight">IBAKM Fellowship Masterclass Program</span> and for taking the time to submit your application.</p>
          
          <div class="info-box" style="border-left-color: #dc3545;">
            <strong>Application Status Update:</strong>
            Application Number: <span class="highlight">${applicationNumber}</span><br>
            Status: <span class="status-badge status-rejected">Not Selected</span>
          </div>
          
          <p>After careful consideration, we regret to inform you that we are unable to offer you a place in the current cohort. This decision was extremely difficult, as we received an overwhelming number of exceptional applications.</p>
          
          <p><strong>Please note:</strong> This decision does not reflect on your qualifications or potential. Our selection process is highly competitive, and many factors influence our final decisions.</p>
          
          <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin: 25px 0;">
            <p style="margin: 0 0 15px 0;"><strong>We encourage you to:</strong></p>
            <ul style="margin: 0; line-height: 2;">
              <li>Apply for future cohorts (applications open every quarter)</li>
              <li>Explore our other programs and initiatives</li>
              <li>Stay connected with IBAKM through our newsletter and events</li>
              <li>Continue developing your leadership skills and experience</li>
            </ul>
          </div>
          
          <center>
            <a href="http://localhost:3000/programs" class="button">Explore Other Programs</a>
          </center>
          
          <p style="margin-top: 30px;">We appreciate your interest in IBAKM and wish you all the best in your leadership journey. We hope to see your application again in the future!</p>
          
          <p>If you have any questions or would like feedback on your application, please feel free to reach out to our admissions team.</p>
        </div>
        
        <div class="footer">
          <strong>IBAKM Fellowship Masterclass Program</strong><br>
          Building the next generation of leaders
          
          <div class="footer-links">
            <a href="http://localhost:3000">Website</a> |
            <a href="mailto:fellowshipmastercertificates@ibakmglobal.com">Contact Us</a> |
            <a href="http://localhost:3000/programs">Our Programs</a>
          </div>
          
          <p style="margin-top: 15px; font-size: 12px; color: #999;">
            This is an automated message. Please do not reply to this email.<br>
            © ${new Date().getFullYear()} IBAKM Global. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: recipientEmail,
    subject: `Application Status Update - ${applicationNumber}`,
    html,
  });
}

// Payment Confirmation
export async function sendPaymentConfirmationEmail(
  recipientEmail: string,
  recipientName: string,
  applicationNumber: string,
  amountPaid: number,
  paymentReference: string
): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      ${emailStyles}
    </head>
    <body>
      <div class="email-container">
        <div class="email-header">
          <img src="https://res.cloudinary.com/dgkuwgrrx/image/upload/v1/fellowship-assets/ibakm-logo.png" alt="IBAKM Logo" class="logo">
          <h1>Payment Confirmed</h1>
        </div>
        
        <div class="email-body">
          <h2>Dear ${recipientName},</h2>
          
          <p>We have successfully received your payment for the <span class="highlight">IBAKM Fellowship Masterclass Program</span>. Thank you!</p>
          
          <div class="info-box" style="border-left-color: #28a745;">
            <strong>💳 Payment Receipt:</strong>
            Application Number: <span class="highlight">${applicationNumber}</span><br>
            Amount Paid: <span class="highlight">₦${amountPaid.toLocaleString()}</span><br>
            Payment Reference: <span class="highlight">${paymentReference}</span><br>
            Payment Date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}<br>
            Status: <span class="status-badge status-approved">✓ Confirmed</span>
          </div>
          
          <p>Your application is now complete and will be submitted to our admissions committee for review.</p>
          
          <p><strong>What happens next?</strong></p>
          <ul style="line-height: 2;">
            <li>Your complete application will be reviewed by our selection committee</li>
            <li>You'll receive a decision notification within 5-7 business days</li>
            <li>You can track your application status on your dashboard</li>
          </ul>
          
          <center>
            <a href="http://localhost:3000/dashboard" class="button">View Application</a>
          </center>
          
          <div class="divider"></div>
          
          <p style="font-size: 14px; color: #666;">
            <strong>Need a formal receipt?</strong> You can download your official payment receipt from your dashboard at any time.
          </p>
        </div>
        
        <div class="footer">
          <strong>IBAKM Fellowship Masterclass Program</strong><br>
          Building the next generation of leaders
          
          <div class="footer-links">
            <a href="http://localhost:3000">Website</a> |
            <a href="mailto:fellowshipmastercertificates@ibakmglobal.com">Contact Us</a> |
            <a href="http://localhost:3000/support">Support</a>
          </div>
          
          <p style="margin-top: 15px; font-size: 12px; color: #999;">
            This is an automated message. Please do not reply to this email.<br>
            © ${new Date().getFullYear()} IBAKM Global. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: recipientEmail,
    subject: `Payment Confirmed - ${applicationNumber}`,
    html,
  });
}

// Application Under Review
export async function sendApplicationUnderReviewEmail(
  recipientEmail: string,
  recipientName: string,
  applicationNumber: string
): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      ${emailStyles}
    </head>
    <body>
      <div class="email-container">
        <div class="email-header">
          <img src="https://res.cloudinary.com/dgkuwgrrx/image/upload/v1/fellowship-assets/ibakm-logo.png" alt="IBAKM Logo" class="logo">
          <h1>Application Under Review</h1>
        </div>
        
        <div class="email-body">
          <h2>Dear ${recipientName},</h2>
          
          <p>Good news! Your application to the <span class="highlight">IBAKM Fellowship Masterclass Program</span> is now being actively reviewed by our admissions committee.</p>
          
          <div class="info-box">
            <strong>📋 Review Status:</strong>
            Application Number: <span class="highlight">${applicationNumber}</span><br>
            Current Status: <span class="status-badge status-pending">Under Review</span><br>
            Expected Decision: Within 5-7 business days
          </div>
          
          <p>Our selection committee is carefully evaluating your:</p>
          <ul style="line-height: 2;">
            <li>Academic and professional qualifications</li>
            <li>Leadership experience and potential</li>
            <li>Personal statement and motivations</li>
            <li>Supporting documents and references</li>
          </ul>
          
          <p>We appreciate your patience during this process. You will receive an email notification as soon as a decision has been made.</p>
          
          <center>
            <a href="http://localhost:3000/dashboard" class="button">Check Application Status</a>
          </center>
        </div>
        
        <div class="footer">
          <strong>IBAKM Fellowship Masterclass Program</strong><br>
          Building the next generation of leaders
          
          <div class="footer-links">
            <a href="http://localhost:3000">Website</a> |
            <a href="mailto:fellowshipmastercertificates@ibakmglobal.com">Contact Us</a>
          </div>
          
          <p style="margin-top: 15px; font-size: 12px; color: #999;">
            This is an automated message. Please do not reply to this email.<br>
            © ${new Date().getFullYear()} IBAKM Global. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: recipientEmail,
    subject: `Application Under Review - ${applicationNumber}`,
    html,
  });
}

export { sendEmail };
