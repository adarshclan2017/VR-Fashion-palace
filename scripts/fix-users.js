const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function fixUsers() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/textail');
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const usersCol = db.collection('users');

    const hashAdmin = await bcrypt.hash('admin123', 10);
    const hashEmp = await bcrypt.hash('emp123', 10);

    // Update or insert admin
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

    // Update or insert employee
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

    const users = await usersCol.find({}).toArray();
    console.log('--- USER ACCOUNTS IN DATABASE ---');
    for (const u of users) {
      const isAdminPass = await bcrypt.compare('admin123', u.password);
      const isEmpPass = await bcrypt.compare('emp123', u.password);
      console.log(`- Username: "${u.username}" | Role: "${u.role}" | Active: ${u.isActive} | admin123: ${isAdminPass} | emp123: ${isEmpPass}`);
    }

    console.log('\nSuccess! Both "admin" and "employee" are now ACTIVE.');
    process.exit(0);
  } catch (err) {
    console.error('Error fixing users:', err);
    process.exit(1);
  }
}

fixUsers();
