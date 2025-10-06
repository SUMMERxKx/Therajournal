export interface DonationTier {
  id: string;
  amount: number;
  label: string;
  description: string;
  popular?: boolean;
}

export interface DonationConfig {
  enabled: boolean;
  tiers: DonationTier[];
  stripePublicKey?: string;
  paypalLink?: string;
  monthlyCap: number; // Monthly spending cap in USD
}

export interface DonationRecord {
  id: string;
  amount: number;
  tier: string;
  timestamp: string;
  method: 'stripe' | 'paypal';
  acknowledged: boolean;
}
