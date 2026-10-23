import { asyncHandler } from '../../shared/middleware/asyncHandler';
import { sendSuccess } from '../../shared/http';
import { categoryService } from './category.service';

export const categoryController = {
  list: asyncHandler(async (_req, res) => {
    sendSuccess(res, await categoryService.listActive());
  }),

  getBySlug: asyncHandler(async (req, res) => {
    sendSuccess(res, await categoryService.getBySlug(req.params.slug));
  }),
};
