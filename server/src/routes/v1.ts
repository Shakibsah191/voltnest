import { Router } from 'express';
import mongoose from 'mongoose';
import { productRoutes } from '../modules/products/product.routes';
import { categoryRoutes } from '../modules/categories/category.routes';
import { authRoutes } from '../modules/auth/auth.routes';
import { cartRoutes } from '../modules/carts/cart.routes';
import { orderRoutes } from '../modules/orders/order.routes';
import { noStore } from '../shared/middleware/noStore';

/** Everything public lives under /api/v1. New modules get mounted here. */
export const v1Router = Router();

v1Router.get('/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      time: new Date().toISOString(),
    },
  });
});

v1Router.use(productRoutes);
v1Router.use(categoryRoutes);
v1Router.use(['/auth', '/cart', '/orders'], noStore);
v1Router.use(authRoutes);
v1Router.use(cartRoutes);
v1Router.use(orderRoutes);
