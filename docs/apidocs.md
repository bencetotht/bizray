# API Documentation

## Authentication

### Register a new user
Request: `POST /api/v1/auth/register`

Body:
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

Parameters:
- `username`: Username (3-128 characters, required)
- `email`: Valid email address (unique, required)
- `password`: Password (minimum 8 characters, required)

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "uuid": "550e8400-e29b-41d4-a716-446655440000",
    "username": "john_doe",
    "email": "john@example.com",
    "role": "registered",
    "registered_at": "2025-01-15T10:30:00"
  }
}
```

### Login
Request: `POST /api/v1/auth/login`

Body:
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

Parameters:
- `email`: User email (required)
- `password`: User password (required)

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "uuid": "550e8400-e29b-41d4-a716-446655440000",
    "username": "john_doe",
    "email": "john@example.com",
    "role": "registered",
    "registered_at": "2025-01-15T10:30:00"
  }
}
```

### Get current user information
Request: `GET /api/v1/auth/me`

Headers:
- `Authorization`: `Bearer <token>` (required)

Response:
```json
{
  "id": 1,
  "uuid": "550e8400-e29b-41d4-a716-446655440000",
  "username": "john_doe",
  "email": "john@example.com",
  "role": "registered",
  "registered_at": "2025-01-15T10:30:00",
  "company_history_data": null
}
```

### Change password
Request: `PUT /api/v1/auth/password`

Headers:
- `Authorization`: `Bearer <token>` (required)

Body:
```json
{
  "current_password": "oldpassword123",
  "new_password": "newsecurepassword456"
}
```

Parameters:
- `current_password`: Current password for verification (required)
- `new_password`: New password (minimum 8 characters, must be different from current, required)

Response:
```json
{
  "message": "Password changed successfully",
  "user": {
    "id": 1,
    "uuid": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john@example.com"
  }
}
```

Error Responses:
- `401 Unauthorized`: Current password is incorrect
- `400 Bad Request`: New password must be different from current password
- `404 Not Found`: User not found

## Company information

### Get available cities for filtering
Request: `GET /api/v1/cities?q=search`

Parameters:
- `q`: search query (optional) - when provided, returns only cities from companies matching the query

Response (without query):
```json
{
  "cities": [
    {
      "city": "Wien",
      "count": 125432
    },
    {
      "city": "Graz",
      "count": 45678
    },
    {
      "city": "Linz",
      "count": 32145
    }
  ]
}
```

Response (with query `q=tech`):
```json
{
  "cities": [
    {
      "city": "Wien",
      "count": 523
    },
    {
      "city": "Graz",
      "count": 187
    },
    {
      "city": "Salzburg",
      "count": 94
    }
  ]
}
```

**Usage Pattern:**
1. User enters search query "tech"
2. Frontend calls `GET /api/v1/cities?q=tech` to get cities where "tech" companies are located
3. Frontend displays city filter with only relevant cities (Wien: 523, Graz: 187, etc.)
4. User selects a city and frontend calls `GET /api/v1/company?q=tech&city=Wien`

**Caching:**
- Without query (`q`): Cached for 24 hours
- With query (`q`): Cached for 1 hour

**Note:** Cities are sorted by company count (descending) within the filtered results.

### Search for companies
Request: `GET /api/v1/company?q=search`

Parameters:
- `q`: search query (required, minimum 3 characters)
- `p`: page number (optional, default: 1)
- `l`: number of results per page (optional, default: 10, max: 100)
- `city`: filter by city name (optional, exact match - use cities from `/api/v1/cities`)

Response:
```json
{
  "companies": [
    {
      "firmenbuchnummer": "661613k",
      "name": "Körpermanufaktur KG",
      "legal_form": "Kommanditgesellschaft",
      "business_purpose": "Betrieb einer Praxis für Physiotherapie und Chiropraktik",
      "seat": "Dornbirn"
    },
    {
      "firmenbuchnummer": "661613b",
      "name": "Körpermanufaktur 2",
      "legal_form": "Kommanditgesellschaft",
      "business_purpose": "Betrieb einer andere Praxis für Physiotherapie und Chiropraktik",
      "seat": "Birndorn"
    }
  ],
  "total": 2
}
```

**Example with city filter:**
```
GET /api/v1/company?q=praxis&city=Wien&p=1&l=10
```

This will search for "praxis" only in companies located in Wien.

Note: This endpoint is cached for 1 hour. Cache key includes the city parameter.

### Get detailed information about company
Request: `GET /api/v1/company/:id`

Parameters:
- `id`: firmenbuchnummer of the firm

Response:
```json
{
  "firmenbuchnummer": "661613k",
  "name": "Körpermanufaktur KG",
  "legal_form": "Kommanditgesellschaft",
  "address": {
    "street": "Marktstraße",
    "house_number": "36",
    "postal_code": "6850",
    "city": "Dornbirn",
    "country": "AUT"
  },
  "business_purpose": "Betrieb einer Praxis für Physiotherapie und Chiropraktik",
  "seat": "Dornbirn",
  "partners": [
    {
      "name": "Richard Thomas Kranabetter",
      "first_name": "Richard Thomas",
      "last_name": "Kranabetter",
      "birth_date": "1991-10-20",
      "role": "UNBESCHRÄNKT HAFTENDE/R GESELLSCHAFTER/IN",
      "representation": "gemeinsame Vertretung"
    },
  ],
  "registry_entries": [
    {
      "type": "Neueintragung",
      "court": "Landesgericht Feldkirch",
      "file_number": "929 048 Fr 1456/25 y",
      "application_date": "2025-09-08",
      "registration_date": "2025-09-09"
    },
  ],
  "riskScore": 7.4,
  "riskIndicators": {
    "ind1": 8.4,
    "ind2": 4.5
  },
  "reference_date": "2025-10-01"
}
```

### Get network information about a company
Request: `GET /api/v1/network/:id`

Parameters:
- `id`: firmenbuchnummer of the firm

By default, the network graph is calculated with **2** hops.

Response:
```json
{
  "firmenbuchnummer": "661613k",
  "nodes": [
    {
      "id": "661613k",
      "type": "company",
      "label": "Körpermanufaktur KG",
    },
    {
      "id": "765478k",
      "type": "company",
      "label": "Example Company",
    },
  ],
  "edges": [
    {
      "source": "765478k",
      "target": "661613k",
      "label": "Person",
      "value": "Richard Thomas Kranabetter",
    },
    {
      "source": "661613k",
      "target": "765478k",
      "label": "Location",
      "value": "AUT, 6850 Dornbirn, Marktstraße 36",
    },
  ],
}
```

## Search query suggestion
Request: `GET /api/v1/search?q=search`

Parameters:
- `q`: search query (required)

Response:
```json
{
  "suggestions": [
    {
      "firmenbuchnummer": "544393d",
      "name": "13PUNKT4-Büro für Digitalisierung e.U."
    },
    {
      "firmenbuchnummer": "471530b",
      "name": "1425 Siegl Immobilien GmbH"
    },
    {
      "firmenbuchnummer": "511911k",
      "name": "17 siebzehn GmbH in Liqu."
    },
    {
      "firmenbuchnummer": "539261g",
      "name": "2752 Siedlung Tirolerbach"
    },
    {
      "firmenbuchnummer": "530232d",
      "name": "27 siebenundzwanzig GmbH in Liqu."
    },
    {
      "firmenbuchnummer": "610228w",
      "name": "2B Architektur Visualisierung OG"
    },
    {
      "firmenbuchnummer": "661319d",
      "name": "2T Automatisierung GmbH"
    },
    {
      "firmenbuchnummer": "428259v",
      "name": "31sieben Marken- &"
    },
    {
      "firmenbuchnummer": "566312m",
      "name": "37 siebenunddreißig GmbH"
    },
    {
      "firmenbuchnummer": "648356s",
      "name": "387 drei-acht-sieben Alpine GmbH"
    }
  ]
}
```

## Metrics
Request: `GET /api/v1/metrics`

Response:
```json
{
  "metrics": {
    "companies": 635169,
    "addresses": 336510,
    "partners": 514871,
    "registry_entries": 1383898,
  }
}
```

## Admin Endpoints

Admin endpoints require a Bearer token with `admin` role in the Authorization header.

### List all users
Request: `GET /api/v1/admin/users`

Parameters:
- `page`: Page number (optional, default: 1)
- `page_size`: Number of users per page (optional, default: 10, max: 100)

Headers:
- `Authorization`: `Bearer <admin_token>` (required)

Response:
```json
{
  "users": [
    {
      "id": 1,
      "uuid": "550e8400-e29b-41d4-a716-446655440000",
      "username": "john_doe",
      "email": "john@example.com",
      "role": "registered",
      "registered_at": "2025-01-15T10:30:00",
      "company_history_data": null
    },
    {
      "id": 2,
      "uuid": "660e8400-e29b-41d4-a716-446655440001",
      "username": "jane_admin",
      "email": "jane@example.com",
      "role": "admin",
      "registered_at": "2025-01-10T08:20:00",
      "company_history_data": null
    }
  ],
  "total": 2,
  "page": 1,
  "page_size": 10
}
```

Note: This endpoint is cached for 5 minutes to improve performance.

### Get a specific user
Request: `GET /api/v1/admin/users/:id`

Parameters:
- `id`: User ID (required)

Headers:
- `Authorization`: `Bearer <admin_token>` (required)

Response:
```json
{
  "id": 1,
  "uuid": "550e8400-e29b-41d4-a716-446655440000",
  "username": "john_doe",
  "email": "john@example.com",
  "role": "registered",
  "registered_at": "2025-01-15T10:30:00",
  "company_history_data": null
}
```

Note: This endpoint is cached for 5 minutes to improve performance.

### Update user details
Request: `PUT /api/v1/admin/users/:id`

Parameters:
- `id`: User ID (required)

Headers:
- `Authorization`: `Bearer <admin_token>` (required)

Body (all fields optional):
```json
{
  "username": "new_username",
  "email": "newemail@example.com",
  "role": "admin"
}
```

Response:
```json
{
  "id": 1,
  "uuid": "550e8400-e29b-41d4-a716-446655440000",
  "username": "new_username",
  "email": "newemail@example.com",
  "role": "admin",
  "registered_at": "2025-01-15T10:30:00",
  "company_history_data": null
}
```

Error Responses:
- `400 Bad Request`: Email already in use by another user
- `404 Not Found`: User not found

Note: This operation invalidates related cache entries.

### Delete a user
Request: `DELETE /api/v1/admin/users/:id`

Parameters:
- `id`: User ID (required)

Headers:
- `Authorization`: `Bearer <admin_token>` (required)

Response:
```json
{
  "message": "User deleted successfully",
  "deleted_user": {
    "id": 1,
    "email": "john@example.com"
  }
}
```

Error Responses:
- `400 Bad Request`: Cannot delete your own account
- `404 Not Found`: User not found

Note: This operation invalidates related cache entries.

### Get admin metrics
Request: `GET /api/v1/admin/metrics`

Headers:
- `Authorization`: `Bearer <admin_token>` (required)

Response:
```json
{
  "metrics": {
    "companies": 635169,
    "addresses": 336510,
    "partners": 514871,
    "registry_entries": 1383898
  },
  "user_metrics": {
    "total_users": 42,
    "users_by_role": {
      "registered": 38,
      "admin": 3,
      "premium": 1
    }
  }
}
```

Note: This endpoint extends the public metrics endpoint (`/api/v1/metrics`) with additional user statistics. It is cached for 5 minutes to improve performance.

## Data Strucutre
```json
{
  "firmenbuchnummer": "661613k",
  "name": "Körpermanufaktur KG",
  "legal_form": "Kommanditgesellschaft",
  "address": {
    "street": "Marktstraße",
    "house_number": "36",
    "postal_code": "6850",
    "city": "Dornbirn",
    "country": "AUT"
  },
  "business_purpose": "Betrieb einer Praxis für Physiotherapie und Chiropraktik",
  "seat": "Dornbirn",
  "partners": [
    {
      "name": "Richard Thomas Kranabetter",
      "first_name": "Richard Thomas",
      "last_name": "Kranabetter",
      "birth_date": "1991-10-20",
      "role": "UNBESCHRÄNKT HAFTENDE/R GESELLSCHAFTER/IN",
      "representation": "gemeinsame Vertretung"
    },
    {
      "name": "Isagani Röser",
      "first_name": "Isagani",
      "last_name": "Röser",
      "birth_date": "1981-03-23",
      "role": "UNBESCHRÄNKT HAFTENDE/R GESELLSCHAFTER/IN",
      "representation": "gemeinsame Vertretung"
    }
  ],
  "registry_entries": [
    {
      "type": "Neueintragung",
      "court": "Landesgericht Feldkirch",
      "file_number": "929 048 Fr 1456/25 y",
      "application_date": "2025-09-08",
      "registration_date": "2025-09-09"
    },
    {
      "type": "Änderung",
      "court": "Landesgericht Feldkirch",
      "file_number": "929 048 Fr 1553/25 s",
      "application_date": "2025-09-11",
      "registration_date": "2025-09-24"
    }
  ],
  "riskScore": 7.4,
  "riskIndicators": {
    "ind1": 8.4,
    "ind2": 4.5
  },
  "reference_date": "2025-10-01"
}
```
