-- MySellGuid Database Migration
-- Run this in Supabase SQL Editor to add discovery engine columns
-- Required to fix "internal server error" on sale creation

-- Step 1: Add new enum values to sale_source_enum
DO $$
BEGIN
    -- Check if enum type exists first
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sales_source_enum') THEN
        -- Add new values if they don't exist
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'tiktok' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'sales_source_enum')) THEN
            ALTER TYPE sales_source_enum ADD VALUE 'tiktok';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'telegram' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'sales_source_enum')) THEN
            ALTER TYPE sales_source_enum ADD VALUE 'telegram';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'rss' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'sales_source_enum')) THEN
            ALTER TYPE sales_source_enum ADD VALUE 'rss';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'auto_discovered' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'sales_source_enum')) THEN
            ALTER TYPE sales_source_enum ADD VALUE 'auto_discovered';
        END IF;
    END IF;
END $$;

-- Step 2: Add sourceType column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'sourcetype') THEN
        ALTER TABLE sales ADD COLUMN "sourceType" varchar NULL;
    END IF;
END $$;

-- Step 3: Add autoDiscovered column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'autodiscovered') THEN
        ALTER TABLE sales ADD COLUMN "autoDiscovered" boolean DEFAULT false NOT NULL;
    END IF;
END $$;

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'sales'
AND column_name IN ('sourceType', 'autoDiscovered', 'sourceurl', 'sourceid');
