-- Remove cost approval workflow
-- This migration removes the approval workflow since costs are now just for recording purposes

-- Drop the cost_approvals table
DROP TABLE IF EXISTS cost_approvals;

-- Drop the approval_status enum type
DROP TYPE IF EXISTS approval_status;

-- Remove approval-related columns from tickets table
ALTER TABLE tickets
  DROP COLUMN IF EXISTS approved_cost,
  DROP COLUMN IF EXISTS approved_at,
  DROP COLUMN IF EXISTS requires_approval;

-- Remove approval_threshold from ticket_categories
ALTER TABLE ticket_categories
  DROP COLUMN IF EXISTS approval_threshold;

-- Remove the needs_approval and approved values from ticket_status enum
-- First, update any tickets that have these statuses to 'acknowledged'
UPDATE tickets
SET status = 'acknowledged'
WHERE status IN ('needs_approval', 'approved');

-- Note: Postgres doesn't allow removing enum values directly
-- The old enum values will remain but won't be used
-- For a production system, you would need to:
-- 1. Create a new enum type without those values
-- 2. Migrate all columns using the enum
-- 3. Drop the old enum type
-- 4. Rename the new type to the original name

-- For now, we'll leave the enum as-is since unused values don't cause issues
-- and this approach is safer than recreating the enum type
