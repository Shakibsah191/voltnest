import { z } from 'zod';
import { MAX_PER_LINE } from './cart.service';

const sku = z.string().trim().toUpperCase().min(1).max(40);

export const addItemSchema = z.object({
  sku,
  quantity: z.coerce.number().int().min(1).max(MAX_PER_LINE).default(1),
});

export const setQuantitySchema = z.object({
  quantity: z.coerce.number().int().min(0).max(MAX_PER_LINE), // 0 removes the line
});

export const skuParamSchema = z.object({ sku });

/** One-time move of the old browser cart (Day 2, localStorage) into the server cart. */
export const importSchema = z.object({
  items: z
    .array(z.object({ sku, quantity: z.coerce.number().int().min(1).max(MAX_PER_LINE) }))
    .max(50),
});
