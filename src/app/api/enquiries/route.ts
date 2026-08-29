import { NextResponse } from 'next/server';

/**
 * Enquiry sink. Replace the body of this handler with whatever you actually
 * run on — a Google Sheet via Apps Script, a WhatsApp Business webhook, or a
 * CRM. Kept server-side so no credential ever reaches the browser.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body?.name || !body?.society || !body?.phone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // TODO: forward to your CRM / sheet / WhatsApp webhook.
    console.log('[enquiry]', {
      name: body.name,
      society: body.society,
      city: body.city ?? null,
      cars: body.cars ?? null,
      phone: body.phone,
      email: body.email ?? null,
      receivedAt: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
