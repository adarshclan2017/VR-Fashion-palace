import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Sale from '@/models/Sale';
import Product from '@/models/Product';

export async function GET() {
  try {
    await connectDB();

    const now = new Date();

    // Start of Today
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Start of Week (Monday)
    const dayOfWeek = now.getDay();
    const diffToMonday = (dayOfWeek + 6) % 7;
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday);

    // Start of Month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Today's sales
    const todaySales = await Sale.find({ createdAt: { $gte: startOfToday } });
    const todayRevenue = todaySales.reduce((acc, s) => acc + s.grandTotal, 0);
    const todayUnits = todaySales.reduce(
      (acc, s) => acc + s.items.reduce((sum, item) => sum + (item.quantity || 1), 0),
      0
    );

    // This week's sales
    const weekSales = await Sale.find({ createdAt: { $gte: startOfWeek } });
    const weekRevenue = weekSales.reduce((acc, s) => acc + s.grandTotal, 0);
    const weekUnits = weekSales.reduce(
      (acc, s) => acc + s.items.reduce((sum, item) => sum + (item.quantity || 1), 0),
      0
    );

    // This month's sales
    const monthSales = await Sale.find({ createdAt: { $gte: startOfMonth } });
    const monthRevenue = monthSales.reduce((acc, s) => acc + s.grandTotal, 0);
    const monthUnits = monthSales.reduce(
      (acc, s) => acc + s.items.reduce((sum, item) => sum + (item.quantity || 1), 0),
      0
    );

    // Women vs Kids breakdown over all sales this month
    let womenRevenue = 0;
    let kidsRevenue = 0;

    monthSales.forEach((s) => {
      s.items.forEach((it) => {
        if (it.section === 'Women' || it.category?.includes('Saree') || it.category?.includes('Kurti')) {
          womenRevenue += it.total || 0;
        } else {
          kidsRevenue += it.total || 0;
        }
      });
    });

    // If month sales is early, take last 30 days
    if (womenRevenue === 0 && kidsRevenue === 0) {
      const allSales = await Sale.find().sort({ createdAt: -1 }).limit(30);
      allSales.forEach((s) => {
        s.items.forEach((it) => {
          if (it.section === 'Women' || it.category?.includes('Saree') || it.category?.includes('Kurti')) {
            womenRevenue += it.total || 0;
          } else {
            kidsRevenue += it.total || 0;
          }
        });
      });
    }

    // Products & Inventory Stats
    const products = await Product.find({ isActive: true });
    let totalStockUnits = 0;
    let inventoryCostValue = 0;
    let inventoryRetailValue = 0;
    const lowStockItems = [];

    for (const p of products) {
      const stock = p.currentStock || 0;
      totalStockUnits += stock;
      inventoryCostValue += (p.costPrice || 0) * stock;
      inventoryRetailValue += (p.sellingPrice || 0) * stock;
      if (stock <= (p.minStockAlert || 5)) {
        lowStockItems.push({
          _id: p._id,
          name: p.name,
          code: p.code,
          section: p.section || 'Women',
          category: p.category,
          size: p.size || 'Free',
          currentStock: stock,
          minStockAlert: p.minStockAlert || 5,
          unit: p.unit || 'piece',
          sellingPrice: p.sellingPrice,
        });
      }
    }

    // Last 7 days trend for chart
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i, 23, 59, 59, 999);
      const daySales = await Sale.find({ createdAt: { $gte: d, $lte: dEnd } });
      const rev = daySales.reduce((acc, s) => acc + s.grandTotal, 0);
      const units = daySales.reduce(
        (acc, s) => acc + s.items.reduce((sum, it) => sum + (it.quantity || 1), 0),
        0
      );
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
      last7Days.push({
        date: dayName,
        revenue: rev,
        units,
        orders: daySales.length,
      });
    }

    // Recent 6 sales
    const recentSales = await Sale.find().sort({ createdAt: -1 }).limit(6);

    return NextResponse.json({
      success: true,
      stats: {
        todayRevenue,
        todayOrders: todaySales.length,
        todayUnits,
        weekRevenue,
        weekOrders: weekSales.length,
        weekUnits,
        monthRevenue,
        monthOrders: monthSales.length,
        monthUnits,
        womenRevenue: Math.round(womenRevenue),
        kidsRevenue: Math.round(kidsRevenue),
        totalProducts: products.length,
        totalStockUnits,
        inventoryCostValue: Math.round(inventoryCostValue),
        inventoryRetailValue: Math.round(inventoryRetailValue),
        lowStockCount: lowStockItems.length,
        lowStockItems: lowStockItems.slice(0, 8),
      },
      last7Days,
      recentSales,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
