-- Update qr_codes table for admin panel
-- Add is_active column if not exists
ALTER TABLE qr_codes
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true NOT NULL;

-- Add token column for tracking/revocation
ALTER TABLE qr_codes
ADD COLUMN IF NOT EXISTS token TEXT UNIQUE;

-- Generate tokens for existing QR codes if they don't have one
UPDATE qr_codes
SET token = gen_random_uuid()::text
WHERE token IS NULL;

-- Make token required for new records (but allow null for backward compat during migration)
-- We'll enforce NOT NULL in application logic

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_qr_codes_is_active ON qr_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_qr_codes_token ON qr_codes(token);
CREATE INDEX IF NOT EXISTS idx_qr_codes_restaurant_active ON qr_codes(restaurant_id, is_active);

-- Add comments
COMMENT ON COLUMN qr_codes.is_active IS 'Whether the QR code is active (can be revoked)';
COMMENT ON COLUMN qr_codes.token IS 'Unique token for tracking scans and analytics';

