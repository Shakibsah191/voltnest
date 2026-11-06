import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import '../src/app'; // loads every model
import { CartModel } from '../src/modules/carts/cart.model';
import { OrderModel } from '../src/modules/orders/order.model';
import { orderService, canMoveTo } from '../src/modules/orders/order.service';
import type { CreateOrderInput } from '../src/modules/orders/order.schemas';
import { clearDb, seedCatalog, startTestDb, stockOf, stopTestDb } from './helpers/db';

const input = (zone: 'inside_rajshahi' | 'inside_dhaka' | 'outside_rajshahi' = 'outside_rajshahi'): CreateOrderInput => ({
  contact: { name: 'Rahim Uddin', email: 'rahim@example.com', phone: '01712345678' },
  shippingAddress: { line1: 'House 12, Road 3', area: '', city: 'Rajshahi', postcode: '', zone },
  paymentMethod: 'cod',
  note: '',
  saveAddress: false,
});

let catalog: Awaited<ReturnType<typeof seedCatalog>>;

async function guestCart(items: { product: unknown; sku: string; qty: number }[]) {
  const guestId = randomUUID();
  await CartModel.create({ guestId, items: items.map((i) => ({ product: i.product, variantSku: i.sku, quantity: i.qty })) });
  return { guestId };
}

beforeAll(startTestDb);
afterAll(stopTestDb);
beforeEach(async () => {
  await clearDb();
  catalog = await seedCatalog();
});

describe('orderService.createOrder totals', () => {
  it('prices from the database and adds the outside-Rajshahi charge', async () => {
    const owner = await guestCart([{ product: catalog.cheap._id, sku: 'T-CHEAP', qty: 3 }]);
    const order = await orderService.createOrder(owner, null, input());

    expect(order.subtotal).toBe(1500);
    expect(order.deliveryCharge).toBe(120);
    expect(order.total).toBe(1620);
  });

  it('charges ৳50 inside Rajshahi', async () => {
    const owner = await guestCart([{ product: catalog.cheap._id, sku: 'T-CHEAP', qty: 1 }]);
    const order = await orderService.createOrder(owner, null, input('inside_rajshahi'));
    expect(order.total).toBe(550);
  });

  it('charges ৳50 inside Dhaka', async () => {
    const owner = await guestCart([{ product: catalog.cheap._id, sku: 'T-CHEAP', qty: 1 }]);
    const order = await orderService.createOrder(owner, null, input('inside_dhaka'));
    expect(order.total).toBe(550);
  });

  it('never gives free delivery, even on big orders', async () => {
    const owner = await guestCart([{ product: catalog.pricey._id, sku: 'T-PRICEY', qty: 2 }]);
    const order = await orderService.createOrder(owner, null, input());
    expect(order.subtotal).toBe(6400);
    expect(order.deliveryCharge).toBe(120);
    expect(order.total).toBe(6520);
  });

  it('saves price and cost snapshots, history and a delivery date', async () => {
    const owner = await guestCart([
      { product: catalog.cheap._id, sku: 'T-CHEAP', qty: 2 },
      { product: catalog.pricey._id, sku: 'T-PRICEY', qty: 1 },
    ]);
    const { orderNumber } = await orderService.createOrder(owner, null, input());
    const saved = await OrderModel.findOne({ orderNumber }).lean();

    expect(saved!.items.map((i) => [i.variantSku, i.unitPrice, i.unitCost, i.lineTotal])).toEqual([
      ['T-CHEAP', 500, 300, 1000],
      ['T-PRICEY', 3200, 2000, 3200],
    ]);
    expect(saved!.totalCost).toBe(2 * 300 + 2000);
    expect(saved!.statusHistory).toHaveLength(1);
    expect(saved!.statusHistory[0]!.status).toBe('pending');
    expect(saved!.expectedDeliveryDate.getTime()).toBeGreaterThan(Date.now());
  });

  it('takes the stock and empties the cart', async () => {
    const owner = await guestCart([{ product: catalog.cheap._id, sku: 'T-CHEAP', qty: 4 }]);
    await orderService.createOrder(owner, null, input());
    expect(await stockOf('T-CHEAP')).toBe(46);
    expect((await CartModel.findOne({ guestId: owner.guestId }))!.items).toHaveLength(0);
  });

  it('refuses when stock is too low, and changes nothing', async () => {
    const owner = await guestCart([{ product: catalog.pricey._id, sku: 'T-PRICEY', qty: 6 }]);
    await expect(orderService.createOrder(owner, null, input())).rejects.toMatchObject({ code: 'STOCK_CHANGED' });
    expect(await stockOf('T-PRICEY')).toBe(5);
    expect(await OrderModel.countDocuments()).toBe(0);
  });

  it('refuses an empty cart', async () => {
    const owner = await guestCart([]);
    await expect(orderService.createOrder(owner, null, input())).rejects.toMatchObject({ code: 'CART_EMPTY' });
  });
});

describe('orderService.updateStatus', () => {
  it('only allows sensible moves', () => {
    expect(canMoveTo('pending', 'delivered')).toBe(true);
    expect(canMoveTo('shipped', 'confirmed')).toBe(false);
    expect(canMoveTo('delivered', 'cancelled')).toBe(false);
    expect(canMoveTo('cancelled', 'confirmed')).toBe(false);
    expect(canMoveTo('delivered', 'returned')).toBe(true);
  });

  it('delivered COD orders count as paid', async () => {
    const owner = await guestCart([{ product: catalog.cheap._id, sku: 'T-CHEAP', qty: 1 }]);
    const { orderNumber } = await orderService.createOrder(owner, null, input());
    await orderService.updateStatus(orderNumber, 'delivered');
    const saved = await OrderModel.findOne({ orderNumber }).lean();
    expect(saved!.paymentStatus).toBe('paid');
    expect(saved!.deliveredAt).toBeInstanceOf(Date);
    expect(saved!.statusHistory.map((e) => e.status)).toEqual(['pending', 'delivered']);
  });

  it('cancelling puts the stock back', async () => {
    const owner = await guestCart([{ product: catalog.pricey._id, sku: 'T-PRICEY', qty: 2 }]);
    const { orderNumber } = await orderService.createOrder(owner, null, input());
    expect(await stockOf('T-PRICEY')).toBe(3);
    await orderService.updateStatus(orderNumber, 'cancelled', { note: 'Customer changed their mind' });
    expect(await stockOf('T-PRICEY')).toBe(5);
    await expect(orderService.updateStatus(orderNumber, 'cancelled')).rejects.toThrow(/can’t be changed/);
  });
});
