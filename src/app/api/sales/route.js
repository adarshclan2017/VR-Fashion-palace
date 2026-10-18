import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Sale from '@/models/Sale';
import Product from '@/models/Product';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const paymentMode = searchParams.get('paymentMode');

    const filter = {};

    if (q) {
      filter.$or = [
        { invoiceNumber: { $regex: q, $options: 'i' } },
        { 'customer.name': { $regex: q, $options: 'i' } },
        { 'customer.phone': { $regex: q, $options: 'i' } },
      ];
    }

    if (paymentMode && paymentMode !== 'All') {
      filter.paymentMode = paymentMode;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const sales = await Sale.find(filter).sort({ createdAt: -1 }).limit(100);
    return NextResponse.json({ success: true, count: sales.length, sales });
  } catch (error) {
    console.error('Error fetching sales from MongoDB:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const { customer, items, paymentMode, paymentStatus, notes } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ success: false, error: 'At least one item is required' }, { status: 400 });
    }

    // Auto generate continuous sequential invoice number: 0001, 0002, 0003...
    // Does NOT reset on new day - continues perpetually from highest existing bill number
    const salesWithNumbers = await Sale.find({}, { invoiceNumber: 1 }).lean();
    let maxNum = 0;
    for (const s of salesWithNumbers) {
      if (s.invoiceNumber) {
        const match = s.invoiceNumber.match(/(\d+)$/);
        if (match) {
          const val = parseInt(match[1], 10);
          if (!isNaN(val) && val > maxNum) {
            maxNum = val;
          }
        }
      }
    }
    const nextSeq = maxNum + 1;
    const invoiceNumber = String(nextSeq).padStart(4, '0');

    let subtotal = 0;
    let totalDiscount = 0;
    const processedItems = [];

    // Verify and deduct stock in MongoDB for each item
    for (const item of items) {
      const prodId = item.product || item.productId || item._id;
      let product = null;

      if (prodId) {
        product = await Product.findById(prodId);
      }

      if (!product && item.code) {
        product = await Product.findOne({ code: item.code.toUpperCase() });
      }

      const qty = Number(item.quantity) || 1;
      const rate = Number(item.rate) || (product ? product.sellingPrice : 0);
      const discountPct = Number(item.discountPercent) || 0;
      const baseAmount = qty * rate;
      const discountAmt = (baseAmount * discountPct) / 100;
      const lineTotal = baseAmount - discountAmt;

      subtotal += lineTotal;
      totalDiscount += discountAmt;

      // If product exists in MongoDB, deduct its stock
      if (product) {
        // Direct stock deduction for readymade apparel
        product.currentStock = Math.max(0, (product.currentStock || 0) - qty);
        product.totalSoldQuantity = (product.totalSoldQuantity || 0) + qty;

        // If product has rolls (unstitched materials), deduct from active rolls
        if (product.rolls && product.rolls.length > 0) {
          let remainingToDeduct = qty;
          for (const roll of product.rolls) {
            if (roll.status === 'Active' && roll.currentMeters > 0) {
              const deduct = Math.min(roll.currentMeters, remainingToDeduct);
              roll.currentMeters -= deduct;
              remainingToDeduct -= deduct;
              if (roll.currentMeters <= 0) {
                roll.currentMeters = 0;
                roll.status = 'Depleted';
              }
              if (remainingToDeduct <= 0) break;
            }
          }
        }

        await product.save();
      }

      processedItems.push({
        product: product ? product._id : null,
        name: item.name || (product ? product.name : 'Fashion Item'),
        code: item.code || (product ? product.code : 'SKU'),
        section: item.section || (product ? product.section : 'Women'),
        category: item.category || (product ? product.category : 'Apparel'),
        size: item.size || (product ? product.size : 'Free Size'),
        color: item.color || (product ? product.color : ''),
        rollNumber: item.rollNumber || '',
        quantity: qty,
        unit: item.unit || (product ? product.unit : 'piece'),
        rate,
        discountPercent: discountPct,
        discountAmount: discountAmt,
        taxableAmount: lineTotal,
        gstRate: 0,
        cgst: 0,
        sgst: 0,
        igst: 0,
        total: lineTotal,
      });
    }

    const grandTotal = Math.round(subtotal);
    const roundOff = Math.round((grandTotal - subtotal) * 100) / 100;

    // Get the employee who created this bill
    let createdBy = { userId: '', username: '', displayName: 'Admin' };
    try {
      const user = await getCurrentUser();
      if (user) {
        createdBy = {
          userId:      String(user._id || ''),
          username:    user.username || '',
          displayName: user.name || user.username || 'Admin',
        };
      }
    } catch (_) {}

    // Create and save Sale in MongoDB
    const sale = new Sale({
      invoiceNumber,
      customer: {
        name: customer?.name?.trim() || 'Walk-in Customer',
        phone: customer?.phone?.trim() || '',
        address: customer?.address?.trim() || '',
        gstin: '',
      },
      items: processedItems,
      subtotal: Math.round(subtotal * 100) / 100,
      totalDiscount: Math.round(totalDiscount * 100) / 100,
      totalTax: 0,
      roundOff,
      grandTotal,
      paymentMode: paymentMode || 'UPI',
      paymentStatus: paymentStatus || 'Paid',
      notes: notes || 'Thank you for shopping at V.R. Fashion Palace!',
      createdBy,
    });

    await sale.save();

    console.log(`[MongoDB] Sale saved successfully: ${sale.invoiceNumber} | Total: ₹${sale.grandTotal}`);

    return NextResponse.json({ success: true, sale }, { status: 201 });
  } catch (error) {
    console.error('Error saving sale to MongoDB:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await connectDB();
    const result = await Sale.deleteMany({});
    console.log(`[MongoDB] Reset completed: Deleted ${result.deletedCount} sales`);
    return NextResponse.json({
      success: true,
      message: `Deleted ${result.deletedCount} invoices. Dashboard & invoice numbering reset to 0001 for new billing.`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error('Error resetting sales:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

