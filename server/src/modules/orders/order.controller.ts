import { z } from 'zod';
import { asyncHandler } from '../../shared/middleware/asyncHandler';
import { sendSuccess } from '../../shared/http';
import { AppError } from '../../shared/errors/AppError';
import { bdPhone } from '../../shared/validation';
import { cartOwnerOf } from '../carts/cart.controller';
import { notificationService } from '../notifications/notification.service';
import { orderService } from './order.service';
import { createOrderSchema } from './order.schemas';

const pageSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(20).default(10),
});

const orderNumberSchema = z.object({ orderNumber: z.string().trim().min(5).max(30) });

export const orderController = {
  checkoutOptions: asyncHandler(async (_req, res) => {
    sendSuccess(res, orderService.checkoutOptions());
  }),

  create: asyncHandler(async (req, res) => {
    const input = createOrderSchema.parse(req.body);
    const owner = cartOwnerOf(req);
    if (!owner) throw new AppError(400, 'Your cart is empty', 'CART_EMPTY');
    const order = await orderService.createOrder(owner, req.user?.id ?? null, input);
    notificationService.orderPlaced(order); // sent in the background
    sendSuccess(res, order, undefined, 201);
  }),

  mine: asyncHandler(async (req, res) => {
    const { page, limit } = pageSchema.parse(req.query);
    const { items, meta } = await orderService.listMine(req.user!.id, page, limit);
    sendSuccess(res, items, meta);
  }),

  getOne: asyncHandler(async (req, res) => {
    const { orderNumber } = orderNumberSchema.parse(req.params);
    const phone = bdPhone.safeParse(req.query.phone ?? '');
    const order = await orderService.getForViewer(orderNumber, {
      userId: req.user?.id,
      role: req.user?.role,
      phone: phone.success ? phone.data : undefined,
    });
    sendSuccess(res, order);
  }),
};
