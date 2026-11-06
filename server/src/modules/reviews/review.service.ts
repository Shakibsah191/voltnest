import { Types } from 'mongoose';
import { AppError } from '../../shared/errors/AppError';
import { OrderModel } from '../orders/order.model';
import { ProductModel } from '../products/product.model';
import { ReviewModel } from './review.model';
import type { CreateReviewInput } from './review.schemas';

export interface PublicReview {
  id: string;
  rating: number;
  title: string;
  body: string;
  /** "Karim A." — first name and initial only */
  authorName: string;
  /** always true: only buyers of a delivered order can review */
  verifiedPurchase: true;
  createdAt: string;
}

export interface ReviewSummary {
  average: number;
  count: number;
  /** how many reviews gave 1..5 stars */
  distribution: Record<'1' | '2' | '3' | '4' | '5', number>;
}

const shortName = (name: string) => {
  const [first = 'Customer', last] = name.trim().split(/\s+/);
  return last ? `${first} ${last[0]!.toUpperCase()}.` : first;
};

async function summaryFor(productId: Types.ObjectId): Promise<ReviewSummary> {
  const rows = await ReviewModel.aggregate<{ _id: number; n: number }>([
    { $match: { product: productId, status: 'published' } },
    { $group: { _id: '$rating', n: { $sum: 1 } } },
  ]);
  const distribution = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 } as ReviewSummary['distribution'];
  let count = 0;
  let sum = 0;
  for (const r of rows) {
    distribution[String(r._id) as keyof typeof distribution] = r.n;
    count += r.n;
    sum += r._id * r.n;
  }
  return { average: count ? Math.round((sum / count) * 10) / 10 : 0, count, distribution };
}

/** Keeps the product's ratingAvg / ratingCount equal to its real, published reviews. */
async function refreshProductRating(productId: Types.ObjectId) {
  const { average, count } = await summaryFor(productId);
  await ProductModel.updateOne({ _id: productId }, { $set: { ratingAvg: average, ratingCount: count } });
}

export const reviewService = {
  /** Only the buyer, only for a delivered order that contains the product, once per product. */
  async create(userId: string, input: CreateReviewInput): Promise<PublicReview> {
    const productId = new Types.ObjectId(input.productId);
    const order = await OrderModel.findOne({ orderNumber: input.orderNumber, user: new Types.ObjectId(userId) })
      .select('_id status items.product')
      .lean();

    if (!order) throw AppError.notFound('We couldn’t find that order in your account');
    if (!order.items.some((i) => String(i.product) === input.productId)) {
      throw AppError.badRequest('That product isn’t part of this order');
    }
    if (order.status !== 'delivered') {
      throw AppError.forbidden('You can review a product once your order is delivered');
    }
    if (await ReviewModel.exists({ user: userId, product: productId })) {
      throw AppError.conflict('You’ve already reviewed this product');
    }

    const review = await ReviewModel.create({
      product: productId,
      user: userId,
      order: order._id,
      rating: input.rating,
      title: input.title,
      body: input.body,
    }).catch((err) => {
      if (err?.code === 11000) throw AppError.conflict('You’ve already reviewed this product');
      throw err;
    });
    await refreshProductRating(productId);

    const populated = await review.populate<{ user: { name: string } }>('user', 'name');
    return {
      id: review.id,
      rating: review.rating,
      title: review.title ?? '',
      body: review.body ?? '',
      authorName: shortName(populated.user?.name ?? 'Customer'),
      verifiedPurchase: true,
      createdAt: (review.get('createdAt') as Date).toISOString(),
    };
  },

  async listForProduct(slug: string, page: number, limit: number) {
    const product = await ProductModel.findOne({ slug, status: 'active' }).select('_id').lean();
    if (!product) throw AppError.notFound('Product not found');

    const filter = { product: product._id, status: 'published' as const };
    const [rows, summary] = await Promise.all([
      ReviewModel.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate<{ user: { name: string } | null }>('user', 'name')
        .lean(),
      summaryFor(product._id),
    ]);

    const items: PublicReview[] = rows.map((r) => ({
      id: String(r._id),
      rating: r.rating,
      title: r.title ?? '',
      body: r.body ?? '',
      authorName: shortName(r.user?.name ?? 'Customer'),
      verifiedPurchase: true,
      createdAt: (r as { createdAt: Date }).createdAt.toISOString(),
    }));

    return {
      summary,
      items,
      meta: { page, limit, total: summary.count, totalPages: Math.max(1, Math.ceil(summary.count / limit)) },
    };
  },
};
