import { Router } from 'express';
import mongoose from 'mongoose';
import { productRoutes } from '../modules/products/product.routes';
import { categoryRoutes } from '../modules/categories/category.routes';

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
