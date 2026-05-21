const dns = require('dns');
const mongoose = require('mongoose');

function ensureMongoSrvDns() {
  const uri = process.env.MONGO_URI || '';
  if (!uri.startsWith('mongodb+srv://')) return;
  const servers = dns.getServers();
  const extras = ['8.8.8.8', '8.8.4.4', '1.1.1.1'];
  const merged = [...servers];
  for (const s of extras) {
    if (!merged.includes(s)) merged.push(s);
  }
  if (merged.length !== servers.length) {
    dns.setServers(merged);
  }
}

async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI is not set');
  }
  ensureMongoSrvDns();
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
  return mongoose.connection;
}

module.exports = { connectDB };
