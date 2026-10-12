const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const LOCAL_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/textail';
const BACKUP_DIR = path.join(__dirname, '../data-backup');

async function exportData() {
  try {
    console.log('Connecting to local database:', LOCAL_URI);
    await mongoose.connect(LOCAL_URI);

    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    const db = mongoose.connection.db;
    const collections = ['users', 'products', 'sales', 'stockinwards'];

    for (const colName of collections) {
      const docs = await db.collection(colName).find({}).toArray();
      const filePath = path.join(BACKUP_DIR, `${colName}.json`);
      fs.writeFileSync(filePath, JSON.stringify(docs, null, 2), 'utf-8');
      console.log(`✓ Exported ${docs.length} records from "${colName}" to ${filePath}`);
    }

    console.log('\nAll data exported successfully to data-backup/ folder!');
    process.exit(0);
  } catch (err) {
    console.error('Export failed:', err);
    process.exit(1);
  }
}

exportData();
