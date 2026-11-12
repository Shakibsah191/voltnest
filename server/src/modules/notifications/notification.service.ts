import { emailConfig } from '../../config/email';
import { emailService } from './email.service';
import { orderPlacedEmail } from './templates/order-placed';
import { statusUpdateEmail, type EmailedStatus } from './templates/status-update';
import type { OrderConfirmation, OrderStatus, StatusUpdateResult } from '../orders/order.service';

const EMAILED: OrderStatus[] = ['confirmed', 'shipped', 'delivered', 'cancelled'];

/** One place that decides which emails go out. Phase 2's agent can reuse it. */
export const notificationService = {
  /** Returns a promise; web requests don't wait for it (`void …`), the CLI does. Never rejects. */
  orderPlaced(order: OrderConfirmation): Promise<boolean> {
    return emailService.send(orderPlacedEmail(order, emailConfig.shopUrl));
  },

  /** Confirmed, on the way, delivered or cancelled. Packing and returns stay quiet. */
  orderStatusChanged(update: StatusUpdateResult): Promise<boolean> {
    if (!EMAILED.includes(update.status)) return Promise.resolve(false);
    return emailService.send(
      statusUpdateEmail({
        order: update.order,
        status: update.status as EmailedStatus,
        note: update.note,
        courier: update.courier,
        shopUrl: emailConfig.shopUrl,
      }),
    );
  },
};
