from __future__ import annotations

import hashlib
import json
from datetime import date
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy import or_, and_, select, func
from sqlalchemy.orm import Session

from .api.queries import calculate_risk_indicators, get_company_urkunde, get_urkunde_content
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
            urkunde_doc = get_urkunde_content(company_urkunde[-1].KEY)
            if urkunde_doc is not None:
                urkunde_hash = hashlib.md5(
                    json.dumps(urkunde_doc, sort_keys=True).encode('utf-8')
                ).hexdigest()[:16]
                risk_cache_key = f"risk_indicators:{company_id}:{urkunde_hash}"
                
                cached_risk = None
                try:
                    cached_risk = get(risk_cache_key, entity_type="risk")
                except Exception:
                    pass
                
                if cached_risk is not None:
                    risk_data, risk_score = cached_risk
                else:
                    risk_data, risk_score = calculate_risk_indicators(urkunde_doc)
                    try:
                        set_cache(risk_cache_key, (risk_data, risk_score), entity_type="risk", ttl=86400)
                    except Exception:
                        pass
                
                result._risk_indicators_dict = {k: float(v) for k, v in risk_data.items() if v is not None}
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
    session: Optional[Session] = None,
) -> Dict[str, Any]:
    """
    Search companies by string across several fields with pagination.
    Returns a dict with keys: companies (list), page, page_size, total, pages.
    """
    if page < 1:
        page = 1
    if page_size < 1:
        page_size = 10

    cache_key = f"db_search_companies:{query}:{page}:{page_size}"
    
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
        like = f"%{query}%"
        filters = or_(
            Company.name.ilike(like),
            Company.firmenbuchnummer.ilike(like),
            Company.seat.ilike(like),
            Company.business_purpose.ilike(like),
        )

        total = session.execute(select(func.count()).select_from(select(Company.id).where(filters).subquery())).scalar_one()

        offset = (page - 1) * page_size
        stmt = (
            select(Company)
            .where(filters)
            .order_by(Company.name.asc())
            .offset(offset)
            .limit(page_size)
        )
        results = session.execute(stmt).scalars().all()

        # load relationships
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

def get_search_suggestions(query: str, session: Optional[Session] = None, limit: int = 10) -> List[Dict[str, str]]:
    """
    Get search suggestions for companies matching the query.
    Returns a list of dictionaries with 'firmenbuchnummer' (fnr) and 'name' only.
    
    Args:
        query: Search query string (minimum 3 characters)
        session: Optional database session
        limit: Maximum number of suggestions to return (default: 10)
    
    Returns:
        List of dictionaries with 'firmenbuchnummer' and 'name' keys
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
    

def get_company_network(company_id: str, hops: int = 2) -> Dict[str, Any]:
    """
    Get the network graph for a specific company.
    Returns nodes and edges in the format defined in apidocs.md
    """
    print(f"Getting network graph for company {company_id} with {hops} hops")
    
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
        
        # add location node and edge if address exists
        if address:
            # create location ID from address components
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
            location_id = hashlib.md5(location_label.encode('utf-8')).hexdigest()[:8]
            
            if location_id not in seen_node_ids:
                nodes.append({
                    "id": location_id,
                    "type": "location",
                    "label": location_label,
                })
                seen_node_ids.add(location_id)
            
            # add edge from company to location
            edges.append({
                "source": company_node_id,
                "target": location_id,
                "label": "Location",
            })
            
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
                    connected_company_id = connected_company.firmenbuchnummer
                    if connected_company_id not in seen_node_ids:
                        nodes.append({
                            "id": connected_company_id,
                            "type": "company",
                            "label": connected_company.name,
                        })
                        seen_node_ids.add(connected_company_id)
                    
                    # add edge from connected company to location
                    edges.append({
                        "source": connected_company_id,
                        "target": location_id,
                        "label": "Location",
                    })
        
        # add person nodes and find connected companies through partners
        for partner in partners:
            # create person ID from partner information
            person_parts = []
            if partner.name:
                person_parts.append(partner.name)
            elif partner.first_name and partner.last_name:
                person_parts.append(f"{partner.first_name} {partner.last_name}")
            elif partner.last_name:
                person_parts.append(partner.last_name)
            
            person_label = " ".join(person_parts) if person_parts else "Unknown Person"
            person_id = hashlib.md5(person_label.encode('utf-8')).hexdigest()[:8]
            
            if person_id not in seen_node_ids:
                nodes.append({
                    "id": person_id,
                    "type": "person",
                    "label": person_label,
                })
                seen_node_ids.add(person_id)
            
            # add edge from person to main company
            edges.append({
                "source": person_id,
                "target": company_node_id,
                "label": "Person",
            })
            
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
                    connected_company_id = connected_company.firmenbuchnummer
                    if connected_company_id not in seen_node_ids:
                        nodes.append({
                            "id": connected_company_id,
                            "type": "company",
                            "label": connected_company.name,
                        })
                        seen_node_ids.add(connected_company_id)
                    
                    # add edge from person to connected company
                    edges.append({
                        "source": person_id,
                        "target": connected_company_id,
                        "label": "Person",
                    })
        
        return {
            "firmenbuchnummer": company_id,
            "nodes": nodes,
            "edges": edges,
        }
    finally:
        session.close()