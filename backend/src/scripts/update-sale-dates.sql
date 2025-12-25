-- Safe script to update expired sale dates
-- Run this on production to reactivate expired sales with fresh dates
-- DO NOT use the seed endpoint on production - it wipes all data!

-- View current status first (run this to see what will be affected)
-- SELECT id, title, status, "startDate", "endDate" FROM sales WHERE status = 'active' ORDER BY "endDate";

-- Option 1: Extend all active sales that have expired by 30 days from now
UPDATE sales 
SET 
  "startDate" = NOW(),
  "endDate" = NOW() + INTERVAL '30 days',
  "updatedAt" = NOW()
WHERE status = 'active' 
  AND "endDate" < NOW();

-- Option 2: Reactivate expired sales (change status back to active and set new dates)
-- UPDATE sales 
-- SET 
--   status = 'active',
--   "startDate" = NOW(),
--   "endDate" = NOW() + INTERVAL '30 days',
--   "updatedAt" = NOW()
-- WHERE status = 'expired';

-- Verify the update
-- SELECT id, title, status, "startDate", "endDate" FROM sales ORDER BY "endDate";

-- Reconcile bookmark saves counts (run after any bookmark migration)
-- UPDATE sales s
-- SET saves = (SELECT COUNT(*) FROM bookmarks b WHERE b."saleId" = s.id);

