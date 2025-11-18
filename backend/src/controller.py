from __future__ import annotations

import hashlib
import json
from datetime import date
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy import or_, select, func
from sqlalchemy.orm import Session

from .api.queries import calculate_risk_indicators, get_company_urkunde, get_urkunde_content, get_all_urkunde_contents
from .cache import get, set

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
        cached_result = get(cache_key, entity_type="db")
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
                    cached_risk = get(risk_cache_key, entity_type="risk")
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
                        set(risk_cache_key, (risk_data, risk_score), entity_type="risk", ttl=86400)
                    except Exception:
                        pass
                
                result._risk_indicators_dict = {k: float(v) for k, v in risk_data.items() if v is not None}
                result.risk_score = risk_score
        serialized_result = _serialize_company(result)
        
        try:
            set(cache_key, serialized_result, entity_type="db", ttl=7200)
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
        cached_result = get(cache_key, entity_type="db")
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
            set(cache_key, result, entity_type="db", ttl=3600)
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
        cached_result = get(cache_key, entity_type="db")
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
            set(cache_key, suggestions, entity_type="db", ttl=3600)
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
    