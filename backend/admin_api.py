from fastapi import APIRouter, HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field

from src.auth import get_current_user, require_role
from src.db import get_session, User
from src.cache import get_cache, set_cache

admin_router = APIRouter(prefix="/api/v1/admin")


# Pydantic models for request/response validation
class UserResponse(BaseModel):
    id: int
    uuid: str
    username: str
    email: str
    role: str
    registered_at: str
    company_history_data: Optional[str] = None


class UpdateUserRequest(BaseModel):
    username: Optional[str] = Field(None, min_length=3, max_length=128)
    email: Optional[EmailStr] = None
    role: Optional[str] = Field(None, max_length=64)


class UsersListResponse(BaseModel):
    users: List[UserResponse]
    total: int
    page: int
    page_size: int


def require_admin(credentials: HTTPAuthorizationCredentials = Security(require_role("admin"))):
    """Helper function to require admin role"""
    return credentials


@admin_router.get("/users", response_model=UsersListResponse)
async def list_users(
    page: int = 1,
    page_size: int = 10,
    current_user: dict = Security(require_role("admin"))
):
    """
    List all users with pagination (Admin only)

    Parameters:
    - page: int - page number (default: 1)
    - page_size: int - number of users per page (default: 10, max: 100)

    Requires: Bearer token with admin role in Authorization header
    """
    # Validate pagination parameters
    if page < 1:
        page = 1
    if page_size < 1 or page_size > 100:
        page_size = 10

    cache_key = f"admin:users:list:{page}:{page_size}"

    # Try to get from cache
    try:
        cached_result = get_cache(cache_key, entity_type="api")
        if cached_result is not None:
            return cached_result
    except Exception:
        pass

    session = get_session()
    try:
        # Get total count
        total = session.query(User).count()

        # Get paginated users
        offset = (page - 1) * page_size
        users = session.query(User).offset(offset).limit(page_size).all()

        # Build response
        user_list = [
            UserResponse(
                id=user.id,
                uuid=user.uuid,
                username=user.username,
                email=user.email,
                role=user.user_role,
                registered_at=user.registered_at.isoformat(),
                company_history_data=user.company_history_data
            )
            for user in users
        ]

        response = UsersListResponse(
            users=user_list,
            total=total,
            page=page,
            page_size=page_size
        )

        # Cache the response for 5 minutes
        try:
            set_cache(cache_key, response.model_dump(), entity_type="api", ttl=300)
        except Exception:
            pass

        return response

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        session.close()


@admin_router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    current_user: dict = Security(require_role("admin"))
):
    """
    Get a specific user by ID (Admin only)

    Parameters:
    - user_id: int - user ID

    Requires: Bearer token with admin role in Authorization header
    """
    cache_key = f"admin:user:{user_id}"

    # Try to get from cache
    try:
        cached_result = get_cache(cache_key, entity_type="api")
        if cached_result is not None:
            return UserResponse(**cached_result)
    except Exception:
        pass

    session = get_session()
    try:
        user = session.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        response = UserResponse(
            id=user.id,
            uuid=user.uuid,
            username=user.username,
            email=user.email,
            role=user.user_role,
            registered_at=user.registered_at.isoformat(),
            company_history_data=user.company_history_data
        )

        # Cache the response for 5 minutes
        try:
            set_cache(cache_key, response.model_dump(), entity_type="api", ttl=300)
        except Exception:
            pass

        return response

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        session.close()


@admin_router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    request: UpdateUserRequest,
    current_user: dict = Security(require_role("admin"))
):
    """
    Update user details (Admin only)

    Parameters:
    - user_id: int - user ID
    - username: str - new username (optional)
    - email: str - new email (optional)
    - role: str - new role (optional)

    Requires: Bearer token with admin role in Authorization header
    """
    session = get_session()
    try:
        user = session.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Update fields if provided
        if request.username is not None:
            user.username = request.username

        if request.email is not None:
            # Check if email already exists for another user
            existing_user = session.query(User).filter(
                User.email == request.email,
                User.id != user_id
            ).first()
            if existing_user:
                raise HTTPException(status_code=400, detail="Email already in use by another user")
            user.email = request.email

        if request.role is not None:
            user.user_role = request.role

        session.commit()
        session.refresh(user)

        # Invalidate cache for this user
        cache_key = f"admin:user:{user_id}"
        try:
            # Clear specific user cache
            from src.cache import _redis_client
            if _redis_client:
                _redis_client.delete(f"api:{cache_key}")
                # Also invalidate the users list cache
                pattern = "api:admin:users:list:*"
                for key in _redis_client.scan_iter(match=pattern):
                    _redis_client.delete(key)
        except Exception:
            pass

        return UserResponse(
            id=user.id,
            uuid=user.uuid,
            username=user.username,
            email=user.email,
            role=user.user_role,
            registered_at=user.registered_at.isoformat(),
            company_history_data=user.company_history_data
        )

    except HTTPException:
        session.rollback()
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        session.close()


@admin_router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    current_user: dict = Security(require_role("admin"))
):
    """
    Delete a user (Admin only)

    Parameters:
    - user_id: int - user ID

    Requires: Bearer token with admin role in Authorization header
    """
    session = get_session()
    try:
        # Prevent admin from deleting themselves
        if current_user.get("user_id") == user_id:
            raise HTTPException(status_code=400, detail="Cannot delete your own account")

        user = session.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        user_email = user.email
        session.delete(user)
        session.commit()

        # Invalidate cache
        try:
            from src.cache import _redis_client
            if _redis_client:
                # Clear specific user cache
                cache_key = f"api:admin:user:{user_id}"
                _redis_client.delete(cache_key)
                # Also invalidate the users list cache
                pattern = "api:admin:users:list:*"
                for key in _redis_client.scan_iter(match=pattern):
                    _redis_client.delete(key)
        except Exception:
            pass

        return {
            "message": "User deleted successfully",
            "deleted_user": {
                "id": user_id,
                "email": user_email
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
