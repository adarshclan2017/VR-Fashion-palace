import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import StoreSettings from '@/models/StoreSettings';

// GET /api/store-settings?key=sections OR ?key=categories
export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (key) {
      const doc = await StoreSettings.findOne({ key });
      return NextResponse.json({ success: true, value: doc ? doc.value : null });
    }

    // Return all settings
    const docs = await StoreSettings.find({});
    const settings = {};
    docs.forEach((d) => { settings[d.key] = d.value; });
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error('Error fetching store settings:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/store-settings  body: { key, value }
export async function POST(request) {
  try {
    await connectDB();
    const { key, value } = await request.json();

    if (!key) {
      return NextResponse.json({ success: false, error: 'key is required' }, { status: 400 });
    }

    // Upsert by key
    const doc = await StoreSettings.findOneAndUpdate(
      { key },
      { key, value },
      { upsert: true, new: true, runValidators: true }
    );

    return NextResponse.json({ success: true, doc });
  } catch (error) {
    console.error('Error saving store settings:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
