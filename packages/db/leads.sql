-- ============================================
-- New Skills Academy — Leads Table
-- Run this in your Supabase SQL Editor
-- ============================================

-- Create enum for lead status
CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'enrolled', 'lost');

-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  location TEXT NOT NULL,
  course_interest TEXT NOT NULL,
  status lead_status NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast filtering by status
CREATE INDEX idx_leads_status ON leads (status);

-- Index for sorting by date
CREATE INDEX idx_leads_created_at ON leads (created_at DESC);

-- Enable Row Level Security
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anonymous inserts (for the public enrollment form)
CREATE POLICY "Allow public lead submissions"
  ON leads
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Policy: Allow authenticated reads (for admin dashboard)
CREATE POLICY "Allow authenticated lead reads"
  ON leads
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Allow service role full access (for API routes)
CREATE POLICY "Allow service role full access"
  ON leads
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_leads_updated_at();
