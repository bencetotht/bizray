from fastapi import APIRouter, HTTPException
from typing import List, Optional

from src.demo import companies

api_router = APIRouter(prefix="/api/v1")

@api_router.get("/")
async def root():
    return {"message": "Welcome to BizRay API"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy"}

@api_router.get("/company")
async def get_companies(q: Optional[str] = None):
    """
    Company search
    Parameters:
    - q: str - query string
    """
    if q is None:
        raise HTTPException(status_code=400, detail="Query parameter is required")
    return {"companies": companies}

@api_router.get("/company/{company_id}")
async def get_company(company_id: str):
    """
    Get a specific company by ID
    Parameters:
    - company_id: firmenbuchnummer
    """
    company = next((c for c in companies if c["firmenbuchnummer"] == company_id), None)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return {"company": company}
