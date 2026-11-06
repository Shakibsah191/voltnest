/**
 * Change an order's status from the terminal (until the Day 5 admin panel exists).
 *
 *   npm run order:status -- VN-261105-4821 delivered
 *   npm run order:status -- VN-261105-4821 shipped "Sent with Pathao"
 *
 * Statuses: confirmed, processing, shipped, delivered, cancelled, returned
 */
import { connectDB, disconnectDB } from '../config/db';
import { ORDER_STATUSES } from '../modules/orders/order.model';
import { orderService, type OrderStatus } from '../modules/orders/order.service';

async function main() {
  const [orderNumber, status, ...noteParts] = process.argv.slice(2);
  if (!orderNumber || !status || !(ORDER_STATUSES as readonly string[]).includes(status)) {
    console.log('Usage: npm run order:status -- <ORDER-NUMBER> <status> ["optional note"]');
    console.log(`Statuses: ${ORDER_STATUSES.filter((s) => s !== 'pending').join(', ')}`);
    process.exit(1);
  }

  await connectDB();
  try {
    const r = await orderService.updateStatus(orderNumber, status as OrderStatus, { note: noteParts.join(' ') });
    console.log(`✅ ${r.orderNumber}: ${r.previousStatus} → ${r.status}`);
  } catch (err) {
    console.error(`❌ ${(err as Error).message}`);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
  }
}

void main();
