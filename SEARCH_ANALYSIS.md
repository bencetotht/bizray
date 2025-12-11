# Search Implementation Analysis & Improvement Proposal

## Current Implementation Analysis

### How It Works (controller.py:179-265)

The current search uses SQLAlchemy's `ilike` operator for case-insensitive pattern matching:

```python
like = f"%{query}%"
filters = or_(
    Company.name.ilike(like),
    Company.firmenbuchnummer.ilike(like),
    Company.seat.ilike(like),
    Company.business_purpose.ilike(like),
)
```

**Search fields:**
- `name` - Company name (String 512)
- `firmenbuchnummer` - Company registry number (String 32, indexed, unique)
- `seat` - Company seat/location (String 256)
- `business_purpose` - Business description (String 2048)

**Query pattern:** `%{query}%` - matches substring anywhere in the field

**Ordering:** Alphabetically by company name (`ORDER BY name ASC`)

### Pros

1. **Simple and predictable** - Easy to understand and maintain
2. **Works across all fields** - Comprehensive coverage of company data
3. **Case-insensitive** - User-friendly (ilike handles case)
4. **Fast for exact/prefix firmenbuchnummer lookups** - Due to index on firmenbuchnummer
5. **Already cached** - 1-hour TTL reduces database load

### Cons & Issues

#### 1. No Relevance Ranking
- All results are equally ranked, sorted only by name alphabetically
- A company whose name exactly matches the query appears alongside companies where the query is buried in business_purpose
- **Example:** Searching "Bank Austria" returns "Bank Austria AG" in the same priority as "Technology Solutions GmbH" (if it has "bank austria" somewhere in business_purpose)

#### 2. No Fuzzy Matching
- Typos or slight variations fail to match
- **Examples that won't work:**
  - "Austia" won't match "Austria"
  - "Technologie" won't match "Technology"
  - "Österreich" vs "Osterreich" (diacritics)

#### 3. Equal Field Weighting
- All fields treated equally despite different relevance
- Match in `name` should rank higher than match in `business_purpose`
- Match in `firmenbuchnummer` (exact ID) should be highest priority

#### 4. Poor Performance at Scale
- `%query%` (leading wildcard) prevents index usage in PostgreSQL
- Full table scan on `name`, `seat`, and `business_purpose` (not indexed)
- Only `firmenbuchnummer` has an index, but `%query%` pattern can't use it efficiently
- **Current behavior:** With thousands of companies, search performance degrades linearly

#### 5. Many False Positives
- Short queries match too broadly
  - "tech" matches "Biotech", "Fintech", "Technology", "Architect", "Polytechnic"
  - "bank" matches "Bankhaus", "Sparkasse", "Databank", "Riverbank Properties"
- Substring matching anywhere causes noise
  - "GmbH" would match ~80% of Austrian companies
  - "str" matches "Straße", "Austria", "industrial", "construction"

#### 6. No Word Boundary Awareness
- Matches across word boundaries
- "red bull" matches "manufactured bulletproof vests in Fredericksburg"
- Doesn't prioritize exact phrase matches

#### 7. No Stemming or Language Support
- German language nuances ignored
- "Versicherung" vs "Versicherungen" (singular/plural) treated as different
- "Straße" vs "Str." not recognized as equivalent

### Performance Characteristics

**Index utilization:**
```sql
-- Only this pattern can use the index on firmenbuchnummer:
WHERE firmenbuchnummer ILIKE 'FN123%'  ✓ Uses index (prefix match)

-- These patterns CANNOT use indexes efficiently:
WHERE name ILIKE '%tech%'               ✗ Full table scan (no index)
WHERE firmenbuchnummer ILIKE '%123%'    ✗ Full table scan (leading wildcard)
WHERE business_purpose ILIKE '%bank%'   ✗ Full table scan (no index)
```

**Query plan for current search (estimated):**
```
Seq Scan on companies  (cost=0.00..1234.56 rows=100)
  Filter: (
    (name ~~* '%query%'::text) OR
    (firmenbuchnummer ~~* '%query%'::text) OR
    (seat ~~* '%query%'::text) OR
    (business_purpose ~~* '%query%'::text)
  )
```

### False Positive Examples

Based on the current implementation, here are realistic false positive scenarios:

1. **Query: "bank"**
   - ✓ Relevant: "Bank Austria AG", "Raiffeisenbank Wien"
   - ✗ False positive: "Riverbank Properties GmbH", "Databank Solutions OG"

2. **Query: "tech"**
   - ✓ Relevant: "Tech Innovations GmbH", "TechStart Vienna"
   - ✗ False positive: "Biotech Research AG", "Architect Design Studio", "Polytechnic Equipment"

3. **Query: "auto"**
   - ✓ Relevant: "Auto Repair Center GmbH"
   - ✗ False positive: "Automation Systems AG", "Autonomous Robotics"

4. **Query: "str"** (trying to find companies with "Straße")
   - ✓ Relevant: "Hauptstraße 1 GmbH"
   - ✗ False positive: "Austria Holdings", "Industrial Construction", "Abstract Art Studio"

5. **Short queries (2-3 chars)** - Currently blocked by 3-char minimum, but if allowed:
   - Query: "AG" matches every company with legal form "AG"
   - Query: "Co" matches "Company", "Construction", "Consulting", "Corporate"

---

## Improvement Proposals

### Option 1: PostgreSQL Full-Text Search (Built-in, Best Balance)

**Pros:**
- Native PostgreSQL feature (no extensions needed)
- Relevance ranking with ts_rank
- Language support (German, English)
- Handles stemming ("Versicherung" matches "Versicherungen")
- Much better performance with GIN indexes
- Weighted search across fields

**Cons:**
- Requires database migration to add tsvector columns and indexes
- Slightly more complex queries
- Limited fuzzy matching (can be combined with pg_trgm)

**Implementation:**

```sql
-- Migration: Add tsvector columns
ALTER TABLE companies ADD COLUMN search_vector tsvector;

-- Create weighted search vector (name=A, firmenbuchnummer=A, seat=B, business_purpose=C)
UPDATE companies SET search_vector =
  setweight(to_tsvector('german', coalesce(name, '')), 'A') ||
  setweight(to_tsvector('german', coalesce(firmenbuchnummer, '')), 'A') ||
  setweight(to_tsvector('german', coalesce(seat, '')), 'B') ||
  setweight(to_tsvector('german', coalesce(business_purpose, '')), 'C');

-- Create GIN index for fast full-text search
CREATE INDEX idx_companies_search_vector ON companies USING GIN(search_vector);

-- Trigger to keep search_vector updated
CREATE FUNCTION companies_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('german', coalesce(NEW.name, '')), 'A') ||
    setweight(to_tsvector('german', coalesce(NEW.firmenbuchnummer, '')), 'A') ||
    setweight(to_tsvector('german', coalesce(NEW.seat, '')), 'B') ||
    setweight(to_tsvector('german', coalesce(NEW.business_purpose, '')), 'C');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE TRIGGER companies_search_vector_trigger
  BEFORE INSERT OR UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION companies_search_vector_update();
```

**Python implementation:**

```python
def search_companies_fulltext(
    query: str,
    page: int = 1,
    page_size: int = 10,
    city: Optional[str] = None,
    session: Optional[Session] = None,
) -> Dict[str, Any]:
    """Search companies using PostgreSQL full-text search with relevance ranking."""

    owns_session = session is None
    if session is None:
        session = SessionLocal()

    try:
        # Convert query to tsquery
        # Use plainto_tsquery for simple queries or websearch_to_tsquery for phrase queries
        ts_query = func.websearch_to_tsquery('german', query)

        # Base query with ts_rank for relevance scoring
        base_filters = [
            Company.search_vector.op('@@')(ts_query)
        ]

        if city:
            base_query = (
                select(
                    Company,
                    func.ts_rank(Company.search_vector, ts_query).label('rank')
                )
                .join(Address, Company.id == Address.company_id)
                .where(and_(*base_filters, Address.city == city))
            )
            count_query = (
                select(func.count())
                .select_from(
                    select(Company.id)
                    .join(Address, Company.id == Address.company_id)
                    .where(and_(*base_filters, Address.city == city))
                    .subquery()
                )
            )
        else:
            base_query = (
                select(
                    Company,
                    func.ts_rank(Company.search_vector, ts_query).label('rank')
                )
                .where(and_(*base_filters))
            )
            count_query = (
                select(func.count())
                .select_from(
                    select(Company.id)
                    .where(and_(*base_filters))
                    .subquery()
                )
            )

        total = session.execute(count_query).scalar_one()

        # Order by relevance rank (descending)
        offset = (page - 1) * page_size
        stmt = base_query.order_by(text('rank DESC')).offset(offset).limit(page_size)

        results = session.execute(stmt).all()
        companies = [row[0] for row in results]

        # Load relationships
        for c in companies:
            _ = c.address
            _ = list(c.partners or [])
            _ = list(c.registry_entries or [])

        list_items = [_serialize_company_list_item(c) for c in companies]

        return {"results": list_items}
    finally:
        if owns_session:
            session.close()
```

**Expected improvements:**
- ✓ Relevance ranking by field weight
- ✓ Stemming (plural/singular matching)
- ✓ 10-100x faster with GIN index
- ✓ Better ranking for exact matches
- ✓ Phrase matching with `websearch_to_tsquery`

---

### Option 2: Trigram Similarity (pg_trgm Extension)

**Pros:**
- Excellent fuzzy matching for typos
- Works well for partial word matches
- Can use GIN/GIST indexes
- Provides similarity scores (0.0-1.0)
- Handles diacritics better

**Cons:**
- Requires PostgreSQL extension (pg_trgm)
- Slower than full-text search for large datasets
- No built-in language/stemming support
- Higher memory usage for indexes

**Implementation:**

```sql
-- Enable extension
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create trigram indexes
CREATE INDEX idx_companies_name_trgm ON companies USING GIN(name gin_trgm_ops);
CREATE INDEX idx_companies_firmenbuchnummer_trgm ON companies USING GIN(firmenbuchnummer gin_trgm_ops);

-- Optional: Create index on business_purpose if needed
CREATE INDEX idx_companies_business_purpose_trgm ON companies USING GIN(business_purpose gin_trgm_ops);
```

**Python implementation:**

```python
from sqlalchemy import text

def search_companies_fuzzy(
    query: str,
    page: int = 1,
    page_size: int = 10,
    threshold: float = 0.3,  # Minimum similarity score
    session: Optional[Session] = None,
) -> Dict[str, Any]:
    """Search companies using trigram similarity for fuzzy matching."""

    owns_session = session is None
    if session is None:
        session = SessionLocal()

    try:
        # Calculate similarity scores for each field
        # Higher weight for name and firmenbuchnummer
        similarity_expr = text(f"""
            GREATEST(
                similarity(name, :query) * 2.0,
                similarity(firmenbuchnummer, :query) * 2.0,
                similarity(COALESCE(seat, ''), :query),
                similarity(COALESCE(business_purpose, ''), :query) * 0.5
            ) AS sim_score
        """)

        base_query = (
            select(Company, similarity_expr)
            .where(
                or_(
                    text("name % :query"),
                    text("firmenbuchnummer % :query"),
                    text("seat % :query"),
                    text("business_purpose % :query")
                )
            )
            .params(query=query)
        )

        # Count query
        count_query = (
            select(func.count(Company.id))
            .where(
                or_(
                    text("name % :query"),
                    text("firmenbuchnumber % :query"),
                    text("seat % :query"),
                    text("business_purpose % :query")
                )
            )
            .params(query=query)
        )

        total = session.execute(count_query).scalar_one()

        # Order by similarity score descending
        offset = (page - 1) * page_size
        stmt = base_query.order_by(text('sim_score DESC')).offset(offset).limit(page_size)

        results = session.execute(stmt).all()
        companies = [row[0] for row in results if row[1] >= threshold]

        # Load relationships
        for c in companies:
            _ = c.address
            _ = list(c.partners or [])
            _ = list(c.registry_entries or [])

        list_items = [_serialize_company_list_item(c) for c in companies]

        return {"results": list_items}
    finally:
        if owns_session:
            session.close()
```

**Expected improvements:**
- ✓ Typo tolerance ("Austia" matches "Austria")
- ✓ Partial word matching
- ✓ Diacritic handling
- ✓ Similarity scoring

---

### Option 3: Hybrid Approach (RECOMMENDED)

Combine full-text search for relevance + trigram for fuzzy matching.

**Strategy:**
1. First try full-text search (fast, good for most queries)
2. If results < threshold (e.g., < 5 results), fall back to fuzzy trigram search
3. Optionally combine both and merge results with weighted scoring

**Implementation:**

```python
def search_companies_hybrid(
    query: str,
    page: int = 1,
    page_size: int = 10,
    city: Optional[str] = None,
    session: Optional[Session] = None,
) -> Dict[str, Any]:
    """
    Hybrid search using both full-text and fuzzy matching.

    Strategy:
    1. Try full-text search first (faster, handles common cases)
    2. If few results, supplement with fuzzy matching
    3. Deduplicate and rank combined results
    """

    owns_session = session is None
    if session is None:
        session = SessionLocal()

    try:
        # Try full-text search first
        fulltext_results = search_companies_fulltext(query, page, page_size, city, session)

        # If we got enough results, return them
        if len(fulltext_results.get('results', [])) >= 5:
            return fulltext_results

        # Otherwise, try fuzzy search to supplement
        fuzzy_results = search_companies_fuzzy(query, page, page_size * 2, session=session)

        # Combine and deduplicate results
        seen_fnrs = set()
        combined = []

        # Add fulltext results first (higher quality)
        for item in fulltext_results.get('results', []):
            if item['firmenbuchnummer'] not in seen_fnrs:
                combined.append(item)
                seen_fnrs.add(item['firmenbuchnummer'])

        # Add fuzzy results if needed
        for item in fuzzy_results.get('results', []):
            if item['firmenbuchnummer'] not in seen_fnrs and len(combined) < page_size:
                combined.append(item)
                seen_fnrs.add(item['firmenbuchnummer'])

        return {"results": combined[:page_size]}
    finally:
        if owns_session:
            session.close()
```

---

### Option 4: Quick Wins (No Schema Changes)

If database migrations are not immediately possible, implement these improvements:

**A. Add relevance scoring with CASE statements:**

```python
def search_companies_improved_simple(
    query: str,
    page: int = 1,
    page_size: int = 10,
    city: Optional[str] = None,
    session: Optional[Session] = None,
) -> Dict[str, Any]:
    """Improved search with relevance ranking using SQL CASE."""

    owns_session = session is None
    if session is None:
        session = SessionLocal()

    try:
        like = f"%{query}%"
        like_start = f"{query}%"
        like_exact = query

        # Build relevance score:
        # - Exact match on firmenbuchnummer: 1000
        # - Exact match on name: 500
        # - Name starts with query: 100
        # - Name contains query: 50
        # - Seat contains query: 25
        # - Business purpose contains query: 10
        relevance_score = (
            case(
                (Company.firmenbuchnummer.ilike(like_exact), 1000),
                (Company.name.ilike(like_exact), 500),
                (Company.name.ilike(like_start), 100),
                (Company.name.ilike(like), 50),
                (Company.seat.ilike(like), 25),
                (Company.business_purpose.ilike(like), 10),
                else_=0
            ).label('relevance')
        )

        filters = or_(
            Company.name.ilike(like),
            Company.firmenbuchnummer.ilike(like),
            Company.seat.ilike(like),
            Company.business_purpose.ilike(like),
        )

        if city:
            base_query = (
                select(Company, relevance_score)
                .join(Address, Company.id == Address.company_id)
                .where(and_(filters, Address.city == city))
            )
            count_query = (
                select(func.count())
                .select_from(
                    select(Company.id)
                    .join(Address, Company.id == Address.company_id)
                    .where(and_(filters, Address.city == city))
                    .subquery()
                )
            )
        else:
            base_query = (
                select(Company, relevance_score)
                .where(filters)
            )
            count_query = (
                select(func.count())
                .select_from(select(Company.id).where(filters).subquery())
            )

        total = session.execute(count_query).scalar_one()

        # Order by relevance DESC, then name ASC
        offset = (page - 1) * page_size
        stmt = (
            base_query
            .order_by(text('relevance DESC'), Company.name.asc())
            .offset(offset)
            .limit(page_size)
        )

        results = session.execute(stmt).all()
        companies = [row[0] for row in results]

        # Load relationships
        for c in companies:
            _ = c.address
            _ = list(c.partners or [])
            _ = list(c.registry_entries or [])

        list_items = [_serialize_company_list_item(c) for c in companies]

        return {"results": list_items}
    finally:
        if owns_session:
            session.close()
```

**B. Add basic indexes:**

```sql
-- Add indexes for better ILIKE performance on common prefix searches
CREATE INDEX idx_companies_name_lower ON companies (LOWER(name) text_pattern_ops);
CREATE INDEX idx_companies_seat_lower ON companies (LOWER(seat) text_pattern_ops);

-- This helps queries like "WHERE name ILIKE 'Apple%'" (prefix match)
```

**Expected improvements:**
- ✓ Better ranking (exact/prefix matches score higher)
- ✓ Minimal code changes
- ✓ No schema migrations required
- ✗ Still has performance issues with leading wildcards
- ✗ No fuzzy matching

---

## Recommendations

### Immediate (Next Sprint)
1. **Implement Option 4 (Quick Wins)** - Adds relevance scoring with minimal changes
2. **Add basic indexes** for name and seat fields
3. **Monitor query performance** using PostgreSQL's query logging

### Short-term (1-2 Months)
1. **Implement Option 1 (Full-Text Search)** - Best long-term solution
2. **Add pg_trgm extension** for future fuzzy matching capabilities
3. **Create database migration** for tsvector columns and GIN indexes
4. **A/B test** new search against old implementation

### Long-term (3+ Months)
1. **Implement Option 3 (Hybrid)** - Combine full-text + fuzzy for best UX
2. **Add search analytics** to track:
   - Most common queries
   - Queries with no results
   - Queries with low click-through rates
3. **Consider Elasticsearch** if dataset grows beyond 1M companies or if advanced features needed (geo-search, faceting, etc.)

---

## Performance Comparison (Estimated)

Based on a dataset of 100,000 companies:

| Approach | Avg Query Time | Index Size | False Positives | Typo Tolerance |
|----------|---------------|------------|-----------------|----------------|
| Current (ILIKE) | 200-500ms | ~10 MB | High (30-40%) | None |
| Quick Wins | 150-400ms | ~15 MB | Medium (20-30%) | None |
| Full-Text Search | 5-20ms | ~50 MB | Low (5-10%) | Medium (stemming) |
| Trigram Fuzzy | 50-150ms | ~100 MB | Low (5-10%) | High |
| Hybrid | 10-50ms | ~150 MB | Very Low (2-5%) | High |

---

## Migration Path

### Phase 1: Immediate (No Downtime)
```python
# Update controller.py
# Replace search_companies() with search_companies_improved_simple()
# Deploy with cache invalidation
```

### Phase 2: Database Migration (Scheduled Maintenance)
```sql
-- Step 1: Add column (non-blocking)
ALTER TABLE companies ADD COLUMN search_vector tsvector;

-- Step 2: Backfill data (run during low traffic)
UPDATE companies SET search_vector =
  setweight(to_tsvector('german', coalesce(name, '')), 'A') ||
  setweight(to_tsvector('german', coalesce(firmenbuchnummer, '')), 'A') ||
  setweight(to_tsvector('german', coalesce(seat, '')), 'B') ||
  setweight(to_tsvector('german', coalesce(business_purpose, '')), 'C');

-- Step 3: Create index (run during low traffic)
CREATE INDEX CONCURRENTLY idx_companies_search_vector
  ON companies USING GIN(search_vector);

-- Step 4: Add trigger
CREATE TRIGGER companies_search_vector_trigger
  BEFORE INSERT OR UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION companies_search_vector_update();
```

### Phase 3: Application Update
```python
# Update controller.py
# Replace search_companies_improved_simple() with search_companies_fulltext()
# Deploy with cache invalidation
# Monitor performance and accuracy
```

### Phase 4: Enable Fuzzy Matching
```sql
-- Enable extension
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create trigram indexes
CREATE INDEX CONCURRENTLY idx_companies_name_trgm
  ON companies USING GIN(name gin_trgm_ops);
```

```python
# Update controller.py
# Replace search_companies_fulltext() with search_companies_hybrid()
# Deploy with cache invalidation
```

---

## Testing Strategy

### Unit Tests
```python
def test_search_relevance_ranking():
    """Test that exact matches rank higher than partial matches."""
    results = search_companies("Bank Austria", page=1, page_size=10)
    assert results['results'][0]['name'] == "Bank Austria AG"  # Exact match first

def test_search_typo_tolerance():
    """Test fuzzy matching handles typos."""
    results = search_companies("Austia", page=1, page_size=10)  # Typo: Austria
    assert any("Austria" in r['name'] for r in results['results'])

def test_search_field_weighting():
    """Test name matches rank higher than business_purpose matches."""
    results = search_companies("Technology", page=1, page_size=10)
    # Companies with "Technology" in name should come before those with it only in business_purpose

def test_search_performance():
    """Test search completes within acceptable time."""
    import time
    start = time.time()
    results = search_companies("Software", page=1, page_size=10)
    duration = time.time() - start
    assert duration < 0.1  # Should complete in < 100ms
```

### Integration Tests
- Test with real Austrian company names
- Test with German language queries
- Test edge cases (special characters, diacritics, very long queries)
- Test pagination consistency

---

## Appendix: Example Queries

### Current Behavior
```
Query: "bank"
Results (alphabetical, no relevance):
1. Alpinebank Tirol
2. Bank Austria AG
3. Databank Solutions GmbH  ← False positive
4. Erste Bank Vienna
5. Raiffeisenbank
6. Riverbank Properties    ← False positive
```

### After Full-Text Search
```
Query: "bank"
Results (ranked by relevance):
1. Bank Austria AG          (exact name match, rank: 0.95)
2. Erste Bank Vienna        (exact name match, rank: 0.95)
3. Raiffeisenbank          (exact name match, rank: 0.90)
4. Alpinebank Tirol        (name match, rank: 0.85)
5. Volksbank Regional      (name match, rank: 0.80)
```

### After Hybrid (Full-Text + Fuzzy)
```
Query: "austia" (typo)
Results (fuzzy matching):
1. Bank Austria AG          (fuzzy match "austria", similarity: 0.92)
2. Austria Holdings GmbH    (fuzzy match "austria", similarity: 0.90)
3. Austrian Post           (fuzzy match "austrian", similarity: 0.85)
```
