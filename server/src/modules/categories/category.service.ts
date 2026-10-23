import { CategoryModel } from './category.model';
import { AppError } from '../../shared/errors/AppError';

const PUBLIC_FIELDS = 'name slug description image parent sortOrder';

export const categoryService = {
  async listActive() {
    return CategoryModel.find({ isActive: true }).select(PUBLIC_FIELDS).sort({ sortOrder: 1, name: 1 }).lean();
  },

  async getBySlug(slug: string) {
    const category = await CategoryModel.findOne({ slug: slug.toLowerCase(), isActive: true })
      .select(PUBLIC_FIELDS)
      .lean();
    if (!category) throw AppError.notFound(`Category "${slug}" not found`);
    return category;
  },
};
