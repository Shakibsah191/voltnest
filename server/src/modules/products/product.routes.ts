import { Router } from 'express';
import { productController } from './product.controller';

export const productRoutes = Router();

productRoutes.get('/home', productController.home);
productRoutes.get('/products', productController.list);
productRoutes.get('/products/:slug', productController.getBySlug);
productRoutes.get('/categories/:slug/products', productController.listByCategory);
