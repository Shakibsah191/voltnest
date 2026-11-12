import { z } from 'zod';
import { ORDER_STATUSES } from '../orders/order.model';
import { PRODUCT_STATUSES } from '../products/product.model';

const ymd = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use a date like 2026-11-08');
const objectId = z.string().regex(/^[0-9a-f]{24}$/i, 'Invalid id');
const page = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
};

// ---------- orders ----------
export const orderListSchema = z.object({
  ...page,
  status: z.enum(ORDER_STATUSES).optional(),
  from: ymd.optional(),
  to: ymd.optional(),
  /** order number, phone number or customer name */
  q: z.string().trim().max(60).optional(),
});

const courier = z.object({
  name: z.string().trim().min(2, 'Enter the courier’s name').max(60),
  trackingNumber: z.string().trim().max(60).optional().default(''),
});

export const statusUpdateSchema = z.object({
  status: z.enum(ORDER_STATUSES.filter((s) => s !== 'pending') as [string, ...string[]], { error: 'Choose a status' }),
  note: z.string().trim().max(300).optional().default(''),
  courier: courier.optional(),
  expectedDeliveryDate: ymd.optional(),
});

export const orderEditSchema = z
  .object({ courier: courier.optional(), expectedDeliveryDate: ymd.optional() })
  .refine((v) => v.courier || v.expectedDeliveryDate, { message: 'Nothing to change' });

// ---------- products ----------
const optionalNumber = z.preprocess((v) => (v === '' || v === null ? undefined : v), z.coerce.number().min(0).max(1_000_000).optional());
const money = (label: string) => z.coerce.number({ error: `Enter the ${label}` }).int(`${label} must be whole taka`).min(0).max(10_000_000);

export const variantSchema = z.object({
  sku: z
    .string({ error: 'Enter a SKU' })
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9-]{3,30}$/, 'SKU: 3–30 letters, numbers or dashes'),
  name: z.string({ error: 'Name the variant' }).trim().min(1, 'Name the variant, e.g. Black').max(60),
  options: z
    .object({
      color: z.string().trim().max(30).optional(),
      wattage: optionalNumber,
      capacity: optionalNumber,
      ports: optionalNumber,
      length: optionalNumber,
    })
    .optional()
    .default({}),
  price: money('price').refine((n) => n > 0, 'Price must be more than ৳0'),
  compareAtPrice: z.preprocess((v) => (v === '' || v === null || v === 0 ? undefined : v), money('was-price').optional()),
  costPrice: money('cost price'),
  stock: z.coerce.number({ error: 'Enter the stock' }).int('Stock must be a whole number').min(0).max(100_000),
  image: z.string().trim().url('Enter a full image link').optional().or(z.literal('')),
});

export const productSchema = z
  .object({
    name: z.string({ error: 'Enter a product name' }).trim().min(2, 'Enter a product name').max(120),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and dashes')
      .max(120)
      .optional()
      .or(z.literal('')),
    shortDescription: z.string().trim().max(300).optional().default(''),
    description: z.string().trim().max(5000).optional().default(''),
    categoryIds: z.array(objectId).min(1, 'Pick at least one category').max(6),
    images: z
      .array(z.object({ url: z.string().trim().url('Enter a full image link'), alt: z.string().trim().max(120).optional().default('') }))
      .max(10)
      .optional()
      .default([]),
    highlights: z.array(z.string().trim().min(1).max(120)).max(8).optional().default([]),
    specs: z
      .array(z.object({ label: z.string().trim().min(1).max(60), value: z.string().trim().min(1).max(200) }))
      .max(24)
      .optional()
      .default([]),
    tags: z.array(z.string().trim().toLowerCase().min(1).max(30)).max(20).optional().default([]),
    variants: z.array(variantSchema).min(1, 'Add at least one variant').max(20),
    status: z.enum(PRODUCT_STATUSES).optional().default('active'),
    isFeatured: z.boolean().optional().default(false),
  })
  .superRefine((p, ctx) => {
    const seen = new Set<string>();
    p.variants.forEach((v, i) => {
      if (seen.has(v.sku)) ctx.addIssue({ code: 'custom', path: ['variants', i, 'sku'], message: 'Each variant needs its own SKU' });
      seen.add(v.sku);
      if (v.compareAtPrice !== undefined && v.compareAtPrice <= v.price) {
        ctx.addIssue({ code: 'custom', path: ['variants', i, 'compareAtPrice'], message: 'The was-price must be higher than the price' });
      }
    });
  });
export type ProductInput = z.infer<typeof productSchema>;

export const productListSchema = z.object({
  ...page,
  q: z.string().trim().max(60).optional(),
  status: z.enum(PRODUCT_STATUSES).optional(),
  lowStock: z.enum(['true', 'false']).optional(),
});

export const stockSchema = z.object({
  variants: z
    .array(z.object({ sku: z.string().trim().toUpperCase().min(1), stock: z.coerce.number().int().min(0).max(100_000) }))
    .min(1)
    .max(20),
});

export const idParam = z.object({ id: objectId });

// ---------- staff ----------
export const createStaffSchema = z.object({
  name: z.string({ error: 'Enter a name' }).trim().min(2, 'Enter a name').max(80),
  email: z.string({ error: 'Enter an email' }).trim().toLowerCase().email('Enter a valid email address'),
  password: z.string({ error: 'Enter a password' }).min(8, 'Use at least 8 characters').max(72),
});

export const updateStaffSchema = z
  .object({
    isActive: z.boolean().optional(),
    password: z.string().min(8, 'Use at least 8 characters').max(72).optional(),
    name: z.string().trim().min(2).max(80).optional(),
  })
  .refine((v) => v.isActive !== undefined || v.password || v.name, { message: 'Nothing to change' });
