import mongoose, { Types } from 'mongoose';
import { AppError } from '../../shared/errors/AppError';
import {
  DELIVERY_OPTIONS,
  deliveryChargeFor,
  expectedDeliveryDateFor,
  publicDeliveryOptions,
} from '../../shared/delivery';
import { CartModel } from '../carts/cart.model';
import type { CartOwner } from '../carts/cart.service';
import { ProductModel } from '../products/product.model';
import { UserModel } from '../users/user.model';
import { ReviewModel } from '../reviews/review.model';
import { OrderModel, ORDER_STATUSES } from './order.model';
import { generateOrderNumber } from './order-number';
import type { CreateOrderInput } from './order.schemas';

type OrderDoc = InstanceType<typeof OrderModel>;

/** Product fields needed to price an order (lean result, includes the private costPrice). */
interface PricingProduct {
  _id: Types.ObjectId;
  name: string;
  status: string;
  images: { url: string }[];
  variants: { sku: string; name: string; price: number; costPrice: number; stock: number; image?: string | null }[];
}

/** What the success page gets back. No unitCost / totalCost: those are for admin reports only. */
export interface OrderConfirmation {
  orderNumber: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  subtotal: number;
  deliveryCharge: number;
  total: number;
  expectedDeliveryDate: string;
  deliveryZone: { id: string; label: string };
  contact: { name: string; email: string; phone: string };
  shippingAddress: { line1: string; area: string; city: string; postcode: string };
  items: { name: string; variantName: string; image: string; quantity: number; unitPrice: number; lineTotal: number }[];
  createdAt: string;
}

export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** One row in "My orders". */
export interface OrderSummary {
  orderNumber: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  total: number;
  itemCount: number;
  images: string[];
  createdAt: string;
  expectedDeliveryDate: string;
  deliveredAt: string | null;
}

/** The order page: the confirmation plus its history and review state. Still no costs. */
export interface OrderDetail extends Omit<OrderConfirmation, 'items'> {
  customerNote: string;
  deliveredAt: string | null;
  courier: { name: string; trackingNumber: string } | null;
  statusHistory: { status: string; note: string; at: string }[];
  items: (OrderConfirmation['items'][number] & {
    productId: string;
    productSlug: string | null;
    variantSku: string;
    reviewed: boolean;
  })[];
  /** true when the viewer is the logged-in owner and the order was delivered */
  canReview: boolean;
}

/** Who is asking to see an order. */
export interface OrderViewer {
  userId?: string;
  role?: 'customer' | 'admin';
  /** guests prove it's their order with the phone number used at checkout */
  phone?: string;
}

const FORWARD_FLOW: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

/** Which status changes make sense. Moving forward may skip steps (pending → shipped is fine). */
export function canMoveTo(current: OrderStatus, next: OrderStatus): boolean {
  if (current === next || current === 'cancelled' || current === 'returned') return false;
  if (next === 'cancelled') return ['pending', 'confirmed', 'processing'].includes(current);
  if (next === 'returned') return ['shipped', 'delivered'].includes(current);
  return FORWARD_FLOW.indexOf(next) > FORWARD_FLOW.indexOf(current);
}

interface StockProblem {
  sku: string;
  name: string;
  requested: number;
  available: number;
}

function toConfirmation(order: OrderDoc): OrderConfirmation {
  const zone = order.shippingAddress!.zone as keyof typeof DELIVERY_OPTIONS;
  return {
    orderNumber: order.orderNumber,
    status: order.status,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    subtotal: order.subtotal,
    deliveryCharge: order.deliveryCharge,
    total: order.total,
    expectedDeliveryDate: order.expectedDeliveryDate.toISOString(),
    deliveryZone: { id: zone, label: DELIVERY_OPTIONS[zone]?.label ?? zone },
    contact: { name: order.contact!.name, email: order.contact!.email, phone: order.contact!.phone },
    shippingAddress: {
      line1: order.shippingAddress!.line1,
      area: order.shippingAddress!.area ?? '',
      city: order.shippingAddress!.city,
      postcode: order.shippingAddress!.postcode ?? '',
    },
    items: order.items.map((i) => ({
      name: i.name,
      variantName: i.variantName,
      image: i.image ?? '',
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      lineTotal: i.lineTotal,
    })),
    createdAt: (order.get('createdAt') as Date).toISOString(),
  };
}

function stockError(problems: StockProblem[]) {
  const first = problems[0]!;
  const message =
    first.available === 0
      ? `${first.name} just sold out. Remove it from your cart to continue.`
      : `Only ${first.available} left of ${first.name}. Lower the quantity to continue.`;
  return new AppError(409, message, 'STOCK_CHANGED', { items: problems });
}

export const orderService = {
  checkoutOptions() {
    return {
      zones: publicDeliveryOptions(),
      paymentMethods: [
        { id: 'cod', label: 'Cash on Delivery', description: 'Pay in cash when your order arrives', available: true },
        { id: 'sslcommerz', label: 'Card, bKash or Nagad', description: 'Pay online through SSLCommerz', available: false },
      ],
    };
  },

  /**
   * Places an order from the customer's cart. Everything happens in one MongoDB
   * transaction: if any step fails (sold out, price changed mid-way, network blip),
   * no stock is taken and no order is saved.
   *
   * The browser sends contact + address + zone only. Prices, delivery charge and
   * totals are worked out here from the database.
   */
  async createOrder(owner: CartOwner, userId: string | null, input: CreateOrderInput): Promise<OrderConfirmation> {
    if (input.paymentMethod !== 'cod') {
      throw AppError.badRequest('Online payment opens soon. Choose Cash on Delivery for now.');
    }

    const session = await mongoose.startSession();
    try {
      let order: OrderDoc | undefined;

      await session.withTransaction(async () => {
        const cartFilter = 'userId' in owner ? { user: new Types.ObjectId(owner.userId) } : { guestId: owner.guestId };
        const cart = await CartModel.findOne(cartFilter).session(session);
        if (!cart || cart.items.length === 0) throw new AppError(400, 'Your cart is empty', 'CART_EMPTY');

        const products = await ProductModel.find({ _id: { $in: cart.items.map((i) => i.product) } })
          .select('name status images variants.sku variants.name variants.price variants.costPrice variants.stock variants.image')
          .session(session)
          .lean<PricingProduct[]>();
        const byId = new Map(products.map((p) => [String(p._id), p]));

        // 1. Price every line from the database (never from the browser) and check stock
        const problems: StockProblem[] = [];
        const lines = cart.items.map((item) => {
          const product = byId.get(String(item.product));
          const variant = product?.variants.find((v) => v.sku === item.variantSku);
          if (!product || !variant || product.status !== 'active') {
            problems.push({ sku: item.variantSku, name: product?.name ?? item.variantSku, requested: item.quantity, available: 0 });
            return null;
          }
          if (variant.stock < item.quantity) {
            problems.push({ sku: variant.sku, name: `${product.name} (${variant.name})`, requested: item.quantity, available: variant.stock });
          }
          return {
            product: product._id,
            variantSku: variant.sku,
            name: product.name,
            variantName: variant.name,
            image: variant.image ?? product.images[0]?.url ?? '',
            quantity: item.quantity,
            unitPrice: variant.price, // snapshot: what the customer pays per unit
            unitCost: variant.costPrice, // snapshot: what it cost us, for profit reports
            lineTotal: variant.price * item.quantity,
          };
        });
        if (problems.length > 0) throw stockError(problems);
        const items = lines.filter((l): l is NonNullable<typeof l> => l !== null);

        // 2. Take the stock. The $elemMatch condition makes each update fail if another
        //    order took the stock a moment ago, which aborts the whole transaction.
        for (const line of items) {
          const res = await ProductModel.updateOne(
            { _id: line.product, status: 'active', variants: { $elemMatch: { sku: line.variantSku, stock: { $gte: line.quantity } } } },
            { $inc: { 'variants.$.stock': -line.quantity, totalStock: -line.quantity, salesCount: line.quantity } },
            { session },
          );
          if (res.modifiedCount !== 1) {
            throw stockError([{ sku: line.variantSku, name: line.name, requested: line.quantity, available: 0 }]);
          }
        }

        // 3. Totals, delivery and dates
        const subtotal = items.reduce((sum, l) => sum + l.lineTotal, 0);
        const totalCost = items.reduce((sum, l) => sum + l.unitCost * l.quantity, 0);
        const zone = input.shippingAddress.zone;
        const deliveryCharge = deliveryChargeFor(zone);
        const now = new Date();

        const [created] = await OrderModel.create(
          [
            {
              orderNumber: await generateOrderNumber(session, now),
              user: userId ? new Types.ObjectId(userId) : null,
              contact: input.contact,
              shippingAddress: input.shippingAddress,
              items,
              subtotal,
              deliveryCharge,
              discount: 0,
              total: subtotal + deliveryCharge,
              totalCost,
              paymentMethod: 'cod',
              paymentStatus: 'unpaid',
              status: 'pending',
              statusHistory: [
                {
                  status: 'pending',
                  note: 'Order placed, Cash on Delivery',
                  changedBy: userId ? new Types.ObjectId(userId) : undefined,
                  at: now,
                },
              ],
              expectedDeliveryDate: expectedDeliveryDateFor(zone, now),
              customerNote: input.note,
            },
          ],
          { session },
        );

        // 4. Empty the cart
        cart.set('items', []);
        await cart.save({ session });

        // 5. Logged-in customer with no saved address: keep this one for next time
        if (userId && input.saveAddress) {
          await UserModel.updateOne(
            { _id: userId, 'addresses.0': { $exists: false } },
            {
              $push: { addresses: { label: 'Home', fullName: input.contact.name, phone: input.contact.phone, ...input.shippingAddress, isDefault: true } },
            },
            { session },
          );
          await UserModel.updateOne({ _id: userId, phone: { $in: [null, ''] } }, { $set: { phone: input.contact.phone } }, { session });
        }

        order = created;
      });

      return toConfirmation(order!);
    } finally {
      await session.endSession();
    }
  },

  /** "My orders": newest first. */
  async listMine(userId: string, page: number, limit: number) {
    const filter = { user: new Types.ObjectId(userId) };
    const [orders, total] = await Promise.all([
      OrderModel.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select('orderNumber status paymentMethod paymentStatus total items.image items.quantity createdAt expectedDeliveryDate deliveredAt')
        .lean(),
      OrderModel.countDocuments(filter),
    ]);
    const items: OrderSummary[] = orders.map((o) => ({
      orderNumber: o.orderNumber,
      status: o.status,
      paymentMethod: o.paymentMethod,
      paymentStatus: o.paymentStatus,
      total: o.total,
      itemCount: o.items.reduce((s, i) => s + i.quantity, 0),
      images: o.items.slice(0, 3).map((i) => i.image ?? ''),
      createdAt: (o as { createdAt: Date }).createdAt.toISOString(),
      expectedDeliveryDate: o.expectedDeliveryDate.toISOString(),
      deliveredAt: o.deliveredAt ? o.deliveredAt.toISOString() : null,
    }));
    return { items, meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } };
  },

  /**
   * One order, if this viewer may see it: its owner, an admin, or a guest who
   * gives the phone number used at checkout. Anyone else gets "not found", so
   * order numbers can't be used to discover other people's orders.
   */
  async getForViewer(orderNumber: string, viewer: OrderViewer): Promise<OrderDetail> {
    const notFound = AppError.notFound('We couldn’t find an order with that number and phone number');
    const order = await OrderModel.findOne({ orderNumber: orderNumber.trim().toUpperCase() });
    if (!order) throw notFound;

    const isOwner = Boolean(viewer.userId && order.user && String(order.user) === viewer.userId);
    const isAdmin = viewer.role === 'admin';
    const phoneMatches = Boolean(viewer.phone && viewer.phone === order.contact?.phone);
    if (!isOwner && !isAdmin && !phoneMatches) throw notFound;

    const productIds = order.items.map((i) => i.product);
    const [products, reviews] = await Promise.all([
      ProductModel.find({ _id: { $in: productIds } }).select('slug').lean<{ _id: Types.ObjectId; slug: string }[]>(),
      isOwner
        ? ReviewModel.find({ user: order.user, product: { $in: productIds } }).select('product').lean()
        : Promise.resolve([] as { product: Types.ObjectId }[]),
    ]);
    const slugOf = new Map(products.map((p) => [String(p._id), p.slug]));
    const reviewed = new Set(reviews.map((r) => String(r.product)));

    const base = toConfirmation(order);
    return {
      ...base,
      customerNote: order.customerNote ?? '',
      deliveredAt: order.deliveredAt ? order.deliveredAt.toISOString() : null,
      courier: order.courier?.name ? { name: order.courier.name, trackingNumber: order.courier.trackingNumber ?? '' } : null,
      statusHistory: order.statusHistory.map((e) => ({ status: e.status, note: e.note ?? '', at: e.at.toISOString() })),
      items: order.items.map((i, idx) => ({
        ...base.items[idx]!,
        productId: String(i.product),
        productSlug: slugOf.get(String(i.product)) ?? null,
        variantSku: i.variantSku,
        reviewed: reviewed.has(String(i.product)),
      })),
      canReview: isOwner && order.status === 'delivered',
    };
  },

  /**
   * Move an order to a new status and log it in statusHistory.
   * Used by the order:status command now and by the admin panel on Day 5.
   * Cancelling puts the stock back. A delivered COD order counts as paid.
   */
  async updateStatus(
    orderNumber: string,
    next: OrderStatus,
    opts: { note?: string; changedBy?: string } = {},
  ): Promise<{ orderNumber: string; status: OrderStatus; previousStatus: OrderStatus }> {
    const session = await mongoose.startSession();
    try {
      let result: { orderNumber: string; status: OrderStatus; previousStatus: OrderStatus } | undefined;
      await session.withTransaction(async () => {
        const order = await OrderModel.findOne({ orderNumber: orderNumber.trim().toUpperCase() }).session(session);
        if (!order) throw AppError.notFound(`No order called ${orderNumber}`);
        const current = order.status as OrderStatus;
        if (!canMoveTo(current, next)) {
          throw AppError.badRequest(`An order that is ${current} can’t be changed to ${next}`);
        }

        const now = new Date();
        if (next === 'cancelled') {
          for (const item of order.items) {
            await ProductModel.updateOne(
              { _id: item.product, 'variants.sku': item.variantSku },
              { $inc: { 'variants.$.stock': item.quantity, totalStock: item.quantity, salesCount: -item.quantity } },
              { session },
            );
          }
        }
        if (next === 'delivered') {
          order.deliveredAt = now;
          if (order.paymentMethod === 'cod') order.paymentStatus = 'paid'; // cash collected at the door
        }
        order.status = next;
        order.statusHistory.push({
          status: next,
          note: opts.note ?? '',
          changedBy: opts.changedBy ? new Types.ObjectId(opts.changedBy) : undefined,
          at: now,
        });
        await order.save({ session });
        result = { orderNumber: order.orderNumber, status: next, previousStatus: current };
      });
      return result!;
    } finally {
      await session.endSession();
    }
  },
};
