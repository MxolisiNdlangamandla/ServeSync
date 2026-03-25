export type UserRole = 'admin' | 'user';
export type SubscriptionTier = 'tier1' | 'tier2' | 'tier3' | 'tier4';

export interface Profile {
  id: string;
  full_name: string | null;
  email: string;
  role: UserRole;
  store_id: string | null;
  store_name: string | null;
  industry: string | null;
  invite_token?: string | null;
  is_online?: boolean;
  last_seen_at?: string | null;
  subscription_tier: SubscriptionTier;
}
