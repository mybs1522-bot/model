import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

const VAULT_URL = process.env.VITE_VAULT_URL || 'https://www.avada3d.com/vault';

/**
 * Send access delivery email via Resend
 * @param {string} toEmail - Buyer's email address
 * @param {'starter' | 'vip' | 'vip_trial'} planType - Plan purchased
 */
export async function sendDeliveryEmail(toEmail, planType = 'vip_trial') {
  if (!resend || !toEmail) {
    console.warn('Resend not configured or missing recipient email');
    return { success: false, reason: 'Resend not configured or missing email' };
  }

  const accessKey = `AVADA-VIP-${toEmail.split('@')[0].toUpperCase()}-2026`;
  const vaultLink = VAULT_URL;

  const subject = '🔥 Your AVADA 3D Member Vault Access is Ready — Instant Unlocked Link';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 24px;">
        <div style="max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          
          <!-- Header -->
          <div style="background: #09090b; padding: 28px 32px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">
              AVADA <span style="color: #10b981;">3D VAULT</span>
            </h1>
            <p style="color: #a1a1aa; font-size: 13px; margin: 6px 0 0 0;">
              Private Member Vault Access Unlocked
            </p>
          </div>

          <!-- Content Body -->
          <div style="padding: 32px;">
            <h2 style="font-size: 18px; font-weight: 700; color: #0f172a; margin: 0 0 12px 0;">
              Welcome to Your SketchUp Master Vault! 🚀
            </h2>
            <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 24px 0;">
              Your trial / VIP membership is now active! You have instant unrestricted access to browse, preview, and download all <strong>15,000+ SketchUp (.SKP) scene models</strong>, 8K PBR textures, and weekly additions directly inside your private Member Vault.
            </p>

            <!-- Vault Access CTA Button -->
            <div style="text-align: center; margin: 28px 0;">
              <a href="${vaultLink}" target="_blank" style="display: inline-block; background-color: #10b981; color: #000000; text-decoration: none; font-size: 15px; font-weight: 800; padding: 14px 28px; border-radius: 12px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
                🔓 Open AVADA 3D Member Vault
              </a>
            </div>

            <!-- Details Box -->
            <div style="background: #f1f5f9; border-radius: 12px; padding: 18px 20px; margin: 24px 0; font-size: 13px;">
              <div style="margin-bottom: 8px;">
                <strong style="color: #334155;">Vault Access URL:</strong> 
                <a href="${vaultLink}" target="_blank" style="color: #059669; font-weight: 700; text-decoration: none;">${vaultLink}</a>
              </div>
              <div style="margin-bottom: 8px;">
                <strong style="color: #334155;">Registered Member Email:</strong> ${toEmail}
              </div>
              <div style="margin-bottom: 8px;">
                <strong style="color: #334155;">Access Level:</strong> 
                <span style="background: #dcfce7; color: #166534; padding: 2px 8px; border-radius: 9999px; font-weight: bold; font-size: 12px;">Full VIP Unlocked (15,000+ Models)</span>
              </div>
              <div>
                <strong style="color: #334155;">Member Key:</strong> 
                <code style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-weight: bold; color: #0f172a;">${accessKey}</code>
              </div>
            </div>

            <p style="font-size: 12px; color: #64748b; line-height: 1.5; margin: 20px 0 0 0;">
              💡 <em>Tip: Bookmark the Member Vault link (<a href="${vaultLink}" style="color: #059669; font-weight: 600;">${vaultLink}</a>) to download new scene models and weekly drops anytime. Need help? Reply directly to this email.</em>
            </p>
          </div>

          <!-- Footer -->
          <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 32px; text-align: center; font-size: 11px; color: #94a3b8;">
            © 2026 AVADA 3D. 100% Commercial License Included.
          </div>
        </div>
      </body>
    </html>
  `;

  // Determine sender: prioritize custom verified sender from env, fallback gracefully
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'AVADA 3D <onboarding@resend.dev>';

  try {
    const data = await resend.emails.send({
      from: fromEmail,
      to: [toEmail],
      subject,
      html: htmlContent,
    });
    console.log('Resend email sent successfully:', data);
    return { success: true, data };
  } catch (err) {
    console.error('Resend delivery note:', err);
    // If custom domain failed, try fallback to onboarding@resend.dev
    if (fromEmail !== 'AVADA 3D <onboarding@resend.dev>') {
      try {
        const fallbackData = await resend.emails.send({
          from: 'AVADA 3D <onboarding@resend.dev>',
          to: [toEmail],
          subject,
          html: htmlContent,
        });
        return { success: true, data: fallbackData };
      } catch (fallbackErr) {
        console.error('Fallback email delivery error:', fallbackErr);
      }
    }
    return { success: false, error: err.message };
  }
}
