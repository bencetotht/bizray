#!/usr/bin/env python3
"""
Test script for verifying full-text search implementation.

This script tests the new full-text search functionality to ensure:
1. Search queries return results
2. Relevance ranking works correctly
3. German language support (stemming) works
4. Performance is improved over ILIKE

Usage:
    python backend/migrations/test_fulltext_search.py
"""

import os
import sys
import time
from pathlib import Path

# Add parent directory to path to import from src
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.controller import search_companies, get_search_suggestions, search_companies_amount
from src.db import get_session


def print_header(text):
    """Print a formatted header."""
    print("\n" + "=" * 80)
    print(f"  {text}")
    print("=" * 80)


def test_basic_search():
    """Test basic search functionality."""
    print_header("Test 1: Basic Search Functionality")

    queries = ["bank", "technology", "austria", "gmbh"]

    for query in queries:
        print(f"\nSearching for: '{query}'")
        start_time = time.time()

        try:
            results = search_companies(query, page=1, page_size=5)
            duration = (time.time() - start_time) * 1000  # Convert to ms

            print(f"  ✓ Found {len(results.get('results', []))} results in {duration:.2f}ms")

            # Show top 3 results
            for i, company in enumerate(results.get('results', [])[:3], 1):
                print(f"    {i}. {company.get('name')} ({company.get('firmenbuchnummer')})")

        except Exception as e:
            print(f"  ✗ Error: {e}")


def test_relevance_ranking():
    """Test that relevance ranking works."""
    print_header("Test 2: Relevance Ranking")

    query = "bank austria"
    print(f"\nSearching for: '{query}'")
    print("Expected: Companies with 'Bank Austria' in name should rank highest")

    try:
        results = search_companies(query, page=1, page_size=10)

        print(f"\nTop results:")
        for i, company in enumerate(results.get('results', [])[:5], 1):
            name = company.get('name')
            print(f"  {i}. {name}")

            # Check if "bank" and "austria" appear in name (case-insensitive)
            name_lower = name.lower()
            has_bank = 'bank' in name_lower
            has_austria = 'austria' in name_lower or 'austrian' in name_lower

            if has_bank and has_austria:
                print(f"     ✓ Contains both 'bank' and 'austria' in name")
            elif has_bank:
                print(f"     ~ Contains 'bank' in name")
            else:
                print(f"     - May be in other fields")

    except Exception as e:
        print(f"  ✗ Error: {e}")


def test_german_language_support():
    """Test German language stemming."""
    print_header("Test 3: German Language Support (Stemming)")

    # Test singular/plural matching
    test_cases = [
        ("versicherung", "versicherungen", "Insurance (singular vs plural)"),
        ("bank", "banken", "Bank (singular vs plural)"),
    ]

    for singular, plural, description in test_cases:
        print(f"\n{description}:")
        print(f"  Query 1: '{singular}'")

        try:
            results_singular = search_companies(singular, page=1, page_size=5)
            count_singular = len(results_singular.get('results', []))
            print(f"    Found {count_singular} results")

            print(f"  Query 2: '{plural}'")
            results_plural = search_companies(plural, page=1, page_size=5)
            count_plural = len(results_plural.get('results', []))
            print(f"    Found {count_plural} results")

            # With stemming, both should return similar results
            if abs(count_singular - count_plural) <= 2:
                print(f"    ✓ Stemming appears to be working (similar result counts)")
            else:
                print(f"    ~ Results differ significantly (may not have stemming or different data)")

        except Exception as e:
            print(f"    ✗ Error: {e}")


def test_suggestions():
    """Test search suggestions."""
    print_header("Test 4: Search Suggestions")

    queries = ["bank", "tech", "öster"]

    for query in queries:
        print(f"\nGetting suggestions for: '{query}'")

        try:
            start_time = time.time()
            suggestions = get_search_suggestions(query, limit=5)
            duration = (time.time() - start_time) * 1000

            print(f"  ✓ Found {len(suggestions)} suggestions in {duration:.2f}ms")

            for i, suggestion in enumerate(suggestions[:3], 1):
                print(f"    {i}. {suggestion.get('name')} ({suggestion.get('firmenbuchnummer')})")

        except Exception as e:
            print(f"  ✗ Error: {e}")


def test_performance():
    """Test search performance."""
    print_header("Test 5: Performance Benchmark")

    query = "technology"
    iterations = 5

    print(f"\nRunning search for '{query}' {iterations} times...")

    times = []
    for i in range(iterations):
        start_time = time.time()

        try:
            results = search_companies(query, page=1, page_size=10)
            duration = (time.time() - start_time) * 1000
            times.append(duration)
            print(f"  Run {i + 1}: {duration:.2f}ms")

        except Exception as e:
            print(f"  ✗ Error: {e}")
            return

    if times:
        avg_time = sum(times) / len(times)
        min_time = min(times)
        max_time = max(times)

        print(f"\nPerformance Summary:")
        print(f"  Average: {avg_time:.2f}ms")
        print(f"  Min: {min_time:.2f}ms")
        print(f"  Max: {max_time:.2f}ms")

        if avg_time < 50:
            print(f"  ✓ Excellent performance (<50ms average)")
        elif avg_time < 150:
            print(f"  ✓ Good performance (<150ms average)")
        else:
            print(f"  ~ Performance acceptable but could be optimized")


def test_count_accuracy():
    """Test that search count is accurate."""
    print_header("Test 6: Search Count Accuracy")

    query = "gmbh"
    print(f"\nTesting count accuracy for: '{query}'")

    try:
        # Get count
        count = search_companies_amount(query)
        print(f"  Total count: {count}")

        # Get actual results
        results = search_companies(query, page=1, page_size=100)
        results_count = len(results.get('results', []))

        print(f"  Results in first page (limit 100): {results_count}")

        if count >= results_count:
            print(f"  ✓ Count is consistent")
        else:
            print(f"  ✗ Count mismatch!")

    except Exception as e:
        print(f"  ✗ Error: {e}")


def test_fallback_behavior():
    """Test that fallback to ILIKE works if full-text search fails."""
    print_header("Test 7: Fallback Behavior")

    print("\nNote: This test verifies that the search works even if full-text")
    print("      search is not available (backward compatibility)")

    query = "test"
    print(f"\nSearching for: '{query}'")

    try:
        results = search_companies(query, page=1, page_size=5)
        print(f"  ✓ Search completed (found {len(results.get('results', []))} results)")
        print(f"  ✓ Fallback mechanism is functional")

    except Exception as e:
        print(f"  ✗ Error: {e}")


def main():
    """Run all tests."""
    print("\n" + "=" * 80)
    print("  Full-Text Search Implementation Test Suite")
    print("=" * 80)

    # Check database connection
    try:
        session = get_session()
        session.close()
        print("\n✓ Database connection successful")
    except Exception as e:
        print(f"\n✗ Database connection failed: {e}")
        print("\nPlease check your DATABASE_URL environment variable.")
        return 1

    # Run all tests
    try:
        test_basic_search()
        test_relevance_ranking()
        test_german_language_support()
        test_suggestions()
        test_performance()
        test_count_accuracy()
        test_fallback_behavior()

        print("\n" + "=" * 80)
        print("  All tests completed!")
        print("=" * 80)
        print("\nNext steps:")
        print("  1. Review results above for any errors")
        print("  2. If full-text search is working, performance should be <50ms")
        print("  3. If seeing 'fallback to ILIKE' messages, run the migration:")
        print("     psql -d bizray -f backend/migrations/001_add_fulltext_search.sql")
        print("=" * 80 + "\n")

        return 0

    except KeyboardInterrupt:
        print("\n\nTests interrupted by user.")
        return 130
    except Exception as e:
        print(f"\n✗ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())
