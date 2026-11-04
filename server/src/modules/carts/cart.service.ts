import type { Request } from 'express';
import { Types } from 'mongoose';
import { authConfig } from '../../config/auth';
import { AppError } from '../../shared/errors/AppError';
import { ProductModel } from '../products/product.model';
import { CartModel } from './cart.model';

/** Most of one variant a customer can order at once. */
export const MAX_PER_LINE = 20;

export type CartOwner = { userId: string } | { guestId: string };

export interface CartLineView {
  variantSku: string;
  productId: string;
  slug: string;
  name: string;
  variantName: string;
  image: string;
  /** Live price from the products collection — the cart never stores prices. */
  unitPrice: number;
  compareAtPrice: number | null;
  quantity: number;
  stock: number;
  /** What the quantity stepper may go up to: min(stock, MAX_PER_LINE). */
  maxQuantity: number;
  lineTotal: number;
  /** false when the variant sold out after it was added. */
  available: boolean;
}

export interface CartView {
  items: CartLineView[];
  itemCount: number;
  /** Sum of the lines that can be bought now. Delivery is added at checkout. */
  subtotal: number;
  hasUnavailable: boolean;
  /** Plain-language notes about changes the server made, e.g. a lowered quantity. */
  notices: string[];
}

type CartDoc = InstanceType<typeof CartModel>;

/** The product fields the cart needs (lean query result). */
interface CartProduct {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  status: string;
  images: { url: string }[];
  variants: { sku: string; name: string; price: number; compareAtPrice?: number | null; stock: number; image?: string | null }[];
}

const EMPTY_CART: CartView = { items: [], itemCount: 0, subtotal: 0, hasUnavailable: false, notices: [] };
const UUID_RX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CART_PRODUCT_FIELDS =
  'name slug status images variants.sku variants.name variants.price variants.compareAtPrice variants.stock variants.image';

function ownerFilter(owner: CartOwner) {
  return 'userId' in owner ? { user: new Types.ObjectId(owner.userId) } : { guestId: owner.guestId };
}

function touchGuest(cart: CartDoc) {
  if (cart.guestId) cart.expiresAt = new Date(Date.now() + authConfig.guestCartTtlMs);
}

async function findCart(owner: CartOwner) {
  return CartModel.findOne(ownerFilter(owner));
}

/** Find the owner's cart, creating it if needed. Safe if two requests race. */
async function findOrCreateCart(owner: CartOwner): Promise<CartDoc> {
  const filter = ownerFilter(owner);
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return await CartModel.findOneAndUpdate(filter, { $setOnInsert: { items: [] } }, { upsert: true, new: true });
    } catch (err) {
      if ((err as { code?: number }).code !== 11000 || attempt === 1) throw err;
    }
  }
  throw new Error('unreachable');
}

async function findSellableVariant(sku: string) {
  const product = await ProductModel.findOne({ 'variants.sku': sku, status: 'active' }).select(CART_PRODUCT_FIELDS).lean<CartProduct>();
  const variant = product?.variants.find((v) => v.sku === sku);
  if (!product || !variant) throw AppError.notFound('This product is no longer available');
  return { product, variant };
}

/**
 * Turn the stored lines (product id + SKU + quantity) into what the drawer shows,
 * using live prices and stock. Lines whose product disappeared are dropped and
 * quantities above the stock are lowered; both are saved and explained in `notices`.
 */
async function toView(cart: CartDoc | null, extraNotices: string[] = []): Promise<CartView> {
  if (!cart || cart.items.length === 0) return { ...EMPTY_CART, notices: extraNotices };

  const ids = [...new Set(cart.items.map((i) => String(i.product)))];
  const products = await ProductModel.find({ _id: { $in: ids } }).select(CART_PRODUCT_FIELDS).lean<CartProduct[]>();
  const byId = new Map(products.map((p) => [String(p._id), p]));

  const notices = [...extraNotices];
  const items: CartLineView[] = [];
  let changed = false;

  for (const item of [...cart.items]) {
    const product = byId.get(String(item.product));
    const variant = product?.variants.find((v) => v.sku === item.variantSku);

    if (!product || !variant || product.status !== 'active') {
      cart.items.pull(item._id);
      changed = true;
      notices.push(`${product?.name ?? 'An item'} is no longer sold and was removed from your cart.`);
      continue;
    }

    const maxQuantity = Math.min(variant.stock, MAX_PER_LINE);
    if (variant.stock > 0 && item.quantity > maxQuantity) {
      item.quantity = maxQuantity;
      changed = true;
      notices.push(`Only ${variant.stock} left of ${product.name} (${variant.name}), so we lowered the quantity.`);
    }

    const available = variant.stock > 0;
    items.push({
      variantSku: variant.sku,
      productId: String(product._id),
      slug: product.slug,
      name: product.name,
      variantName: variant.name,
      image: variant.image ?? product.images[0]?.url ?? '',
      unitPrice: variant.price,
      compareAtPrice: variant.compareAtPrice ?? null,
      quantity: item.quantity,
      stock: variant.stock,
      maxQuantity: Math.max(maxQuantity, 1),
      lineTotal: available ? variant.price * item.quantity : 0,
      available,
    });
  }

  if (changed) await cart.save();

  return {
    items,
    itemCount: items.reduce((sum, l) => sum + l.quantity, 0),
    subtotal: items.reduce((sum, l) => sum + l.lineTotal, 0),
    hasUnavailable: items.some((l) => !l.available),
    notices,
  };
}

/** Adds to an in-memory cart doc (not saved). Returns a notice if the quantity had to be capped. */
function addLine(
  cart: CartDoc,
  productId: Types.ObjectId,
  variant: { sku: string; stock: number; name: string },
  productName: string,
  quantity: number,
): string | null {
  const cap = Math.min(variant.stock, MAX_PER_LINE);
  const line = cart.items.find((i) => i.variantSku === variant.sku);
  const wanted = (line?.quantity ?? 0) + quantity;
  const next = Math.min(wanted, cap);

  if (line) {
    line.quantity = next;
    line.set('product', productId);
  } else {
    cart.items.push({ product: productId, variantSku: variant.sku, quantity: next });
  }
  if (wanted <= cap) return null;
  return cap === MAX_PER_LINE
    ? `You can order up to ${MAX_PER_LINE} of one item at a time.`
    : `Only ${variant.stock} of ${productName} (${variant.name}) left, so your cart has all of them.`;
}

export const cartService = {
  /** The guest-cart id from the cookie, if it looks like one we issued. */
  readGuestId(req: Request): string | null {
    const id = req.cookies?.[authConfig.cookies.guestCart];
    return typeof id === 'string' && UUID_RX.test(id) ? id : null;
  },

  async view(owner: CartOwner | null): Promise<CartView> {
    return owner ? toView(await findCart(owner)) : { ...EMPTY_CART };
  },

  async addItem(owner: CartOwner, sku: string, quantity: number): Promise<CartView> {
    const { product, variant } = await findSellableVariant(sku);
    if (variant.stock <= 0) throw AppError.conflict(`${product.name} (${variant.name}) is sold out`);

    const cart = await findOrCreateCart(owner);
    const notice = addLine(cart, product._id, variant, product.name, quantity);
    touchGuest(cart);
    await cart.save();
    return toView(cart, notice ? [notice] : []);
  },

  async setQuantity(owner: CartOwner, sku: string, quantity: number): Promise<CartView> {
    const cart = await findCart(owner);
    const line = cart?.items.find((i) => i.variantSku === sku);
    if (!cart || !line) throw AppError.notFound('That item is not in your cart');

    if (quantity === 0) cart.items.pull(line._id);
    else line.quantity = Math.min(quantity, MAX_PER_LINE); // stock is checked by toView
    touchGuest(cart);
    await cart.save();
    return toView(cart);
  },

  async removeItem(owner: CartOwner, sku: string): Promise<CartView> {
    const cart = await findCart(owner);
    if (!cart) return { ...EMPTY_CART };
    const line = cart.items.find((i) => i.variantSku === sku);
    if (line) {
      cart.items.pull(line._id);
      await cart.save();
    }
    return toView(cart);
  },

  async clear(owner: CartOwner): Promise<CartView> {
    await CartModel.updateOne(ownerFilter(owner), { $set: { items: [] } });
    return { ...EMPTY_CART };
  },

  /** Moves the Day 2 browser cart into the server cart. Unknown or sold-out SKUs are skipped. */
  async importItems(owner: CartOwner, items: { sku: string; quantity: number }[]): Promise<CartView> {
    if (items.length === 0) return this.view(owner);
    const skus = [...new Set(items.map((i) => i.sku))];
    const products = await ProductModel.find({ 'variants.sku': { $in: skus }, status: 'active' })
      .select(CART_PRODUCT_FIELDS)
      .lean<CartProduct[]>();

    const cart = await findOrCreateCart(owner);
    for (const { sku, quantity } of items) {
      const product = products.find((p) => p.variants.some((v) => v.sku === sku));
      const variant = product?.variants.find((v) => v.sku === sku);
      if (!product || !variant || variant.stock <= 0) continue;
      addLine(cart, product._id, variant, product.name, quantity);
    }
    touchGuest(cart);
    await cart.save();
    return toView(cart);
  },

  /** On login/register: the guest's lines are added to the user's cart, then the guest cart is deleted. */
  async mergeGuestIntoUser(guestId: string, userId: string): Promise<void> {
    const guest = await CartModel.findOne({ guestId });
    if (!guest) return;

    if (guest.items.length > 0) {
      const cart = await findOrCreateCart({ userId });
      for (const g of guest.items) {
        const line = cart.items.find((i) => i.variantSku === g.variantSku);
        if (line) line.quantity = Math.min(line.quantity + g.quantity, MAX_PER_LINE);
        else cart.items.push({ product: g.product, variantSku: g.variantSku, quantity: g.quantity });
      }
      await cart.save(); // stock limits are applied the next time the cart is read
    }
    await guest.deleteOne();
  },
};
