const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    // Configure the SMTP transporter with Hostinger settings
    this.transporter = nodemailer.createTransport({
      host: 'smtp.hostinger.com',
      port: 465,
      secure: true, // SSL
      auth: {
        user: process.env.EMAIL_USER || 'admin@sortyx.com',
        pass: process.env.EMAIL_PASSWORD || 'Admin@Sortyx2025!'
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Verify the connection on initialization
    this.verifyConnection();
  }

  async verifyConnection() {
    try {
      await this.transporter.verify();
      console.log('✅ Email service is ready to send emails');
    } catch (error) {
      console.error('❌ Email service connection error:', error.message);
      console.warn('⚠️  Email notifications will not be sent. Please check your EMAIL_USER and EMAIL_PASSWORD environment variables.');
      console.warn('⚠️  Make sure to use the correct SMTP credentials from Hostinger.');
    }
  }

  /**
   * Send welcome email to newly registered users
   * @param {string} userEmail - The recipient's email address
   * @param {string} userName - The recipient's name
   */
  async sendWelcomeEmail(userEmail, userName) {
    const mailOptions = {
      from: {
        name: 'Sortyx Bin Monitoring',
        address: process.env.EMAIL_USER || 'admin@sortyx.com'
      },
      to: userEmail,
      subject: '🎉 Welcome to Sortyx Smart Bin Monitoring Dashboard',
      html: this.getWelcomeEmailTemplate(userName),
      text: this.getWelcomeEmailTextVersion(userName)
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Welcome email sent successfully to:', userEmail);
      console.log('Message ID:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Error sending welcome email:', error.message);
      throw error;
    }
  }

  /**
   * Send alert notification email
   * @param {string} userEmail - The recipient's email address
   * @param {string} userName - The recipient's name
   * @param {object} alertDetails - Details about the alert
   */
  async sendAlertEmail(userEmail, userName, alertDetails) {
    const mailOptions = {
      from: {
        name: 'Sortyx Bin Monitoring Alerts',
        address: process.env.EMAIL_USER || 'admin@sortyx.com'
      },
      to: userEmail,
      subject: `🚨 Alert: ${alertDetails.binName || 'Smart Bin'} - ${alertDetails.alertType || 'Notification'}`,
      html: this.getAlertEmailTemplate(userName, alertDetails),
      text: this.getAlertEmailTextVersion(userName, alertDetails)
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Alert email sent successfully to:', userEmail);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Error sending alert email:', error.message);
      throw error;
    }
  }

  /**
   * HTML template for welcome email
   */
  getWelcomeEmailTemplate(userName) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Sortyx</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f4f4f7;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 20px;
      text-align: center;
      color: #ffffff;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
    }
    .header p {
      margin: 10px 0 0;
      font-size: 16px;
      opacity: 0.95;
    }
    .content {
      padding: 40px 30px;
      color: #333333;
      line-height: 1.6;
    }
    .content h2 {
      color: #667eea;
      font-size: 24px;
      margin-bottom: 20px;
    }
    .content p {
      font-size: 16px;
      margin-bottom: 15px;
    }
    .features {
      background-color: #f9f9fc;
      border-left: 4px solid #667eea;
      padding: 20px;
      margin: 25px 0;
      border-radius: 4px;
    }
    .features h3 {
      color: #667eea;
      font-size: 18px;
      margin-top: 0;
      margin-bottom: 15px;
    }
    .features ul {
      margin: 0;
      padding-left: 20px;
    }
    .features li {
      margin-bottom: 10px;
      font-size: 15px;
    }
    .cta-button {
      display: inline-block;
      padding: 14px 32px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 16px;
      margin: 20px 0;
      transition: transform 0.2s;
    }
    .cta-button:hover {
      transform: translateY(-2px);
    }
    .footer {
      background-color: #f9f9fc;
      padding: 30px;
      text-align: center;
      color: #666666;
      font-size: 14px;
      border-top: 1px solid #e0e0e0;
    }
    .footer p {
      margin: 5px 0;
    }
    .footer a {
      color: #667eea;
      text-decoration: none;
    }
    .divider {
      height: 1px;
      background: linear-gradient(to right, transparent, #667eea, transparent);
      margin: 30px 0;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>🎉 Welcome to Sortyx!</h1>
      <p>Your Smart Bin Monitoring Dashboard</p>
    </div>
    
    <div class="content">
      <h2>Hello ${userName}! 👋</h2>
      
      <p>Thank you for joining <strong>Sortyx Smart Bin Monitoring Dashboard</strong>! We're excited to have you on board.</p>
      
      <p>Your account has been successfully created, and you're now ready to start monitoring your smart bins with cutting-edge technology and real-time insights.</p>
      
      <div class="features">
        <h3>🚀 What You Can Do:</h3>
        <ul>
          <li><strong>Real-Time Monitoring:</strong> Track your bins' fill levels and status instantly</li>
          <li><strong>Smart Alerts:</strong> Get notified when bins need attention</li>
          <li><strong>Multi-Compartment Support:</strong> Manage complex bin systems with ease</li>
          <li><strong>Analytics & Reports:</strong> View detailed insights and trends</li>
          <li><strong>IoT Integration:</strong> Connect your sensors seamlessly</li>
          <li><strong>Custom Notifications:</strong> Set up alerts your way</li>
        </ul>
      </div>
      
      <div style="text-align: center;">
        <a href="${process.env.FRONTEND_URL || 'https://sortyx-smart-bin.onrender.com'}" class="cta-button">
          Get Started Now →
        </a>
      </div>
      
      <div class="divider"></div>
      
      <p><strong>Need Help?</strong></p>
      <p>Our support team is here to assist you. Feel free to reach out if you have any questions or need guidance getting started.</p>
      
      <p>Happy monitoring! 🗑️✨</p>
      
      <p style="margin-top: 30px;">
        Best regards,<br>
        <strong>The Sortyx Team</strong>
      </p>
    </div>
    
    <div class="footer">
      <p><strong>Sortyx Smart Bin Monitoring</strong></p>
      <p>📧 Support: <a href="mailto:support@sortyx.com">support@sortyx.com</a></p>
      <p>🌐 Website: <a href="https://sortyx.com">sortyx.com</a></p>
      <p style="margin-top: 20px; font-size: 12px; color: #999;">
        © ${new Date().getFullYear()} Sortyx. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Plain text version of welcome email
   */
  getWelcomeEmailTextVersion(userName) {
    return `
Welcome to Sortyx Smart Bin Monitoring Dashboard!

Hello ${userName}!

Thank you for joining Sortyx Smart Bin Monitoring Dashboard! We're excited to have you on board.

Your account has been successfully created, and you're now ready to start monitoring your smart bins with cutting-edge technology and real-time insights.

What You Can Do:
- Real-Time Monitoring: Track your bins' fill levels and status instantly
- Smart Alerts: Get notified when bins need attention
- Multi-Compartment Support: Manage complex bin systems with ease
- Analytics & Reports: View detailed insights and trends
- IoT Integration: Connect your sensors seamlessly
- Custom Notifications: Set up alerts your way

Get started now: ${process.env.FRONTEND_URL || 'https://sortyx-smart-bin.onrender.com'}

Need Help?
Our support team is here to assist you. Feel free to reach out if you have any questions or need guidance getting started.

Happy monitoring!

Best regards,
The Sortyx Team

---
Sortyx Smart Bin Monitoring
Support: support@sortyx.com
Website: sortyx.com
© ${new Date().getFullYear()} Sortyx. All rights reserved.
    `;
  }

  /**
   * HTML template for alert email
   */
  getAlertEmailTemplate(userName, alertDetails) {
    const severityColors = {
      critical: '#dc2626',
      warning: '#f59e0b',
      info: '#3b82f6'
    };
    
    const severity = alertDetails.severity || 'info';
    const color = severityColors[severity] || '#3b82f6';

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Smart Bin Alert</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f4f4f7;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      background-color: ${color};
      padding: 30px 20px;
      text-align: center;
      color: #ffffff;
    }
    .content {
      padding: 30px;
      color: #333333;
      line-height: 1.6;
    }
    .alert-box {
      background-color: #f9f9fc;
      border-left: 4px solid ${color};
      padding: 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .footer {
      background-color: #f9f9fc;
      padding: 20px;
      text-align: center;
      color: #666666;
      font-size: 14px;
      border-top: 1px solid #e0e0e0;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>🚨 Smart Bin Alert</h1>
    </div>
    <div class="content">
      <p>Hello ${userName},</p>
      <div class="alert-box">
        <h3>${alertDetails.binName || 'Smart Bin'}</h3>
        <p><strong>Alert Type:</strong> ${alertDetails.alertType || 'Notification'}</p>
        <p><strong>Message:</strong> ${alertDetails.message || 'Your bin requires attention'}</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
      </div>
      <p>Please check your dashboard for more details.</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Sortyx. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Plain text version of alert email
   */
  getAlertEmailTextVersion(userName, alertDetails) {
    return `
Smart Bin Alert

Hello ${userName},

Alert Details:
- Bin: ${alertDetails.binName || 'Smart Bin'}
- Type: ${alertDetails.alertType || 'Notification'}
- Message: ${alertDetails.message || 'Your bin requires attention'}
- Time: ${new Date().toLocaleString()}

Please check your dashboard for more details.

---
© ${new Date().getFullYear()} Sortyx. All rights reserved.
    `;
  }
}

// Export a singleton instance
module.exports = new EmailService();