const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/textail';

const RollSchema = new mongoose.Schema({
  rollNumber: { type: String, required: true },
  initialMeters: { type: Number, required: true, default: 0 },
  currentMeters: { type: Number, required: true, default: 0 },
  batchNo: { type: String, default: '' },
  status: { type: String, enum: ['Active', 'Depleted'], default: 'Active' },
  addedAt: { type: Date, default: Date.now },
});

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    category: { type: String, required: true, default: 'Cotton' },
    pattern: { type: String, default: 'Plain' },
    color: { type: String, default: 'Standard' },
    width: { type: String, default: '44 inch' },
    unit: { type: String, default: 'meter' },
    costPrice: { type: Number, required: true, default: 0 },
    sellingPrice: { type: Number, required: true, default: 0 },
    gstRate: { type: Number, default: 5 },
    hsnCode: { type: String, default: '5208' },
    minStockAlert: { type: Number, default: 20 },
    currentStock: { type: Number, default: 0 },
    rolls: [RollSchema],
    totalSoldMeters: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const SaleItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  name: { type: String, required: true },
  code: { type: String, required: true },
  category: { type: String, default: 'Cotton' },
  rollNumber: { type: String, default: '' },
  quantity: { type: Number, required: true },
  unit: { type: String, default: 'meter' },
  rate: { type: Number, required: true },
  discountPercent: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  taxableAmount: { type: Number, required: true },
  gstRate: { type: Number, default: 5 },
  cgst: { type: Number, default: 0 },
  sgst: { type: Number, default: 0 },
  igst: { type: Number, default: 0 },
  total: { type: Number, required: true },
});

const SaleSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, required: true, unique: true, uppercase: true },
    customer: {
      name: { type: String, default: 'Walk-in Customer' },
      phone: { type: String, default: '' },
      address: { type: String, default: '' },
      gstin: { type: String, default: '' },
    },
    items: [SaleItemSchema],
    subtotal: { type: Number, required: true },
    totalDiscount: { type: Number, default: 0 },
    totalTax: { type: Number, default: 0 },
    roundOff: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },
    paymentMode: { type: String, default: 'Cash' },
    paymentStatus: { type: String, default: 'Paid' },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);
const Sale = mongoose.models.Sale || mongoose.model('Sale', SaleSchema);

const sampleFabrics = [
  {
    name: 'Pure Cotton Shirting 60s',
    code: 'COT-601',
    category: 'Cotton',
    pattern: 'Micro Checks',
    color: 'Sky Blue',
    width: '58 inch',
    unit: 'meter',
    costPrice: 160,
    sellingPrice: 240,
    gstRate: 5,
    hsnCode: '5208',
    minStockAlert: 30,
    rolls: [
      { rollNumber: 'R-COT-01', initialMeters: 60, currentMeters: 45.5, status: 'Active' },
      { rollNumber: 'R-COT-02', initialMeters: 55, currentMeters: 55.0, status: 'Active' },
      { rollNumber: 'R-COT-03', initialMeters: 60, currentMeters: 18.0, status: 'Active' },
    ],
  },
  {
    name: 'Banarasi Katan Silk Brocade',
    code: 'SLK-104',
    category: 'Silk',
    pattern: 'Zari Floral Motif',
    color: 'Royal Crimson',
    width: '44 inch',
    unit: 'meter',
    costPrice: 850,
    sellingPrice: 1250,
    gstRate: 5,
    hsnCode: '5007',
    minStockAlert: 15,
    rolls: [
      { rollNumber: 'R-SLK-01', initialMeters: 25, currentMeters: 12.5, status: 'Active' },
      { rollNumber: 'R-SLK-02', initialMeters: 25, currentMeters: 22.0, status: 'Active' },
    ],
  },
  {
    name: 'Irish Pure Linen 60 Lea',
    code: 'LIN-302',
    category: 'Linen',
    pattern: 'Plain Slub',
    color: 'Natural Oatmeal',
    width: '58 inch',
    unit: 'meter',
    costPrice: 420,
    sellingPrice: 650,
    gstRate: 5,
    hsnCode: '5309',
    minStockAlert: 25,
    rolls: [
      { rollNumber: 'R-LIN-01', initialMeters: 50, currentMeters: 14.0, status: 'Active' },
      { rollNumber: 'R-LIN-02', initialMeters: 45, currentMeters: 40.5, status: 'Active' },
    ],
  },
  {
    name: 'Rayon 14kg Gold Foil Print',
    code: 'RAY-205',
    category: 'Rayon',
    pattern: 'Jaipuri Boota Print',
    color: 'Mustard Yellow',
    width: '44 inch',
    unit: 'meter',
    costPrice: 85,
    sellingPrice: 145,
    gstRate: 5,
    hsnCode: '5408',
    minStockAlert: 40,
    rolls: [
      { rollNumber: 'R-RAY-01', initialMeters: 80, currentMeters: 8.5, status: 'Active' },
      { rollNumber: 'R-RAY-02', initialMeters: 75, currentMeters: 11.0, status: 'Active' },
    ],
  },
  {
    name: 'Indigo Denim Stretch 12oz',
    code: 'DNM-401',
    category: 'Denim',
    pattern: 'Twill Weave',
    color: 'Deep Indigo',
    width: '58 inch',
    unit: 'meter',
    costPrice: 220,
    sellingPrice: 350,
    gstRate: 5,
    hsnCode: '5209',
    minStockAlert: 20,
    rolls: [
      { rollNumber: 'R-DNM-01', initialMeters: 50, currentMeters: 38.0, status: 'Active' },
    ],
  },
  {
    name: 'Viscose Georgette 60g Dyeable',
    code: 'GEO-501',
    category: 'Georgette',
    pattern: 'Plain',
    color: 'Bleached White',
    width: '44 inch',
    unit: 'meter',
    costPrice: 110,
    sellingPrice: 180,
    gstRate: 5,
    hsnCode: '5407',
    minStockAlert: 20,
    rolls: [
      { rollNumber: 'R-GEO-01', initialMeters: 60, currentMeters: 52.0, status: 'Active' },
    ],
  },
  {
    name: 'Micro Velvet 9000 Premium',
    code: 'VEL-901',
    category: 'Velvet',
    pattern: 'Solid Soft Pile',
    color: 'Bottle Green',
    width: '44 inch',
    unit: 'meter',
    costPrice: 290,
    sellingPrice: 480,
    gstRate: 5,
    hsnCode: '5801',
    minStockAlert: 15,
    rolls: [
      { rollNumber: 'R-VEL-01', initialMeters: 30, currentMeters: 6.0, status: 'Active' },
    ],
  },
  {
    name: 'Italian Merino Wool Suiting',
    code: 'WOL-701',
    category: 'Wool',
    pattern: 'Houndstooth',
    color: 'Charcoal Grey',
    width: '58 inch',
    unit: 'meter',
    costPrice: 950,
    sellingPrice: 1600,
    gstRate: 5,
    hsnCode: '5112',
    minStockAlert: 10,
    rolls: [
      { rollNumber: 'R-WOL-01', initialMeters: 35, currentMeters: 28.5, status: 'Active' },
    ],
  },
  {
    name: 'Satin Silk Crepe Soft Sheen',
    code: 'SAT-802',
    category: 'Satin',
    pattern: 'Plain Lustrous',
    color: 'Blush Pink',
    width: '44 inch',
    unit: 'meter',
    costPrice: 140,
    sellingPrice: 220,
    gstRate: 5,
    hsnCode: '5007',
    minStockAlert: 25,
    rolls: [
      { rollNumber: 'R-SAT-01', initialMeters: 50, currentMeters: 42.0, status: 'Active' },
    ],
  },
  {
    name: 'Organic Khadi Handspun Cotton',
    code: 'KHD-101',
    category: 'Cotton',
    pattern: 'Plain Texture',
    color: 'Natural Off-White',
    width: '44 inch',
    unit: 'meter',
    costPrice: 190,
    sellingPrice: 290,
    gstRate: 5,
    hsnCode: '5208',
    minStockAlert: 20,
    rolls: [
      { rollNumber: 'R-KHD-01', initialMeters: 40, currentMeters: 31.0, status: 'Active' },
    ],
  },
];

async function seed() {
  console.log('Connecting to MongoDB at:', MONGODB_URI);
  await mongoose.connect(MONGODB_URI);
  console.log('Connected! Clearing old data...');

  await Product.deleteMany({});
  await Sale.deleteMany({});

  const insertedProducts = [];
  for (const fab of sampleFabrics) {
    const currentStock = fab.rolls.reduce((sum, r) => sum + r.currentMeters, 0);
    const prod = new Product({
      ...fab,
      currentStock,
      totalSoldMeters: 0,
    });
    await prod.save();
    insertedProducts.push(prod);
  }

  console.log(`Inserted ${insertedProducts.length} textile fabrics.`);

  const customerNames = [
    'Sharma Designers',
    'Rajesh Boutiques',
    'Pooja Sarees & Fabrics',
    'Vikram Tailoring Co.',
    'Meera Exports',
    'Aarti Fashions',
    'Anand Garments',
    'Sunil Textile Emporium',
    'Walk-in Retail Buyer',
    'Kapoor Suiting & Shirting',
  ];

  const paymentModes = ['Cash', 'UPI', 'UPI', 'Card', 'Credit/Due'];
  const now = new Date();

  for (let i = 24; i >= 1; i--) {
    const daysAgo = Math.floor((i * 28) / 24);
    const saleDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000 - Math.random() * 8 * 3600 * 1000);

    const numItems = Math.floor(Math.random() * 2) + 1;
    const items = [];
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;

    for (let j = 0; j < numItems; j++) {
      const prod = insertedProducts[(i + j) % insertedProducts.length];
      const meters = Number((Math.floor(Math.random() * 15) + 3.5).toFixed(1));
      const rate = prod.sellingPrice;
      const baseAmount = meters * rate;
      const discountPct = Math.random() > 0.6 ? 5 : 0;
      const discountAmt = Number(((baseAmount * discountPct) / 100).toFixed(2));
      const taxable = Number((baseAmount - discountAmt).toFixed(2));
      const gstRate = prod.gstRate || 5;
      const taxAmt = Number(((taxable * gstRate) / 100).toFixed(2));
      const cgst = Number((taxAmt / 2).toFixed(2));
      const sgst = Number((taxAmt / 2).toFixed(2));
      const lineTotal = Number((taxable + taxAmt).toFixed(2));

      subtotal += baseAmount;
      totalDiscount += discountAmt;
      totalTax += taxAmt;

      items.push({
        product: prod._id,
        name: prod.name,
        code: prod.code,
        category: prod.category,
        rollNumber: prod.rolls[0]?.rollNumber || 'R-01',
        quantity: meters,
        unit: 'meter',
        rate,
        discountPercent: discountPct,
        discountAmount: discountAmt,
        taxableAmount: taxable,
        gstRate,
        cgst,
        sgst,
        igst: 0,
        total: lineTotal,
      });

      prod.totalSoldMeters = (prod.totalSoldMeters || 0) + meters;
    }

    const unrounded = subtotal - totalDiscount + totalTax;
    const grandTotal = Math.round(unrounded);
    const roundOff = Number((grandTotal - unrounded).toFixed(2));

    const customerName = customerNames[i % customerNames.length];
    const invNumber = `INV-${saleDate.getFullYear().toString().slice(-2)}${String(saleDate.getMonth() + 1).padStart(2, '0')}-${String(25 - i).padStart(4, '0')}`;

    const sale = new Sale({
      invoiceNumber: invNumber,
      customer: {
        name: customerName,
        phone: `+91 98${Math.floor(10000000 + Math.random() * 90000000)}`,
        address: 'Ring Road Market, Surat',
        gstin: Math.random() > 0.5 ? `24AAAAA${1000 + i}A1Z5` : '',
      },
      items,
      subtotal: Number(subtotal.toFixed(2)),
      totalDiscount: Number(totalDiscount.toFixed(2)),
      totalTax: Number(totalTax.toFixed(2)),
      roundOff,
      grandTotal,
      paymentMode: paymentModes[i % paymentModes.length],
      paymentStatus: 'Paid',
      createdAt: saleDate,
      updatedAt: saleDate,
    });

    await sale.save();
  }

  for (const p of insertedProducts) {
    await p.save();
  }

  console.log('Seeding complete! 24 sales and 10 fabric products created.');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
