import { OrderModel } from '../orders/order.model';
import { ProductModel } from '../products/product.model';
import { addDays, startOfDhakaDay } from '../../shared/dates';

const OPEN: string[] = ['pending', 'confirmed', 'processing', 'shipped'];

/**
 * The numbers behind the admin dashboard. Kept as plain functions so the
 * Phase 2 AI agent (daily report, finance summary) can call the same code.
 */
export const dashboardService = {
  /** Orders placed in [from, to): count, value and gross profit. Cancelled orders are left out of money. */
  async salesBetween(from: Date, to: Date) {
    const [row] = await OrderModel.aggregate<{ orders: number; cancelled: number; revenue: number; profit: number; delivery: number }>([
      { $match: { createdAt: { $gte: from, $lt: to } } },
      {
        $group: {
          _id: null,
          orders: { $sum: 1 },
          cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
          revenue: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 0, '$total'] } },
          delivery: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 0, '$deliveryCharge'] } },
          // product profit only: delivery charges go to the courier
          profit: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 0, { $subtract: ['$subtotal', '$totalCost'] }] } },
        },
      },
    ]);
    return row ?? { orders: 0, cancelled: 0, revenue: 0, profit: 0, delivery: 0 };
  },

  /** Open orders promised within `days` days, plus any already late. Soonest first. */
  async dueForDelivery(days = 3, now = new Date(), limit = 20) {
    const until = addDays(startOfDhakaDay(now), days + 1);
    const rows = await OrderModel.find({ status: { $in: OPEN }, expectedDeliveryDate: { $lt: until } })
      .sort({ expectedDeliveryDate: 1 })
      .limit(limit)
      .select('orderNumber status contact.name contact.phone shippingAddress.zone total expectedDeliveryDate')
      .lean();
    return rows.map((o) => ({
      orderNumber: o.orderNumber,
      status: o.status,
      customerName: o.contact?.name ?? '',
      phone: o.contact?.phone ?? '',
      zone: o.shippingAddress?.zone ?? '',
      total: o.total,
      expectedDeliveryDate: o.expectedDeliveryDate.toISOString(),
      late: o.expectedDeliveryDate < now,
    }));
  },

  async countByStatus() {
    const rows = await OrderModel.aggregate<{ _id: string; n: number }>([{ $group: { _id: '$status', n: { $sum: 1 } } }]);
    return Object.fromEntries(rows.map((r) => [r._id, r.n])) as Record<string, number>;
  },

  async lowStock(threshold = 5, limit = 10) {
    const rows = await ProductModel.find({ status: 'active', 'variants.stock': { $lte: threshold } })
      .select('name variants.sku variants.name variants.stock')
      .limit(limit)
      .lean<{ _id: unknown; name: string; variants: { sku: string; name: string; stock: number }[] }[]>();
    return rows.flatMap((p) =>
      p.variants
        .filter((v) => v.stock <= threshold)
        .map((v) => ({ productId: String(p._id), name: p.name, variantName: v.name, sku: v.sku, stock: v.stock })),
    );
  },

  /** Everything the dashboard page shows. Money only for the owner. */
  async overview({ includeMoney, now = new Date() }: { includeMoney: boolean; now?: Date }) {
    const today = startOfDhakaDay(now);
    const [todaySales, weekSales, byStatus, due, lowStock] = await Promise.all([
      this.salesBetween(today, addDays(today, 1)),
      this.salesBetween(addDays(today, -6), addDays(today, 1)),
      this.countByStatus(),
      this.dueForDelivery(3, now),
      this.lowStock(),
    ]);
    return {
      today: {
        orders: todaySales.orders,
        ...(includeMoney ? { revenue: todaySales.revenue, profit: todaySales.profit } : {}),
      },
      last7Days: {
        orders: weekSales.orders,
        ...(includeMoney ? { revenue: weekSales.revenue, profit: weekSales.profit } : {}),
      },
      toConfirm: byStatus.pending ?? 0,
      inProgress: (byStatus.confirmed ?? 0) + (byStatus.processing ?? 0) + (byStatus.shipped ?? 0),
      dueForDelivery: due,
      lowStock,
    };
  },
};
