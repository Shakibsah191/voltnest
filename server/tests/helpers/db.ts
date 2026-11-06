import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { CategoryModel } from '../../src/modules/categories/category.model';
import { ProductModel } from '../../src/modules/products/product.model';

let replSet: MongoMemoryReplSet | undefined;

/** A throwaway one-node replica set (transactions need one, just like Atlas). */
export async function startTestDb() {
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: 'wiredTiger' } });
  await mongoose.connect(replSet.getUri(), { dbName: 'voltnest-test' });
  // build unique indexes before any test relies on them
  await Promise.all(mongoose.modelNames().map((name) => mongoose.model(name).init()));
}

export async function stopTestDb() {
  await mongoose.disconnect();
  await replSet?.stop();
}

export async function clearDb() {
  const collections = await mongoose.connection.db!.collections();
  await Promise.all(collections.map((c) => c.deleteMany({})));
}

/**
 * Two products:
 *   CHEAP  ৳500 (cost ৳300), stock 50
 *   PRICEY ৳3,200 (cost ৳2,000), stock 5
 */
export async function seedCatalog() {
  const category = await CategoryModel.create({ name: 'Chargers', slug: 'chargers' });
  const cheap = await ProductModel.create({
    name: 'Test Cable',
    slug: 'test-cable',
    categoryIds: [category._id],
    images: [{ url: 'https://example.com/cable.png', alt: '' }],
    variants: [{ sku: 'T-CHEAP', name: 'Black / 1 m', price: 500, costPrice: 300, stock: 50 }],
  });
  const pricey = await ProductModel.create({
    name: 'Test Power Bank',
    slug: 'test-power-bank',
    categoryIds: [category._id],
    variants: [{ sku: 'T-PRICEY', name: '20,000 mAh', price: 3200, costPrice: 2000, stock: 5 }],
  });
  return { cheap, pricey };
}

export async function stockOf(sku: string) {
  const p = await ProductModel.findOne({ 'variants.sku': sku }).lean();
  return p!.variants.find((v) => v.sku === sku)!.stock;
}
