-- =====================================================
-- MHG FACILITIES - SEED VENDORS
-- =====================================================
-- Imports vendor master list from Xero contact exports
-- Source: MHG_Vendor_Master_List.csv (deduplicated)
-- =====================================================

-- Use a DO block to avoid duplicates on re-run
DO $$
DECLARE
  v_tenant_id UUID := '00000000-0000-0000-0000-000000000001';
BEGIN

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'ABC Exterminating, Inc',
    NULL,
    NULL,
    NULL,
    '115 Main Street, Suite #6, Monroe, CT 6468',
    ARRAY['pest-control']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'ABC Exterminating, Inc' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'AC Garage Door Service',
    NULL,
    NULL,
    NULL,
    '15 Margerie Dr, New Fairfield, CT 6812',
    ARRAY['garage-door','general-repair']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'AC Garage Door Service' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'ACCRA-TEMP',
    NULL,
    NULL,
    NULL,
    '40 Chelton Avenue, West Hartford, CT 6110',
    ARRAY['hvac']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'ACCRA-TEMP' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'Air Quality LLC',
    NULL,
    NULL,
    NULL,
    '420 Moose Hill Rd, Monroe, CT',
    ARRAY['hvac']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'Air Quality LLC' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'Albion Glass Inc.',
    NULL,
    NULL,
    NULL,
    '1 1/2 Islandbrook Ave, Building A, Bridgeport, CT 6606',
    ARRAY['glass']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'Albion Glass Inc.' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'All American Waste, LLC',
    NULL,
    NULL,
    NULL,
    'PO Box 1308, Enfield, CT 6083',
    ARRAY['waste-removal']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'All American Waste, LLC' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'All Waste',
    NULL,
    NULL,
    NULL,
    'PO Box 2472, Hartford, CT 6146',
    ARRAY['waste-removal']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'All Waste' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'Aquarion Water Company',
    NULL,
    NULL,
    NULL,
    'PO Box 3664, Portland, ME 04104-3664',
    ARRAY['utility','water']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'Aquarion Water Company' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'Arc-O-Rooter LLC',
    NULL,
    NULL,
    NULL,
    'PO Box 8, Danbury, CT 6813',
    ARRAY['plumbing','drain-cleaning']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'Arc-O-Rooter LLC' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'Archer Signs',
    NULL,
    NULL,
    NULL,
    '316 Boston Post Rd, Milford, CT 6460',
    ARRAY['signage']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'Archer Signs' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'Bill JR & Son Septic LLC',
    NULL,
    NULL,
    NULL,
    'P.O. Box 647, Botsford, CT 6404',
    ARRAY['septic']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'Bill JR & Son Septic LLC' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'Blinds Guys',
    NULL,
    NULL,
    NULL,
    'PO Box 387, Botsford, CT 6404',
    ARRAY['blinds','window-treatments']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'Blinds Guys' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'Blue Line Repairs LLC',
    NULL,
    NULL,
    NULL,
    '494 Bridgeport Ave, Unit 101, Shelton, CT 6484',
    ARRAY['general-repair']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'Blue Line Repairs LLC' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'Cardoso Cleaners',
    NULL,
    NULL,
    NULL,
    '131 Clark Street, Hartford, CT 6120',
    ARRAY['cleaning']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'Cardoso Cleaners' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'Charter Oak Garbage',
    NULL,
    NULL,
    NULL,
    NULL,
    ARRAY['waste-removal']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'Charter Oak Garbage' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'Clean Suites',
    NULL,
    NULL,
    NULL,
    '67 Heritage Dr, Naugatuck, CT 6770',
    ARRAY['cleaning']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'Clean Suites' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'Cliff Canfield Plumbing',
    NULL,
    NULL,
    NULL,
    '456 Danbury Rd, New Milford, CT 6776',
    ARRAY['plumbing']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'Cliff Canfield Plumbing' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'CNG',
    NULL,
    NULL,
    NULL,
    'PO Box 847820, Boston, MA 02284-7820',
    ARRAY['utility','gas']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'CNG' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'Comcast Business',
    NULL,
    NULL,
    NULL,
    'P.O. Box 6505, Chelmsford, MA 1824',
    ARRAY['utility','internet','cable']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'Comcast Business' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'COMMERCIAL GASKETS',
    NULL,
    NULL,
    NULL,
    '22 Bunker Hill Rd, Killingworth, CT 6419',
    ARRAY['parts','gaskets']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'COMMERCIAL GASKETS' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'Constellation Newenergy, Inc.',
    NULL,
    NULL,
    NULL,
    'P.O. Box 5471, Carol Stream, IL 60197-5471',
    ARRAY['utility','energy']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'Constellation Newenergy, Inc.' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'Cozzini Bros., Inc.',
    NULL,
    NULL,
    NULL,
    '350 Howard Avenue, Des Plaines, IL 60018',
    ARRAY['knife-sharpening','sanitation']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'Cozzini Bros., Inc.' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'CSC Hood & Duct Services',
    NULL,
    NULL,
    NULL,
    '55 Glendale Road, P.O. Box 354, South Windsor, CT 6074',
    ARRAY['hood-cleaning','duct-cleaning']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'CSC Hood & Duct Services' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'Connecticut Water Company',
    NULL,
    NULL,
    NULL,
    NULL,
    ARRAY['utility','water']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'Connecticut Water Company' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'CWPM',
    NULL,
    NULL,
    NULL,
    '25 Norton Place, PO Box 415, Plainville, CT 6062',
    ARRAY['property-management']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'CWPM' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'D-Grease',
    NULL,
    NULL,
    NULL,
    '16 Mabel Ave, Danbury, CT 6811',
    ARRAY['cleaning','grease-trap']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'D-Grease' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'Danbury Septic',
    NULL,
    NULL,
    NULL,
    '2 Powder Horn Ridge, Danbury, CT 6811',
    ARRAY['septic']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'Danbury Septic' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'Danbury Upholstery',
    NULL,
    NULL,
    NULL,
    '39B Mill Plain Rd, Danbury, CT 6811',
    ARRAY['upholstery']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'Danbury Upholstery' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'Danbury Winair Co',
    NULL,
    NULL,
    NULL,
    NULL,
    ARRAY['hvac']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'Danbury Winair Co' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'Danny''s Glass & Shower Doors',
    NULL,
    NULL,
    NULL,
    '65 Clemens Ave, Trumbull, CT 6611',
    ARRAY['glass']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'Danny''s Glass & Shower Doors' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'Discount Drain Services',
    NULL,
    NULL,
    NULL,
    'P.O. Box 373, Shelton, CT 6484',
    ARRAY['plumbing','drain-cleaning']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'Discount Drain Services' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'DJ Petrucci, LLC',
    NULL,
    NULL,
    NULL,
    'PO Box 579, Fairfield, CT 6824',
    ARRAY['general-contractor']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'DJ Petrucci, LLC' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'Durants Party Rentals',
    NULL,
    NULL,
    NULL,
    '1 Precision Road, Danbury, CT 6811',
    ARRAY['rentals']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'Durants Party Rentals' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'Earthbuilt LLC',
    NULL,
    NULL,
    NULL,
    '64 Apter Dr, Torrington, CT 6790',
    ARRAY['construction']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'Earthbuilt LLC' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'Ecolab, Inc.',
    NULL,
    NULL,
    NULL,
    'P.O. Box 32027, New York, NY 10087',
    ARRAY['sanitation','chemicals','pest-control']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'Ecolab, Inc.' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'EG Painting LLC',
    NULL,
    NULL,
    NULL,
    '61 Ohio Avenue Ext Apt A, Norwalk, CT 6851',
    ARRAY['painting']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'EG Painting LLC' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'Elegant Concrete Polishing',
    NULL,
    NULL,
    NULL,
    '155 Fulton Ter, Unit A, New Haven, CT 6512',
    ARRAY['flooring','concrete']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'Elegant Concrete Polishing' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'Empire Pro Cleaners',
    NULL,
    NULL,
    NULL,
    '252 Lindley Street, Bridgeport, CT 6606',
    ARRAY['cleaning']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'Empire Pro Cleaners' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'Encore Fire Protection',
    NULL,
    NULL,
    NULL,
    '35 Philmack Drive, Middletown, CT 6457',
    ARRAY['fire-protection']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'Encore Fire Protection' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'Eversource Electric',
    NULL,
    NULL,
    NULL,
    'PO Box 56002, Boston, MA 02205-6002',
    ARRAY['utility','electric']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'Eversource Electric' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'Fairfield Steel',
    NULL,
    NULL,
    NULL,
    '42 Oliver Terrace, Shelton, CT 6484',
    ARRAY['steel','fabrication']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'Fairfield Steel' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'Falvey Linen & Uniform of CT',
    NULL,
    NULL,
    NULL,
    '50 Burnham Avenue, Cranston, RI 2910',
    ARRAY['linen','uniform']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'Falvey Linen & Uniform of CT' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'Five Star Maintenance LLC',
    NULL,
    NULL,
    NULL,
    '77 North St, Danbury, CT 6810',
    ARRAY['general-maintenance']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'Five Star Maintenance LLC' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'Flamig Farm Earth Products',
    NULL,
    NULL,
    NULL,
    '44 W Mountain Rd, West Simsbury, CT 6092',
    ARRAY['landscaping','materials']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'Flamig Farm Earth Products' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'Guys Heating & Cooling',
    NULL,
    NULL,
    NULL,
    NULL,
    ARRAY['hvac']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'Guys Heating & Cooling' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'Hartford Sprinkler Company Inc.',
    NULL,
    NULL,
    NULL,
    '4 Britton Dr, Bloomfield, CT 6002',
    ARRAY['fire-protection','sprinkler']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'Hartford Sprinkler Company Inc.' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'HL Bennett Jr Inc',
    NULL,
    NULL,
    NULL,
    '60 F Bennett Square, Southbury, CT 6488',
    ARRAY['general-contractor']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'HL Bennett Jr Inc' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'Hood Services 24, LLC',
    NULL,
    NULL,
    NULL,
    '220 Julius St, Iselin, NJ 8830',
    ARRAY['hood-cleaning']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'Hood Services 24, LLC' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'Horton Electric',
    NULL,
    NULL,
    NULL,
    '97 River Road, Canton, CT 6019',
    ARRAY['electrical']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'Horton Electric' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'Huntington Handyman Service LLC',
    NULL,
    NULL,
    NULL,
    '84 Sorghum Rd, Shelton, CT 6484',
    ARRAY['handyman']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'Huntington Handyman Service LLC' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'J & J Lock, LLC',
    NULL,
    NULL,
    NULL,
    '1876 Litchfield Road, Watertown, CT 6795',
    ARRAY['locksmith']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'J & J Lock, LLC' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'J Fusaro Plg & Htg Inc',
    NULL,
    NULL,
    NULL,
    '57 Stony Hill Rd, Bethel, CT 6801',
    ARRAY['plumbing','heating']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'J Fusaro Plg & Htg Inc' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'J Gil Electric LLC',
    NULL,
    NULL,
    NULL,
    '8 Council Dr, Oxford, CT 6478',
    ARRAY['electrical']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'J Gil Electric LLC' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'J. Shuster Building & Renovations',
    NULL,
    NULL,
    NULL,
    '35 Oak Hill Ln, Shelton, CT 6484',
    ARRAY['construction','renovation']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'J. Shuster Building & Renovations' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'James Connole',
    NULL,
    NULL,
    NULL,
    '16 Woodland Avenue, Winstead, CT 6098',
    ARRAY['general-contractor']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'James Connole' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'Jeff Ricker',
    NULL,
    NULL,
    NULL,
    '1047 Danbury Road, Wilton, CT 6897',
    ARRAY['general-contractor']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'Jeff Ricker' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'Joe Hayden',
    NULL,
    NULL,
    NULL,
    'P.O. Box 86, S. Lyme, CT 6376',
    ARRAY['general-contractor']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'Joe Hayden' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'John Vlahos',
    NULL,
    NULL,
    NULL,
    '420 Moose Hill Rd, Monroe, CT',
    ARRAY['general-contractor']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'John Vlahos' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'King Coil Cleaning',
    NULL,
    NULL,
    NULL,
    '30 Ranger Lane, West Hartford, CT 6117',
    ARRAY['hvac','cleaning']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'King Coil Cleaning' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'Kuehn Building & Remodeling',
    NULL,
    NULL,
    NULL,
    '106 Miry Brook Rd, Danbury, CT 6810',
    ARRAY['construction','remodeling']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'Kuehn Building & Remodeling' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'Lawn Works',
    NULL,
    NULL,
    NULL,
    '15 Enford Street #903, Avon, CT 6001',
    ARRAY['landscaping','lawn-care']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'Lawn Works' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'Leahy''s Fuel',
    NULL,
    NULL,
    NULL,
    NULL,
    ARRAY['utility','fuel']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'Leahy''s Fuel' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'Lupo Electric LLC',
    NULL,
    NULL,
    NULL,
    '56 A Echo Lake Rd, Watertown, CT 6795',
    ARRAY['electrical']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'Lupo Electric LLC' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'MACRI',
    NULL,
    NULL,
    NULL,
    'PO Box 1750, Avon, CT 6001',
    ARRAY['property-management']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'MACRI' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'MBS Lawn & Tree',
    NULL,
    NULL,
    NULL,
    'PO Box 156, Monroe, CT 6468',
    ARRAY['landscaping','tree-service']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'MBS Lawn & Tree' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'MESA General Contractors, LLC.',
    NULL,
    NULL,
    NULL,
    '458 Danbury Road, A7, New Milford, CT 6776',
    ARRAY['general-contractor']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'MESA General Contractors, LLC.' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'MPSPHC',
    NULL,
    NULL,
    NULL,
    'PO Box 103, Trumbull, CT 6611',
    ARRAY['property-management']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'MPSPHC' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'Nancy''s Tree Planting',
    NULL,
    NULL,
    NULL,
    '112 Bridgeport Ave, Shelton, CT 6484',
    ARRAY['landscaping','tree-service']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'Nancy''s Tree Planting' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'New England Hoods Inc',
    NULL,
    NULL,
    NULL,
    '64 Hood Ter, West Haven, CT 6516',
    ARRAY['hood-cleaning']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'New England Hoods Inc' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'Nick''s Carting, Inc.',
    NULL,
    NULL,
    NULL,
    '288 Knowlton Street, Bridgeport, CT 6609',
    ARRAY['waste-removal']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'Nick''s Carting, Inc.' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'NMC Steel LLC',
    NULL,
    NULL,
    NULL,
    NULL,
    ARRAY['steel','fabrication']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'NMC Steel LLC' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'Noble Wood Floors',
    NULL,
    NULL,
    NULL,
    NULL,
    ARRAY['flooring']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'Noble Wood Floors' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'Northern Comfort',
    NULL,
    NULL,
    NULL,
    '178 Osborne St, Danbury, CT 6810',
    ARRAY['hvac']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'Northern Comfort' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'NuCO2',
    NULL,
    NULL,
    NULL,
    'P.O. Box 9011, Stuart, FL 34995',
    ARRAY['co2-supply']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'NuCO2' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'Oak Ridge Waste & Recycling',
    NULL,
    NULL,
    NULL,
    'PO Box 1937, Danbury, CT 6810',
    ARRAY['waste-removal','recycling']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'Oak Ridge Waste & Recycling' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'OBM',
    NULL,
    NULL,
    NULL,
    NULL,
    ARRAY['general-maintenance']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'OBM' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'Paul Casey & Son Roofing LLC',
    NULL,
    NULL,
    NULL,
    '50 Armstrong Road, Shelton, CT 6464',
    ARRAY['roofing']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'Paul Casey & Son Roofing LLC' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'Precision Pump Service',
    NULL,
    NULL,
    NULL,
    '7 Aja Lane, New Milford, CT 6776',
    ARRAY['plumbing','pump-service']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'Precision Pump Service' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'Pierce Plumbing LLC',
    NULL,
    NULL,
    NULL,
    '1035 Old Waterbury Rd, Southbury, CT 6488',
    ARRAY['plumbing']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'Pierce Plumbing LLC' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'Premier Group, LLC',
    NULL,
    NULL,
    NULL,
    '801 N Main Street Ext, Ste 7, Wallingford, CT 6492',
    ARRAY['plumbing']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'Premier Group, LLC' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'ProGuard',
    NULL,
    NULL,
    NULL,
    '1 Ecolab Place, St Paul, MN 55102-2739',
    ARRAY['sanitation','chemicals']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'ProGuard' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'R & S Construction Services Inc',
    NULL,
    NULL,
    NULL,
    'PO Box 121, Middlebury, CT 6762',
    ARRAY['construction']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'R & S Construction Services Inc' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'Rachel Radachowsky',
    NULL,
    NULL,
    NULL,
    '179 Westville Ave. Extension, Danbury, CT 6811',
    ARRAY['general-contractor']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'Rachel Radachowsky' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'Ramirez Lemus Remodeling',
    NULL,
    NULL,
    NULL,
    '263 Noble Street, West Haven, CT 6516',
    ARRAY['remodeling']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'Ramirez Lemus Remodeling' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'Reclaimed Creations LLC',
    NULL,
    NULL,
    NULL,
    '16 Fair Street, Carmel, NY 10512',
    ARRAY['construction','renovation']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'Reclaimed Creations LLC' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'Red Baron Carpet Cleaning, LLC',
    NULL,
    NULL,
    NULL,
    '6 Edgewood Dr, Newtown, CT 6470',
    ARRAY['carpet-cleaning']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'Red Baron Carpet Cleaning, LLC' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'Restaurant Furniture Plus',
    NULL,
    NULL,
    NULL,
    '1001 W Culver Rd, Knox, IN 46534',
    ARRAY['furniture']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'Restaurant Furniture Plus' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'Service One',
    NULL,
    NULL,
    NULL,
    '35 Hill Street, Bridgeport, CT 6606',
    ARRAY['general-maintenance']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'Service One' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'Southington Ice House,Llc',
    NULL,
    NULL,
    NULL,
    '1678 Meriden Wtby Tpke, PO Box 294, Milldale, CT 6467',
    ARRAY['ice-supply']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'Southington Ice House,Llc' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'Spectrum Business',
    NULL,
    NULL,
    NULL,
    'PO Box 7173, Pasadena CA 91109-7173, Pasadena, CA 91109-7173',
    ARRAY['utility','internet','cable']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'Spectrum Business' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'Stone Resources',
    NULL,
    NULL,
    NULL,
    '93 Triangle St, Danbury, CT 6810',
    ARRAY['masonry','construction']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'Stone Resources' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'SUPERIOR CLEAN LLC',
    NULL,
    NULL,
    NULL,
    '198 DEPOT ROAD UNIT #1B, MILFORD, CT 6460',
    ARRAY['cleaning']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'SUPERIOR CLEAN LLC' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'System Aire Supply Co., Inc.',
    NULL,
    NULL,
    NULL,
    '20 Westfield Drive, Plantsville, CT 6479',
    ARRAY['hvac','supplies']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'System Aire Supply Co., Inc.' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'Testa Refrigeration',
    NULL,
    NULL,
    NULL,
    '1 Lily Drive, Danbury, CT 6811',
    ARRAY['refrigeration','hvac']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'Testa Refrigeration' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'United Illuminating (UI)',
    NULL,
    NULL,
    NULL,
    'P.O. Box 847818, Boston, MA 02284-7818',
    ARRAY['utility','electric']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'United Illuminating (UI)' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'Trading Post Home, Hearth & Leisure',
    NULL,
    NULL,
    NULL,
    '314 Kent Rd, New Milford, CT 6776',
    ARRAY['furniture','fixtures']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'Trading Post Home, Hearth & Leisure' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'Uni-Kem Chemicals, Inc.',
    NULL,
    NULL,
    NULL,
    '802 William Leigh Dr Suite 19, Tullytown, PA 19007',
    ARRAY['chemicals']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'Uni-Kem Chemicals, Inc.' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'United Alarm Services',
    NULL,
    NULL,
    NULL,
    'PO Box 735358, Dallas, TX 75373-5358',
    ARRAY['security','alarm']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'United Alarm Services' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'Valley Electric Supply Co Inc.',
    NULL,
    NULL,
    NULL,
    '3 Chestnut Street, Ansonia, CT 6401',
    ARRAY['electrical','supplies']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'Valley Electric Supply Co Inc.' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'Valley Fire Protection',
    NULL,
    NULL,
    NULL,
    '494 Bridgeport Ave, Shelton, CT 6484',
    ARRAY['fire-protection']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'Valley Fire Protection' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'Valley Lighting',
    NULL,
    NULL,
    NULL,
    '3 Chestnut St, PO Box 42, Ansonia, CT 6401',
    ARRAY['lighting','electrical']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'Valley Lighting' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'WB Law & Son',
    NULL,
    NULL,
    NULL,
    '2280 Wilson Avenue, Unit B, Newark, NJ 7105',
    ARRAY['general-maintenance']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'WB Law & Son' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'WF Anderson LLC',
    NULL,
    NULL,
    NULL,
    '4 Old Mill Plain Rd, Danbury, CT 6811',
    ARRAY['general-contractor']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'WF Anderson LLC' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'Borough Tax Collector',
    NULL,
    NULL,
    NULL,
    'P.O. Box 471, Newtown, CT 6470',
    ARRAY['municipal','tax']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'Borough Tax Collector' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'Central Connecticut Health District',
    NULL,
    NULL,
    NULL,
    '2080 Silas Deane Hwy, Ste 100, Rocky Hill, CT 6067',
    ARRAY['municipal','health-department']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'Central Connecticut Health District' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'City Of Danbury',
    NULL,
    NULL,
    NULL,
    '155 Deer Hill Ave, Danbury, CT 6810',
    ARRAY['municipal']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'City Of Danbury' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'City Of Shelton WPCA',
    NULL,
    NULL,
    NULL,
    NULL,
    ARRAY['municipal','water-authority']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'City Of Shelton WPCA' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'Farmington Valley Health District',
    NULL,
    NULL,
    NULL,
    '95 River Road, Canton, CT 6019',
    ARRAY['municipal','health-department']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'Farmington Valley Health District' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'Maryann Douglas State Marshal',
    NULL,
    NULL,
    NULL,
    'PO Box 494, Plainville, CT 6062',
    ARRAY['municipal','legal']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'Maryann Douglas State Marshal' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'Naugatuck Valley Health District',
    NULL,
    NULL,
    NULL,
    '98 Bank Street, Seymour, CT 6483',
    ARRAY['municipal','health-department']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'Naugatuck Valley Health District' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'Newtown Health District',
    NULL,
    NULL,
    NULL,
    '3 Primrose Street, Newtown, CT 6470',
    ARRAY['municipal','health-department']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'Newtown Health District' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'Ridgefield Fire Department',
    NULL,
    NULL,
    NULL,
    '6 Catoonah Street, Ridgefield, CT 6877',
    ARRAY['municipal','fire-department']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'Ridgefield Fire Department' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'State Marshal John A. Lepito, Jr.',
    NULL,
    NULL,
    NULL,
    '69 Walnut St, New Britain, CT 6051',
    ARRAY['municipal','legal']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'State Marshal John A. Lepito, Jr.' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'State of Connecticut',
    NULL,
    NULL,
    NULL,
    NULL,
    ARRAY['municipal','state']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'State of Connecticut' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'Town Of Avon',
    NULL,
    NULL,
    NULL,
    '60 W Main St, Avon, CT 6001',
    ARRAY['municipal','tax']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'Town Of Avon' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'Town Of Newtown Tax Collector',
    NULL,
    NULL,
    NULL,
    'Newtown Municipal Center, 3 Primrose Street, Newtown, CT 6470',
    ARRAY['municipal','tax']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'Town Of Newtown Tax Collector' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'Town of Shelton',
    NULL,
    NULL,
    NULL,
    NULL,
    ARRAY['municipal','tax']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'Town of Shelton' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'Awing FX, Inc.',
    NULL,
    NULL,
    NULL,
    '2435 State Route 32, New Windsor, NY 12553',
    ARRAY['equipment','lighting']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'Awing FX, Inc.' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'HDI',
    NULL,
    NULL,
    NULL,
    '131 Chapel Road, Manchester, CT 6042',
    ARRAY['equipment','supplies']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'HDI' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'JL Conrad Commercial Furnishings LLC',
    NULL,
    NULL,
    NULL,
    '8100 Massillon Rd SW, Navarre, OH 44662',
    ARRAY['furniture','equipment']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'JL Conrad Commercial Furnishings LLC' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'Paper Roll Supplies',
    NULL,
    NULL,
    NULL,
    '172 Eastern Blvd., Glastonbury, CT 6033',
    ARRAY['supplies','paper']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'Paper Roll Supplies' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'Restaurant City Equipment Store',
    NULL,
    NULL,
    NULL,
    '84 Progress Lane, Waterbury, CT 6705',
    ARRAY['equipment']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'Restaurant City Equipment Store' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'SoundPhase Inc.',
    NULL,
    NULL,
    NULL,
    NULL,
    ARRAY['audio-visual']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'SoundPhase Inc.' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'Trimark United East',
    NULL,
    NULL,
    NULL,
    '9 Hampshire Street, Mansfield, MA 2048',
    ARRAY['equipment','supplies']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'Trimark United East' AND deleted_at IS NULL
  );

  INSERT INTO vendors (tenant_id, name, contact_name, email, phone, address, service_categories, is_active)
  SELECT v_tenant_id,
    'Konica Minolta',
    NULL,
    NULL,
    NULL,
    'PO Box 790488, St Louis, MO 63179-0448',
    ARRAY['technology','printing']::TEXT[],
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM vendors
    WHERE tenant_id = v_tenant_id AND name = 'Konica Minolta' AND deleted_at IS NULL
  );

END $$;