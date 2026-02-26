interface InvitationEmailData {
  recipientName: string;
  recipientEmail: string;
  tenantName: string;
  role: string;
  inviteLink: string;
  inviterName: string;
}

/**
 * Generate HTML email template for user invitation
 * Uses inline styles for maximum email client compatibility
 */
export function generateInvitationEmail(data: InvitationEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const {
    recipientName,
    recipientEmail,
    tenantName,
    role,
    inviteLink,
    inviterName,
  } = data;

  const subject = `You've been invited to join ${tenantName} on MarketOps`;

  const html = `
<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitation to ${tenantName}</title>
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
  <table role="presentation" width="100%" bgcolor="#f5f5f5" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5;">
    <tr>
      <td style="padding: 40px 20px;">
        <!--[if mso]><table role="presentation" cellpadding="0" cellspacing="0" width="600" align="center"><tr><td><![endif]-->
        <table role="presentation" width="100%" bgcolor="#ffffff" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; border: 1px solid #e5e7eb;">
          <!-- Header -->
          <tr>
            <td bgcolor="#111827" style="padding: 40px 40px 20px; text-align: center; background-color: #111827; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">MarketOps</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #111827; font-size: 24px; font-weight: 600;">You've been invited!</h2>

              <p style="margin: 0 0 16px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Hi${recipientName ? ` ${recipientName}` : ""},
              </p>

              <p style="margin: 0 0 16px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                <strong>${inviterName}</strong> has invited you to join <strong>${tenantName}</strong> on MarketOps as a <strong>${role}</strong>.
              </p>

              <p style="margin: 0 0 24px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                MarketOps is a comprehensive platform for managing facility operations, maintenance, and assets. Click the button below to accept your invitation and create your account.
              </p>

              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; margin: 0 0 24px;">
                <tr>
                  <td style="text-align: center;">
                    <!--[if mso]>
                    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${inviteLink}" style="height:48px;v-text-anchor:middle;width:220px;" arcsize="13%" strokecolor="#111827" fillcolor="#111827">
                      <w:anchorlock/>
                      <center style="color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;">Accept Invitation</center>
                    </v:roundrect>
                    <![endif]-->
                    <!--[if !mso]><!-->
                    <a href="${inviteLink}" style="display: inline-block; padding: 14px 32px; background-color: #111827; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600;">
                      Accept Invitation
                    </a>
                    <!--<![endif]-->
                  </td>
                </tr>
              </table>

              <!-- Link as fallback -->
              <p style="margin: 0 0 24px; color: #6b7280; font-size: 14px; line-height: 1.6;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="margin: 0 0 24px; color: #111827; font-size: 14px; word-break: break-all;">
                ${inviteLink}
              </p>

              <!-- Warning -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 24px;">
                <tr>
                  <td style="padding: 16px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;" bgcolor="#fef3c7">
                    <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                      <strong>Note:</strong> This invitation link will expire in 7 days for security reasons.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                If you didn't expect this invitation, you can safely ignore this email.
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
                © 2026 MarketOps. All rights reserved.
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
You've been invited to join ${tenantName} on MarketOps

Hi${recipientName ? ` ${recipientName}` : ""},

${inviterName} has invited you to join ${tenantName} on MarketOps as a ${role}.

MarketOps is a comprehensive platform for managing facility operations, maintenance, and assets.

To accept your invitation and create your account, visit:
${inviteLink}

This invitation link will expire in 7 days for security reasons.

If you didn't expect this invitation, you can safely ignore this email.

This email was sent to ${recipientEmail}

© 2026 MarketOps. All rights reserved.
  `.trim();

  return { subject, html, text };
}
