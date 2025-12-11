-- Migration: Add Full-Text Search Support to Companies Table
-- Description: Adds tsvector column, GIN index, and trigger for PostgreSQL full-text search
-- Date: 2025-12-11
-- Issue: #144 - Improve search accuracy

-- ============================================================================
-- STEP 1: Add search_vector column (non-blocking)
-- ============================================================================

ALTER TABLE companies ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- ============================================================================
-- STEP 2: Create function to update search vector
-- ============================================================================

CREATE OR REPLACE FUNCTION companies_search_vector_update()
RETURNS trigger AS $$
BEGIN
  -- Weighted search vector:
  -- 'A' weight (highest): name, firmenbuchnummer
  -- 'B' weight (medium): seat
  -- 'C' weight (lower): business_purpose
  NEW.search_vector :=
    setweight(to_tsvector('german', coalesce(NEW.name, '')), 'A') ||
    setweight(to_tsvector('german', coalesce(NEW.firmenbuchnummer, '')), 'A') ||
    setweight(to_tsvector('german', coalesce(NEW.seat, '')), 'B') ||
    setweight(to_tsvector('german', coalesce(NEW.business_purpose, '')), 'C');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 3: Backfill existing data
-- ============================================================================

-- Update all existing rows with search vector
-- This may take a while depending on table size
-- Run during low-traffic period

UPDATE companies SET search_vector =
  setweight(to_tsvector('german', coalesce(name, '')), 'A') ||
  setweight(to_tsvector('german', coalesce(firmenbuchnummer, '')), 'A') ||
  setweight(to_tsvector('german', coalesce(seat, '')), 'B') ||
  setweight(to_tsvector('german', coalesce(business_purpose, '')), 'C')
WHERE search_vector IS NULL;

-- ============================================================================
-- STEP 4: Create GIN index for fast full-text search
-- ============================================================================

-- Using CONCURRENTLY to avoid locking the table
-- Note: CONCURRENTLY requires running outside a transaction block
-- If this fails, run without CONCURRENTLY during maintenance window

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_search_vector
ON companies USING GIN(search_vector);

-- ============================================================================
-- STEP 5: Create trigger to keep search_vector updated
-- ============================================================================

DROP TRIGGER IF EXISTS companies_search_vector_trigger ON companies;

CREATE TRIGGER companies_search_vector_trigger
  BEFORE INSERT OR UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION companies_search_vector_update();

-- ============================================================================
-- STEP 6: Add index for ILIKE fallback (optional, for backward compatibility)
-- ============================================================================

-- These indexes help with prefix searches if needed as fallback
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_name_lower
ON companies (LOWER(name) text_pattern_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_firmenbuchnummer_lower
ON companies (LOWER(firmenbuchnummer) text_pattern_ops);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify the migration worked:
-- SELECT COUNT(*) FROM companies WHERE search_vector IS NOT NULL;
-- SELECT COUNT(*) FROM companies;
-- These should match

-- Test a search:
-- SELECT name, ts_rank(search_vector, websearch_to_tsquery('german', 'bank')) as rank
-- FROM companies
-- WHERE search_vector @@ websearch_to_tsquery('german', 'bank')
-- ORDER BY rank DESC
-- LIMIT 10;

-- Check index usage:
-- EXPLAIN ANALYZE
-- SELECT * FROM companies
-- WHERE search_vector @@ websearch_to_tsquery('german', 'bank');

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================

-- To rollback this migration:
-- DROP TRIGGER IF EXISTS companies_search_vector_trigger ON companies;
-- DROP FUNCTION IF EXISTS companies_search_vector_update();
-- DROP INDEX CONCURRENTLY IF EXISTS idx_companies_search_vector;
-- DROP INDEX CONCURRENTLY IF EXISTS idx_companies_name_lower;
-- DROP INDEX CONCURRENTLY IF EXISTS idx_companies_firmenbuchnummer_lower;
-- ALTER TABLE companies DROP COLUMN IF EXISTS search_vector;
