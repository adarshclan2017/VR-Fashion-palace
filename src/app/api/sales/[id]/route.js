import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Sale from '@/models/Sale';

export const dynamic = 'force-dynamic';

export async function GET(request, context) {
  try {
    await connectDB();
    const params = await context.params;
    const id = params?.id;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    let sale = null;
    if (id.startsWith('INV-')) {
      sale = await Sale.findOne({ invoiceNumber: id });
    } else {
      sale = await Sale.findById(id);
    }

    if (!sale) {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, sale });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
