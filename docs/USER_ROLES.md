# User Roles and Privileges

This document describes the different user roles in BizRay and their associated privileges.

## Endpoint Authorization Matrix

| Endpoint | Registered | Subscriber | Admin |
|----------|-----------|------------|-------|
| **Authentication** |
| `POST /api/v1/auth/register` | ✅ | ✅ | ✅ |
| `POST /api/v1/auth/login` | ✅ | ✅ | ✅ |
| `GET /api/v1/auth/me` | ✅ | ✅ | ✅ |
| `PUT /api/v1/auth/password` | ✅ | ✅ | ✅ |
| **Company Data** |
| `GET /api/v1/company` | ✅ | ✅ | ✅ |
| `GET /api/v1/company/:id` | ✅ | ✅ | ✅ |
| `GET /api/v1/network/:id` | ❌ | ✅ | ✅ |
| `GET /api/v1/search` | ✅ | ✅ | ✅ |
| `GET /api/v1/metrics` | ✅ | ✅ | ✅ |
| **Admin Endpoints** |
| `GET /api/v1/admin/users` | ❌ | ❌ | ✅ |
| `GET /api/v1/admin/users/:id` | ❌ | ❌ | ✅ |
| `PUT /api/v1/admin/users/:id` | ❌ | ❌ | ✅ |
| `DELETE /api/v1/admin/users/:id` | ❌ | ❌ | ✅ |
| `GET /api/v1/admin/metrics` | ❌ | ❌ | ✅ |

---

## Error Responses

### 401 Unauthorized
Returned when:
- No JWT token provided
- Invalid JWT token
- Expired JWT token

Example:
```json
{
  "detail": "Token has expired"
}
```

### 403 Forbidden
Returned when:
- Valid token but insufficient role permissions

Example for single role:
```json
{
  "detail": "Insufficient permissions"
}
```

Example for multiple roles:
```json
{
  "detail": "Insufficient permissions. Required roles: subscriber, admin"
}
```

### JWT Token Payload

```json
{
  "user_id": 123,
  "uuid": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "role": "subscriber",
  "exp": 1735689600,
  "iat": 1735084800
}
```