const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const TARGET_URI = process.argv[2] || process.env.MONGODB_URI;
const BACKUP_DIR = path.join(__dirname, '../data-backup');

if (!TARGET_URI) {
  console.error('Error: Please provide a target MongoDB connection URI.');
  console.log('Usage: node scripts/import-data.js "mongodb+srv://<user>:<password>@cluster0.xxx.mongodb.net/textail"');
  process.exit(1);
}

async function importData() {
  try {
    const safeTarget = TARGET_URI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
    console.log('Connecting to target database:', safeTarget);
    await mongoose.connect(TARGET_URI);

    const db = mongoose.connection.db;
    const collections = ['users', 'products', 'sales', 'stockinwards'];

    for (const colName of collections) {
      const filePath = path.join(BACKUP_DIR, `${colName}.json`);
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf-8');
        const docs = JSON.parse(raw);

        if (docs.length > 0) {
          // Clean existing collection before import
          await db.collection(colName).deleteMany({});
          // Insert docs
          await db.collection(colName).insertMany(docs);
          console.log(`✓ Imported ${docs.length} documents into "${colName}"`);
        } else {
          console.log(`- Skipped "${colName}" (0 documents)`);
        }
      }
    }

    console.log('\nData migration to cloud database completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Import failed:', err);
    process.exit(1);
  }
}

importData();
