const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI =
  process.env.MONGODB_URI ||
  'mongodb+srv://admin:vrfashion123@cluster0.qn5niyl.mongodb.net/textail?retryWrites=true&w=majority&appName=Cluster0';

const sampleProducts = [
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
    name: 'Semi-Stitched Heavy Bridal Lehenga Choli',
    code: 'WMN-LHG-04',
    section: 'Women',
    category: 'Lehengas',
    size: 'Semi-Stitched',
    color: 'Maroon & Gold',
    fabric: 'Velvet & Net',
    brand: 'Royal Boutique',
    unit: 'set',
    mrp: 6500,
    costPrice: 2800,
    sellingPrice: 4299,
    gstRate: 0,
    hsnCode: '6204',
    minStockAlert: 3,
    currentStock: 8,
    barcode: '8901234004',
  },
  {
    name: 'Pure Cotton Printed Daily Wear Kurti',
    code: 'WMN-KRT-05',
    section: 'Women',
    category: 'Kurtis & Tunics',
    size: 'L',
    color: 'Mustard Yellow',
    fabric: '100% Cotton',
    brand: 'VR Collection',
    unit: 'piece',
    mrp: 999,
    costPrice: 280,
    sellingPrice: 599,
    gstRate: 0,
    hsnCode: '6204',
    minStockAlert: 10,
    currentStock: 30,
    barcode: '8901234005',
  },
  {
    name: 'Rayon Gold Foil Printed Flared Gown',
    code: 'WMN-GWN-06',
    section: 'Women',
    category: 'Western & Gowns',
    size: 'M',
    color: 'Royal Blue',
    fabric: 'Heavy Rayon',
    brand: 'VR Collection',
    unit: 'piece',
    mrp: 1799,
    costPrice: 520,
    sellingPrice: 1099,
    gstRate: 0,
    hsnCode: '6204',
    minStockAlert: 5,
    currentStock: 15,
    barcode: '8901234006',
  },
  {
    name: 'Stretchable Premium Cotton Lycra Leggings',
    code: 'WMN-BTM-07',
    section: 'Women',
    category: 'Bottom Wear',
    size: 'Free Size',
    color: 'Jet Black',
    fabric: 'Cotton Lycra 4-way',
    brand: 'Comfort Fit',
    unit: 'piece',
    mrp: 499,
    costPrice: 140,
    sellingPrice: 299,
    gstRate: 0,
    hsnCode: '6108',
    minStockAlert: 15,
    currentStock: 45,
    barcode: '8901234007',
  },
  {
    name: 'Chanderi Silk Party Wear Dupatta with Tassels',
    code: 'WMN-DUP-08',
    section: 'Women',
    category: 'Dupattas & Stoles',
    size: '2.25 Mtr',
    color: 'Blush Pink',
    fabric: 'Chanderi',
    brand: 'VR Collection',
    unit: 'piece',
    mrp: 699,
    costPrice: 180,
    sellingPrice: 399,
    gstRate: 0,
    hsnCode: '6214',
    minStockAlert: 8,
    currentStock: 20,
    barcode: '8901234008',
  },

  // --- KIDS GIRLS ---
  {
    name: 'Girls Sequin Fluffy Net Princess Party Frock',
    code: 'KID-FRK-01',
    section: 'Kids Girls',
    category: 'Frocks & Gowns',
    size: '4-5 Yrs',
    color: 'Baby Pink',
    fabric: 'Satin & Multi-layer Net',
    brand: 'Little Princess',
    unit: 'piece',
    mrp: 1899,
    costPrice: 550,
    sellingPrice: 1199,
    gstRate: 0,
    hsnCode: '6204',
    minStockAlert: 5,
    currentStock: 14,
    barcode: '8901234009',
  },
  {
    name: 'Kids Girls Brocade Traditional Lehenga Choli Set',
    code: 'KID-LHG-02',
    section: 'Kids Girls',
    category: 'Ethnic Sets',
    size: '6-7 Yrs',
    color: 'Peacock Blue & Gold',
    fabric: 'Brocade & Silk Blend',
    brand: 'VR Kids Festive',
    unit: 'set',
    mrp: 2499,
    costPrice: 850,
    sellingPrice: 1599,
    gstRate: 0,
    hsnCode: '6204',
    minStockAlert: 4,
    currentStock: 10,
    barcode: '8901234010',
  },
  {
    name: 'Girls 100% Cotton Printed Top & Denim Dungaree Set',
    code: 'KID-DNG-03',
    section: 'Kids Girls',
    category: 'Western & Casuals',
    size: '3-4 Yrs',
    color: 'Yellow / Indigo Blue',
    fabric: 'Soft Cotton & Denim',
    brand: 'Tiny Trendz',
    unit: 'set',
    mrp: 1299,
    costPrice: 380,
    sellingPrice: 799,
    gstRate: 0,
    hsnCode: '6204',
    minStockAlert: 6,
    currentStock: 16,
    barcode: '8901234011',
  },

  // --- KIDS BOYS ---
  {
    name: 'Boys 3-Piece Waistcoat Shirt & Trouser Party Suit',
    code: 'BOY-SUT-01',
    section: 'Kids Boys',
    category: 'Suits & Blazers',
    size: '5-6 Yrs',
    color: 'Navy Blue & White',
    fabric: 'Poly-Cotton & Suiting',
    brand: 'Little Gentlemen',
    unit: 'set',
    mrp: 2299,
    costPrice: 700,
    sellingPrice: 1450,
    gstRate: 0,
    hsnCode: '6203',
    minStockAlert: 5,
    currentStock: 12,
    barcode: '8901234012',
  },
  {
    name: 'Boys Silk Blend Kurta Pajama with Nehru Jacket',
    code: 'BOY-KRT-02',
    section: 'Kids Boys',
    category: 'Ethnic Wear',
    size: '7-8 Yrs',
    color: 'Pista Green & Ivory',
    fabric: 'Jacquard Silk Blend',
    brand: 'VR Kids Festive',
    unit: 'set',
    mrp: 1999,
    costPrice: 620,
    sellingPrice: 1299,
    gstRate: 0,
    hsnCode: '6203',
    minStockAlert: 5,
    currentStock: 14,
    barcode: '8901234013',
  },
  {
    name: 'Boys Superhero Bio-Washed Graphic Cotton T-Shirt',
    code: 'BOY-TEE-03',
    section: 'Kids Boys',
    category: 'T-Shirts & Tops',
    size: '8-9 Yrs',
    color: 'Crimson Red',
    fabric: '100% Combed Cotton',
    brand: 'Tiny Trendz',
    unit: 'piece',
    mrp: 599,
    costPrice: 150,
    sellingPrice: 349,
    gstRate: 0,
    hsnCode: '6109',
    minStockAlert: 10,
    currentStock: 25,
    barcode: '8901234014',
  },

  // --- INFANTS & BABY ---
  {
    name: 'Infant Unisex Organic Cotton Snap-button Romper Set (Pack of 3)',
    code: 'INF-RMP-01',
    section: 'Infants',
    category: 'Rompers & Sleepwear',
    size: '0-6 Months',
    color: 'Multi Pastel',
    fabric: '100% Organic Cotton',
    brand: 'Cuddle Soft',
    unit: 'pack',
    mrp: 999,
    costPrice: 320,
    sellingPrice: 649,
    gstRate: 0,
    hsnCode: '6111',
    minStockAlert: 8,
    currentStock: 20,
    barcode: '8901234015',
  },
  {
    name: 'Baby Girl Soft Net Birthday Tutu Dress with Headband',
    code: 'INF-DRS-02',
    section: 'Infants',
    category: 'Infant Dresses',
    size: '6-12 Months',
    color: 'Peach & Cream',
    fabric: 'Cotton Lining & Ultra-soft Net',
    brand: 'Cuddle Soft',
    unit: 'set',
    mrp: 1399,
    costPrice: 420,
    sellingPrice: 899,
    gstRate: 0,
    hsnCode: '6111',
    minStockAlert: 5,
    currentStock: 12,
    barcode: '8901234016',
  },
];

async function seedAtlas() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to Atlas successfully!');

    const db = mongoose.connection.db;

    // 1. Seed Products
    console.log('Seeding products collection...');
    const productsCol = db.collection('products');
    for (const p of sampleProducts) {
      await productsCol.updateOne(
        { code: p.code },
        { $set: { ...p, updatedAt: new Date() } },
        { upsert: true }
      );
    }
    const productCount = await productsCol.countDocuments();
    console.log(`✓ Products in Atlas: ${productCount}`);

    // 2. Seed Users
    console.log('Seeding users collection...');
    const usersCol = db.collection('users');
    const hashAdmin = await bcrypt.hash('admin123', 10);
    const hashEmp = await bcrypt.hash('emp123', 10);

    await usersCol.updateOne(
      { username: 'admin' },
      {
        $set: {
          username: 'admin',
          password: hashAdmin,
          displayName: 'Shop Owner (Admin)',
          role: 'admin',
          isActive: true,
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );

    await usersCol.updateOne(
      { username: 'employee' },
      {
        $set: {
          username: 'employee',
          password: hashEmp,
          displayName: 'Counter Staff',
          role: 'employee',
          isActive: true,
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );

    const userCount = await usersCol.countDocuments();
    console.log(`✓ Users in Atlas: ${userCount}`);

    console.log('\n🎉 MongoDB Atlas is fully seeded and ready for VR Fashion Palace!');
    process.exit(0);
  } catch (err) {
    console.error('Atlas seeding error:', err);
    process.exit(1);
  }
}

seedAtlas();
