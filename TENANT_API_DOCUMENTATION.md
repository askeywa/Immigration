# Tenant API Integration Documentation

## Overview

This documentation provides information for tenant development teams to integrate with the Immigration Portal API. The API allows tenants to authenticate users, manage accounts, and access tenant-specific data.

## Base URLs

### Development
```
http://localhost:5000/api/v1
```

### Production
```
https://api.{your-domain.com}/api/v1
```

## Authentication

All API requests require proper domain resolution. The API automatically detects the tenant based on the request domain.

## Endpoints

### 1. Tenant Login

**POST** `/tenant/auth/login`

Authenticate a user for the current tenant domain.

#### Request Body
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user",
      "isActive": true
    },
    "tenant": {
      "id": "tenant_id",
      "name": "Company Name",
      "domain": "company.com",
      "status": "active"
    },
    "subscription": {
      "id": "subscription_id",
      "status": "active",
      "planName": "Basic Plan"
    },
    "token": "jwt_token_here",
    "frontendUrl": "https://company.com"
  },
  "message": "Login successful"
}
```

### 2. Tenant Registration

**POST** `/tenant/auth/register`

Register a new user for the current tenant domain.

#### Request Body
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "user@example.com",
  "password": "password123"
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user"
    },
    "token": "jwt_token_here",
    "frontendUrl": "https://company.com"
  },
  "message": "Registration successful"
}
```

### 3. Get Tenant Information

**GET** `/tenant/info`

Get information about the current tenant.

#### Response
```json
{
  "success": true,
  "data": {
    "id": "tenant_id",
    "name": "Company Name",
    "domain": "company.com",
    "status": "active",
    "settings": {
      "maxUsers": 100,
      "features": ["basic", "advanced"]
    },
    "contactInfo": {
      "email": "admin@company.com",
      "phone": "+1234567890"
    },
    "frontendUrl": "https://company.com",
    "apiUrl": "https://api.company.com/api/v1"
  }
}
```

### 4. Get Widget Configuration

**GET** `/tenant/widget/config`

Get configuration for embedding the login widget.

#### Response
```json
{
  "success": true,
  "data": {
    "tenant": {
      "id": "tenant_id",
      "name": "Company Name",
      "domain": "company.com"
    },
    "apiEndpoints": {
      "login": "https://api.company.com/api/v1/tenant/auth/login",
      "register": "https://api.company.com/api/v1/tenant/auth/register",
      "info": "https://api.company.com/api/v1/tenant/info"
    },
    "frontendUrl": "https://company.com",
    "branding": {
      "logo": "https://company.com/logo.png",
      "primaryColor": "#3B82F6",
      "companyName": "Company Name"
    }
  }
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

### Common Error Codes

- `400` - Bad Request (missing required fields)
- `401` - Unauthorized (invalid credentials)
- `404` - Not Found (tenant not found)
- `409` - Conflict (user already exists)
- `500` - Internal Server Error

## Integration Examples

### JavaScript/HTML Integration

```html
<!DOCTYPE html>
<html>
<head>
    <title>Login Widget</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
    <div id="login-widget">
        <!-- Your login form here -->
    </div>

    <script>
        const API_BASE = 'https://api.your-domain.com/api/v1';
        
        async function login(email, password) {
            try {
                const response = await fetch(`${API_BASE}/tenant/auth/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, password }),
                });
                
                const result = await response.json();
                
                if (result.success) {
                    // Redirect to tenant dashboard
                    window.location.href = result.data.frontendUrl;
                } else {
                    // Show error message
                    console.error(result.error);
                }
            } catch (error) {
                console.error('Login failed:', error);
            }
        }
    </script>
</body>
</html>
```

### React Integration

```jsx
import React, { useState } from 'react';

const TenantLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    
    const handleLogin = async (e) => {
        e.preventDefault();
        
        try {
            const response = await fetch('/api/v1/tenant/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Store token and redirect
                localStorage.setItem('token', result.data.token);
                window.location.href = result.data.frontendUrl;
            }
        } catch (error) {
            console.error('Login failed:', error);
        }
    };
    
    return (
        <form onSubmit={handleLogin}>
            <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
            />
            <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
            />
            <button type="submit">Login</button>
        </form>
    );
};
```

## Widget Embedding

### Option 1: Direct HTML Embedding

```html
<iframe 
    src="https://your-domain.com/tenant-widget.html" 
    width="400" 
    height="600"
    frameborder="0">
</iframe>
```

### Option 2: JavaScript Widget

```html
<script>
    // Load widget configuration
    fetch('https://api.your-domain.com/api/v1/tenant/widget/config')
        .then(response => response.json())
        .then(config => {
            // Initialize your custom widget with config
            initializeWidget(config.data);
        });
</script>
```

## Security Considerations

1. **HTTPS Only**: Always use HTTPS in production
2. **Domain Validation**: The API automatically validates requests against registered tenant domains
3. **Rate Limiting**: API endpoints are rate-limited to prevent abuse
4. **Input Validation**: All inputs are validated and sanitized
5. **Token Security**: JWT tokens should be stored securely and have appropriate expiration

## Support

For technical support or questions about API integration, please contact:
- Email: support@immigrationportal.com
- Documentation: https://docs.immigrationportal.com
- API Status: https://status.immigrationportal.com

## Changelog

### Version 1.0.0
- Initial release
- Tenant authentication endpoints
- Widget configuration endpoint
- Basic error handling and validation
