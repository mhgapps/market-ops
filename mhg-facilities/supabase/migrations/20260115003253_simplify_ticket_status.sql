-- Migration: Simplify ticket status flow
-- Removes 'acknowledged' and 'verified' statuses
-- New flow: submitted → in_progress → completed → closed
-- verified_at remains as a flag (not a status)

-- 1. Update any tickets with 'acknowledged' status to 'submitted'
UPDATE tickets
SET status = 'submitted',
    updated_at = NOW()
WHERE status = 'acknowledged';

-- 2. Update any tickets with 'verified' status to 'completed'
UPDATE tickets
SET status = 'completed',
    updated_at = NOW()
WHERE status = 'verified';

-- 3. Drop the acknowledged_at column from tickets table
ALTER TABLE tickets
DROP COLUMN IF EXISTS acknowledged_at;

-- 4. Update the status check constraint (if exists) to remove old values
-- First, drop the old constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'tickets_status_check'
    AND table_name = 'tickets'
  ) THEN
    ALTER TABLE tickets DROP CONSTRAINT tickets_status_check;
  END IF;
END $$;

-- 5. Add updated status check constraint
ALTER TABLE tickets
ADD CONSTRAINT tickets_status_check
CHECK (status IN ('submitted', 'in_progress', 'completed', 'closed', 'rejected', 'on_hold'));

-- Note: verified_at column is kept as it's now used as a flag
-- to indicate if a ticket was verified before being closed
