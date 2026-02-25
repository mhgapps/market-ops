-- Migration: Add asset_types table for equipment sub-classification
-- Example: HVAC (category) -> Compressor, Air Handler, Condenser (types)
--          Kitchen Equipment (category) -> Stove, Grill, Walk-in Cooler (types)

-- Create asset_types table
CREATE TABLE asset_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  category_id UUID NOT NULL REFERENCES asset_categories(id),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(tenant_id, category_id, name)
);

-- Add asset_type_id to assets table
ALTER TABLE assets ADD COLUMN asset_type_id UUID REFERENCES asset_types(id);

-- Indexes
CREATE INDEX idx_asset_types_tenant ON asset_types(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_asset_types_category ON asset_types(category_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_assets_asset_type ON assets(asset_type_id) WHERE deleted_at IS NULL;

-- Keep updated_at in sync
CREATE TRIGGER trigger_asset_types_updated_at
BEFORE UPDATE ON asset_types
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();
