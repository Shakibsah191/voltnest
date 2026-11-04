import mongoose, { Types } from 'mongoose';
import { AppError } from '../../shared/errors/AppError';
import {
  DELIVERY_OPTIONS,
  FREE_DELIVERY_THRESHOLD,
  deliveryChargeFor,
  expectedDeliveryDateFor,
  publicDeliveryOptions,
} from '../../shared/delivery';
import { CartModel } from '../carts/cart.model';
import type { CartOwner } from '../carts/cart.service';
import { ProductModel } from '../products/product.model';
import { UserModel } from '../users/user.model';
import { OrderModel } from './order.model';
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
  items: { name: string; variantName: string; image: string; quantity: number; unitPrice: number; lineTotal: number }[];
  createdAt: string;
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
      freeDeliveryThreshold: FREE_DELIVERY_THRESHOLD,
      paymentMethods: [
        { id: 'cod', label: 'Cash on Delivery', description: 'Pay in cash when your order arrives', available: true },
        { id: 'sslcommerz', label: 'Card, bKash or Nagad', description: 'Online payment, coming soon', available: false },
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
        const deliveryCharge = deliveryChargeFor(zone, subtotal);
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
};
