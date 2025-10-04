const verificationEmail = (userName, otp, verificationLink) => {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                margin: 0;
                padding: 0;
                background-color: #f4f4f4;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 10px;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                text-align: center;
            }
            .header h1 {
                margin: 0;
                font-size: 28px;
                font-weight: 600;
            }
            .content {
                padding: 40px 30px;
            }
            .greeting {
                font-size: 18px;
                margin-bottom: 20px;
                color: #2c3e50;
            }
            .message {
                font-size: 16px;
                margin-bottom: 30px;
                color: #555;
            }
            .verification-section {
                background-color: #f8f9fa;
                border-radius: 8px;
                padding: 25px;
                margin: 25px 0;
                text-align: center;
            }
            .otp-code {
                font-size: 32px;
                font-weight: bold;
                color: #667eea;
                letter-spacing: 4px;
                margin: 15px 0;
                padding: 15px;
                background-color: white;
                border-radius: 6px;
                border: 2px dashed #667eea;
            }
            .verify-button {
                display: inline-block;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                text-decoration: none;
                padding: 15px 30px;
                border-radius: 25px;
                font-weight: 600;
                font-size: 16px;
                margin: 20px 0;
                transition: transform 0.2s ease;
            }
            .verify-button:hover {
                transform: translateY(-2px);
            }
            .link-section {
                margin: 25px 0;
                padding: 20px;
                background-color: #e8f4fd;
                border-radius: 8px;
                border-left: 4px solid #667eea;
            }
            .link-text {
                font-size: 14px;
                color: #666;
                margin-bottom: 10px;
            }
            .verification-link {
                word-break: break-all;
                color: #667eea;
                text-decoration: none;
                font-weight: 500;
            }
            .footer {
                background-color: #f8f9fa;
                padding: 25px 30px;
                text-align: center;
                border-top: 1px solid #e9ecef;
            }
            .footer p {
                margin: 5px 0;
                font-size: 14px;
                color: #666;
            }
            .warning {
                background-color: #fff3cd;
                border: 1px solid #ffeaa7;
                border-radius: 6px;
                padding: 15px;
                margin: 20px 0;
                color: #856404;
                font-size: 14px;
            }
            .expiry-info {
                background-color: #d1ecf1;
                border: 1px solid #bee5eb;
                border-radius: 6px;
                padding: 15px;
                margin: 20px 0;
                color: #0c5460;
                font-size: 14px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔐 Email Verification</h1>
            </div>
            
            <div class="content">
                <div class="greeting">
                    Hello ${userName || 'there'}! 👋
                </div>
                
                <div class="message">
                    Thank you for signing up! To complete your registration and verify your email address, please use one of the verification methods below.
                </div>
                
                <div class="verification-section">
                    <h3>📱 Verification Code (OTP)</h3>
                    <p>Enter this code in the verification form:</p>
                    <div class="otp-code">${otp}</div>
                    <p><strong>This code will expire in 10 minutes</strong></p>
                </div>
                
                <div class="link-section">
                    <div class="link-text">Or click the button below to verify your email:</div>
                    <a href="${verificationLink}" class="verify-button">
                        ✅ Verify Email Address
                    </a>
                </div>
                
                <div class="warning">
                    <strong>⚠️ Security Notice:</strong> Never share this verification code with anyone. Our team will never ask for this code via phone or email.
                </div>
                
                <div class="expiry-info">
                    <strong>⏰ Important:</strong> This verification link and code will expire in 10 minutes for security reasons. If you don't verify within this time, you'll need to request a new verification email.
                </div>
                
                <div class="link-section">
                    <div class="link-text">If the button doesn't work, copy and paste this link into your browser:</div>
                    <a href="${verificationLink}" class="verification-link">${verificationLink}</a>
                </div>
            </div>
            
            <div class="footer">
                <p><strong>Need help?</strong> Contact our support team at support@yourcompany.com</p>
                <p>This email was sent to verify your account. If you didn't create an account, please ignore this email.</p>
                <p>&copy; 2024 Your Company Name. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>`;
  };
  
  export default verificationEmail;
  