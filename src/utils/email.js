const nodemailer = require('nodemailer');
const { CONFIG } = require('../config');

// Create reusable transporter
const transporter = nodemailer.createTransport({
    host: CONFIG.SMTP.HOST,
    port: CONFIG.SMTP.PORT,
    secure: CONFIG.SMTP.SECURE,
    auth: {
        user: CONFIG.SMTP.USER,
        pass: CONFIG.SMTP.PASS,
    },
});

// Verify transporter configuration
transporter.verify((error, success) => {
    if (error) {
        console.error('SMTP Configuration Error:', error);
    } else {
        console.log('SMTP Server is ready to send emails');
    }
});

/**
 * Send OTP email to user
 * @param {string} email - Recipient email address
 * @param {string} otp - OTP code
 * @param {string} userName - User's name (optional)
 * @returns {Promise<boolean>} - Success status
 */
exports.sendOtpEmail = async (email, otp, userName = 'User') => {
    try {
        const mailOptions = {
            from: CONFIG.SMTP.FROM,
            to: email,
            subject: 'Your GoTruks OTP Code',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            line-height: 1.6;
                            color: #333;
                            margin: 0;
                            padding: 0;
                            background-color: #f4f4f4;
                        }
                        .container {
                            max-width: 600px;
                            margin: 20px auto;
                            background: #ffffff;
                            border-radius: 8px;
                            overflow: hidden;
                            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                        }
                        .header {
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            color: #ffffff;
                            padding: 30px 20px;
                            text-align: center;
                        }
                        .header h1 {
                            margin: 0;
                            font-size: 28px;
                        }
                        .content {
                            padding: 40px 30px;
                        }
                        .otp-box {
                            background: #f8f9fa;
                            border: 2px dashed #667eea;
                            border-radius: 8px;
                            padding: 20px;
                            text-align: center;
                            margin: 30px 0;
                        }
                        .otp-code {
                            font-size: 36px;
                            font-weight: bold;
                            color: #667eea;
                            letter-spacing: 8px;
                            margin: 10px 0;
                        }
                        .warning {
                            background: #fff3cd;
                            border-left: 4px solid #ffc107;
                            padding: 15px;
                            margin: 20px 0;
                            border-radius: 4px;
                        }
                        .footer {
                            background: #f8f9fa;
                            padding: 20px;
                            text-align: center;
                            font-size: 12px;
                            color: #6c757d;
                        }
                        .footer a {
                            color: #667eea;
                            text-decoration: none;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🚚 GoTruks</h1>
                        </div>
                        <div class="content">
                            <h2>Hello ${userName},</h2>
                            <p>You requested an OTP code to verify your identity. Please use the code below:</p>
                            
                            <div class="otp-box">
                                <p style="margin: 0; font-size: 14px; color: #6c757d;">Your OTP Code</p>
                                <div class="otp-code">${otp}</div>
                                <p style="margin: 0; font-size: 12px; color: #6c757d;">Valid for 10 minutes</p>
                            </div>
                            
                            <div class="warning">
                                <strong>⚠️ Security Notice:</strong>
                                <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                                    <li>Never share this OTP with anyone</li>
                                    <li>GoTruks will never ask for your OTP via phone or email</li>
                                    <li>This code expires in 10 minutes</li>
                                </ul>
                            </div>
                            
                            <p>If you didn't request this code, please ignore this email or contact our support team.</p>
                        </div>
                        <div class="footer">
                            <p>© 2026 GoTruks. All rights reserved.</p>
                            <p>
                                <a href="mailto:info@gotruks.com">Contact Support</a> | 
                                <a href="#">Privacy Policy</a> | 
                                <a href="#">Terms of Service</a>
                            </p>
                        </div>
                    </div>
                </body>
                </html>
            `,
            text: `Hello ${userName},\n\nYour GoTruks OTP code is: ${otp}\n\nThis code is valid for 10 minutes.\n\nIf you didn't request this code, please ignore this email.\n\nBest regards,\nGoTruks Team`,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('OTP Email sent successfully:', info.messageId);
        return true;
    } catch (error) {
        console.error('Error sending OTP email:', error);
        // Don't throw error - fail silently for security (prevent email enumeration)
        return false;
    }
};
