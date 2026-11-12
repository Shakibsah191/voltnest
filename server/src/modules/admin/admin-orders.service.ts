import { Types } from 'mongoose';
import { AppError } from '../../shared/errors/AppError';
import { DELIVERY_OPTIONS } from '../../shared/delivery';
import { addDays, dhakaDate } from '../../shared/dates';
import { OrderModel, ORDER_STATUSES } from '../orders/order.model';
import { canMoveTo, orderService, type OrderStatus } from '../orders/order.service';
import { UserModel } from '../users/user.model';
import { notificationService } from '../notifications/notification.service';

type Filters = { page: number; limit: number; status?: OrderStatus; from?: string; to?: string; q?: string };

const escapeRx = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const zoneLabel = (z: string) => DELIVERY_OPTIONS[z as keyof typeof DELIVERY_OPTIONS]?.label ?? z;

export const adminOrdersService = {
  async list({ page, limit, status, from, to, q }: Filters) {
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (from || to) {
      filter.createdAt = {
        ...(from ? { $gte: dhakaDate(from) } : {}),
        ...(to ? { $lt: addDays(dhakaDate(to), 1) } : {}),
      };
    }
    if (q) {
      const digits = q.replace(/[\s+-]/g, '').replace(/^88(?=01)/, '');
      if (/^vn-/i.test(q)) filter.orderNumber = { $regex: `^${escapeRx(q.toUpperCase())}` };
      else if (/^\d{4,}$/.test(digits)) filter['contact.phone'] = { $regex: escapeRx(digits) };
      else filter['contact.name'] = { $regex: escapeRx(q), $options: 'i' };
    }

    const [rows, total] = await Promise.all([
      OrderModel.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select('orderNumber status paymentStatus contact.name contact.phone shippingAddress.zone total items.quantity createdAt expectedDeliveryDate')
        .lean(),
      OrderModel.countDocuments(filter),
    ]);

    return {
      items: rows.map((o) => ({
        orderNumber: o.orderNumber,
        status: o.status,
        paymentStatus: o.paymentStatus,
        customerName: o.contact?.name ?? '',
        phone: o.contact?.phone ?? '',
        zone: zoneLabel(o.shippingAddress?.zone ?? ''),
        total: o.total,
        itemCount: o.items.reduce((s, i) => s + i.quantity, 0),
        createdAt: (o as { createdAt: Date }).createdAt.toISOString(),
        expectedDeliveryDate: o.expectedDeliveryDate.toISOString(),
      })),
      meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    };
  },

  /** Everything staff need to fulfil an order. Cost and profit only when includeMoney. */
  async get(orderNumber: string, includeMoney: boolean) {
    const order = await OrderModel.findOne({ orderNumber: orderNumber.trim().toUpperCase() }).lean();
    if (!order) throw AppError.notFound('No order with that number');

    const userIds = [order.user, ...order.statusHistory.map((e) => e.changedBy)].filter(Boolean) as Types.ObjectId[];
    const users = await UserModel.find({ _id: { $in: userIds } }).select('name email role').lean();
    const nameOf = new Map(users.map((u) => [String(u._id), u]));
    const customer = order.user ? nameOf.get(String(order.user)) : null;
    const current = order.status as OrderStatus;

    return {
      orderNumber: order.orderNumber,
      status: current,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      createdAt: (order as { createdAt: Date }).createdAt.toISOString(),
      expectedDeliveryDate: order.expectedDeliveryDate.toISOString(),
      deliveredAt: order.deliveredAt ? order.deliveredAt.toISOString() : null,
      contact: order.contact,
      shippingAddress: { ...order.shippingAddress, zoneLabel: zoneLabel(order.shippingAddress?.zone ?? '') },
      customerNote: order.customerNote ?? '',
      account: customer ? { name: customer.name, email: customer.email } : null,
      courier: order.courier?.name ? { name: order.courier.name, trackingNumber: order.courier.trackingNumber ?? '' } : null,
      items: order.items.map((i) => ({
        productId: String(i.product),
        variantSku: i.variantSku,
        name: i.name,
        variantName: i.variantName,
        image: i.image ?? '',
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        lineTotal: i.lineTotal,
        ...(includeMoney ? { unitCost: i.unitCost } : {}),
      })),
      subtotal: order.subtotal,
      deliveryCharge: order.deliveryCharge,
      total: order.total,
      ...(includeMoney ? { totalCost: order.totalCost, profit: order.subtotal - order.totalCost } : {}),
      statusHistory: order.statusHistory.map((e) => ({
        status: e.status,
        note: e.note ?? '',
        at: e.at.toISOString(),
        by: e.changedBy ? (nameOf.get(String(e.changedBy))?.name ?? 'Staff') : null, // null = the customer or the system
      })),
      /** the buttons the panel should show */
      nextStatuses: ORDER_STATUSES.filter((s) => canMoveTo(current, s)),
    };
  },

  async updateStatus(
    orderNumber: string,
    input: { status: OrderStatus; note: string; courier?: { name: string; trackingNumber: string }; expectedDeliveryDate?: string },
    changedBy: string,
  ) {
    if (input.status === 'shipped' && !input.courier) {
      throw new AppError(400, 'Enter the courier’s name before marking it shipped', 'VALIDATION_ERROR', { 'courier.name': 'Enter the courier’s name' });
    }
    const result = await orderService.updateStatus(orderNumber, input.status, {
      note: input.note,
      changedBy,
      courier: input.courier,
      expectedDeliveryDate: input.expectedDeliveryDate ? dhakaDate(input.expectedDeliveryDate, 18) : undefined,
    });
    void notificationService.orderStatusChanged(result); // the customer hears about it
    return { orderNumber: result.orderNumber, status: result.status, previousStatus: result.previousStatus };
  },

  /** Fix the courier or the promised date without changing the status. */
  async edit(orderNumber: string, input: { courier?: { name: string; trackingNumber: string }; expectedDeliveryDate?: string }) {
    const set: Record<string, unknown> = {};
    if (input.courier) set.courier = input.courier;
    if (input.expectedDeliveryDate) set.expectedDeliveryDate = dhakaDate(input.expectedDeliveryDate, 18);
    const res = await OrderModel.updateOne({ orderNumber: orderNumber.trim().toUpperCase() }, { $set: set });
    if (res.matchedCount === 0) throw AppError.notFound('No order with that number');
    return { updated: true };
  },
};
