/**
 * Seed demo menu items for an existing merchant.
 *
 * Usage:  node scripts/seed-menu.js <merchant-slug>
 * If no slug is provided, seeds all merchants.
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Merchant = require('../models/Merchant');
const MenuItem = require('../models/MenuItem');

const DEMO_MENUS = {
  kenyan: [
    { name: 'Nyama Choma',      price: 850,  category: 'Mains',    emoji: '🥩', description: 'Slow-roasted goat ribs with kachumbari' },
    { name: 'Ugali & Sukuma',   price: 350,  category: 'Mains',    emoji: '🌽', description: 'Classic Kenyan staple with sautéed greens' },
    { name: 'Pilau',            price: 450,  category: 'Mains',    emoji: '🍚', description: 'Spiced rice with tender beef pieces' },
    { name: 'Fish Fry (Tilapia)', price: 650, category: 'Mains',   emoji: '🐟', description: 'Whole fried tilapia with ugali & greens' },
    { name: 'Chicken Biryani',  price: 550,  category: 'Mains',    emoji: '🍗', description: 'Fragrant rice layered with spiced chicken' },
    { name: 'Chapati (2pc)',    price: 80,   category: 'Sides',    emoji: '🫓', description: 'Soft layered Kenyan flatbread' },
    { name: 'Kachumbari',       price: 100,  category: 'Sides',    emoji: '🥗', description: 'Fresh tomato, onion & coriander salad' },
    { name: 'Mukimo',           price: 200,  category: 'Sides',    emoji: '🥔', description: 'Mashed potatoes with corn, peas & greens' },
    { name: 'Mandazi (3pc)',    price: 120,  category: 'Desserts',  emoji: '🍩', description: 'East African coconut doughnuts' },
    { name: 'Chai Masala',      price: 100,  category: 'Drinks',   emoji: '🍵', description: 'Spiced Kenyan milk tea' },
    { name: 'Fresh Mango Juice',price: 200,  category: 'Drinks',   emoji: '🥭', description: 'Freshly blended mango' },
    { name: 'Tusker Lager',     price: 300,  category: 'Drinks',   emoji: '🍺', description: 'Kenya\'s favourite lager' },
    { name: 'Stoney Tangawizi', price: 120,  category: 'Drinks',   emoji: '🥤', description: 'Ginger beer soda' },
  ],
};

async function seedMenu(slug) {
  await connectDB();

  const filter = slug ? { slug } : {};
  const merchants = await Merchant.find(filter);

  if (!merchants.length) {
    console.log(slug ? `No merchant found with slug "${slug}"` : 'No merchants in database. Register one first.');
    process.exit(1);
  }

  for (const merchant of merchants) {
    const existingCount = await MenuItem.countDocuments({ merchant: merchant._id });
    if (existingCount > 0) {
      console.log(`  ⏭  ${merchant.name} already has ${existingCount} menu items — skipping`);
      continue;
    }

    const items = DEMO_MENUS.kenyan.map((item, i) => ({
      ...item,
      merchant: merchant._id,
      sortOrder: i,
    }));

    await MenuItem.insertMany(items);
    console.log(`  ✓  Seeded ${items.length} items for "${merchant.name}" (${merchant.slug})`);
  }

  console.log('\nDone. Customers can now visit: /m/<slug>');
  process.exit(0);
}

const slug = process.argv[2];
seedMenu(slug).catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
