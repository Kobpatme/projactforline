-- ============================================
-- LINE Sticker Generator — Temporary Auth Bypass
-- ============================================
-- Run this in the Supabase SQL Editor to allow testing 
-- before Phase 3 (Authentication) is fully implemented.

-- 1. Make user_id nullable temporarily
ALTER TABLE sticker_projects ALTER COLUMN user_id DROP NOT NULL;

-- 2. Drop the foreign key constraint temporarily
ALTER TABLE sticker_projects DROP CONSTRAINT IF EXISTS sticker_projects_user_id_fkey;

-- 3. Add policies to allow anonymous interactions for sticker_projects
DROP POLICY IF EXISTS "Allow anonymous inserts" ON sticker_projects;
CREATE POLICY "Allow anonymous inserts" ON sticker_projects FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous selects" ON sticker_projects;
CREATE POLICY "Allow anonymous selects" ON sticker_projects FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow anonymous updates" ON sticker_projects;
CREATE POLICY "Allow anonymous updates" ON sticker_projects FOR UPDATE USING (true);

-- 4. Add policies to allow anonymous interactions for sticker_results
DROP POLICY IF EXISTS "Allow anonymous selects results" ON sticker_results;
CREATE POLICY "Allow anonymous selects results" ON sticker_results FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow anonymous inserts results" ON sticker_results;
CREATE POLICY "Allow anonymous inserts results" ON sticker_results FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous updates results" ON sticker_results;
CREATE POLICY "Allow anonymous updates results" ON sticker_results FOR UPDATE USING (true);

-- Note: In Phase 3, we will revert these changes and implement proper auth policies.
