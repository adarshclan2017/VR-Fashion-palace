import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    const section = searchParams.get('section');
    const category = searchParams.get('category');
    const lowStock = searchParams.get('lowStock') === 'true';

    const filter = { isActive: true };

    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { code: { $regex: q, $options: 'i' } },
        { color: { $regex: q, $options: 'i' } },
        { size: { $regex: q, $options: 'i' } },
        { fabric: { $regex: q, $options: 'i' } },
        { brand: { $regex: q, $options: 'i' } },
        { barcode: { $regex: q, $options: 'i' } },
      ];
    }

    if (section && section !== 'All') {
      filter.section = section;
    }

    if (category && category !== 'All') {
      filter.category = category;
    }

    let products = await Product.find(filter).sort({ createdAt: -1 });

    if (lowStock) {
      products = products.filter((p) => (p.currentStock || 0) <= (p.minStockAlert || 5));
    }

    return NextResponse.json({ success: true, count: products.length, products });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();

    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ success: false, error: 'Product name is required' }, { status: 400 });
    }

    let code = (body.code || '').toUpperCase().trim();
    if (!code) {
      const secPrefix = ((body.section || 'VR').replace(/[^a-zA-Z]/g, '').slice(0, 3) || 'VR').toUpperCase();
      code = `${secPrefix}-${Date.now().toString().slice(-6)}`;
    }

    // Check if code already exists
    const existing = await Product.findOne({ code });
    if (existing) {
      if (body.code && body.code.trim()) {
        return NextResponse.json({ success: false, error: `Outfit code '${code}' already exists` }, { status: 400 });
      }
      code = `${code}-${Math.floor(100 + Math.random() * 900)}`;
    }

    const currentStock = Number(body.currentStock) || Number(body.initialStock) || 0;
    const section = (body.section || 'Women').trim();
    const category = (body.category || 'General').trim() || 'General';

    const product = new Product({
      name: body.name.trim(),
      code,
      section,
      category,
      size: body.size || 'Free Size',
      color: body.color || 'Standard',
      fabric: body.fabric || 'Cotton',
      brand: body.brand || 'VR Collection',
      unit: body.unit || 'piece',
      mrp: Number(body.mrp) || Number(body.sellingPrice) || 0,
      costPrice: Number(body.costPrice) || 0,
      sellingPrice: Number(body.sellingPrice) || 0,
      gstRate: Number(body.gstRate) || 0,
      hsnCode: body.hsnCode || '6204',
      minStockAlert: Number(body.minStockAlert) || 5,
      barcode: body.barcode || '',
      currentStock,
    });

    await product.save();
    return NextResponse.json({ success: true, product }, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
