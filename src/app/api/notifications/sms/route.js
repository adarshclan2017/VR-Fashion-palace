import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json();
    const { phone, invoiceNumber, customerName, grandTotal, billUrl } = body;

    const cleanPhone = (phone || '').replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      return NextResponse.json(
        { success: false, error: 'A valid 10-digit mobile number is required' },
        { status: 400 }
      );
    }

    const recipient = cleanPhone.slice(-10);

    // DLT registered message template — must match the approved template exactly.
    // The {#var#} placeholders will be replaced with actual values when sending via Fast2SMS DLT route.
    const smsMessage =
      `V.R. Fashion Palace: Dear ${customerName || 'Customer'}, your bill of Rs. ${grandTotal || 0}` +
      ` (Bill #${invoiceNumber}) is ready. View/Download digital e-bill: ${billUrl}` +
      ` Thank you for shopping! Contact: 8903940644`;

    console.log(`[SMS DISPATCH] Sending to +91${recipient}: "${smsMessage}"`);

    if (!process.env.FAST2SMS_API_KEY) {
      // No API key configured — log and return mock success for development
      console.warn('[SMS] FAST2SMS_API_KEY not set. Skipping actual SMS dispatch.');
      return NextResponse.json({
        success: true,
        message: `[DEV] SMS would be sent to +91 ${recipient}`,
        recipient: `+91 ${recipient}`,
        smsText: smsMessage,
        billUrl,
        note: 'Configure FAST2SMS_API_KEY in .env.local to enable real SMS delivery.',
      });
    }

    // ─── Choose route ────────────────────────────────────────────────────────
    // If DLT Sender ID + Template ID are configured → use registered DLT route
    // Otherwise → fall back to Quick (non-DLT) route (for testing only)
    // ─────────────────────────────────────────────────────────────────────────
    const senderId   = process.env.FAST2SMS_SENDER_ID;   // e.g. "VRFASH"
    const templateId = process.env.FAST2SMS_TEMPLATE_ID; // DLT Template ID from TRAI portal

    let smsPayload;
    let route;

    if (senderId && templateId) {
      // ✅ DLT Registered Route — mandatory in India for business SMS
      route = 'dlt';
      smsPayload = {
        route: 'dlt',
        sender_id: senderId,
        message: smsMessage,
        variables_values: '', // No variable substitution needed (message is complete)
        schedule_time: '',
        numbers: recipient,
        ...(process.env.FAST2SMS_ENTITY_ID && { entity_id: process.env.FAST2SMS_ENTITY_ID }),
        template_id: templateId,
      };
    } else {
      // ⚠️  Quick Route — only works for testing / non-commercial use without DLT
      route = 'q';
      smsPayload = {
        route: 'q',
        message: smsMessage,
        language: 'english',
        numbers: recipient,
      };
      console.warn(
        '[SMS] Using Fast2SMS Quick route. Set FAST2SMS_SENDER_ID + FAST2SMS_TEMPLATE_ID in .env.local for DLT registered SMS.'
      );
    }

    let gatewayResponse = null;
    try {
      const fast2smsRes = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          authorization: process.env.FAST2SMS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(smsPayload),
      });

      gatewayResponse = await fast2smsRes.json();
      console.log(`[SMS] Fast2SMS (${route}) response:`, gatewayResponse);

      if (!fast2smsRes.ok || gatewayResponse?.return === false) {
        return NextResponse.json(
          {
            success: false,
            error: gatewayResponse?.message?.[0] || 'Fast2SMS gateway rejected the request',
            gateway: gatewayResponse,
          },
          { status: 502 }
        );
      }
    } catch (smsErr) {
      console.error('[SMS] Fast2SMS gateway error:', smsErr);
      return NextResponse.json(
        { success: false, error: 'Failed to reach Fast2SMS gateway: ' + smsErr.message },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `SMS sent to +91 ${recipient} via ${route === 'dlt' ? 'Registered DLT' : 'Quick'} route`,
      recipient: `+91 ${recipient}`,
      smsText: smsMessage,
      billUrl,
      gateway: gatewayResponse,
    });
  } catch (error) {
    console.error('Error dispatching SMS:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to dispatch SMS' },
      { status: 500 }
    );
  }
}
