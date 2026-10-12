import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Sale from '@/models/Sale';

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view') || 'weekly'; // 'weekly' or 'monthly'
    const now = new Date();

    if (view === 'weekly') {
      // Current week (Monday to Sunday)
      const dayOfWeek = now.getDay();
      const diffToMonday = (dayOfWeek + 6) % 7;
      const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);

      // Previous week
      const startOfPrevWeek = new Date(startOfWeek.getTime() - 7 * 24 * 60 * 60 * 1000);
      const endOfPrevWeek = new Date(startOfWeek.getTime() - 1);

      const thisWeekSales = await Sale.find({ createdAt: { $gte: startOfWeek, $lte: endOfWeek } });
      const prevWeekSales = await Sale.find({ createdAt: { $gte: startOfPrevWeek, $lte: endOfPrevWeek } });

      const thisWeekRevenue = thisWeekSales.reduce((acc, s) => acc + s.grandTotal, 0);
      const prevWeekRevenue = prevWeekSales.reduce((acc, s) => acc + s.grandTotal, 0);
      const growthRate =
        prevWeekRevenue > 0
          ? Number((((thisWeekRevenue - prevWeekRevenue) / prevWeekRevenue) * 100).toFixed(1))
          : 0;

      // Day-by-day breakdown
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const dailyBreakdown = days.map((dayName, idx) => {
        const dayStart = new Date(startOfWeek.getTime() + idx * 24 * 60 * 60 * 1000);
        const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000 - 1);

        const salesThatDay = thisWeekSales.filter(
          (s) => new Date(s.createdAt) >= dayStart && new Date(s.createdAt) <= dayEnd
        );

        const rev = salesThatDay.reduce((acc, s) => acc + s.grandTotal, 0);
        const units = salesThatDay.reduce(
          (acc, s) => acc + s.items.reduce((m, item) => m + (item.quantity || 1), 0),
          0
        );

        return {
          day: dayName,
          date: dayStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          revenue: rev,
          units,
          orders: salesThatDay.length,
          avgOrderValue: salesThatDay.length > 0 ? Math.round(rev / salesThatDay.length) : 0,
        };
      });

      // Categories and Section mapping
      const categoryMap = {};
      const sectionMap = { Women: 0, 'Kids Girls': 0, 'Kids Boys': 0, Infants: 0 };
      const productMap = {};
      const paymentMap = { Cash: 0, UPI: 0, Card: 0, 'Credit/Due': 0 };

      for (const sale of thisWeekSales) {
        paymentMap[sale.paymentMode] = (paymentMap[sale.paymentMode] || 0) + sale.grandTotal;

        for (const it of sale.items) {
          const cat = it.category || 'Apparel';
          categoryMap[cat] = (categoryMap[cat] || 0) + (it.total || 0);

          const sec = it.section || (it.category?.includes('Kurti') || it.category?.includes('Saree') ? 'Women' : 'Kids Girls');
          sectionMap[sec] = (sectionMap[sec] || 0) + (it.total || 0);

          if (!productMap[it.name]) {
            productMap[it.name] = { name: it.name, code: it.code, section: sec, size: it.size, units: 0, revenue: 0 };
          }
          productMap[it.name].units += it.quantity || 1;
          productMap[it.name].revenue += it.total || 0;
        }
      }

      const topOutfits = Object.values(productMap)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      const categoryShare = Object.entries(categoryMap).map(([name, value]) => ({
        name,
        value: Math.round(value),
      }));

      return NextResponse.json({
        success: true,
        period: {
          start: startOfWeek.toLocaleDateString(),
          end: endOfWeek.toLocaleDateString(),
          type: 'week',
        },
        summary: {
          totalRevenue: thisWeekRevenue,
          prevRevenue: prevWeekRevenue,
          growthRate,
          totalInvoices: thisWeekSales.length,
          totalUnits: thisWeekSales.reduce((acc, s) => acc + s.items.reduce((m, it) => m + (it.quantity || 1), 0), 0),
          averageBill: thisWeekSales.length > 0 ? Math.round(thisWeekRevenue / thisWeekSales.length) : 0,
        },
        dailyBreakdown,
        topOutfits,
        categoryShare,
        sectionMap,
        paymentDistribution: paymentMap,
      });
    }

    // MONTHLY REPORT
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const startOfMonth = new Date(currentYear, currentMonth, 1, 0, 0, 0);
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);

    const startOfPrevMonth = new Date(currentYear, currentMonth - 1, 1, 0, 0, 0);
    const endOfPrevMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);

    const thisMonthSales = await Sale.find({ createdAt: { $gte: startOfMonth, $lte: endOfMonth } });
    const prevMonthSales = await Sale.find({ createdAt: { $gte: startOfPrevMonth, $lte: endOfPrevMonth } });

    const thisMonthRevenue = thisMonthSales.reduce((acc, s) => acc + s.grandTotal, 0);
    const prevMonthRevenue = prevMonthSales.reduce((acc, s) => acc + s.grandTotal, 0);
    const growthRate =
      prevMonthRevenue > 0
        ? Number((((thisMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100).toFixed(1))
        : 0;

    // 4 Weeks breakdown
    const weeklyBreakdown = [
      { week: 'Week 1 (1-7)', start: 1, end: 7 },
      { week: 'Week 2 (8-14)', start: 8, end: 14 },
      { week: 'Week 3 (15-21)', start: 15, end: 21 },
      { week: 'Week 4 (22+)', start: 22, end: 31 },
    ].map((w) => {
      const salesInWeek = thisMonthSales.filter((s) => {
        const day = new Date(s.createdAt).getDate();
        return day >= w.start && day <= w.end;
      });

      const rev = salesInWeek.reduce((acc, s) => acc + s.grandTotal, 0);
      const units = salesInWeek.reduce(
        (acc, s) => acc + s.items.reduce((m, item) => m + (item.quantity || 1), 0),
        0
      );

      return {
        week: w.week,
        revenue: rev,
        units,
        orders: salesInWeek.length,
      };
    });

    const categoryMap = {};
    const sectionMap = { Women: 0, 'Kids Girls': 0, 'Kids Boys': 0, Infants: 0 };
    const productMap = {};
    const paymentMap = { Cash: 0, UPI: 0, Card: 0, 'Credit/Due': 0 };

    for (const sale of thisMonthSales) {
      paymentMap[sale.paymentMode] = (paymentMap[sale.paymentMode] || 0) + sale.grandTotal;

      for (const it of sale.items) {
        const cat = it.category || 'Apparel';
        categoryMap[cat] = (categoryMap[cat] || 0) + (it.total || 0);

        const sec = it.section || (it.category?.includes('Kurti') || it.category?.includes('Saree') ? 'Women' : 'Kids Girls');
        sectionMap[sec] = (sectionMap[sec] || 0) + (it.total || 0);

        if (!productMap[it.name]) {
          productMap[it.name] = { name: it.name, code: it.code, section: sec, size: it.size, units: 0, revenue: 0 };
        }
        productMap[it.name].units += it.quantity || 1;
        productMap[it.name].revenue += it.total || 0;
      }
    }

    const topOutfits = Object.values(productMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const categoryShare = Object.entries(categoryMap).map(([name, value]) => ({
      name,
      value: Math.round(value),
    }));

    return NextResponse.json({
      success: true,
      period: {
        start: startOfMonth.toLocaleDateString(),
        end: endOfMonth.toLocaleDateString(),
        type: 'month',
        monthName: now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      },
      summary: {
        totalRevenue: thisMonthRevenue,
        prevRevenue: prevMonthRevenue,
        growthRate,
        totalInvoices: thisMonthSales.length,
        totalUnits: thisMonthSales.reduce((acc, s) => acc + s.items.reduce((m, it) => m + (it.quantity || 1), 0), 0),
        averageBill: thisMonthSales.length > 0 ? Math.round(thisMonthRevenue / thisMonthSales.length) : 0,
      },
      weeklyBreakdown,
      topOutfits,
      categoryShare,
      sectionMap,
      paymentDistribution: paymentMap,
    });
  } catch (error) {
    console.error('Sales report error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
