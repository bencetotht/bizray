from fastapi import APIRouter, HTTPException
from typing import List, Optional

from src.controller import search_companies, get_company_by_id

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
    try:
        companies = search_companies(q, page, page_size)
        # controller.search_companies expected a dict like {"results": [...]}
        # but the frontend expects `data.companies` to be an array fixed (maybe lol) to always
        # return an array under the "companies" (chatgpt emoji here :))) ).
        if isinstance(companies, dict):
            results = companies.get("results") or companies.get("companies") or []
        elif isinstance(companies, list):
            results = companies
        else:
            results = []
        return {"companies": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/company/{company_id}")
async def get_company(company_id: str):
    """
    Get a specific company by ID
    Parameters:
    - company_id: firmenbuchnummer
    """
    try:
        company = get_company_by_id(company_id)
        if not company:
            raise HTTPException(status_code=404, detail="Company not found")
        return {"company": company}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
