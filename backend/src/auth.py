import os
from datetime import datetime, timedelta
from typing import Optional

import bcrypt
import jwt
from fastapi import HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

security = HTTPBearer()


def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    salt = bcrypt.gensalt()
    password_hash = bcrypt.hashpw(password.encode('utf-8'), salt)
    return password_hash.decode('utf-8')


def verify_password(password: str, password_hash: str) -> bool:
    """Verify a password against its hash."""
    return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))


def create_jwt_token(user_id: int, user_uuid: str, email: str, user_role: str) -> str:
    """Create a JWT token for a user."""
    jwt_secret = os.getenv("JWT_SECRET")
    if not jwt_secret:
        raise ValueError("JWT_SECRET environment variable is not set")

    # Token expires in 7 days by default
    expiration_hours = int(os.getenv("JWT_EXPIRATION_HOURS", "168"))
    expiration = datetime.utcnow() + timedelta(hours=expiration_hours)

    payload = {
        "user_id": user_id,
        "uuid": user_uuid,
        "email": email,
        "role": user_role,
        "exp": expiration,
        "iat": datetime.utcnow()
    }

    token = jwt.encode(payload, jwt_secret, algorithm="HS256")
    return token


def decode_jwt_token(token: str) -> dict:
    """Decode and validate a JWT token."""
    jwt_secret = os.getenv("JWT_SECRET")
    if not jwt_secret:
        raise ValueError("JWT_SECRET environment variable is not set")

    try:
        payload = jwt.decode(token, jwt_secret, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)) -> dict:
    """Get the current user from the JWT token."""
    token = credentials.credentials
    payload = decode_jwt_token(token)
    return payload


def require_role(required_role: str):
    """Decorator to require a specific role for an endpoint."""
    def role_checker(credentials: HTTPAuthorizationCredentials = Security(security)) -> dict:
        user = get_current_user(credentials)
        if user.get("role") != required_role:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user
    return role_checker
