import { emailConfig } from '../../config/email';
import { emailService } from './email.service';
import { orderPlacedEmail } from './templates/order-placed';
import type { OrderConfirmation } from '../orders/order.service';

/** One place that decides which emails go out. Phase 2's agent can reuse it. */
export const notificationService = {
  /** Fire and forget: the customer's order response never waits for the email. */
  orderPlaced(order: OrderConfirmation) {
    void emailService.send(orderPlacedEmail(order, emailConfig.shopUrl));
  },
};
