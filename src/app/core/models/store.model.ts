export type StoreStatus = 'active' | 'inactive';

export interface Store {
  id: string;
  owner_profile_id: string;
  name: string;
  address_line1: string | null;
  city: string | null;
  contact_phone: string | null;
  status: StoreStatus;
  created_at: string | null;
  updated_at: string | null;
  is_primary: boolean;
}

export interface StoreBillingSummary {
  activeStoreCount: number;
  monthlyRate: number;
  projectedMonthlyTotal: number;
}

export interface StoresResponse {
  stores: Store[];
  billing: StoreBillingSummary;
}