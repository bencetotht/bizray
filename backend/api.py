from fastapi import APIRouter, HTTPException, Security, Response
from fastapi.security import HTTPAuthorizationCredentials
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field
from uuid import uuid4

from src.controller import search_companies, get_company_by_id, get_search_suggestions, get_metrics, get_company_network, search_companies_amount, get_available_cities
from src.cache import get_cache, set_cache, _redis_client
from src.auth import hash_password, verify_password, create_jwt_token, get_current_user, require_any_role
from src.db import get_session, User
from src.pdf_generator import create_company_pdf
from src.api.queries import get_company_urkunde, get_all_urkunde_contents, calculate_risk_indicators

api_router = APIRouter(prefix="/api/v1")


# Helper function for visit tracking
def _track_company_visit(company_id: str) -> None:
    """
    Track a company visit in Redis for recommendation system
    Uses sorted set to maintain visit counts with 24-hour expiration
    """
    if _redis_client is None:
        return

    try:
        import time
        current_timestamp = int(time.time())

        # Increment visit count in sorted set
        _redis_client.zincrby("visits:trending", 1, company_id)

        # Store last access timestamp with 24-hour TTL
        visit_key = f"visits:ts:{company_id}"
        _redis_client.setex(visit_key, 86400, current_timestamp)

    except Exception as e:
        print(f"Error tracking visit for company {company_id}: {e}")


# Pydantic models for request/response validation
class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=128)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=256)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    token: str
    user: dict


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=256)


class ChangeUsernameRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=128)


@api_router.get("/")
async def root():
    return {"message": "Welcome to BizRay API"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy"}


@api_router.post("/auth/register", response_model=AuthResponse)
async def register(request: RegisterRequest):
    """
    Register a new user
    Parameters:
    - username: str - username (3-128 characters)
    - email: str - valid email address (unique)
    - password: str - password (min 8 characters)
    """
    session = get_session()
    try:
        # Check if email already exists
        existing_user = session.query(User).filter(User.email == request.email).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")

        # Hash the password
        password_hash = hash_password(request.password)

        # Create new user
        new_user = User(
            uuid=str(uuid4()),
            username=request.username,
            email=request.email,
            password_hash=password_hash,
            user_role="registered"
        )

        session.add(new_user)
        session.commit()
        session.refresh(new_user)

        # Create JWT token
        token = create_jwt_token(
            user_id=new_user.id,
            user_uuid=new_user.uuid,
            email=new_user.email,
            user_role=new_user.user_role
        )

        return AuthResponse(
            token=token,
            user={
                "id": new_user.id,
                "uuid": new_user.uuid,
                "username": new_user.username,
                "email": new_user.email,
                "role": new_user.user_role,
                "registered_at": new_user.registered_at.isoformat()
            }
        )
    except HTTPException:
        session.rollback()
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        session.close()


@api_router.post("/auth/login", response_model=AuthResponse)
async def login(request: LoginRequest):
    """
    Login a user
    Parameters:
    - email: str - user email
    - password: str - user password
    """
    session = get_session()
    try:
        # Find user by email
        user = session.query(User).filter(User.email == request.email).first()
        if not user:
            raise HTTPException(status_code=401, detail="Invalid email or password")

        # Verify password
        if not verify_password(request.password, user.password_hash):
            raise HTTPException(status_code=401, detail="Invalid email or password")

        # Create JWT token
        token = create_jwt_token(
            user_id=user.id,
            user_uuid=user.uuid,
            email=user.email,
            user_role=user.user_role
        )

        return AuthResponse(
            token=token,
            user={
                "id": user.id,
                "uuid": user.uuid,
                "username": user.username,
                "email": user.email,
                "role": user.user_role,
                "registered_at": user.registered_at.isoformat()
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        session.close()


@api_router.get("/auth/me")
async def get_me(current_user: dict = Security(get_current_user)):
    """
    Get current user information from JWT token
    Requires: Bearer token in Authorization header
    """
    session = get_session()
    try:
        user = session.query(User).filter(User.id == current_user["user_id"]).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        return {
            "id": user.id,
            "uuid": user.uuid,
            "username": user.username,
            "email": user.email,
            "role": user.user_role,
            "registered_at": user.registered_at.isoformat(),
            "company_history_data": user.company_history_data
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        session.close()


@api_router.put("/auth/password")
async def change_password(
    request: ChangePasswordRequest,
    current_user: dict = Security(get_current_user)
):
    """
    Change user password
    Requires: Bearer token in Authorization header
    Parameters:
    - current_password: Current password for verification
    - new_password: New password (min 8 characters)
    """
    session = get_session()
    try:
        # Get user from database based on JWT token
        user = session.query(User).filter(User.id == current_user["user_id"]).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Verify current password
        if not verify_password(request.current_password, user.password_hash):
            raise HTTPException(status_code=401, detail="Current password is incorrect")

        # Check that new password is different from current password
        if request.current_password == request.new_password:
            raise HTTPException(status_code=400, detail="New password must be different from current password")

        # Hash and update the new password
        new_password_hash = hash_password(request.new_password)
        user.password_hash = new_password_hash

        session.commit()

        return {
            "message": "Password changed successfully",
            "user": {
                "id": user.id,
                "uuid": user.uuid,
                "email": user.email
            }
        }
    except HTTPException:
        session.rollback()
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        session.close()


@api_router.put("/auth/username")
async def change_username(
    request: ChangeUsernameRequest,
    current_user: dict = Security(get_current_user)
):
    """
    Change username
    Requires: Bearer token in Authorization header
    Parameters:
    - username: New username (3-128 characters)
    """
    session = get_session()
    try:
        # Get user from database based on JWT token
        user = session.query(User).filter(User.id == current_user["user_id"]).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Update the username
        user.username = request.username

        session.commit()

        return {
            "message": "Username changed successfully",
            "user": {
                "id": user.id,
                "uuid": user.uuid,
                "username": user.username,
                "email": user.email
            }
        }
    except HTTPException:
        session.rollback()
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        session.close()


@api_router.delete("/auth/profile")
async def delete_profile(current_user: dict = Security(get_current_user)):
    """
    Delete own user profile
    Requires: Bearer token in Authorization header
    """
    session = get_session()
    try:
        # Get user from database based on JWT token
        user = session.query(User).filter(User.id == current_user["user_id"]).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        user_info = {
            "id": user.id,
            "email": user.email,
            "username": user.username
        }

        # Delete the user
        session.delete(user)
        session.commit()

        return {
            "message": "Profile deleted successfully",
            "deleted_user": user_info
        }
    except HTTPException:
        session.rollback()
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        session.close()


@api_router.post("/auth/subscription/toggle", response_model=AuthResponse)
async def toggle_subscription(current_user: dict = Security(get_current_user)):
    """
    Toggle subscription status between registered and subscriber roles
    Users can only change their own role
    Admin users cannot toggle their subscription
    Requires: Bearer token in Authorization header
    """
    session = get_session()
    try:
        # Get user from database based on JWT token
        user = session.query(User).filter(User.id == current_user["user_id"]).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Admin users cannot toggle their subscription
        if user.user_role == "admin":
            raise HTTPException(status_code=403, detail="Admin users cannot change their subscription status")

        # Toggle between registered and subscriber
        if user.user_role == "registered":
            user.user_role = "subscriber"
        elif user.user_role == "subscriber":
            user.user_role = "registered"

        session.commit()
        session.refresh(user)

        # Create new JWT token with updated role
        token = create_jwt_token(
            user_id=user.id,
            user_uuid=user.uuid,
            email=user.email,
            user_role=user.user_role
        )

        return AuthResponse(
            token=token,
            user={
                "id": user.id,
                "uuid": user.uuid,
                "username": user.username,
                "email": user.email,
                "role": user.user_role,
                "registered_at": user.registered_at.isoformat()
            }
        )
    except HTTPException:
        session.rollback()
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        session.close()


@api_router.get("/company")
async def get_companies(
    q: Optional[str] = None,
    p: Optional[int] = 1,
    l: Optional[int] = 10,
    city: Optional[str] = None
):
    """
    Company search with optional city filter
    Parameters:
    - q: str - query string (required)
    - p: int - page number (default: 1)
    - l: int - page size (default: 10, max: 100)
    - city: str - filter by city name (optional, exact match)
    """
    if q is None:
        raise HTTPException(status_code=400, detail="Query parameter is required")
    if len(q) < 3:
        raise HTTPException(status_code=400, detail="Query parameter must be at least 3 characters long")
    if p < 1:
        p = 1
    if l < 1 or l > 100:
        l = 10

    cache_key = f"search:{q}:{p}:{l}:{city}"

    try:
        cached_result = get_cache(cache_key, entity_type="api")
        if cached_result is not None:
            return cached_result
    except Exception:
        pass

    try:
        total_companies = search_companies_amount(q, city)
        companies = search_companies(q, p, l, city)
        if isinstance(companies, dict):
            results = companies.get("results") or companies.get("companies") or []
        elif isinstance(companies, list):
            results = companies
        else:
            results = []

        response = {"companies": results, "total": total_companies}

        try:
            set_cache(cache_key, response, entity_type="api", ttl=3600)
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
        cached_result = get_cache(cache_key, entity_type="api")
        if cached_result is not None:
            # Track visit for recommendation system
            _track_company_visit(company_id)
            return cached_result
    except Exception:
        pass

    try:
        company = get_company_by_id(company_id)
        if not company:
            raise HTTPException(status_code=404, detail="Company not found")

        response = {"company": company}

        try:
            set_cache(cache_key, response, entity_type="api", ttl=7200)
        except Exception:
            pass

        # Track visit for recommendation system
        _track_company_visit(company_id)

        return response
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/network/{company_id}")
async def get_network_graph(
    company_id: str,
    hops: Optional[int] = 2,
    current_user: dict = Security(require_any_role("subscriber", "admin"))
):
    """
    Get the network graph for a specific company (Premium feature)

    Parameters:
    - company_id: firmenbuchnummer
    - hops: number of hops (optional, default: 2)

    Requires: Bearer token with subscriber or admin role in Authorization header
    """
    cache_key = f"network:{company_id}:{hops}"

    # try:
    #     cached_result = get_cache(cache_key, entity_type="network")
    #     if cached_result is not None:
    #         return cached_result
    # except Exception:
    #     pass

    try:
        company = get_company_network(company_id)
        if not company:
            raise HTTPException(status_code=404, detail="Company not found")

        response = {"company": company}

        # try:
        #     set_cache(cache_key, response, entity_type="api", ttl=7200)
        # except Exception:
        #     pass

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
        cached_result = get_cache(cache_key, entity_type="api")
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
            set_cache(cache_key, response, entity_type="api", ttl=3600)
        except Exception:
            pass
        
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/cities")
async def get_cities(q: Optional[str] = None):
    """
    Get available cities with company counts for filtering
    Optionally filtered by search query to show only relevant cities

    Parameters:
    - q: search query (optional) - when provided, returns only cities from companies matching the query

    Returns cities sorted by company count (descending)
    """
    print(f"Cities endpoint called with q={q}")
    cache_key = f"api_cities:{q}"

    try:
        cached_result = get_cache(cache_key, entity_type="api")
        if cached_result is not None:
            print(f"Returning cached result for cities (q={q})")
            return cached_result
    except Exception as e:
        print(f"Cache read error in cities endpoint: {e}")

    try:
        print(f"Calling get_available_cities(q={q})")
        cities = get_available_cities(q)
        print(f"Got {len(cities)} cities from controller")
        response = {"cities": cities}

        # Cache for different durations based on whether it's query-specific or global
        ttl = 3600 if q else 86400  # 1 hour for query-specific, 24 hours for all cities

        try:
            set_cache(cache_key, response, entity_type="api", ttl=ttl)
            print(f"Cached cities response (q={q}, ttl={ttl})")
        except Exception as e:
            print(f"Cache write error in cities endpoint: {e}")

        return response
    except Exception as e:
        print(f"Error in cities endpoint: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/metrics")
async def get_metrics_endpoint():
    """
    Get metrics - counts of each entry type in the database
    """
    cache_key = "api_metrics"

    try:
        cached_result = get_cache(cache_key, entity_type="api")
        if cached_result is not None:
            return cached_result
    except Exception:
        pass

    try:
        metrics = get_metrics()
        response = {"metrics": metrics}

        try:
            set_cache(cache_key, response, entity_type="api", ttl=43200)
        except Exception:
            pass

        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/recommendations")
async def get_recommendations():
    """
    Get top 5 most viewed companies in the last 24 hours
    Returns company names, IDs, and visit counts
    """
    if _redis_client is None:
        return {"recommendations": []}

    try:
        import time
        current_timestamp = int(time.time())
        cutoff_timestamp = current_timestamp - 86400  # 24 hours ago

        # Get all companies from the sorted set (sorted by visit count descending)
        trending_companies = _redis_client.zrevrange("visits:trending", 0, -1, withscores=True)

        recommendations = []
        for company_id, visit_count in trending_companies:
            # Check if this company's last visit is within 24 hours
            visit_key = f"visits:ts:{company_id}"
            last_visit_timestamp = _redis_client.get(visit_key)

            if last_visit_timestamp is None:
                # Timestamp key expired, remove from trending set
                _redis_client.zrem("visits:trending", company_id)
                continue

            last_visit = int(last_visit_timestamp)
            if last_visit < cutoff_timestamp:
                # Visit is older than 24 hours, skip
                continue

            # Get company details
            try:
                company_data = get_company_by_id(company_id)
                if company_data:
                    recommendations.append({
                        "company_id": company_id,
                        "name": company_data.get("name", "Unknown"),
                        "visit_count": int(visit_count)
                    })

                    # Stop once we have 5 recommendations
                    if len(recommendations) >= 5:
                        break
            except Exception as e:
                print(f"Error fetching company {company_id} for recommendations: {e}")
                continue

        return {"recommendations": recommendations}

    except Exception as e:
        print(f"Error generating recommendations: {e}")
        return {"recommendations": []}


@api_router.get("/company/{company_id}/export")
async def export_company_summary(company_id: str):
    """
    Fetches all company data and returns a downloadable summary report in PDF format
    """
    company_data = get_company_by_id(company_id)
    if not company_data:
        raise HTTPException(status_code=404, detail="Company not found")

    company_urkunde_list = get_company_urkunde(company_id)

    risk_data_for_pdf = {}
    if company_urkunde_list:
        all_docs = get_all_urkunde_contents(company_urkunde_list)
        if all_docs:
            risk_indicators_dict, _ = calculate_risk_indicators(
                all_docs[-1],
                historical_data=all_docs,
                registry_entries=company_data.get("registry_entries", [])
            )

            risk_data_for_pdf = {"indicators": risk_indicators_dict}

    try:
        pdf_bytes = create_company_pdf(company_data, risk_data_for_pdf)
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"PDF generation error for company {company_id}: {error_details}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate PDF: {str(e)}"
        )

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{company_id}_summary.pdf"'
        }
    )