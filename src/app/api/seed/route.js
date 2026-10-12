import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import Sale from '@/models/Sale';

export const sampleProducts = [
  // --- WOMEN WEAR ---
  {
    name: 'Zari Embroidered Silk Anarkali Suit Set',
    code: 'WMN-ARK-01',
    section: 'Women',
    category: 'Ethnic Sets',
    size: 'XL',
    color: 'Wine Red',
    fabric: 'Chanderi Silk',
    brand: 'VR Collection',
    unit: 'set',
    mrp: 2999,
    costPrice: 1200,
    sellingPrice: 1899,
    gstRate: 0,
    hsnCode: '6204',
    minStockAlert: 5,
    currentStock: 18,
    barcode: '8901234001',
  },
  {
    name: 'Chikankari Georgette Flared Kurti',
    code: 'WMN-KRT-02',
    section: 'Women',
    category: 'Kurtis & Tunics',
    size: 'M',
    color: 'Lavender',
    fabric: 'Georgette',
    brand: 'VR Collection',
    unit: 'piece',
    mrp: 1499,
    costPrice: 450,
    sellingPrice: 899,
    gstRate: 0,
    hsnCode: '6204',
    minStockAlert: 8,
    currentStock: 25,
    barcode: '8901234002',
  },
  {
    name: 'Banarasi Katan Silk Saree with Blouse Piece',
    code: 'WMN-SAR-03',
    section: 'Women',
    category: 'Sarees',
    size: 'Free Size',
    color: 'Emerald Green',
    fabric: 'Katan Silk',
    brand: 'VR Collection',
    unit: 'set',
    mrp: 3800,
    costPrice: 1500,
    sellingPrice: 2450,
    gstRate: 0,
    hsnCode: '5007',
    minStockAlert: 4,
    currentStock: 12,
    barcode: '8901234003',
  },
  {
    name: 'Bridal Velvet Flared Party Lehenga Choli',
    code: 'WMN-LHG-04',
    section: 'Women',
    category: 'Lehengas',
    size: 'Semi-Stitched',
    color: 'Ruby Maroon',
    fabric: 'Velvet & Net',
    brand: 'VR Royal',
    unit: 'set',
    mrp: 7500,
    costPrice: 2800,
    sellingPrice: 4999,
    gstRate: 0,
    hsnCode: '6204',
    minStockAlert: 3,
    currentStock: 8,
    barcode: '8901234004',
  },
  {
    name: 'Pure Cotton Daily Wear Kurti & Pant Pair',
    code: 'WMN-SET-05',
    section: 'Women',
    category: 'Ethnic Sets',
    size: 'L',
    color: 'Mustard Yellow',
    fabric: '100% Cotton',
    brand: 'VR Collection',
    unit: 'set',
    mrp: 1699,
    costPrice: 550,
    sellingPrice: 1099,
    gstRate: 0,
    hsnCode: '6204',
    minStockAlert: 6,
    currentStock: 30,
    barcode: '8901234005',
  },
  {
    name: 'Floral Bohemian Tiered Maxi Dress',
    code: 'WMN-DRS-06',
    section: 'Women',
    category: 'Western Dresses',
    size: 'M',
    color: 'Blush Pink',
    fabric: 'Rayon Viscose',
    brand: 'VR Chic',
    unit: 'piece',
    mrp: 1899,
    costPrice: 600,
    sellingPrice: 1250,
    gstRate: 0,
    hsnCode: '6204',
    minStockAlert: 5,
    currentStock: 20,
    barcode: '8901234006',
  },
  {
    name: '4-Way Stretch Ankle Leggings (Pack of 2)',
    code: 'WMN-LEG-07',
    section: 'Women',
    category: 'Bottoms & Leggings',
    size: 'Free Size',
    color: 'Black & Maroon',
    fabric: 'Cotton Lycra',
    brand: 'Comfort Fit',
    unit: 'set',
    mrp: 699,
    costPrice: 220,
    sellingPrice: 449,
    gstRate: 0,
    hsnCode: '6104',
    minStockAlert: 10,
    currentStock: 45,
    barcode: '8901234007',
  },
  {
    name: 'Designer Organza Floral Dupatta',
    code: 'WMN-DUP-08',
    section: 'Women',
    category: 'Dupattas & Stoles',
    size: '2.5 Meter',
    color: 'Peach Gold',
    fabric: 'Pure Organza',
    brand: 'VR Royal',
    unit: 'piece',
    mrp: 999,
    costPrice: 280,
    sellingPrice: 599,
    gstRate: 0,
    hsnCode: '6214',
    minStockAlert: 5,
    currentStock: 22,
    barcode: '8901234008',
  },

  // --- KIDS GIRLS ---
  {
    name: 'Princess Layered Tutu Net Party Frock',
    code: 'KID-FRK-01',
    section: 'Kids Girls',
    category: 'Kids Frocks',
    size: '3-4Y',
    color: 'Powder Pink',
    fabric: 'Soft Net & Satin',
    brand: 'Little Princess',
    unit: 'piece',
    mrp: 1599,
    costPrice: 480,
    sellingPrice: 999,
    gstRate: 0,
    hsnCode: '6209',
    minStockAlert: 5,
    currentStock: 20,
    barcode: '8901234009',
  },
  {
    name: 'Girls Traditional Silk Pavada Lehenga Set',
    code: 'KID-LHG-02',
    section: 'Kids Girls',
    category: 'Kids Ethnic',
    size: '5-6Y',
    color: 'Rani Pink & Gold',
    fabric: 'Art Silk',
    brand: 'Festive Tots',
    unit: 'set',
    mrp: 1850,
    costPrice: 620,
    sellingPrice: 1299,
    gstRate: 0,
    hsnCode: '6209',
    minStockAlert: 4,
    currentStock: 15,
    barcode: '8901234010',
  },
  {
    name: 'Girls Denim Dungaree with Striped Inner Top',
    code: 'KID-DNG-03',
    section: 'Kids Girls',
    category: 'Kids Casual',
    size: '4-5Y',
    color: 'Denim Blue',
    fabric: 'Cotton Denim',
    brand: 'Mini Chic',
    unit: 'set',
    mrp: 1299,
    costPrice: 380,
    sellingPrice: 850,
    gstRate: 0,
    hsnCode: '6209',
    minStockAlert: 5,
    currentStock: 18,
    barcode: '8901234011',
  },

  // --- KIDS BOYS ---
  {
    name: 'Boys Designer Modi Jacket Kurta-Pajama 3pc Set',
    code: 'KID-KRT-04',
    section: 'Kids Boys',
    category: 'Boys Ethnic',
    size: '4-5Y',
    color: 'Navy & Cream',
    fabric: 'Jacquard Silk Blend',
    brand: 'Prince Collection',
    unit: 'set',
    mrp: 1899,
    costPrice: 580,
    sellingPrice: 1250,
    gstRate: 0,
    hsnCode: '6209',
    minStockAlert: 5,
    currentStock: 16,
    barcode: '8901234012',
  },
  {
    name: 'Boys Casual Polo Tee & Chino Shorts Set',
    code: 'KID-TEE-05',
    section: 'Kids Boys',
    category: 'Boys Casual',
    size: '6-7Y',
    color: 'Mint & Khaki',
    fabric: '100% Combed Cotton',
    brand: 'Tiny Trendz',
    unit: 'set',
    mrp: 1099,
    costPrice: 320,
    sellingPrice: 699,
    gstRate: 0,
    hsnCode: '6209',
    minStockAlert: 6,
    currentStock: 24,
    barcode: '8901234013',
  },
  {
    name: 'Boys Slim-Fit Stretch Denim Jeans',
    code: 'KID-JNS-06',
    section: 'Kids Boys',
    category: 'Boys Bottoms',
    size: '8-9Y',
    color: 'Dark Indigo',
    fabric: 'Stretch Denim',
    brand: 'Urban Kids',
    unit: 'piece',
    mrp: 1299,
    costPrice: 400,
    sellingPrice: 799,
    gstRate: 0,
    hsnCode: '6203',
    minStockAlert: 5,
    currentStock: 20,
    barcode: '8901234014',
  },

  // --- INFANTS & TODDLERS ---
  {
    name: 'Infant Organic Cotton Romper & Bib Set (Pack of 2)',
    code: 'INF-RMP-01',
    section: 'Infants',
    category: 'Infant Wear',
    size: '0-6M',
    color: 'Pastel Yellow & Sky',
    fabric: '100% Organic Cotton',
    brand: 'BabyCuddle',
    unit: 'set',
    mrp: 899,
    costPrice: 240,
    sellingPrice: 549,
    gstRate: 0,
    hsnCode: '6209',
    minStockAlert: 8,
    currentStock: 28,
    barcode: '8901234015',
  },
  {
    name: 'Infant Warm Fleece Bunny Jumpsuit',
    code: 'INF-JMP-02',
    section: 'Infants',
    category: 'Infant Wear',
    size: '6-12M',
    color: 'Teddy Beige',
    fabric: 'Soft Fleece',
    brand: 'BabyCuddle',
    unit: 'piece',
    mrp: 1199,
    costPrice: 360,
    sellingPrice: 799,
    gstRate: 0,
    hsnCode: '6209',
    minStockAlert: 4,
    currentStock: 14,
    barcode: '8901234016',
  },
];

export async function POST() {
  try {
    await connectDB();

    // Clear old products and sales
    await Product.deleteMany({});
    await Sale.deleteMany({});

    // Insert Products with 0 GST
    const createdProducts = await Product.insertMany(sampleProducts);

    // Generate 28 realistic past sales without GST
    const customerNames = [
      'Pooja Sharma', 'Anjali Desai', 'Neha Patel', 'Priya Kulkarni', 'Meena Shah',
      'Kavita Reddy', 'Deepika Verma', 'Ritu Agarwal', 'Sneha Joshi', 'Sunita Joshi',
      'Sunil Mehta', 'Rajesh Gupta', 'Vikram Rathore', 'Aarav Malhotra', 'Pankaj Varma'
    ];

    const paymentModes = ['UPI', 'Cash', 'Card', 'UPI', 'UPI', 'Cash'];
    const pastSales = [];
    const now = new Date();

    for (let i = 0; i < 28; i++) {
      const daysAgo = Math.floor((i / 28) * 30);
      const saleDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000 - Math.random() * 36000000);

      // Pick 1 to 3 random items
      const itemCount = Math.random() > 0.4 ? (Math.random() > 0.6 ? 3 : 2) : 1;
      const shuffled = [...createdProducts].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, itemCount);

      let subtotal = 0;
      const items = [];

      for (const prod of selected) {
        const qty = Math.floor(Math.random() * 2) + 1;
        const rate = prod.sellingPrice;
        const discountPct = Math.random() > 0.7 ? 5 : 0;
        const discAmt = (rate * qty * discountPct) / 100;
        const total = rate * qty - discAmt;

        subtotal += total;

        items.push({
          product: prod._id,
          name: prod.name,
          code: prod.code,
          section: prod.section,
          category: prod.category,
          size: prod.size,
          color: prod.color,
          quantity: qty,
          unit: prod.unit,
          rate,
          discountPercent: discountPct,
          discountAmount: discAmt,
          taxableAmount: total,
          gstRate: 0,
          cgst: 0,
          sgst: 0,
          igst: 0,
          total,
        });
      }

      const grandTotal = Math.round(subtotal);
      const invoiceNum = `INV-${String(i + 1).padStart(4, '0')}`;
      const customer = customerNames[Math.floor(Math.random() * customerNames.length)];

      pastSales.push({
        invoiceNumber: invoiceNum,
        customer: {
          name: customer,
          phone: `98${Math.floor(10000000 + Math.random() * 89999999)}`,
          address: 'Main City Center',
          gstin: '',
        },
        items,
        subtotal: grandTotal,
        totalDiscount: 0,
        totalTax: 0,
        roundOff: 0,
        grandTotal,
        paymentMode: paymentModes[Math.floor(Math.random() * paymentModes.length)],
        paymentStatus: 'Paid',
        notes: 'Thank you for shopping at VR Fashion Palace - Women & Kids Wear!',
        createdAt: saleDate,
        updatedAt: saleDate,
      });
    }

    await Sale.insertMany(pastSales);

    return NextResponse.json({
      success: true,
      message: `Seeded ${createdProducts.length} Women & Kids Wear products and ${pastSales.length} historical invoices without GST!`,
      productsCount: createdProducts.length,
      salesCount: pastSales.length,
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
