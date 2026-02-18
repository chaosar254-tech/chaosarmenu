-- Migration 027: Create billing_settings table
-- This migration creates a billing settings table for restaurant payment configuration

-- Create billing_settings table
CREATE TABLE billing_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE UNIQUE,
  setup_fee_enabled BOOLEAN DEFAULT true,
  setup_fee_amount NUMERIC(10, 2) DEFAULT 0,
  setup_fee_payment_link TEXT,
  subscription_period TEXT CHECK (subscription_period IN ('monthly', 'yearly')) DEFAULT 'monthly',
  subscription_monthly_price NUMERIC(10, 2) DEFAULT 0,
  subscription_yearly_price NUMERIC(10, 2) DEFAULT 0,
  subscription_monthly_link TEXT,
  subscription_yearly_link TEXT,
  plan TEXT CHECK (plan IN ('trial', 'monthly', 'yearly')) DEFAULT 'trial',
  status TEXT CHECK (status IN ('active', 'past_due', 'canceled', 'trial')) DEFAULT 'trial',
  trial_end_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for restaurant_id (already unique, but index for joins)
CREATE INDEX idx_billing_settings_restaurant_id ON billing_settings(restaurant_id);

-- Enable RLS
ALTER TABLE billing_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Owners can view their own billing settings
CREATE POLICY "Owners can view own billing settings"
  ON billing_settings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = billing_settings.restaurant_id
      AND restaurants.owner_user_id = auth.uid()
    )
  );

-- RLS Policy: Owners can insert their own billing settings
CREATE POLICY "Owners can insert own billing settings"
  ON billing_settings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = billing_settings.restaurant_id
      AND restaurants.owner_user_id = auth.uid()
    )
  );

-- RLS Policy: Owners can update their own billing settings
CREATE POLICY "Owners can update own billing settings"
  ON billing_settings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = billing_settings.restaurant_id
      AND restaurants.owner_user_id = auth.uid()
    )
  );

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_billing_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER billing_settings_updated_at
  BEFORE UPDATE ON billing_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_billing_settings_updated_at();

-- Add comment for documentation
COMMENT ON TABLE billing_settings IS 'Billing and payment settings for restaurants';
COMMENT ON COLUMN billing_settings.setup_fee_enabled IS 'Whether setup fee is enabled';
COMMENT ON COLUMN billing_settings.setup_fee_amount IS 'Setup fee amount in TRY';
COMMENT ON COLUMN billing_settings.setup_fee_payment_link IS 'Payment link URL for setup fee (e.g., iyzico Link/Pay Link)';
COMMENT ON COLUMN billing_settings.subscription_period IS 'Billing period: monthly or yearly';
COMMENT ON COLUMN billing_settings.subscription_monthly_price IS 'Monthly subscription price in TRY';
COMMENT ON COLUMN billing_settings.subscription_yearly_price IS 'Yearly subscription price in TRY';
COMMENT ON COLUMN billing_settings.subscription_monthly_link IS 'Payment link URL for monthly subscription';
COMMENT ON COLUMN billing_settings.subscription_yearly_link IS 'Payment link URL for yearly subscription';
COMMENT ON COLUMN billing_settings.plan IS 'Current plan: trial, monthly, or yearly';
COMMENT ON COLUMN billing_settings.status IS 'Subscription status: active, past_due, canceled, or trial';
COMMENT ON COLUMN billing_settings.trial_end_at IS 'Trial end date (for trial plans)';

