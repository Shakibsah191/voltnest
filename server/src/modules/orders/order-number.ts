import { randomInt } from 'node:crypto';
import type { ClientSession } from 'mongoose';
import { OrderModel } from './order.model';

/** "VN-261104-4821": date in Bangladesh time + 4 random digits. Easy to read out on the phone. */
export async function generateOrderNumber(session?: ClientSession, now = new Date()): Promise<string> {
  const local = new Date(now.getTime() + 6 * 60 * 60 * 1000);
  const ymd = local.toISOString().slice(2, 10).replace(/-/g, ''); // YYMMDD

  for (let attempt = 0; attempt < 8; attempt++) {
    // after a few clashes on a busy day, use a longer suffix
    const suffix = attempt < 5 ? randomInt(1000, 10000) : randomInt(100000, 1000000);
    const candidate = `VN-${ymd}-${suffix}`;
    const taken = await OrderModel.exists({ orderNumber: candidate }).session(session ?? null);
    if (!taken) return candidate;
  }
  throw new Error('Could not create a unique order number');
}
