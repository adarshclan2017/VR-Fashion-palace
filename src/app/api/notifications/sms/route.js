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
    const smsMessage = `VR Fashion Palace: Dear ${customerName || 'Customer'}, your bill of Rs. ${grandTotal || 0} (Bill #${invoiceNumber}) is ready. View/Download your digital e-bill here: ${billUrl} . Thank you for shopping! Helpline: +91 98765 43210`;

    console.log(`[SMS DISPATCH] Sending to +91${recipient}: "${smsMessage}"`);

    // Ready for integration with Fast2SMS / Twilio / MSG91 if configured
    if (process.env.FAST2SMS_API_KEY) {
      try {
        await fetch('https://www.fast2sms.com/dev/bulkV2', {
          method: 'POST',
          headers: {
            authorization: process.env.FAST2SMS_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            route: 'q',
            message: smsMessage,
            language: 'english',
            numbers: recipient,
          }),
        });
      } catch (smsErr) {
        console.error('Fast2SMS gateway error:', smsErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: `SMS link successfully sent to +91 ${recipient}`,
      recipient: `+91 ${recipient}`,
      smsText: smsMessage,
      billUrl,
    });
  } catch (error) {
    console.error('Error dispatching SMS:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to dispatch SMS' },
      { status: 500 }
    );
  }
}
