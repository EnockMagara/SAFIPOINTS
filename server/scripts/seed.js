require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');
const { connectXRPL, disconnectXRPL } = require('../config/xrpl');
const WalletService = require('../services/WalletService');
const TokenService = require('../services/TokenService');
const Merchant = require('../models/Merchant');
const Customer = require('../models/Customer');

const MERCHANTS = [
  { name: 'Kilimanjaro Grill', email: 'kili@demo.com', phone: '+254700000001' },
  { name: 'Safari Bites', email: 'safari@demo.com', phone: '+254700000002' },
  { name: 'Nairobi Spice', email: 'spice@demo.com', phone: '+254700000003' },
];

const CUSTOMERS = [
  { name: 'Jane Wanjiku', phone: '+254711111111', email: 'jane@demo.com' },
  { name: 'John Kamau', phone: '+254722222222', email: 'john@demo.com' },
  { name: 'Grace Achieng', phone: '+254733333333', email: 'grace@demo.com' },
];

async function seed() {
  console.log('\n  SafiPoints Seed Script\n  ======================\n');

  await connectDB();
  await connectXRPL();

  // Clear existing data
  await Promise.all([
    Merchant.deleteMany({}),
    Customer.deleteMany({}),
    mongoose.model('LoyaltyTransaction').deleteMany({}),
    mongoose.model('RedemptionRequest').deleteMany({}),
  ]);
  console.log('  Cleared existing data\n');

  // Create merchants
  const merchants = [];
  for (const m of MERCHANTS) {
    console.log(`  Creating merchant: ${m.name}...`);
    const wallet = await WalletService.createWallet();
    const merchant = await Merchant.create({
      name: m.name,
      slug: m.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      email: m.email,
      password: await bcrypt.hash('demo1234', 12),
      phone: m.phone,
      xrplAddress: wallet.address,
      xrplSeedEnc: wallet.seedEnc,
    });
    merchants.push(merchant);
    console.log(`    XRPL: ${wallet.address}\n`);
  }

  // Create customers with trust lines to first merchant
  const customers = [];
  for (const c of CUSTOMERS) {
    console.log(`  Creating customer: ${c.name}...`);
    const walletData = await WalletService.createCustomerWallet(merchants[0].xrplAddress);
    const customer = await Customer.create({
      name: c.name,
      phone: c.phone,
      email: c.email,
      xrplAddress: walletData.address,
      xrplSeedEnc: walletData.seedEnc,
      trustLineSet: walletData.trustLineSet,
      enrolledMerchants: [merchants[0]._id],
    });
    customers.push(customer);
    console.log(`    XRPL: ${walletData.address} | Trust: ${walletData.trustLineSet}\n`);
  }

  // Issue some test tokens
  console.log('  Issuing test SAFI tokens...\n');
  const fullMerchant = await Merchant.findById(merchants[0]._id).select('+xrplSeedEnc');

  for (let i = 0; i < customers.length; i++) {
    const fullCust = await Customer.findById(customers[i]._id).select('+xrplSeedEnc');
    const amounts = [100, 250, 500];
    console.log(`  Issuing ${amounts[i]} SAFI to ${fullCust.name}...`);

    const result = await TokenService.issueTokens({
      merchant: fullMerchant,
      customer: fullCust,
      amount: amounts[i],
      fiatAmount: amounts[i] * 10,
      metadata: { source: 'seed' },
    });
    console.log(`    Tx: ${result.xrplTxHash}\n`);
  }

  console.log('  ─────────────────────────────────');
  console.log('  Seed complete!\n');
  console.log('  Demo credentials:');
  console.log('  ─────────────────');
  console.log('  Merchant login: kili@demo.com / demo1234');
  console.log('  Customer login: +254711111111 (Jane)');
  console.log(`  Merchant ID: ${merchants[0]._id}`);
  console.log('');

  await disconnectXRPL();
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
