import { z } from 'zod';
import { DELIVERY_ZONES } from '../../shared/delivery';
import { bdPhone, email, personName } from '../../shared/validation';
import { PAYMENT_METHODS } from './order.model';

const optionalText = (max: number) => z.string().trim().max(max).optional().default('');

/**
 * What the checkout form sends. Note what is NOT here: items, prices, totals.
 * The server takes the items from the customer's cart and prices them itself.
 */
export const createOrderSchema = z.object({
  contact: z.object({
    name: personName,
    email,
    phone: bdPhone,
  }),
  shippingAddress: z.object({
    line1: z
      .string({ required_error: 'Enter your address' })
      .trim()
      .min(5, 'Enter your house, road and area')
      .max(200, 'Address is too long'),
    area: optionalText(80),
    city: z.string({ required_error: 'Enter your city or district' }).trim().min(2, 'Enter your city or district').max(60),
    postcode: z
      .string()
      .trim()
      .regex(/^(\d{4})?$/, 'Postcode is 4 digits, or leave it empty')
      .optional()
      .default(''),
    zone: z.enum(DELIVERY_ZONES, { errorMap: () => ({ message: 'Choose your delivery area' }) }),
  }),
  paymentMethod: z.enum(PAYMENT_METHODS, { errorMap: () => ({ message: 'Choose a payment method' }) }),
  note: optionalText(500),
  /** Logged-in users: keep this address for next time (only if they have none yet). */
  saveAddress: z.boolean().optional().default(true),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
