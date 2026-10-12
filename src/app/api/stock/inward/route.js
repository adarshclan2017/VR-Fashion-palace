import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import StockInward from '@/models/StockInward';

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();

    const { supplierName, supplierBillNo, items, notes } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ success: false, error: 'At least one item is required' }, { status: 400 });
    }

    const referenceNo = `INW-${Date.now().toString().slice(-6)}`;
    let totalMeters = 0;
    let totalAmount = 0;

    const inwardItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        continue;
      }

      const meters = Number(item.meters) || 0;
      const costPrice = Number(item.costPrice) || product.costPrice;
      const rollNumber = item.rollNumber || `R-${Date.now().toString().slice(-4)}`;

      // Add roll to product
      product.rolls.push({
        rollNumber,
        initialMeters: meters,
        currentMeters: meters,
        batchNo: item.batchNo || supplierBillNo || '',
        status: 'Active',
        addedAt: new Date(),
      });

      // Update currentStock
      product.currentStock = product.rolls.reduce(
        (sum, r) => sum + (r.currentMeters > 0 ? r.currentMeters : 0),
        0
      );

      // Optionally update product cost price if changed
      if (costPrice > 0) {
        product.costPrice = costPrice;
      }

      await product.save();

      totalMeters += meters;
      totalAmount += meters * costPrice;

      inwardItems.push({
        product: product._id,
        productName: product.name,
        code: product.code,
        rollNumber,
        meters,
        costPrice,
        batchNo: item.batchNo || supplierBillNo || '',
      });
    }

    const inwardRecord = new StockInward({
      referenceNo,
      supplierName: supplierName || 'Textile Mill Supplier',
      supplierBillNo: supplierBillNo || '',
      items: inwardItems,
      totalMeters,
      totalAmount,
      notes: notes || '',
    });

    await inwardRecord.save();

    return NextResponse.json({ success: true, inwardRecord }, { status: 201 });
  } catch (error) {
    console.error('Error recording inward stock:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    await connectDB();
    const inwards = await StockInward.find().sort({ createdAt: -1 }).limit(50);
    return NextResponse.json({ success: true, inwards });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
