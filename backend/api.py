from fastapi import APIRouter, HTTPException
from typing import List, Optional

from src.controller import search_companies, get_company_by_id, get_search_suggestions
from src.cache import get, set

api_router = APIRouter(prefix="/api/v1")

@api_router.get("/")
async def root():
    return {"message": "Welcome to BizRay API"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy"}

@api_router.get("/company")
async def get_companies(q: Optional[str] = None, page: Optional[int] = 1, page_size: Optional[int] = 10):
    """
    Company search
    Parameters:
    - q: str - query string
    - page: int - page number
    - page_size: int - page size
    """
    if q is None:
        raise HTTPException(status_code=400, detail="Query parameter is required")
    if len(q) < 3:
        raise HTTPException(status_code=400, detail="Query parameter must be at least 3 characters long")
    if page < 1:
        page = 1
    if page_size < 1 or page_size > 100:
        page_size = 10
    
    cache_key = f"search:{q}:{page}:{page_size}"
    
    try:
        cached_result = get(cache_key, entity_type="api")
        if cached_result is not None:
            return cached_result
    except Exception:
        pass
    
    try:
        companies = search_companies(q, page, page_size)
        if isinstance(companies, dict):
            results = companies.get("results") or companies.get("companies") or []
        elif isinstance(companies, list):
            results = companies
        else:
            results = []
        
        response = {"companies": results}
        
        try:
            set(cache_key, response, entity_type="api", ttl=3600)
        except Exception:
            pass
        
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/company/{company_id}")
async def get_company(company_id: str):
    """
    Get a specific company by ID
    Parameters:
    - company_id: firmenbuchnummer
    """
    cache_key = f"company:{company_id}"
    
    try:
        cached_result = get(cache_key, entity_type="api")
        if cached_result is not None:
            return cached_result
    except Exception:
        pass
    
    try:
        company = get_company_by_id(company_id)
        if not company:
            raise HTTPException(status_code=404, detail="Company not found")
        
        response = {"company": company}
        
        try:
            set(cache_key, response, entity_type="api", ttl=7200)
        except Exception:
            pass
        
        return response
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/search")
async def search_suggestions(q: Optional[str] = None):
    """
    Get search suggestions
    Parameters:
    - q: str - query string
    """
    if q is None:
        raise HTTPException(status_code=400, detail="Query parameter is required")
    if len(q) < 3:
        raise HTTPException(status_code=400, detail="Query parameter must be at least 3 characters long")
    
    cache_key = f"search_suggestions:{q}"
    try:
        cached_result = get(cache_key, entity_type="api")
        if cached_result is not None:
            return cached_result
    except Exception:
        pass
    
    try:
        suggestions = get_search_suggestions(q)
        if isinstance(suggestions, dict):
            results = suggestions.get("results") or suggestions.get("suggestions") or []
        elif isinstance(suggestions, list):
            results = suggestions
        else:
            results = []
        
        response = {"suggestions": results}
        
        try:
            set(cache_key, response, entity_type="api", ttl=3600)
        except Exception:
            pass
        
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))