export type NotificationType = 'new_order' | 'item_added' | 'call_staff' | 'bill_request';

export interface AppNotification {
  id: string;
  order_id: string;
  table_number: string | null;
  type: NotificationType;
  message: string;
  read: boolean;
  created_at: string;
}
