/**
 * npm run seed
 * Wipes the demo collections and loads 6 categories, 40 products and 1 admin user.
 * Refuses to run when NODE_ENV=production unless you pass --force.
 */
import bcrypt from 'bcryptjs';
import { env } from '../config/env';
import { connectDB, disconnectDB } from '../config/db';
import { CategoryModel } from '../modules/categories/category.model';
import { ProductModel } from '../modules/products/product.model';
import { UserModel } from '../modules/users/user.model';
import { CartModel } from '../modules/carts/cart.model';
import { OrderModel } from '../modules/orders/order.model';
import { PaymentModel } from '../modules/payments/payment.model';
import { ReviewModel } from '../modules/reviews/review.model';
import { buildProducts, categories } from './data';

async function seed() {
  if (env.NODE_ENV === 'production' && !process.argv.includes('--force')) {
    console.error('Refusing to seed a production database. Re-run with --force if you are sure.');
    process.exit(1);
  }

  await connectDB();

  console.log('🧹 Clearing old data…');
  await Promise.all([
    CategoryModel.deleteMany({}),
    ProductModel.deleteMany({}),
    UserModel.deleteMany({}),
    CartModel.deleteMany({}),
    OrderModel.deleteMany({}),
    PaymentModel.deleteMany({}),
    ReviewModel.deleteMany({}),
  ]);

  // make sure every index in the models exists (unique slugs, SKUs, etc.)
  await Promise.all([CategoryModel, ProductModel, UserModel, CartModel, OrderModel, PaymentModel, ReviewModel].map((m) => m.syncIndexes()));

  console.log('📁 Creating categories…');
  const createdCategories = await CategoryModel.insertMany(categories);
  const idBySlug = new Map<string, unknown>(createdCategories.map((c) => [c.slug, c._id]));

  console.log('📦 Creating products…');
  // create() (not insertMany) so the pre-save hook fills minPrice, maxPrice and totalStock
  const createdProducts = await ProductModel.create(buildProducts(idBySlug));

  console.log('👤 Creating admin user…');
  await UserModel.create({
    name: 'VoltNest Admin',
    email: env.ADMIN_EMAIL,
    passwordHash: await bcrypt.hash(env.ADMIN_PASSWORD, 12),
    role: 'admin',
  });

  console.log('\n✅ Seed complete');
  console.log(`   ${createdCategories.length} categories`);
  console.log(`   ${createdProducts.length} products`);
  console.log(`   1 admin → ${env.ADMIN_EMAIL}`);

  await disconnectDB();
}

seed().catch(async (err) => {
  console.error('❌ Seed failed:', err);
  await disconnectDB().catch(() => undefined);
  process.exit(1);
});
