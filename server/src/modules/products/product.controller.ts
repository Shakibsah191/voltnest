import { asyncHandler } from '../../shared/middleware/asyncHandler';
import { sendSuccess } from '../../shared/http';
import { listQuerySchema, productService } from './product.service';

export const productController = {
  list: asyncHandler(async (req, res) => {
    const { items, meta } = await productService.list(listQuerySchema.parse(req.query));
    sendSuccess(res, items, meta);
  }),

  listByCategory: asyncHandler(async (req, res) => {
    const { category, items, meta } = await productService.listByCategorySlug(
      req.params.slug,
      listQuerySchema.parse(req.query),
    );
    sendSuccess(res, { category, items }, meta);
  }),

  home: asyncHandler(async (_req, res) => {
    sendSuccess(res, await productService.getHome());
  }),

  getBySlug: asyncHandler(async (req, res) => {
    sendSuccess(res, await productService.getBySlug(req.params.slug));
  }),
};
