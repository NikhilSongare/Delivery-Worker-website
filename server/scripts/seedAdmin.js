/**
 * Create an admin user: node scripts/seedAdmin.js you@example.com yourpassword
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const bcrypt = require('bcryptjs');
const { connectDB } = require('../config/db');
const User = require('../models/User');

const email = process.argv[2] || process.env.ADMIN_EMAIL;
const password = process.argv[3] || process.env.ADMIN_PASSWORD;
const name = process.env.ADMIN_NAME || 'Admin';

if (!email || !password) {
  console.error('Usage: node scripts/seedAdmin.js <email> <password>');
  process.exit(1);
}

async function run() {
  await connectDB();
  const hashed = await bcrypt.hash(password, 12);
  await User.findOneAndUpdate(
    { email: email.toLowerCase() },
    {
      name,
      email: email.toLowerCase(),
      phone: process.env.ADMIN_PHONE || '0000000000',
      password: hashed,
      role: 'admin',
      isAvailable: false,
      vehicleType: '',
      isActive: true,
    },
    { upsert: true, new: true }
  );
  console.log('Admin user ready:', email.toLowerCase());
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
