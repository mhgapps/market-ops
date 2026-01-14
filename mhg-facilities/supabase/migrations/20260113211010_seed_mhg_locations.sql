-- =====================================================
-- MHG FACILITIES - SEED MHG LOCATIONS
-- =====================================================
-- Seeds all real Market Hospitality Group restaurant locations
-- Brands: Market Place Kitchen & Bar, Mercato Italian Kitchen & Bar,
--         Market Place Tavern, Blu Pointe, Beso Taco Bar
-- =====================================================

-- =====================
-- ADD BRAND COLUMN TO LOCATIONS
-- =====================

ALTER TABLE locations ADD COLUMN IF NOT EXISTS brand TEXT;

-- Create index for brand filtering
CREATE INDEX IF NOT EXISTS idx_locations_brand ON locations(brand) WHERE deleted_at IS NULL;

-- =====================
-- REMOVE DEMO LOCATIONS (if any exist)
-- =====================

DELETE FROM locations
WHERE tenant_id = '00000000-0000-0000-0000-000000000001'
  AND name IN ('Downtown Flagship', 'South Congress', 'Domain North', 'East 6th Street', 'Mueller District');

-- =====================
-- INSERT REAL MHG LOCATIONS
-- =====================

-- Market Place Kitchen & Bar (6 locations in CT)
INSERT INTO locations (tenant_id, name, brand, address, city, state, zip, status) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Market Place Kitchen & Bar - Avon', 'Market Place Kitchen & Bar', '336 W Main Street', 'Avon', 'CT', '06001', 'active'),
  ('00000000-0000-0000-0000-000000000001', 'Market Place Kitchen & Bar - Danbury', 'Market Place Kitchen & Bar', '33 Mill Plain Road', 'Danbury', 'CT', '06811', 'active'),
  ('00000000-0000-0000-0000-000000000001', 'Market Place Kitchen & Bar - Newington', 'Market Place Kitchen & Bar', '3331 Berlin Turnpike', 'Newington', 'CT', '06111', 'active'),
  ('00000000-0000-0000-0000-000000000001', 'Market Place Kitchen & Bar - Newtown', 'Market Place Kitchen & Bar', '32 Church Hill Road', 'Newtown', 'CT', '06470', 'active'),
  ('00000000-0000-0000-0000-000000000001', 'Market Place Kitchen & Bar - Shelton', 'Market Place Kitchen & Bar', '811 Bridgeport Avenue', 'Shelton', 'CT', '06484', 'active'),
  ('00000000-0000-0000-0000-000000000001', 'Market Place Kitchen & Bar - Woodbury', 'Market Place Kitchen & Bar', '641 Main Street South', 'Woodbury', 'CT', '06798', 'active')
ON CONFLICT DO NOTHING;

-- Mercato Italian Kitchen & Bar (3 locations in CT)
INSERT INTO locations (tenant_id, name, brand, address, city, state, zip, status) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Mercato Italian Kitchen & Bar - Canton', 'Mercato Italian Kitchen & Bar', '110 Albany Turnpike', 'Canton', 'CT', '06019', 'active'),
  ('00000000-0000-0000-0000-000000000001', 'Mercato Italian Kitchen & Bar - Shelton', 'Mercato Italian Kitchen & Bar', '785 Bridgeport Avenue', 'Shelton', 'CT', '06484', 'active'),
  ('00000000-0000-0000-0000-000000000001', 'Mercato Italian Kitchen & Bar - Southbury', 'Mercato Italian Kitchen & Bar', '690 Main Street South', 'Southbury', 'CT', '06488', 'active')
ON CONFLICT DO NOTHING;

-- Market Place Tavern (2 locations in CT)
INSERT INTO locations (tenant_id, name, brand, address, city, state, zip, status) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Market Place Tavern - Brookfield', 'Market Place Tavern', '189 Federal Road', 'Brookfield', 'CT', '06804', 'active'),
  ('00000000-0000-0000-0000-000000000001', 'Market Place Tavern - Litchfield', 'Market Place Tavern', '7 North Street', 'Litchfield', 'CT', '06759', 'active')
ON CONFLICT DO NOTHING;

-- Blu Pointe (1 location in NY)
INSERT INTO locations (tenant_id, name, brand, address, city, state, zip, status) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Blu Pointe', 'Blu Pointe', '120 Front Street', 'Newburgh', 'NY', '12550', 'active')
ON CONFLICT DO NOTHING;

-- Beso Taco Bar (1 location in NY - co-located with Blu Pointe)
INSERT INTO locations (tenant_id, name, brand, address, city, state, zip, status) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Beso Taco Bar', 'Beso Taco Bar', '120 Front Street', 'Newburgh', 'NY', '12550', 'active')
ON CONFLICT DO NOTHING;

-- =====================
-- SUMMARY
-- =====================
-- Total locations seeded: 14
-- - Market Place Kitchen & Bar: 6 (CT)
-- - Mercato Italian Kitchen & Bar: 3 (CT)
-- - Market Place Tavern: 2 (CT)
-- - Blu Pointe: 1 (NY)
-- - Beso Taco Bar: 1 (NY)
