/**
 * npm run seed            → SAFE: updates categories, products and the admin user.
 *                           Removes categories/products that are no longer in data.ts.
 *                           Never deletes users, carts, orders, payments or reviews.
 *                           Keeps each existing product's id, variant ids, stock,
 *                           sales count and publish date, so carts and orders stay valid.
 *
 * npm run seed -- --reset → DANGER: wipes ALL collections (users, orders, everything)
 *                           and loads a fresh demo database. Asks for confirmation.
 *
 * Refuses to run when NODE_ENV=production unless you also pass --force.
 */
import readline from 'node:readline/promises';
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

const RESET = process.argv.includes('--reset');
const FORCE = process.argv.includes('--force');

async function confirmReset(): Promise<boolean> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question(
    '\n⚠️  --reset will DELETE ALL users, orders, carts, payments and reviews.\n   Type RESET to continue: ',
  );
  rl.close();
  return answer.trim() === 'RESET';
}

async function wipeEverything() {
  console.log('🧹 Wiping all collections…');
  await Promise.all([
    CategoryModel.deleteMany({}),
    ProductModel.deleteMany({}),
    UserModel.deleteMany({}),
    CartModel.deleteMany({}),
    OrderModel.deleteMany({}),
    PaymentModel.deleteMany({}),
    ReviewModel.deleteMany({}),
  ]);
}

async function upsertCategories() {
  console.log('📁 Updating categories…');
  const idBySlug = new Map<string, unknown>();
  for (const c of categories) {
    const doc = await CategoryModel.findOneAndUpdate({ slug: c.slug }, { $set: c }, { upsert: true, new: true });
    idBySlug.set(c.slug, doc._id);
  }
  return idBySlug;
}

async function upsertProducts(idBySlug: Map<string, unknown>) {
  console.log('📦 Updating products…');
  let created = 0;
  let updated = 0;
  const docs = buildProducts(idBySlug);

  for (const doc of docs) {
    const existing = await ProductModel.findOne({ slug: doc.slug });

    if (!existing) {
      // create() so the pre-save hook fills minPrice, maxPrice and totalStock
      await ProductModel.create(doc);
      created++;
      continue;
    }

    // Keep live data: variant ids and stock, sales count, publish date
    const oldVariants = (existing.get('variants') ?? []) as { sku: string; _id: unknown; stock: number }[];
    const variants = doc.variants.map((vr) => {
      const old = oldVariants.find((o) => o.sku === vr.sku);
      return old ? { ...vr, _id: old._id, stock: old.stock } : vr;
    });
    const { salesCount: _sales, publishedAt: _published, ...rest } = doc;

    existing.set({ ...rest, variants });
    await existing.save(); // save() (not updateOne) so the pre-save hook runs
    updated++;
  }

  return { created, updated, slugs: docs.map((d) => d.slug) };
}

/** Removes catalogue items that were deleted from data.ts (customer data is never touched). */
async function pruneCatalogue(productSlugs: string[]) {
  const products = await ProductModel.deleteMany({ slug: { $nin: productSlugs } });
  const cats = await CategoryModel.deleteMany({ slug: { $nin: categories.map((c) => c.slug) } });
  return { products: products.deletedCount ?? 0, categories: cats.deletedCount ?? 0 };
}

async function upsertAdmin() {
  console.log('👤 Updating admin user…');
  const email = env.ADMIN_EMAIL.toLowerCase();
  const passwordHash = await bcrypt.hash(env.ADMIN_PASSWORD, 12);
  const existing = await UserModel.findOne({ email });

  if (existing) {
    existing.set({ passwordHash, role: 'admin' });
    await existing.save();
    return 'updated';
  }

  await UserModel.create({ name: 'VoltNest Admin', email, passwordHash, role: 'admin' });
  return 'created';
}

async function seed() {
  if (env.NODE_ENV === 'production' && !FORCE) {
    console.error('Refusing to seed a production database. Re-run with --force if you are sure.');
    process.exit(1);
  }

  if (RESET && !(await confirmReset())) {
    console.log('Cancelled. Nothing was changed.');
    process.exit(0);
  }

  await connectDB();

  if (RESET) await wipeEverything();

  // make sure every index in the models exists (unique slugs, SKUs, etc.)
  await Promise.all(
    [CategoryModel, ProductModel, UserModel, CartModel, OrderModel, PaymentModel, ReviewModel].map((m) => m.syncIndexes()),
  );

  const idBySlug = await upsertCategories();
  const { created, updated, slugs } = await upsertProducts(idBySlug);
  const removed = await pruneCatalogue(slugs);
  const adminResult = await upsertAdmin();

  console.log(`\n✅ Seed complete${RESET ? ' (full reset)' : ' (safe mode, customer data kept)'}`);
  console.log(`   ${idBySlug.size} categories`);
  console.log(`   ${created} products created, ${updated} updated`);
  if (removed.products || removed.categories)
    console.log(`   removed ${removed.categories} old categories and ${removed.products} old products`);
  console.log(`   admin ${adminResult} → ${env.ADMIN_EMAIL.toLowerCase()}`);
  if (!RESET) console.log('   users, carts, orders, payments and reviews were not touched');

  await disconnectDB();
}

seed().catch(async (err) => {
  console.error('❌ Seed failed:', err);
  await disconnectDB().catch(() => undefined);
  process.exit(1);
});
