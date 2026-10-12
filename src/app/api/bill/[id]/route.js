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
      return NextResponse.json({ success: false, error: 'Bill identifier is required' }, { status: 400 });
    }

    // Search by invoiceNumber (case-insensitive) or by MongoDB ObjectId
    let sale = await Sale.findOne({ invoiceNumber: id.toUpperCase() });

    if (!sale && id.match(/^[0-9a-fA-F]{24}$/)) {
      sale = await Sale.findById(id);
    }

    if (!sale) {
      return NextResponse.json({ success: false, error: 'Bill not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, sale });
  } catch (error) {
    console.error('Error fetching public bill:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
