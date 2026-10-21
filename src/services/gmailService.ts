import { Order } from '../types';
import { getAccessToken, getCurrentUser } from './gmailAuth';

/**
 * Encodes a UTF-8 string to a base64url-encoded string (RFC 4648 §5).
 * Required by Google Gmail REST API for sending raw RFC 2822 emails.
 */
function encodeBase64Url(str: string): string {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Formats PKR currency amounts cleanly
 */
function formatPKR(val: number): string {
  return `Rs. ${Number(val || 0).toLocaleString()}`;
}

/**
 * Generates an elegant, responsive HTML email template for Revora order confirmations
 */
export function generateOrderEmailHtml(order: Order, storeSupportEmail = 'revoraofficial57@gmail.com'): string {
  const itemsRows = order.items
    .map(
      (item) => `
      <tr style="border-bottom: 1px solid #e5e5e5;">
        <td style="padding: 12px 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; color: #111111;">
          <strong>${item.productName}</strong>
          <div style="font-size: 11px; color: #666666; margin-top: 2px;">
            Type: ${item.clothingType} | Size: ${item.size} | Color: ${item.color} | Qty: ${item.quantity}
          </div>
        </td>
        <td style="padding: 12px 8px; font-family: 'Courier New', Courier, monospace; font-size: 13px; text-align: right; color: #111111; vertical-align: top;">
          ${formatPKR(item.price * item.quantity)}
        </td>
      </tr>
    `
    )
    .join('');

  const paymentBreakdownHtml = order.isPartialPayment
    ? `
      <div style="background-color: #fffbeb; border: 1px solid #fde68a; padding: 14px; margin-top: 16px; border-radius: 4px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="font-size: 12px; font-weight: bold; color: #92400e; text-transform: uppercase; margin-bottom: 8px;">
          Partial Advance Payment Breakdown
        </div>
        <table style="width: 100%; font-size: 12px; color: #78350f;">
          <tr>
            <td>Advance Required (${order.advancePercentage}%):</td>
            <td style="text-align: right; font-weight: bold;">${formatPKR(order.advanceAmount)}</td>
          </tr>
          <tr>
            <td>Amount Received / Paid:</td>
            <td style="text-align: right; font-weight: bold; color: #065f46;">${formatPKR(order.amountReceived)}</td>
          </tr>
          <tr>
            <td>Remaining Balance Due:</td>
            <td style="text-align: right; font-weight: bold; color: #991b1b;">${formatPKR(order.remainingBalance)}</td>
          </tr>
        </table>
        <div style="font-size: 11px; color: #b45309; margin-top: 8px; padding-top: 6px; border-top: 1px dashed #fcd34d;">
          <strong>Balance Terms:</strong> ${order.remainingBalanceDueWhen || 'Payable upon doorstep courier delivery.'}
        </div>
      </div>
    `
    : `
      <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; padding: 12px; margin-top: 16px; border-radius: 4px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; color: #374151;">
        <strong>Payment Method:</strong> ${order.paymentMethod === 'COD' ? 'Cash on Delivery (Pay full order amount to courier at doorstep)' : order.paymentMethod}
      </div>
    `;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Order Confirmation #${order.orderNumber}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 30px 10px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border: 1px solid #e4e4e7; border-radius: 6px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
          <!-- Header -->
          <tr>
            <td style="background-color: #000000; padding: 24px 30px; text-align: center;">
              <h1 style="margin: 0; font-family: Georgia, serif; font-size: 26px; letter-spacing: 4px; color: #ffffff; font-weight: normal; text-transform: uppercase;">
                REVORA
              </h1>
              <p style="margin: 4px 0 0; color: #a1a1aa; font-size: 10px; letter-spacing: 2px; text-transform: uppercase;">
                Premium Apparel Store • Pakistan
              </p>
            </td>
          </tr>

          <!-- Confirmation Banner -->
          <tr>
            <td style="padding: 24px 30px 12px; border-bottom: 1px solid #f4f4f5;">
              <span style="display: inline-block; background-color: #ecfdf5; color: #047857; font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 12px; letter-spacing: 0.5px; text-transform: uppercase;">
                Order Placed Successfully
              </span>
              <h2 style="margin: 12px 0 4px; font-size: 20px; color: #09090b; font-weight: 700;">
                Thank you for your order, ${order.customerName.split(' ')[0]}!
              </h2>
              <p style="margin: 0; font-size: 13px; color: #71717a; line-height: 1.5;">
                We have received your order <strong>#${order.orderNumber}</strong>. Our dispatch team is currently processing your items.
              </p>
            </td>
          </tr>

          <!-- Order Summary Details -->
          <tr>
            <td style="padding: 16px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                <tr>
                  <td width="50%" style="font-size: 12px; color: #71717a; vertical-align: top;">
                    <div style="font-weight: 600; color: #09090b; text-transform: uppercase; font-size: 11px; margin-bottom: 4px;">Delivery Address</div>
                    <div style="color: #27272a; line-height: 1.4;">
                      ${order.customerName}<br>
                      ${order.shippingAddress.address}<br>
                      ${order.shippingAddress.area ? order.shippingAddress.area + ', ' : ''}${order.shippingAddress.city}<br>
                      Phone: ${order.customerPhone}
                    </div>
                  </td>
                  <td width="50%" style="font-size: 12px; color: #71717a; vertical-align: top; text-align: right;">
                    <div style="font-weight: 600; color: #09090b; text-transform: uppercase; font-size: 11px; margin-bottom: 4px;">Order Info</div>
                    <div style="color: #27272a; line-height: 1.4;">
                      <strong>Order #:</strong> ${order.orderNumber}<br>
                      <strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}<br>
                      <strong>Status:</strong> ${order.orderStatus}<br>
                      <strong>Payment:</strong> ${order.paymentMethod}
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Items Table -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-top: 10px;">
                <thead>
                  <tr style="background-color: #f8fafc; border-bottom: 2px solid #e2e8f0;">
                    <th style="padding: 8px; font-size: 11px; text-align: left; text-transform: uppercase; color: #475569; font-weight: 700;">Item & Specification</th>
                    <th style="padding: 8px; font-size: 11px; text-align: right; text-transform: uppercase; color: #475569; font-weight: 700;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsRows}
                </tbody>
              </table>

              <!-- Totals Table -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 16px; font-size: 13px;">
                <tr>
                  <td style="padding: 4px 8px; color: #64748b;">Subtotal:</td>
                  <td style="padding: 4px 8px; text-align: right; font-family: monospace; color: #0f172a;">${formatPKR(order.subtotal)}</td>
                </tr>
                ${
                  order.discount > 0
                    ? `
                  <tr>
                    <td style="padding: 4px 8px; color: #059669;">Discount ${order.discountCode ? '(' + order.discountCode + ')' : ''}:</td>
                    <td style="padding: 4px 8px; text-align: right; font-family: monospace; color: #059669;">-${formatPKR(order.discount)}</td>
                  </tr>`
                    : ''
                }
                <tr>
                  <td style="padding: 4px 8px; color: #64748b;">Shipping Fee:</td>
                  <td style="padding: 4px 8px; text-align: right; font-family: monospace; color: #0f172a;">
                    ${order.deliveryFee === 0 ? 'FREE' : formatPKR(order.deliveryFee)}
                  </td>
                </tr>
                <tr style="border-top: 2px solid #0f172a; font-weight: bold; font-size: 15px;">
                  <td style="padding: 10px 8px; color: #0f172a;">Total Order Value:</td>
                  <td style="padding: 10px 8px; text-align: right; font-family: monospace; color: #0f172a;">${formatPKR(order.total)}</td>
                </tr>
              </table>

              <!-- Payment breakdown -->
              ${paymentBreakdownHtml}

              <!-- Bank info if applicable -->
              ${
                order.selectedBankAccountName
                  ? `
                <div style="margin-top: 14px; padding: 12px; background-color: #f1f5f9; border-radius: 4px; font-size: 12px; color: #334155;">
                  <strong>Transferred via:</strong> ${order.selectedBankAccountName}
                </div>
              `
                  : ''
              }
            </td>
          </tr>

          <!-- Footer / Support -->
          <tr>
            <td style="background-color: #fafafa; border-top: 1px solid #f4f4f5; padding: 24px 30px; text-align: center;">
              <p style="margin: 0 0 6px; font-size: 12px; color: #52525b;">
                Need help or have questions regarding your order?
              </p>
              <p style="margin: 0; font-size: 12px; color: #09090b; font-weight: 500;">
                Email us at <a href="mailto:${storeSupportEmail}" style="color: #000000; text-decoration: underline;">${storeSupportEmail}</a> or WhatsApp at <strong>+92 329 4862442</strong>.
              </p>
              <div style="margin-top: 16px; font-size: 10px; color: #a1a1aa; text-transform: uppercase; letter-spacing: 1px;">
                © ${new Date().getFullYear()} REVORA. All rights reserved.
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Sends order confirmation email via Gmail REST API using the user's OAuth access token.
 */
export async function sendOrderConfirmationEmail(
  order: Order,
  options?: {
    senderEmail?: string;
    customRecipient?: string;
  }
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const accessToken = await getAccessToken();
    const user = getCurrentUser();

    if (!accessToken) {
      return {
        success: false,
        error:
          'No active Google OAuth session. Please click "Sign in with Google" to connect Gmail.',
      };
    }

    const recipient = options?.customRecipient || order.customerEmail || order.shippingAddress.email;
    if (!recipient) {
      return {
        success: false,
        error: 'Customer email address is missing for this order.',
      };
    }

    const senderEmail = options?.senderEmail || user?.email || 'revoraofficial57@gmail.com';
    const emailSubject = `Order Confirmation #${order.orderNumber} - Revora Store`;
    const htmlBody = generateOrderEmailHtml(order, senderEmail);

    // Build raw RFC 2822 email format
    const emailLines = [
      `From: "Revora Store" <${senderEmail}>`,
      `To: ${recipient}`,
      `Subject: ${emailSubject}`,
      `Date: ${new Date().toUTCString()}`,
      `MIME-Version: 1.0`,
      `Content-Type: text/html; charset=UTF-8`,
      `Content-Transfer-Encoding: 7bit`,
      ``,
      htmlBody,
    ];

    const rawEmail = emailLines.join('\r\n');
    const base64UrlEmail = encodeBase64Url(rawEmail);

    // Call Gmail API send endpoint
    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        raw: base64UrlEmail,
      }),
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      const errMsg = errJson?.error?.message || `Gmail API error (${response.status})`;
      console.error('Gmail API send error:', errJson);
      return { success: false, error: errMsg };
    }

    const data = await response.json();
    return {
      success: true,
      messageId: data.id,
    };
  } catch (err: any) {
    console.error('Exception while sending Gmail message:', err);
    return {
      success: false,
      error: err?.message || 'Failed to send email via Gmail.',
    };
  }
}

/**
 * Sends a quick test email to verify Gmail API functionality
 */
export async function sendTestGmailEmail(
  toEmail: string,
  storeSupportEmail = 'revoraofficial57@gmail.com'
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const accessToken = await getAccessToken();
    const user = getCurrentUser();

    if (!accessToken) {
      return {
        success: false,
        error: 'Please sign in with Google first to authenticate Gmail access.',
      };
    }

    const senderEmail = user?.email || storeSupportEmail;
    const testSubject = `Revora Store - Gmail Integration Test (${new Date().toLocaleTimeString()})`;
    const testHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 24px; max-width: 500px; border: 1px solid #e4e4e7; border-radius: 8px;">
        <h2 style="margin-top: 0; color: #09090b;">✓ Gmail Integration Active</h2>
        <p style="color: #52525b; font-size: 14px; line-height: 1.5;">
          This test email confirms that your Revora Store app is successfully connected to the Gmail API and authorized to dispatch customer order confirmation emails!
        </p>
        <div style="background-color: #f4f4f5; padding: 12px; border-radius: 4px; font-family: monospace; font-size: 12px; margin: 16px 0;">
          Sent from: ${senderEmail}<br>
          Recipient: ${toEmail}<br>
          Timestamp: ${new Date().toISOString()}
        </div>
        <p style="color: #71717a; font-size: 12px; margin-bottom: 0;">
          Revora Apparel Store Automation Engine
        </p>
      </div>
    `;

    const emailLines = [
      `From: "Revora Store" <${senderEmail}>`,
      `To: ${toEmail}`,
      `Subject: ${testSubject}`,
      `Date: ${new Date().toUTCString()}`,
      `MIME-Version: 1.0`,
      `Content-Type: text/html; charset=UTF-8`,
      `Content-Transfer-Encoding: 7bit`,
      ``,
      testHtml,
    ];

    const rawEmail = emailLines.join('\r\n');
    const base64UrlEmail = encodeBase64Url(rawEmail);

    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: base64UrlEmail }),
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      return { success: false, error: errJson?.error?.message || `Gmail error (${response.status})` };
    }

    const data = await response.json();
    return { success: true, messageId: data.id };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error sending test email.' };
  }
}
