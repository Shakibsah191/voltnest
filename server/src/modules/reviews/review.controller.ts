import { asyncHandler } from '../../shared/middleware/asyncHandler';
import { sendSuccess } from '../../shared/http';
import { reviewService } from './review.service';
import { createReviewSchema, listReviewsSchema } from './review.schemas';

export const reviewController = {
  create: asyncHandler(async (req, res) => {
    const review = await reviewService.create(req.user!.id, createReviewSchema.parse(req.body));
    sendSuccess(res, review, undefined, 201);
  }),

  listForProduct: asyncHandler(async (req, res) => {
    const { page, limit } = listReviewsSchema.parse(req.query);
    const { summary, items, meta } = await reviewService.listForProduct(String(req.params.slug), page, limit);
    sendSuccess(res, { summary, items }, meta);
  }),
};
