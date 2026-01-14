-- =====================================================
-- SEED DATA FOR MHG FACILITIES
-- Run this after initial migration to set up demo data
-- =====================================================

-- Create MHG tenant
INSERT INTO tenants (id, name, slug, plan, status, owner_email, max_users, max_locations, storage_limit_gb)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Market Hospitality Group',
  'mhg',
  'professional',
  'active',
  'admin@mhg.com',
  50,
  20,
  50
);

-- Create locations for MHG
INSERT INTO locations (id, tenant_id, name, address, city, state, zip, phone, square_footage, status)
VALUES
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Downtown Flagship', '123 Main St', 'Austin', 'TX', '78701', '512-555-0001', 5000, 'active'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'South Congress', '456 S Congress Ave', 'Austin', 'TX', '78704', '512-555-0002', 3500, 'active'),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Domain North', '789 Domain Dr', 'Austin', 'TX', '78758', '512-555-0003', 4000, 'active'),
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'East 6th Street', '321 E 6th St', 'Austin', 'TX', '78701', '512-555-0004', 2800, 'active'),
  ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Mueller District', '555 Mueller Blvd', 'Austin', 'TX', '78723', '512-555-0005', 3200, 'active');

-- Create asset categories
INSERT INTO asset_categories (id, tenant_id, name, description, default_lifespan_years)
VALUES
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'HVAC', 'Heating, ventilation, and air conditioning equipment', 15),
  ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Refrigeration', 'Walk-in coolers, freezers, and refrigerators', 12),
  ('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Kitchen Equipment', 'Ovens, ranges, fryers, and prep equipment', 10),
  ('20000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'POS Hardware', 'Point of sale terminals and printers', 5),
  ('20000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Plumbing', 'Water heaters, pumps, and fixtures', 15),
  ('20000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'Fire Safety', 'Fire suppression, extinguishers, and alarms', 10),
  ('20000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 'Furniture', 'Tables, chairs, booths, and bar seating', 8);

-- Create ticket categories
INSERT INTO ticket_categories (id, tenant_id, name, name_es, description, default_priority, escalation_hours)
VALUES
  ('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'HVAC Issue', 'Problema de HVAC', 'Heating or cooling problems', 'high', 4),
  ('30000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Refrigeration', 'Refrigeración', 'Walk-in cooler or freezer issues', 'critical', 2),
  ('30000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Plumbing', 'Plomería', 'Leaks, clogs, water heater issues', 'high', 4),
  ('30000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Electrical', 'Eléctrico', 'Power, lighting, and electrical issues', 'high', 4),
  ('30000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Kitchen Equipment', 'Equipo de Cocina', 'Ovens, ranges, fryers, dishwashers', 'high', 4),
  ('30000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'POS/Technology', 'POS/Tecnología', 'Point of sale and network issues', 'medium', 8),
  ('30000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 'General Maintenance', 'Mantenimiento General', 'General repairs and maintenance', 'low', 24),
  ('30000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', 'Pest Control', 'Control de Plagas', 'Pest sightings or infestations', 'critical', 2);

-- Create compliance document types
INSERT INTO compliance_document_types (id, tenant_id, name, name_es, description, default_alert_days, is_location_specific)
VALUES
  ('40000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Health Permit', 'Permiso de Salud', 'Food establishment health permit', '{90, 60, 30, 14, 7}', true),
  ('40000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Liquor License', 'Licencia de Licor', 'TABC mixed beverage permit', '{90, 60, 30, 14, 7}', true),
  ('40000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Fire Safety Certificate', 'Certificado de Seguridad contra Incendios', 'Fire marshal inspection certificate', '{90, 60, 30, 14, 7}', true),
  ('40000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Business License', 'Licencia de Negocio', 'City business operating license', '{90, 60, 30}', true),
  ('40000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Food Handler Certificate', 'Certificado de Manipulador de Alimentos', 'Employee food handler certification', '{30, 14, 7}', false),
  ('40000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'Music License (ASCAP)', 'Licencia de Música (ASCAP)', 'ASCAP music performance license', '{60, 30, 14}', false),
  ('40000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 'Music License (BMI)', 'Licencia de Música (BMI)', 'BMI music performance license', '{60, 30, 14}', false);

-- Create PM templates
INSERT INTO pm_templates (id, tenant_id, name, description, category, estimated_duration_hours, checklist)
VALUES
  ('50000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Hood Cleaning', 'Kitchen exhaust hood cleaning', 'hood_cleaning', 4, '["Degrease hood interior", "Clean filters", "Inspect ductwork", "Check fan operation", "Document with photos"]'),
  ('50000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Grease Trap Service', 'Grease trap pumping and cleaning', 'grease_trap', 1, '["Pump grease trap", "Clean interior", "Inspect baffles", "Check inlet/outlet", "Record waste volume"]'),
  ('50000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'HVAC Filter Change', 'Replace HVAC filters', 'hvac', 0.5, '["Shut down unit", "Remove old filter", "Install new filter", "Record filter size", "Restart unit"]'),
  ('50000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Fire Extinguisher Inspection', 'Monthly fire extinguisher check', 'fire_safety', 0.25, '["Check pressure gauge", "Verify seal intact", "Inspect condition", "Sign inspection tag"]'),
  ('50000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Pest Control Service', 'Monthly pest control treatment', 'pest_control', 1, '["Inspect premises", "Check bait stations", "Apply treatments", "Document findings", "Provide report"]');

-- Note: Users should be created through the auth flow, not seeded directly
-- The seed data above provides the foundation for demo/testing purposes
