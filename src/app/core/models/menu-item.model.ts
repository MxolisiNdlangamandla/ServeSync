export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  available: boolean;
  description: string | null;
  created_at: string;
}
