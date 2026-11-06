import { Badge } from '@/shared/ui/Badge';
import { STATUS_LABEL, STATUS_TONE } from '../status';
import type { OrderStatus } from '../types';

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</Badge>;
}
