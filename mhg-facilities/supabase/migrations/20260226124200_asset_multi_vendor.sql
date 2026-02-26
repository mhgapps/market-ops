-- =====================================================
-- MULTI-VENDOR ASSETS
-- Migrate from single assets.vendor_id FK to junction table
-- =====================================================

-- =====================
-- ASSET_VENDORS JUNCTION TABLE
-- =====================

CREATE TABLE asset_vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES assets(id),
  vendor_id UUID NOT NULL REFERENCES vendors(id),
  is_primary BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- One active (asset, vendor) pair at a time
CREATE UNIQUE INDEX idx_asset_vendors_unique_active
  ON asset_vendors (asset_id, vendor_id)
  WHERE deleted_at IS NULL;

-- Only one primary vendor per asset
CREATE UNIQUE INDEX idx_asset_vendors_one_primary
  ON asset_vendors (asset_id)
  WHERE is_primary = true AND deleted_at IS NULL;

-- Performance: lookup by asset
CREATE INDEX idx_asset_vendors_asset_id
  ON asset_vendors (asset_id)
  WHERE deleted_at IS NULL;

-- Performance: lookup by vendor
CREATE INDEX idx_asset_vendors_vendor_id
  ON asset_vendors (vendor_id)
  WHERE deleted_at IS NULL;

-- =====================
-- MIGRATE EXISTING DATA
-- =====================

INSERT INTO asset_vendors (asset_id, vendor_id, is_primary)
SELECT id, vendor_id, true
FROM assets
WHERE vendor_id IS NOT NULL
  AND deleted_at IS NULL;

-- =====================
-- DROP OLD COLUMN
-- =====================

ALTER TABLE assets DROP COLUMN vendor_id;
