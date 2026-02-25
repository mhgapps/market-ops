-- Migration: Create trusted_devices table and add must_set_password to users
-- Supports "remember this device" functionality: when a user logs in with their
-- password, their device is trusted for 180 days so they skip re-authentication.

-- =====================
-- TRUSTED DEVICES TABLE
-- =====================

CREATE TABLE IF NOT EXISTS trusted_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  user_id UUID NOT NULL REFERENCES users(id),
  auth_user_id UUID NOT NULL,
  device_token_hash TEXT NOT NULL,
  device_name TEXT,              -- parsed from user-agent (e.g., "Chrome on macOS")
  ip_address INET,
  trusted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '180 days'),
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ,       -- set when user explicitly revokes a device
  deleted_at TIMESTAMPTZ,       -- soft delete only, never hard delete
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Fast lookup by token hash during login validation
CREATE INDEX idx_trusted_devices_token_hash
  ON trusted_devices (device_token_hash);

-- List active (non-revoked, non-deleted) devices for a user
CREATE INDEX idx_trusted_devices_user_id
  ON trusted_devices (user_id)
  WHERE deleted_at IS NULL AND revoked_at IS NULL;

-- Tenant-scoped queries for admin device management
CREATE INDEX idx_trusted_devices_tenant_id
  ON trusted_devices (tenant_id)
  WHERE deleted_at IS NULL;

-- Keep updated_at in sync
CREATE TRIGGER trigger_trusted_devices_updated_at
  BEFORE UPDATE ON trusted_devices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- =====================
-- ADD must_set_password TO USERS
-- =====================
-- Flags users who accepted an invite without setting a password.
-- The app checks this on login and redirects them to a set-password flow.

ALTER TABLE users ADD COLUMN IF NOT EXISTS must_set_password BOOLEAN NOT NULL DEFAULT FALSE;
