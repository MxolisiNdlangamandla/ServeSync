export type UserRole = 'admin' | 'user';
export type SubscriptionTier = 'tier1' | 'tier2' | 'tier3';

export interface Profile {
  id: string;
  full_name: string | null;
  email: string;
  role: UserRole;
  store_id: string | null;
  store_name: string | null;
  industry: string | null;
  subscription_tier: SubscriptionTier;
}
