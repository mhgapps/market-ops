-- =====================================================
-- MERGE EMERGENCY INCIDENTS INTO TICKETS
-- =====================================================
-- Emergency incidents are conceptually tickets with elevated urgency.
-- This migration adds emergency-specific fields to tickets and migrates
-- existing emergency_incidents data.
-- =====================================================

-- Add emergency-specific fields to tickets table
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS contained_at TIMESTAMPTZ;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS resolution_notes TEXT;

-- Create index for emergency ticket queries
CREATE INDEX IF NOT EXISTS idx_tickets_is_emergency ON tickets(tenant_id, is_emergency) WHERE is_emergency = true AND deleted_at IS NULL;

-- Migrate existing emergency incidents to tickets
-- Note: This preserves the original data by creating new ticket records
DO $$
DECLARE
  incident RECORD;
  new_ticket_number INT;
  mapped_priority ticket_priority;
  mapped_status ticket_status;
BEGIN
  FOR incident IN
    SELECT * FROM emergency_incidents WHERE deleted_at IS NULL
  LOOP
    -- Get next ticket number for tenant
    SELECT COALESCE(MAX(ticket_number), 0) + 1 INTO new_ticket_number
    FROM tickets WHERE tenant_id = incident.tenant_id;

    -- Map severity to priority (high -> high, critical -> critical)
    mapped_priority := incident.severity::text::ticket_priority;

    -- Map incident status to ticket status
    mapped_status := CASE incident.status
      WHEN 'active' THEN 'submitted'::ticket_status
      WHEN 'contained' THEN 'in_progress'::ticket_status
      WHEN 'resolved' THEN 'closed'::ticket_status
      ELSE 'submitted'::ticket_status
    END;

    -- Insert as ticket
    INSERT INTO tickets (
      tenant_id,
      ticket_number,
      title,
      description,
      location_id,
      priority,
      status,
      submitted_by,
      is_emergency,
      contained_at,
      resolution_notes,
      acknowledged_at,
      closed_at,
      created_at,
      updated_at
    ) VALUES (
      incident.tenant_id,
      new_ticket_number,
      incident.title,
      incident.description,
      incident.location_id,
      mapped_priority,
      mapped_status,
      incident.reported_by,
      true,
      incident.contained_at,
      incident.resolution_notes,
      CASE WHEN incident.status IN ('contained', 'resolved') THEN incident.contained_at ELSE NULL END,
      incident.resolved_at,
      incident.reported_at,
      incident.updated_at
    );
  END LOOP;
END $$;

-- Soft delete the emergency_incidents table data (preserve for audit)
-- We don't DROP the table to maintain referential integrity and audit trail
UPDATE emergency_incidents SET deleted_at = now() WHERE deleted_at IS NULL;

-- Add comment to document the deprecation
COMMENT ON TABLE emergency_incidents IS 'DEPRECATED: Emergency incidents are now tracked as tickets with is_emergency=true. This table is preserved for historical audit purposes only.';
