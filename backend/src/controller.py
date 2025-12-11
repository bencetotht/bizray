from __future__ import annotations

import hashlib
import json
from datetime import date
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy import or_, and_, select, func, text
from sqlalchemy.orm import Session

from .api.queries import calculate_risk_indicators, get_company_urkunde, get_urkunde_content, get_all_urkunde_contents
from .cache import get_cache, set_cache

from .db import (
    SessionLocal,
    Company,
    Address,
    Partner,
    RegistryEntry,
    RiskIndicator,
)

def _serialize_date(value: Optional[date]) -> Optional[str]:
    """Serialize a date to an ISO string."""
    if value is None:
        return None
    return value.isoformat()

def _serialize_company(company: Company) -> Dict[str, Any]:
    """Serialize a company to a dictionary."""
    address_dict: Optional[Dict[str, Any]] = None
    if company.address:
        address_dict = {
            "street": company.address.street,
            "house_number": company.address.house_number,
            "postal_code": company.address.postal_code,
            "city": company.address.city,
            "country": company.address.country,
        }

    partners_list: List[Dict[str, Any]] = []
    for p in company.partners or []:
        partners_list.append(
            {
                "name": p.name,
                "first_name": p.first_name,
                "last_name": p.last_name,
                "birth_date": _serialize_date(p.birth_date),
                "role": p.role,
                "representation": p.representation,
            }
        )

    registry_entries_list: List[Dict[str, Any]] = []
    for r in company.registry_entries or []:
        registry_entries_list.append(
            {
                "type": r.type,
                "court": r.court,
                "file_number": r.file_number,
                "application_date": _serialize_date(r.application_date),
                "registration_date": _serialize_date(r.registration_date),
            }
        )

    # Use risk indicators from the object attribute if available, otherwise fall back to relationship
    risk_indicators_dict: Dict[str, float] = {}
    if hasattr(company, '_risk_indicators_dict') and company._risk_indicators_dict is not None:
        risk_indicators_dict = company._risk_indicators_dict
    else:
        for ri in company.risk_indicators or []:
            if ri.key is not None and ri.value is not None:
                risk_indicators_dict[ri.key] = float(ri.value)

    return {
        "firmenbuchnummer": company.firmenbuchnummer,
        "name": company.name,
        "legal_form": company.legal_form,
        "address": address_dict,
        "business_purpose": company.business_purpose,
        "seat": company.seat,
        "partners": partners_list,
        "registry_entries": registry_entries_list,
        "riskScore": float(company.risk_score) if company.risk_score is not None else None,
        "riskIndicators": risk_indicators_dict,
        "reference_date": _serialize_date(company.reference_date),
    }

def _serialize_company_list_item(company: Company) -> Dict[str, Any]:
    """Serialize a company to the minimal list item used for search results."""
    return {
        "firmenbuchnummer": company.firmenbuchnummer,
        "name": company.name,
        "legal_form": company.legal_form,
        "business_purpose": company.business_purpose,
        "seat": company.seat,
    }

def get_company_by_id(company_id: str, session: Optional[Session] = None) -> Optional[Dict[str, Any]]:
    """
    Fetch a single company by its firmenbuchnummer and return it serialized to the schema.
    """
    cache_key = f"db_company_by_id:{company_id}"
    
    try:
        cached_result = get_cache(cache_key, entity_type="db")
        if cached_result is not None:
            return cached_result
    except Exception:
        pass
    
    owns_session = False
    if session is None:
        session = SessionLocal()
        owns_session = True
    try:
        stmt = (
            select(Company)
            .where(Company.firmenbuchnummer == company_id)
        )
        result = session.execute(stmt).scalars().first()
        if result is None:
            return None

        # preload relationships
        _ = result.address
        _ = list(result.partners or [])
        _ = list(result.registry_entries or [])

        # calculate risk indicators result
        company_urkunde = get_company_urkunde(company_id)
        if company_urkunde is not None:
            # Parse all urkunde entries
            all_urkunde_docs = get_all_urkunde_contents(company_urkunde)
            
            if all_urkunde_docs and len(all_urkunde_docs) > 0:
                # Use the latest entry (last in list) for risk indicators
                latest_urkunde_doc = all_urkunde_docs[-1]
                
                urkunde_hash = hashlib.md5(
                    json.dumps(latest_urkunde_doc, sort_keys=True).encode('utf-8')
                ).hexdigest()[:16]
                risk_cache_key = f"risk_indicators:{company_id}:{urkunde_hash}"
                
                cached_risk = None
                try:
                    cached_risk = get_cache(risk_cache_key, entity_type="risk")
                except Exception:
                    pass
                
                if cached_risk is not None:
                    risk_data, risk_score = cached_risk
                else:
                    # Pass latest entry for most indicators, historical data for future use, and registry entries for compliance
                    risk_data, risk_score = calculate_risk_indicators(
                        latest_urkunde_doc, 
                        historical_data=all_urkunde_docs,
                        registry_entries=list(result.registry_entries or [])
                    )
                    try:
                        set_cache(risk_cache_key, (risk_data, risk_score), entity_type="risk", ttl=86400)
                    except Exception:
                        pass
                
                result._risk_indicators_dict = {k: float(v) if v is not None else None for k, v in risk_data.items()}
                result.risk_score = risk_score
        serialized_result = _serialize_company(result)
        
        try:
            set_cache(cache_key, serialized_result, entity_type="db", ttl=7200)
        except Exception:
            pass
        
        return serialized_result
    finally:
        if owns_session:
            session.close()

def search_companies(
    query: str,
    page: int = 1,
    page_size: int = 10,
    city: Optional[str] = None,
    session: Optional[Session] = None,
) -> Dict[str, Any]:
    """
    Search companies using PostgreSQL full-text search with relevance ranking.
    Falls back to ILIKE search if search_vector is not available.
    Optionally filter by city.
    Returns a dict with keys: results (list of companies).
    """
    if page < 1:
        page = 1
    if page_size < 1:
        page_size = 10

    cache_key = f"db_search_companies:{query}:{page}:{page_size}:{city}"

    try:
        cached_result = get_cache(cache_key, entity_type="db")
        if cached_result is not None:
            return cached_result
    except Exception:
        pass

    owns_session = False
    if session is None:
        session = SessionLocal()
        owns_session = True

    try:
        # Check if search_vector column exists and is populated
        # We'll try full-text search first, fallback to ILIKE if it fails
        try:
            # Use websearch_to_tsquery for better query parsing
            # It handles phrases, AND/OR operators, and is more user-friendly
            ts_query = func.websearch_to_tsquery('german', query)

            # Calculate relevance rank for ordering
            rank_expr = func.ts_rank(
                Company.search_vector,
                ts_query
            ).label('rank')

            # Base filters for full-text search
            search_filter = Company.search_vector.op('@@')(ts_query)

            if city:
                # Join with Address table to filter by city
                base_query = (
                    select(Company, rank_expr)
                    .join(Address, Company.id == Address.company_id)
                    .where(and_(search_filter, Address.city == city))
                )
                count_query = (
                    select(func.count())
                    .select_from(
                        select(Company.id)
                        .join(Address, Company.id == Address.company_id)
                        .where(and_(search_filter, Address.city == city))
                        .subquery()
                    )
                )
            else:
                base_query = (
                    select(Company, rank_expr)
                    .where(search_filter)
                )
                count_query = (
                    select(func.count())
                    .select_from(select(Company.id).where(search_filter).subquery())
                )

            total = session.execute(count_query).scalar_one()

            # Order by relevance rank (descending), then by name
            offset = (page - 1) * page_size
            stmt = (
                base_query
                .order_by(text('rank DESC'), Company.name.asc())
                .offset(offset)
                .limit(page_size)
            )

            results_with_rank = session.execute(stmt).all()
            results = [row[0] for row in results_with_rank]

        except Exception as fts_error:
            # Fallback to ILIKE search if full-text search fails
            # This ensures backward compatibility if migration hasn't run yet
            print(f"Full-text search failed, falling back to ILIKE: {fts_error}")

            like = f"%{query}%"
            filters = or_(
                Company.name.ilike(like),
                Company.firmenbuchnummer.ilike(like),
                Company.seat.ilike(like),
                Company.business_purpose.ilike(like),
            )

            if city:
                base_query = (
                    select(Company)
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
                base_query = select(Company).where(filters)
                count_query = select(func.count()).select_from(select(Company.id).where(filters).subquery())

            total = session.execute(count_query).scalar_one()

            offset = (page - 1) * page_size
            stmt = base_query.order_by(Company.name.asc()).offset(offset).limit(page_size)
            results = session.execute(stmt).scalars().all()

        # Load relationships
        for c in results:
            _ = c.address
            _ = list(c.partners or [])
            _ = list(c.registry_entries or [])
            _ = list(c.risk_indicators or [])

        list_items = [_serialize_company_list_item(c) for c in results]

        result = {"results": list_items}

        try:
            set_cache(cache_key, result, entity_type="db", ttl=3600)
        except Exception:
            pass

        return result
    finally:
        if owns_session:
            session.close()

def search_companies_amount(query: str, city: Optional[str] = None, session: Optional[Session] = None) -> int:
    """
    Get the number of companies matching the query.
    Uses full-text search with fallback to ILIKE for consistency with search_companies.
    Optionally filter by city.
    """
    if len(query) < 3:
        return 0

    cache_key = f"db_search_companies_amount:{query}:{city}"

    try:
        cached_result = get_cache(cache_key, entity_type="db")
        if cached_result is not None:
            return cached_result
    except Exception:
        pass

    owns_session = False
    if session is None:
        session = SessionLocal()
        owns_session = True

    try:
        # Try full-text search first, fallback to ILIKE if it fails
        try:
            ts_query = func.websearch_to_tsquery('german', query)
            search_filter = Company.search_vector.op('@@')(ts_query)

            if city:
                count_query = (
                    select(func.count())
                    .select_from(
                        select(Company.id)
                        .join(Address, Company.id == Address.company_id)
                        .where(and_(search_filter, Address.city == city))
                        .subquery()
                    )
                )
            else:
                count_query = select(func.count()).select_from(select(Company.id).where(search_filter).subquery())

        except Exception:
            # Fallback to ILIKE
            like = f"%{query}%"
            filters = or_(
                Company.name.ilike(like),
                Company.firmenbuchnummer.ilike(like),
                Company.seat.ilike(like),
                Company.business_purpose.ilike(like),
            )

            if city:
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
                count_query = select(func.count()).select_from(select(Company.id).where(filters).subquery())

        total = session.execute(count_query).scalar_one()

        try:
            set_cache(cache_key, total, entity_type="db", ttl=3600)
        except Exception:
            pass

        return total
    finally:
        if owns_session:
            session.close()


def get_search_suggestions(query: str, session: Optional[Session] = None, limit: int = 10) -> List[Dict[str, str]]:
    """
    Get search suggestions for companies matching the query.
    Uses full-text search with fallback to ILIKE for better relevance.
    Returns a list of dictionaries with 'firmenbuchnummer' (fnr) and 'name' only.

    Args:
        query: Search query string (minimum 3 characters)
        session: Optional database session
        limit: Maximum number of suggestions to return (default: 10)

    Returns:
        List of dictionaries with 'firmenbuchnummer' and 'name' keys, ordered by relevance
    """
    if len(query) < 3:
        return []

    cache_key = f"db_search_suggestions:{query}:{limit}"

    try:
        cached_result = get_cache(cache_key, entity_type="db")
        if cached_result is not None:
            return cached_result
    except Exception:
        pass

    owns_session = False
    if session is None:
        session = SessionLocal()
        owns_session = True

    try:
        # Try full-text search first for better relevance
        try:
            ts_query = func.websearch_to_tsquery('german', query)
            rank_expr = func.ts_rank(Company.search_vector, ts_query).label('rank')
            search_filter = Company.search_vector.op('@@')(ts_query)

            stmt = (
                select(Company.firmenbuchnummer, Company.name, rank_expr)
                .where(search_filter)
                .order_by(text('rank DESC'), Company.name.asc())
                .limit(limit)
            )

            results = session.execute(stmt).all()

            suggestions = [
                {
                    "firmenbuchnummer": row.firmenbuchnummer,
                    "name": row.name,
                }
                for row in results
            ]

        except Exception:
            # Fallback to ILIKE search
            like = f"%{query}%"
            filters = or_(
                Company.name.ilike(like),
                Company.firmenbuchnummer.ilike(like),
            )

            stmt = (
                select(Company.firmenbuchnummer, Company.name)
                .where(filters)
                .order_by(Company.name.asc())
                .limit(limit)
            )

            results = session.execute(stmt).all()

            suggestions = [
                {
                    "firmenbuchnummer": row.firmenbuchnummer,
                    "name": row.name,
                }
                for row in results
            ]

        try:
            set_cache(cache_key, suggestions, entity_type="db", ttl=3600)
        except Exception:
            pass

        return suggestions
    finally:
        if owns_session:
            session.close()
    
def get_metrics(session: Optional[Session] = None) -> Dict[str, int]:
    """
    Get counts of each entry type in the database.
    Returns a dictionary with counts for companies, addresses, partners, registry_entries, and risk_indicators.
    """
    owns_session = False
    if session is None:
        session = SessionLocal()
        owns_session = True

    try:
        companies_count = session.execute(select(func.count(Company.id))).scalar_one()
        addresses_count = session.execute(select(func.count(Address.id))).scalar_one()
        partners_count = session.execute(select(func.count(Partner.id))).scalar_one()
        registry_entries_count = session.execute(select(func.count(RegistryEntry.id))).scalar_one()
        risk_indicators_count = session.execute(select(func.count(RiskIndicator.id))).scalar_one()

        metrics = {
            "companies": companies_count,
            "addresses": addresses_count,
            "partners": partners_count,
            "registry_entries": registry_entries_count,
            # "risk_indicators": risk_indicators_count,
        }

        return metrics
    finally:
        if owns_session:
            session.close()


def get_available_cities(query: Optional[str] = None, session: Optional[Session] = None) -> List[Dict[str, Any]]:
    """
    Get unique cities with company counts, optionally filtered by search query.
    When query is provided, only returns cities from companies matching the search query.
    Returns a list of dictionaries with 'city' and 'count' keys, ordered by count descending.
    """
    cache_key = f"db_available_cities:{query}"

    try:
        cached_result = get_cache(cache_key, entity_type="db")
        if cached_result is not None:
            return cached_result
    except Exception as e:
        print(f"Cache read error: {e}")

    owns_session = False
    if session is None:
        session = SessionLocal()
        owns_session = True

    try:
        if query:
            # Filter cities based on companies matching the search query
            like = f"%{query}%"
            company_filters = or_(
                Company.name.ilike(like),
                Company.firmenbuchnummer.ilike(like),
                Company.seat.ilike(like),
                Company.business_purpose.ilike(like),
            )

            # Subquery approach: first find matching companies, then aggregate by city
            # This is more efficient than joining on the full table
            matching_companies = (
                select(Company.id)
                .where(company_filters)
                .subquery()
            )

            stmt = (
                select(Address.city, func.count(Address.id).label('count'))
                .join(matching_companies, Address.company_id == matching_companies.c.id)
                .where(Address.city.isnot(None))
                .where(Address.city != '')
                .group_by(Address.city)
                .order_by(func.count(Address.id).desc())
            )
        else:
            # No query - return all cities
            stmt = (
                select(Address.city, func.count(Address.id).label('count'))
                .where(Address.city.isnot(None))
                .where(Address.city != '')
                .group_by(Address.city)
                .order_by(func.count(Address.id).desc())
            )

        print(f"Executing cities query (query={query})")
        results = session.execute(stmt).all()
        print(f"Got {len(results)} cities")

        cities = [
            {
                "city": row.city,
                "count": row.count
            }
            for row in results
        ]

        # Cache for different durations based on whether it's query-specific or global
        ttl = 3600 if query else 86400  # 1 hour for query-specific, 24 hours for all cities

        try:
            set_cache(cache_key, cities, entity_type="db", ttl=ttl)
        except Exception as e:
            print(f"Cache write error: {e}")

        return cities
    except Exception as e:
        print(f"Error in get_available_cities: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        if owns_session:
            session.close()
    
def get_company_network(company_id: str, hops: int = 2) -> Dict[str, Any]:
    """
    Get the network graph for a specific company.
    Returns nodes and edges in the format defined in apidocs.md
    Only company nodes are returned. Edges contain connection type and value.
    Maximum of 50 nodes will be returned.
    """
    MAX_NODES = 50

    session = SessionLocal()
    try:
        # get company
        stmt = (
            select(Company)
            .where(Company.firmenbuchnummer == company_id)
        )
        company = session.execute(stmt).scalars().first()

        if company is None:
            return None

        # load relationships
        address = company.address
        partners = list(company.partners or [])

        # initialize nodes and edges
        nodes = []
        edges = []
        seen_node_ids = set()

        # add the main company node
        company_node_id = company.firmenbuchnummer
        if company_node_id not in seen_node_ids:
            nodes.append({
                "id": company_node_id,
                "type": "company",
                "label": company.name,
            })
            seen_node_ids.add(company_node_id)

        # find companies with the same location
        if address:
            # create location label from address components
            location_parts = []
            if address.country:
                location_parts.append(address.country)
            if address.postal_code:
                location_parts.append(address.postal_code)
            if address.city:
                location_parts.append(address.city)
            if address.street:
                street_str = address.street
                if address.house_number:
                    street_str += f" {address.house_number}"
                location_parts.append(street_str)

            location_label = ", ".join(location_parts) if location_parts else "Unknown Location"

            # find companies with the same location
            location_filters = []
            if address.postal_code:
                location_filters.append(Address.postal_code == address.postal_code)
            if address.city:
                location_filters.append(Address.city == address.city)
            if address.street:
                location_filters.append(Address.street == address.street)
            if address.house_number:
                location_filters.append(Address.house_number == address.house_number)

            if location_filters:
                connected_companies_stmt = (
                    select(Company)
                    .join(Address, Company.id == Address.company_id)
                    .where(
                        and_(*location_filters),
                        Company.firmenbuchnummer != company_id
                    )
                )
                connected_companies = session.execute(connected_companies_stmt).scalars().all()

                for connected_company in connected_companies:
                    # Stop if we've reached the maximum number of nodes
                    if len(nodes) >= MAX_NODES:
                        break

                    connected_company_id = connected_company.firmenbuchnummer
                    if connected_company_id not in seen_node_ids:
                        nodes.append({
                            "id": connected_company_id,
                            "type": "company",
                            "label": connected_company.name,
                        })
                        seen_node_ids.add(connected_company_id)

                    # add edge from main company to connected company with location value
                    edges.append({
                        "source": company_node_id,
                        "target": connected_company_id,
                        "label": "Location",
                        "value": location_label,
                    })

        # find connected companies through partners
        for partner in partners:
            # create person label from partner information
            person_parts = []
            if partner.name:
                person_parts.append(partner.name)
            elif partner.first_name and partner.last_name:
                person_parts.append(f"{partner.first_name} {partner.last_name}")
            elif partner.last_name:
                person_parts.append(partner.last_name)

            person_label = " ".join(person_parts) if person_parts else "Unknown Person"

            # find companies with the same partner
            partner_filters = []
            if partner.first_name:
                partner_filters.append(Partner.first_name == partner.first_name)
            if partner.last_name:
                partner_filters.append(Partner.last_name == partner.last_name)
            if partner.birth_date:
                partner_filters.append(Partner.birth_date == partner.birth_date)

            if partner_filters:
                # find other companies with this partner
                connected_companies_stmt = (
                    select(Company)
                    .join(Partner, Company.id == Partner.company_id)
                    .where(
                        and_(*partner_filters),
                        Company.firmenbuchnummer != company_id
                    )
                )
                connected_companies = session.execute(connected_companies_stmt).scalars().all()

                for connected_company in connected_companies:
                    # Stop if we've reached the maximum number of nodes
                    if len(nodes) >= MAX_NODES:
                        break

                    connected_company_id = connected_company.firmenbuchnummer
                    if connected_company_id not in seen_node_ids:
                        nodes.append({
                            "id": connected_company_id,
                            "type": "company",
                            "label": connected_company.name,
                        })
                        seen_node_ids.add(connected_company_id)

                    # add edge from main company to connected company with person value
                    edges.append({
                        "source": company_node_id,
                        "target": connected_company_id,
                        "label": "Person",
                        "value": person_label,
                    })

        return {
            "firmenbuchnummer": company_id,
            "nodes": nodes,
            "edges": edges,
        }
    finally:
        session.close()