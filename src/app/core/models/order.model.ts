export type OrderStatus = 'active' | 'completed' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'pending' | 'paid';

export interface OrderItem {
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  store_id: string;
  table_number: string;
  customer_name: string | null;
  items: OrderItem[];
  status: OrderStatus;
  call_staff: boolean;
  request_bill: boolean;
  payment_status: PaymentStatus;
  notes: string | null;
  access_token: string;
  created_at: string;
  updated_at: string;
}

export interface CreateOrderPayload {
  table_number: string;
  customer_name?: string;
  items: OrderItem[];
  notes?: string;
  access_token: string;
}
