import { Router } from 'express';
import { requireAdmin, requireStaff } from '../../shared/middleware/auth';
import { adminController as c } from './admin.controller';

/**
 * Everything under /api/v1/admin.
 *   requireStaff = employees and the owner
 *   requireAdmin = the owner only (prices, products, money, staff accounts)
 * The dashboard and order detail hide money from staff inside the service.
 */
export const adminRoutes = Router();

adminRoutes.get('/admin/me', requireStaff, c.me);
adminRoutes.get('/admin/dashboard', requireStaff, c.dashboard);

adminRoutes.get('/admin/orders', requireStaff, c.listOrders);
adminRoutes.get('/admin/orders/:orderNumber', requireStaff, c.getOrder);
adminRoutes.patch('/admin/orders/:orderNumber/status', requireStaff, c.updateOrderStatus);
adminRoutes.patch('/admin/orders/:orderNumber', requireStaff, c.editOrder);

adminRoutes.get('/admin/products', requireStaff, c.listProducts);
adminRoutes.get('/admin/products/:id', requireStaff, c.getProduct);
adminRoutes.patch('/admin/products/:id/stock', requireStaff, c.setStock);
adminRoutes.post('/admin/products', requireAdmin, c.createProduct);
adminRoutes.put('/admin/products/:id', requireAdmin, c.updateProduct);
adminRoutes.post('/admin/uploads/signature', requireAdmin, c.uploadSignature);

adminRoutes.get('/admin/staff', requireAdmin, c.listStaff);
adminRoutes.post('/admin/staff', requireAdmin, c.createStaff);
adminRoutes.patch('/admin/staff/:id', requireAdmin, c.updateStaff);
