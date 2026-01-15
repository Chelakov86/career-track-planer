-- Migration: Remove role_type column from jobs table
-- Date: 2026-01-15
-- Description: Removes the role_type column as PM/QA differentiation is no longer needed

ALTER TABLE jobs DROP COLUMN IF EXISTS role_type;

COMMENT ON TABLE jobs IS 'Job applications tracking table (role_type removed 2026-01-15)';
