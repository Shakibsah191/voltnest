import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import { app } from '../src/app';
import { UserModel } from '../src/modules/users/user.model';
import { ProductModel } from '../src/modules/products/product.model';
import { CategoryModel } from '../src/modules/categories/category.model';
import { clearDb, seedCatalog, startTestDb, stopTestDb } from './helpers/db';

const orderBody = {
  contact: { name: 'Rahim Uddin', email: 'rahim@example.com', phone: '01712345678' },
  shippingAddress: { line1: 'House 12, Road 3', city: 'Dhaka', zone: 'inside_dhaka' },
  paymentMethod: 'cod',
};

async function makeUser(role: 'admin' | 'staff' | 'customer', email: string, name: string) {
  await UserModel.create({ name, email, role, passwordHash: await bcrypt.hash('secret123', 4) });
  const agent = request.agent(app);
  const res = await agent.post('/api/v1/auth/login').send({ email, password: 'secret123' }).expect(200);
  return { agent, auth: { Authorization: `Bearer ${res.body.data.accessToken}` } };
}

async function guestOrder() {
  const agent = request.agent(app);
  await agent.post('/api/v1/cart/items').send({ sku: 'T-CHEAP', quantity: 2 }).expect(200);
  return (await agent.post('/api/v1/orders').send(orderBody).expect(201)).body.data.orderNumber as string;
}

let owner: Awaited<ReturnType<typeof makeUser>>;
let staff: Awaited<ReturnType<typeof makeUser>>;
let shopper: Awaited<ReturnType<typeof makeUser>>;

beforeAll(startTestDb);
afterAll(stopTestDb);
beforeEach(async () => {
  await clearDb();
  await seedCatalog();
  owner = await makeUser('admin', 'owner@example.com', 'Shop Owner');
  staff = await makeUser('staff', 'staff@example.com', 'Nadia Islam');
  shopper = await makeUser('customer', 'shopper@example.com', 'Some Shopper');
});

describe('who can open the admin panel', () => {
  it('blocks guests and customers, lets staff and the owner in', async () => {
    await request(app).get('/api/v1/admin/dashboard').expect(401);
    await request(app).get('/api/v1/admin/dashboard').set(shopper.auth).expect(403);
    await request(app).get('/api/v1/admin/dashboard').set(staff.auth).expect(200);
    await request(app).get('/api/v1/admin/dashboard').set(owner.auth).expect(200);
  });

  it('hides money from staff on the dashboard', async () => {
    await guestOrder();
    const s = (await request(app).get('/api/v1/admin/dashboard').set(staff.auth)).body.data;
    const o = (await request(app).get('/api/v1/admin/dashboard').set(owner.auth)).body.data;
    expect(s.today).toEqual({ orders: 1 });
    expect(o.today).toEqual({ orders: 1, revenue: 1050, profit: 400 }); // 2×500 + ৳50; profit 2×(500−300)
    expect(o.toConfirm).toBe(1);
    expect(o.dueForDelivery[0].customerName).toBe('Rahim Uddin');
  });
});

describe('orders in the admin panel', () => {
  it('finds orders by phone or number, and hides cost from staff', async () => {
    const n = await guestOrder();
    const byPhone = await request(app).get('/api/v1/admin/orders').query({ q: '01712' }).set(staff.auth).expect(200);
    expect(byPhone.body.data.map((o: { orderNumber: string }) => o.orderNumber)).toEqual([n]);
    const byNumber = await request(app).get('/api/v1/admin/orders').query({ q: n.slice(0, 9) }).set(staff.auth).expect(200);
    expect(byNumber.body.data).toHaveLength(1);
    const none = await request(app).get('/api/v1/admin/orders').query({ status: 'delivered' }).set(staff.auth).expect(200);
    expect(none.body.data).toHaveLength(0);

    const asStaff = (await request(app).get(`/api/v1/admin/orders/${n}`).set(staff.auth)).body.data;
    expect(JSON.stringify(asStaff)).not.toMatch(/unitCost|totalCost|profit/);
    expect(asStaff.contact.phone).toBe('01712345678');
    expect(asStaff.nextStatuses).toEqual(['confirmed', 'processing', 'shipped', 'delivered', 'cancelled']);

    const asOwner = (await request(app).get(`/api/v1/admin/orders/${n}`).set(owner.auth)).body.data;
    expect(asOwner).toMatchObject({ totalCost: 600, profit: 400 });
  });

  it('staff move an order along, and every step records who did it', async () => {
    const n = await guestOrder();
    const url = `/api/v1/admin/orders/${n}/status`;
    await request(app).patch(url).set(staff.auth).send({ status: 'confirmed', note: 'Called, customer confirmed' }).expect(200);
    const noCourier = await request(app).patch(url).set(staff.auth).send({ status: 'shipped' }).expect(400);
    expect(noCourier.body.error.details['courier.name']).toBeTruthy();
    await request(app).patch(url).set(staff.auth).send({ status: 'shipped', courier: { name: 'Pathao', trackingNumber: 'PTH-123' } }).expect(200);
    await request(app).patch(url).set(staff.auth).send({ status: 'confirmed' }).expect(400); // no going back

    const d = (await request(app).get(`/api/v1/admin/orders/${n}`).set(staff.auth)).body.data;
    expect(d.status).toBe('shipped');
    expect(d.courier).toEqual({ name: 'Pathao', trackingNumber: 'PTH-123' });
    expect(d.statusHistory.map((e: { status: string; by: string | null }) => [e.status, e.by])).toEqual([
      ['pending', null],
      ['confirmed', 'Nadia Islam'],
      ['shipped', 'Nadia Islam'],
    ]);

    // the customer sees it on the public tracking page
    const track = await request(app).get(`/api/v1/orders/${n}`).query({ phone: '01712345678' }).expect(200);
    expect(track.body.data.courier.name).toBe('Pathao');
  });

  it('can move the promised date', async () => {
    const n = await guestOrder();
    await request(app).patch(`/api/v1/admin/orders/${n}`).set(staff.auth).send({ expectedDeliveryDate: '2030-01-15' }).expect(200);
    const d = (await request(app).get(`/api/v1/admin/orders/${n}`).set(staff.auth)).body.data;
    expect(d.expectedDeliveryDate).toBe('2030-01-15T12:00:00.000Z'); // 18:00 in Bangladesh
  });
});

describe('products in the admin panel', () => {
  const newProduct = async () => {
    const cat = await CategoryModel.findOne().lean();
    return {
      name: 'Nova 25W Charger',
      categoryIds: [String(cat!._id)],
      shortDescription: 'Small and quick.',
      highlights: ['25W'],
      variants: [
        { sku: 'n25-blk', name: 'Black', price: 1490, compareAtPrice: 1790, costPrice: 900, stock: 12, options: { wattage: 25 } },
        { sku: 'N25-WHT', name: 'White', price: 1490, costPrice: 900, stock: 3 },
      ],
    };
  };

  it('only the owner can create or edit products', async () => {
    const body = await newProduct();
    await request(app).post('/api/v1/admin/products').set(staff.auth).send(body).expect(403);
    const created = await request(app).post('/api/v1/admin/products').set(owner.auth).send(body).expect(201);
    expect(created.body.data.slug).toBe('nova-25w-charger');

    const saved = await ProductModel.findById(created.body.data.id).lean();
    expect(saved).toMatchObject({ minPrice: 1490, totalStock: 15, status: 'active' });
    expect(saved!.variants[0]!.sku).toBe('N25-BLK'); // upper-cased

    // the shop shows it straight away
    await request(app).get('/api/v1/products/nova-25w-charger').expect(200);

    const again = await request(app).post('/api/v1/admin/products').set(owner.auth).send(body).expect(409);
    expect(again.body.error.message).toMatch(/SKU N25-BLK is already used/);
  });

  it('explains bad input field by field', async () => {
    const body = await newProduct();
    body.variants[0]!.compareAtPrice = 1000; // lower than the price
    body.variants[1]!.sku = 'N25-BLK'; // duplicate inside the form
    const res = await request(app).post('/api/v1/admin/products').set(owner.auth).send(body).expect(400);
    expect(res.body.error.details).toMatchObject({
      'variants.0.compareAtPrice': 'The was-price must be higher than the price',
      'variants.1.sku': 'Each variant needs its own SKU',
    });
  });

  it('staff can see products and change stock, but never see cost', async () => {
    const id = (await request(app).post('/api/v1/admin/products').set(owner.auth).send(await newProduct())).body.data.id;
    const list = await request(app).get('/api/v1/admin/products').query({ q: 'nova' }).set(staff.auth).expect(200);
    expect(JSON.stringify(list.body)).not.toMatch(/costPrice/);
    expect(list.body.data[0].lowStock).toBe(true); // White has 3

    const one = await request(app).get(`/api/v1/admin/products/${id}`).set(staff.auth).expect(200);
    expect(JSON.stringify(one.body)).not.toMatch(/costPrice/);
    const ownerView = await request(app).get(`/api/v1/admin/products/${id}`).set(owner.auth).expect(200);
    expect(ownerView.body.data.variants[0].costPrice).toBe(900);

    const stock = await request(app).patch(`/api/v1/admin/products/${id}/stock`).set(staff.auth).send({ variants: [{ sku: 'n25-wht', stock: 40 }] }).expect(200);
    expect(stock.body.data.totalStock).toBe(52);
    await request(app).put(`/api/v1/admin/products/${id}`).set(staff.auth).send(await newProduct()).expect(403);
  });

  it('archiving hides a product from the shop', async () => {
    const body = await newProduct();
    const id = (await request(app).post('/api/v1/admin/products').set(owner.auth).send(body)).body.data.id;
    await request(app).put(`/api/v1/admin/products/${id}`).set(owner.auth).send({ ...body, status: 'archived' }).expect(200);
    await request(app).get('/api/v1/products/nova-25w-charger').expect(404);
  });

  it('photo upload says clearly when Cloudinary isn’t set up', async () => {
    const res = await request(app).post('/api/v1/admin/uploads/signature').set(owner.auth).expect(503);
    expect(res.body.error.code).toBe('UPLOADS_DISABLED');
    await request(app).post('/api/v1/admin/uploads/signature').set(staff.auth).expect(403);
  });
});

describe('staff accounts', () => {
  it('owner adds an employee, who can then log in', async () => {
    await request(app).post('/api/v1/admin/staff').set(staff.auth).send({ name: 'X', email: 'x@example.com', password: 'secret123' }).expect(403);
    await request(app).post('/api/v1/admin/staff').set(owner.auth).send({ name: 'Rafi Hasan', email: 'Rafi@Example.com', password: 'secret123' }).expect(201);
    const login = await request(app).post('/api/v1/auth/login').send({ email: 'rafi@example.com', password: 'secret123' }).expect(200);
    expect(login.body.data.user.role).toBe('staff');
    const list = await request(app).get('/api/v1/admin/staff').set(owner.auth).expect(200);
    expect(list.body.data.map((u: { email: string }) => u.email)).toEqual(expect.arrayContaining(['owner@example.com', 'staff@example.com', 'rafi@example.com']));
  });

  it('switching an employee off ends their access at once', async () => {
    const id = String((await UserModel.findOne({ email: 'staff@example.com' }).lean())!._id);
    await request(app).patch(`/api/v1/admin/staff/${id}`).set(owner.auth).send({ isActive: false }).expect(200);

    await request(app).get('/api/v1/admin/dashboard').set(staff.auth).expect(401); // old access token stops working
    await staff.agent.post('/api/v1/auth/refresh').expect(401); // and can't be renewed
    const login = await request(app).post('/api/v1/auth/login').send({ email: 'staff@example.com', password: 'secret123' }).expect(403);
    expect(login.body.error.code).toBe('ACCOUNT_DISABLED');

    await request(app).patch(`/api/v1/admin/staff/${id}`).set(owner.auth).send({ isActive: true }).expect(200);
    await request(app).post('/api/v1/auth/login').send({ email: 'staff@example.com', password: 'secret123' }).expect(200);
  });

  it('the owner’s own account can’t be switched off from here', async () => {
    const id = String((await UserModel.findOne({ email: 'owner@example.com' }).lean())!._id);
    await request(app).patch(`/api/v1/admin/staff/${id}`).set(owner.auth).send({ isActive: false }).expect(404);
  });
});
