export interface MenuItem {
  id: string;
  storeId?: string;
  store_id?: string;
  assigned_store_name?: string | null;
  name: string;
  price: number;
  category: string;
  available: boolean;
  description: string | null;
  created_at: string;
}
