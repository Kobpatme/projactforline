-- ============================================
-- LINE Sticker Generator — Database Schema
-- ============================================
-- Migration: 001_create_sticker_tables
-- Description: Create tables for sticker generation projects and results

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. Enum for project status
-- ============================================
CREATE TYPE project_status AS ENUM ('pending', 'processing', 'completed', 'failed');

-- ============================================
-- 2. sticker_projects table
-- Tracks each sticker generation session
-- ============================================
CREATE TABLE sticker_projects (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    source_image_url TEXT NOT NULL,
    status          project_status NOT NULL DEFAULT 'pending',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for querying by user
CREATE INDEX idx_sticker_projects_user_id ON sticker_projects(user_id);
CREATE INDEX idx_sticker_projects_status ON sticker_projects(status);

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_sticker_projects_updated_at
    BEFORE UPDATE ON sticker_projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 3. sticker_results table
-- Stores each generated sticker image
-- ============================================
CREATE TABLE sticker_results (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id      UUID NOT NULL REFERENCES sticker_projects(id) ON DELETE CASCADE,
    image_url       TEXT,
    action_name     TEXT NOT NULL,
    order_index     INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for querying by project
CREATE INDEX idx_sticker_results_project_id ON sticker_results(project_id);

-- ============================================
-- 4. Row Level Security (RLS)
-- ============================================

-- Enable RLS on both tables
ALTER TABLE sticker_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE sticker_results ENABLE ROW LEVEL SECURITY;

-- sticker_projects: Users can only access their own projects
CREATE POLICY "Users can view own projects"
    ON sticker_projects
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own projects"
    ON sticker_projects
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
    ON sticker_projects
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
    ON sticker_projects
    FOR DELETE
    USING (auth.uid() = user_id);

-- sticker_results: Users can access results for their own projects
CREATE POLICY "Users can view own sticker results"
    ON sticker_results
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM sticker_projects
            WHERE sticker_projects.id = sticker_results.project_id
            AND sticker_projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Service role can insert sticker results"
    ON sticker_results
    FOR INSERT
    WITH CHECK (true);

-- ============================================
-- 5. Storage Bucket (run separately in Supabase dashboard)
-- ============================================
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('sticker-images', 'sticker-images', true);
