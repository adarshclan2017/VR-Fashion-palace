import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';

export const dynamic = 'force-dynamic';

export async function GET(request, context) {
  try {
    await connectDB();
    const params = await context.params;
    const id = params?.id;
    const product = await Product.findById(id);
    if (!product) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, product });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request, context) {
  try {
    await connectDB();
    const params = await context.params;
    const id = params?.id;
    const body = await request.json();

    const product = await Product.findById(id);
    if (!product) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    if (body.name) product.name = body.name.trim();
    if (body.section) product.section = body.section;
    if (body.category) product.category = body.category;
    if (body.size) product.size = body.size;
    if (body.color) product.color = body.color;
    if (body.fabric) product.fabric = body.fabric;
    if (body.brand) product.brand = body.brand;
    if (body.barcode !== undefined) product.barcode = body.barcode;
    if (body.mrp !== undefined) product.mrp = Number(body.mrp);
    if (body.costPrice !== undefined) product.costPrice = Number(body.costPrice);
    if (body.sellingPrice !== undefined) product.sellingPrice = Number(body.sellingPrice);
    if (body.gstRate !== undefined) product.gstRate = Number(body.gstRate);
    if (body.hsnCode) product.hsnCode = body.hsnCode;
    if (body.minStockAlert !== undefined) product.minStockAlert = Number(body.minStockAlert);

    // Stock direct update or delta
    if (body.stockDelta !== undefined) {
      product.currentStock = Math.max(0, (product.currentStock || 0) + Number(body.stockDelta));
    } else if (body.currentStock !== undefined) {
      product.currentStock = Math.max(0, Number(body.currentStock));
    }

    await product.save();
    return NextResponse.json({ success: true, product });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, context) {
  try {
    await connectDB();
    const params = await context.params;
    const id = params?.id;
    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: `"${product.name}" deleted permanently` });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
