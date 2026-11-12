import { asyncHandler } from '../../shared/middleware/asyncHandler';
import { sendSuccess } from '../../shared/http';
import type { OrderStatus } from '../orders/order.service';
import { dashboardService } from './dashboard.service';
import { adminOrdersService } from './admin-orders.service';
import { adminProductsService } from './admin-products.service';
import { staffService } from './staff.service';
import { uploadsService } from './uploads.service';
import {
  createStaffSchema,
  idParam,
  orderEditSchema,
  orderListSchema,
  productListSchema,
  productSchema,
  statusUpdateSchema,
  stockSchema,
  updateStaffSchema,
} from './admin.schemas';

const isOwner = (role?: string) => role === 'admin';
const orderNumberOf = (p: Record<string, string | undefined>) => String(p.orderNumber ?? '');

export const adminController = {
  me: asyncHandler(async (req, res) => {
    sendSuccess(res, { role: req.user!.role, uploadsEnabled: uploadsService.isEnabled() });
  }),

  dashboard: asyncHandler(async (req, res) => {
    sendSuccess(res, await dashboardService.overview({ includeMoney: isOwner(req.user!.role) }));
  }),

  // orders
  listOrders: asyncHandler(async (req, res) => {
    const f = orderListSchema.parse(req.query);
    const { items, meta } = await adminOrdersService.list({ ...f, status: f.status as OrderStatus | undefined });
    sendSuccess(res, items, meta);
  }),
  getOrder: asyncHandler(async (req, res) => {
    sendSuccess(res, await adminOrdersService.get(orderNumberOf(req.params), isOwner(req.user!.role)));
  }),
  updateOrderStatus: asyncHandler(async (req, res) => {
    const input = statusUpdateSchema.parse(req.body);
    const result = await adminOrdersService.updateStatus(
      orderNumberOf(req.params),
      { ...input, status: input.status as OrderStatus, courier: input.courier },
      req.user!.id,
    );
    sendSuccess(res, result);
  }),
  editOrder: asyncHandler(async (req, res) => {
    sendSuccess(res, await adminOrdersService.edit(orderNumberOf(req.params), orderEditSchema.parse(req.body)));
  }),

  // products
  listProducts: asyncHandler(async (req, res) => {
    const f = productListSchema.parse(req.query);
    const { items, meta } = await adminProductsService.list({ ...f, lowStock: f.lowStock === 'true' }, isOwner(req.user!.role));
    sendSuccess(res, items, meta);
  }),
  getProduct: asyncHandler(async (req, res) => {
    sendSuccess(res, await adminProductsService.get(idParam.parse(req.params).id, isOwner(req.user!.role)));
  }),
  createProduct: asyncHandler(async (req, res) => {
    sendSuccess(res, await adminProductsService.create(productSchema.parse(req.body)), undefined, 201);
  }),
  updateProduct: asyncHandler(async (req, res) => {
    sendSuccess(res, await adminProductsService.update(idParam.parse(req.params).id, productSchema.parse(req.body)));
  }),
  setStock: asyncHandler(async (req, res) => {
    const { variants } = stockSchema.parse(req.body);
    sendSuccess(res, await adminProductsService.setStock(idParam.parse(req.params).id, variants));
  }),
  uploadSignature: asyncHandler(async (_req, res) => {
    sendSuccess(res, uploadsService.sign());
  }),

  // staff
  listStaff: asyncHandler(async (_req, res) => {
    sendSuccess(res, await staffService.list());
  }),
  createStaff: asyncHandler(async (req, res) => {
    sendSuccess(res, await staffService.create(createStaffSchema.parse(req.body)), undefined, 201);
  }),
  updateStaff: asyncHandler(async (req, res) => {
    sendSuccess(res, await staffService.update(idParam.parse(req.params).id, updateStaffSchema.parse(req.body)));
  }),
};
