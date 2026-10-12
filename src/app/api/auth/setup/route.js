import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

// Auto-seed default admin and employee if no users exist
export async function POST() {
  try {
    await connectDB();

    const userCount = await User.countDocuments();
    if (userCount > 0) {
      return NextResponse.json({
        success: false,
        error: 'Users already exist. Use admin panel to manage users.',
        existingCount: userCount,
      });
    }

    // Create default admin
    const admin = new User({
      username: 'admin',
      password: 'admin123',
      displayName: 'Shop Owner (Admin)',
      role: 'admin',
    });
    await admin.save();

    // Create default employee
    const employee = new User({
      username: 'employee',
      password: 'emp123',
      displayName: 'Counter Staff',
      role: 'employee',
    });
    await employee.save();

    return NextResponse.json({
      success: true,
      message: 'Default users created successfully!',
      users: [
        { username: 'admin', password: 'admin123', role: 'admin' },
        { username: 'employee', password: 'emp123', role: 'employee' },
      ],
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
