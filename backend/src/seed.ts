import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const backendDir = path.resolve(currentDir, '..');
dotenv.config({ path: path.join(backendDir, '.env') });
dotenv.config({ path: path.join(backendDir, '.env.local') });

async function seed() {
  const { getDb } = await import('./db/index.js');
  const { users, sellerProfiles, products } = await import('./db/schema.js');

  const db = getDb();
  console.log('Connected to Neon PostgreSQL! Seeding initial data...');

  const passwordHash = await bcrypt.hash('admin123', 10);

  // 1. Create Administrator
  const [admin] = await db.insert(users).values({
    email: 'admin@agrimarket.co.za',
    name: 'AgriMarket Administrator',
    passwordHash,
    role: 'admin',
    phone: '+27 (0)11 555 0100',
    city: 'Johannesburg',
    province: 'Gauteng',
    emailVerifiedAt: new Date(),
  }).onConflictDoNothing().returning();

  console.log('✓ Administrator account ready (admin@agrimarket.co.za / admin123)');

  // 2. Create Sample Seller
  const sellerPassword = await bcrypt.hash('seller123', 10);
  const [seller] = await db.insert(users).values({
    email: 'seller@valleygreen.co.za',
    name: 'Tendai Ndlovu',
    passwordHash: sellerPassword,
    role: 'seller',
    phone: '+27 (0)15 516 4320',
    city: 'Levubu',
    province: 'Limpopo',
    emailVerifiedAt: new Date(),
  }).onConflictDoNothing().returning();

  if (seller) {
    await db.insert(sellerProfiles).values({
      userId: seller.id,
      businessName: 'Valley Green Agri Cooperative',
      representativeRole: 'Lead Producer & Director',
      registrationNumber: '2018/492104/24',
      farmAddress: 'Plot 14, Levubu Agricultural Hub, Limpopo',
      province: 'Limpopo',
      primarySector: 'Fresh Vegetables & Subtropical Fruits',
      farmSize: '420 Hectares Under Drip Irrigation',
      verificationStatus: 'Verified',
      reviewedAt: new Date(),
    }).onConflictDoNothing();

    // 3. Create Sample Verified Product
    await db.insert(products).values({
      sellerId: seller.id,
      name: 'Fresh Grade A Jam Tomatoes',
      slug: 'fresh-grade-a-jam-tomatoes-sample',
      category: 'Fresh Vegetables',
      subcategory: 'Tomatoes',
      province: 'Limpopo',
      priceCents: 14000,
      priceUnit: '10kg Wooden Crate',
      minimumQuantity: 10,
      stockQuantity: 450,
      stockStatus: 'In Stock',
      description: 'Firm, sun-ripened Roma/Jam tomatoes graded for supermarket distribution and commercial kitchens.',
      image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=800&q=80',
      availableForDelivery: true,
      availableForCollection: true,
      status: 'active',
    }).onConflictDoNothing();
  }

  // 4. Create Sample Buyer
  const buyerPassword = await bcrypt.hash('buyer123', 10);
  await db.insert(users).values({
    email: 'buyer@freshmark.co.za',
    name: 'Wholesale Buyer',
    passwordHash: buyerPassword,
    role: 'buyer',
    phone: '+27 (0)11 992 4000',
    city: 'Centurion',
    province: 'Gauteng',
    emailVerifiedAt: new Date(),
  }).onConflictDoNothing();

  console.log('✓ Seed completed successfully!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});

