import { asyncHandler } from '../../shared/middleware/asyncHandler';
import { sendSuccess } from '../../shared/http';
import { AppError } from '../../shared/errors/AppError';
import { cartOwnerOf } from '../carts/cart.controller';
import { orderService } from './order.service';
import { createOrderSchema } from './order.schemas';

export const orderController = {
  checkoutOptions: asyncHandler(async (_req, res) => {
    sendSuccess(res, orderService.checkoutOptions());
  }),

  create: asyncHandler(async (req, res) => {
    const input = createOrderSchema.parse(req.body);
    const owner = cartOwnerOf(req);
    if (!owner) throw new AppError(400, 'Your cart is empty', 'CART_EMPTY');
    const order = await orderService.createOrder(owner, req.user?.id ?? null, input);
    sendSuccess(res, order, undefined, 201);
  }),
};
