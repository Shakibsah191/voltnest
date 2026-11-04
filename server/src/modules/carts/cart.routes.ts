import { Router } from 'express';
import { authenticate } from '../../shared/middleware/auth';
import { cartController } from './cart.controller';

/** The cart works for guests and logged-in users alike. */
export const cartRoutes = Router();

cartRoutes.get('/cart', authenticate, cartController.get);
cartRoutes.post('/cart/items', authenticate, cartController.addItem);
cartRoutes.patch('/cart/items/:sku', authenticate, cartController.setQuantity);
cartRoutes.delete('/cart/items/:sku', authenticate, cartController.removeItem);
cartRoutes.delete('/cart', authenticate, cartController.clear);
cartRoutes.post('/cart/import', authenticate, cartController.import);
