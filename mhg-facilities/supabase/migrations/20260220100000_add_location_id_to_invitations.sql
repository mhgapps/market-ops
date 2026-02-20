-- =============================================
-- Add location_id to tenant_invitations
-- =============================================
-- BUG FIX: The invite flow accepts a location_id to pre-assign an invited
-- user to a specific location upon acceptance, but the column was missing
-- from the table. This caused the location assignment to be silently lost.

ALTER TABLE tenant_invitations
  ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id);

COMMENT ON COLUMN tenant_invitations.location_id IS
  'Optional location to assign the invited user to upon acceptance. Nullable because not all invitations target a specific location.';

-- Index for lookups by location (e.g., "show all pending invites for this location")
-- Partial index excludes soft-deleted rows for efficient filtering.
CREATE INDEX IF NOT EXISTS idx_tenant_invitations_location_id
  ON tenant_invitations (location_id)
  WHERE location_id IS NOT NULL AND deleted_at IS NULL;
