interface PasswordResetEmailData {
  recipientEmail: string;
  resetLink: string;
}

/**
 * Generate HTML email template for password reset
 * Uses inline styles for maximum email client compatibility
 */
export function generatePasswordResetEmail(data: PasswordResetEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const { recipientEmail, resetLink } = data;

  const subject = "Reset your MarketOps password";

  const html = `
<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td { font-family: Arial, Helvetica, sans-serif !important; }
  </style>
  <noscript>
  <xml>
    <o:OfficeDocumentSettings>
      <o:PixelsPerInch>96</o:PixelsPerInch>
    </o:OfficeDocumentSettings>
  </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" width="100%" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5;" bgcolor="#f5f5f5">
    <tr>
      <td style="padding: 40px 20px;">
        <!--[if mso]><table role="presentation" cellpadding="0" cellspacing="0" width="600" align="center"><tr><td><![endif]-->
        <table role="presentation" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);" bgcolor="#ffffff">
          <!-- Header -->
          <tr>
            <td bgcolor="#667eea" style="padding: 40px 40px 20px; text-align: center; background-color: #667eea; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">MarketOps</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #1a1a1a; font-size: 24px; font-weight: 600;">Reset your password</h2>

              <p style="margin: 0 0 16px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                We received a request to reset the password for your MarketOps account. Click the button below to choose a new password.
              </p>

              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; margin: 0 0 24px;">
                <tr>
                  <td style="text-align: center;">
                    <!--[if mso]>
                    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${resetLink}" style="height:48px;v-text-anchor:middle;width:220px;" arcsize="13%" strokecolor="#667eea" fillcolor="#667eea">
                      <w:anchorlock/>
                      <center style="color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;">Reset Password</center>
                    </v:roundrect>
                    <![endif]-->
                    <!--[if !mso]><!-->
                    <a href="${resetLink}" style="display: inline-block; padding: 14px 32px; background-color: #667eea; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600;">
                      Reset Password
                    </a>
                    <!--<![endif]-->
                  </td>
                </tr>
              </table>

              <!-- Link as fallback -->
              <p style="margin: 0 0 24px; color: #6b7280; font-size: 14px; line-height: 1.6;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="margin: 0 0 24px; color: #667eea; font-size: 14px; word-break: break-all;">
                ${resetLink}
              </p>

              <!-- Warning -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 24px;">
                <tr>
                  <td style="padding: 16px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;" bgcolor="#fef3c7">
                    <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                      <strong>Note:</strong> This link will expire in 1 hour for security reasons.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td bgcolor="#f9fafb" style="padding: 24px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px; color: #6b7280; font-size: 12px; text-align: center;">
                This email was sent to <strong>${recipientEmail}</strong>
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                &copy; 2026 MarketOps. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
        <!--[if mso]></td></tr></table><![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const text = `
Reset your MarketOps password

We received a request to reset the password for your MarketOps account.

To reset your password, visit:
${resetLink}

This link will expire in 1 hour for security reasons.

If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.

This email was sent to ${recipientEmail}

© 2026 MarketOps. All rights reserved.
  `.trim();

  return { subject, html, text };
}
