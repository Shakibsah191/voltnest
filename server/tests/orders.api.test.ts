import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { OrderModel } from '../src/modules/orders/order.model';
import { ProductModel } from '../src/modules/products/product.model';
import { orderService } from '../src/modules/orders/order.service';
import { clearDb, seedCatalog, startTestDb, stopTestDb } from './helpers/db';

const body = {
  contact: { name: 'Rahim Uddin', email: 'rahim@example.com', phone: '+880 1712-345678' },
  shippingAddress: { line1: 'House 12, Road 3', city: 'Rajshahi', zone: 'inside_rajshahi' },
  paymentMethod: 'cod',
};

beforeAll(startTestDb);
afterAll(stopTestDb);
beforeEach(async () => {
  await clearDb();
  await seedCatalog();
});

async function guestWithItem(sku = 'T-CHEAP', quantity = 2) {
  const agent = request.agent(app); // keeps cookies like a browser
  await agent.post('/api/v1/cart/items').send({ sku, quantity }).expect(200);
  return agent;
}

async function registeredUser(email = 'karim@example.com') {
  const agent = request.agent(app);
  const res = await agent
    .post('/api/v1/auth/register')
    .send({ name: 'Karim Ahmed', email, password: 'secret123' })
    .expect(201);
  return { agent, token: res.body.data.accessToken as string };
}

describe('POST /api/v1/orders', () => {
  it('places a guest COD order with server-side totals', async () => {
    const agent = await guestWithItem();
    const res = await agent.post('/api/v1/orders').send({ ...body, total: 1, subtotal: 1 }).expect(201);

    expect(res.body.data).toMatchObject({ subtotal: 1000, deliveryCharge: 50, total: 1050, paymentMethod: 'cod' });
    expect(res.body.data.orderNumber).toMatch(/^VN-\d{6}-\d{4}$/);
    expect(JSON.stringify(res.body)).not.toMatch(/unitCost|totalCost|costPrice/);
    expect(res.body.data.contact.phone).toBe('01712345678');
  });

  it('returns field errors for a bad form', async () => {
    const agent = await guestWithItem();
    const res = await agent
      .post('/api/v1/orders')
      .send({ contact: { name: '', email: 'x', phone: '12' }, shippingAddress: { zone: 'mars' }, paymentMethod: 'cod' })
      .expect(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(Object.keys(res.body.error.details)).toEqual(
      expect.arrayContaining(['contact.name', 'contact.email', 'contact.phone', 'shippingAddress.zone']),
    );
  });

  it('refuses online payment for now', async () => {
    const agent = await guestWithItem();
    const res = await agent.post('/api/v1/orders').send({ ...body, paymentMethod: 'sslcommerz' }).expect(400);
    expect(res.body.error.message).toMatch(/Cash on Delivery/);
  });

  it('refuses when there is no cart', async () => {
    const res = await request(app).post('/api/v1/orders').send(body).expect(400);
    expect(res.body.error.code).toBe('CART_EMPTY');
  });

  it('links a logged-in order to the account', async () => {
    const { agent, token } = await registeredUser();
    await agent.post('/api/v1/cart/items').set('Authorization', `Bearer ${token}`).send({ sku: 'T-PRICEY', quantity: 1 }).expect(200);
    const res = await agent.post('/api/v1/orders').set('Authorization', `Bearer ${token}`).send(body).expect(201);
    expect(res.body.data.deliveryCharge).toBe(50); // no free delivery, even at ৳3,200
    const saved = await OrderModel.findOne({ orderNumber: res.body.data.orderNumber }).lean();
    expect(saved!.user).not.toBeNull();
  });
});

describe('My orders and tracking', () => {
  it('lists only my orders, newest first', async () => {
    const { agent, token } = await registeredUser();
    const auth = { Authorization: `Bearer ${token}` };
    for (const sku of ['T-CHEAP', 'T-PRICEY']) {
      await agent.post('/api/v1/cart/items').set(auth).send({ sku, quantity: 1 }).expect(200);
      await agent.post('/api/v1/orders').set(auth).send(body).expect(201);
    }
    const guest = await guestWithItem();
    await guest.post('/api/v1/orders').send(body).expect(201);

    const res = await agent.get('/api/v1/orders/mine').set(auth).expect(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0].total).toBe(3250);
    expect(res.body.meta.total).toBe(2);
    await request(app).get('/api/v1/orders/mine').expect(401);
  });

  it('lets a guest track with order number + phone, and nobody else', async () => {
    const agent = await guestWithItem();
    const { orderNumber } = (await agent.post('/api/v1/orders').send(body).expect(201)).body.data;

    const ok = await request(app).get(`/api/v1/orders/${orderNumber}`).query({ phone: '01712-345678' }).expect(200);
    expect(ok.body.data.statusHistory[0].status).toBe('pending');
    expect(ok.body.data.canReview).toBe(false);

    await request(app).get(`/api/v1/orders/${orderNumber}`).query({ phone: '01811111111' }).expect(404);
    await request(app).get(`/api/v1/orders/${orderNumber}`).expect(404);
    const { token } = await registeredUser('someone@example.com');
    await request(app).get(`/api/v1/orders/${orderNumber}`).set('Authorization', `Bearer ${token}`).expect(404);
  });
});

describe('Reviews', () => {
  it('only after delivery, once per product, and updates the rating', async () => {
    const { agent, token } = await registeredUser();
    const auth = { Authorization: `Bearer ${token}` };
    await agent.post('/api/v1/cart/items').set(auth).send({ sku: 'T-CHEAP', quantity: 1 }).expect(200);
    const { orderNumber } = (await agent.post('/api/v1/orders').set(auth).send(body).expect(201)).body.data;
    const product = await ProductModel.findOne({ slug: 'test-cable' }).lean();
    const review = { orderNumber, productId: String(product!._id), rating: 4, title: 'Solid cable', body: 'Charges fast.' };

    await agent.post('/api/v1/reviews').set(auth).send(review).expect(403); // not delivered yet
    await orderService.updateStatus(orderNumber, 'delivered');

    const detail = await agent.get(`/api/v1/orders/${orderNumber}`).set(auth).expect(200);
    expect(detail.body.data.canReview).toBe(true);
    expect(detail.body.data.items[0]).toMatchObject({ productSlug: 'test-cable', reviewed: false });

    const created = await agent.post('/api/v1/reviews').set(auth).send(review).expect(201);
    expect(created.body.data).toMatchObject({ rating: 4, authorName: 'Karim A.', verifiedPurchase: true });
    await agent.post('/api/v1/reviews').set(auth).send(review).expect(409);

    const updated = await ProductModel.findById(product!._id).lean();
    expect(updated).toMatchObject({ ratingAvg: 4, ratingCount: 1 });

    const list = await request(app).get('/api/v1/products/test-cable/reviews').expect(200);
    expect(list.body.data.summary).toMatchObject({ average: 4, count: 1, distribution: { '4': 1 } });
    expect(list.body.data.items[0].title).toBe('Solid cable');

    const after = await agent.get(`/api/v1/orders/${orderNumber}`).set(auth).expect(200);
    expect(after.body.data.items[0].reviewed).toBe(true);
  });

  it('needs a login', async () => {
    await request(app).post('/api/v1/reviews').send({}).expect(401);
  });
});
