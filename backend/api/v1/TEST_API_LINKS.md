# API v1 Test Links

Use these sample links to test the API with your API key.

**API Key:** `060e3af76e06c63208b07be5c9f949c935eaf00ae09153d7fd82e6e18bd0710b`

**Base URL:** `https://api.gtvmotor.dev/api/v1`

---

## How to Test

### Using cURL (Command Line)

Replace `YOUR_API_KEY` with your actual API key in the examples below.

#### 1. Test API Status
```bash
curl -X GET "https://api.gtvmotor.dev/api/v1/" \
  -H "X-API-Key: 060e3af76e06c63208b07be5c9f949c935eaf00ae09153d7fd82e6e18bd0710b"
```

#### 2. Get All Customers (Paginated)
```bash
curl -X GET "https://api.gtvmotor.dev/api/v1/customers?page=1&limit=10" \
  -H "X-API-Key: 060e3af76e06c63208b07be5c9f949c935eaf00ae09153d7fd82e6e18bd0710b"
```

#### 3. Get Customer by ID (Complete Service Information)
```bash
curl -X GET "https://api.gtvmotor.dev/api/v1/customers/1" \
  -H "X-API-Key: 060e3af76e06c63208b07be5c9f949c935eaf00ae09153d7fd82e6e18bd0710b"
```

**Response includes:**
- Customer basic information
- All vehicles with details
- All services with complete information:
  - Service Overview (status, payment, invoice, dates, amounts, exchange rate, volume)
  - Service Items (detailed breakdown)
  - Customer Information
  - Vehicle Information
  - Service Information (type, category, technician, sales rep, details)

#### 4. Search Customers
```bash
curl -X GET "https://api.gtvmotor.dev/api/v1/customers?search=john" \
  -H "X-API-Key: 060e3af76e06c63208b07be5c9f949c935eaf00ae09153d7fd82e6e18bd0710b"
```

#### 5. Get All Vehicles
```bash
curl -X GET "https://api.gtvmotor.dev/api/v1/vehicles?page=1&limit=10" \
  -H "X-API-Key: 060e3af76e06c63208b07be5c9f949c935eaf00ae09153d7fd82e6e18bd0710b"
```

#### 6. Get Vehicle by ID
```bash
curl -X GET "https://api.gtvmotor.dev/api/v1/vehicles/1" \
  -H "X-API-Key: 060e3af76e06c63208b07be5c9f949c935eaf00ae09153d7fd82e6e18bd0710b"
```

#### 7. Get Vehicle by Plate Number
```bash
curl -X GET "https://api.gtvmotor.dev/api/v1/vehicles?plate=ABC1234" \
  -H "X-API-Key: 060e3af76e06c63208b07be5c9f949c935eaf00ae09153d7fd82e6e18bd0710b"
```

#### 8. Get All Invoices
```bash
curl -X GET "https://api.gtvmotor.dev/api/v1/invoices?page=1&limit=10" \
  -H "X-API-Key: 060e3af76e06c63208b07be5c9f949c935eaf00ae09153d7fd82e6e18bd0710b"
```

#### 9. Get Invoice by ID
```bash
curl -X GET "https://api.gtvmotor.dev/api/v1/invoices/1" \
  -H "X-API-Key: 060e3af76e06c63208b07be5c9f949c935eaf00ae09153d7fd82e6e18bd0710b"
```

#### 10. Get Invoice by Invoice Number
```bash
curl -X GET "https://api.gtvmotor.dev/api/v1/invoices?invoice_number=INV-2024-001" \
  -H "X-API-Key: 060e3af76e06c63208b07be5c9f949c935eaf00ae09153d7fd82e6e18bd0710b"
```

#### 11. Get Analytics Overview
```bash
curl -X GET "https://api.gtvmotor.dev/api/v1/analytics?type=overview&days=7" \
  -H "X-API-Key: 060e3af76e06c63208b07be5c9f949c935eaf00ae09153d7fd82e6e18bd0710b"
```

#### 12. Get Analytics by Day/Month/Year
```bash
# Daily breakdown
curl -X GET "https://api.gtvmotor.dev/api/v1/analytics?type=overview&days=30&breakdown=day" \
  -H "X-API-Key: 060e3af76e06c63208b07be5c9f949c935eaf00ae09153d7fd82e6e18bd0710b"

# Monthly breakdown
curl -X GET "https://api.gtvmotor.dev/api/v1/analytics?type=overview&days=365&breakdown=month" \
  -H "X-API-Key: 060e3af76e06c63208b07be5c9f949c935eaf00ae09153d7fd82e6e18bd0710b"

# Yearly breakdown
curl -X GET "https://api.gtvmotor.dev/api/v1/analytics?type=overview&days=1825&breakdown=year" \
  -H "X-API-Key: 060e3af76e06c63208b07be5c9f949c935eaf00ae09153d7fd82e6e18bd0710b"
```

#### 13. Get Endpoint Analytics
```bash
curl -X GET "https://api.gtvmotor.dev/api/v1/analytics?type=endpoints&days=7" \
  -H "X-API-Key: 060e3af76e06c63208b07be5c9f949c935eaf00ae09153d7fd82e6e18bd0710b"
```

#### 14. Get API Key Analytics
```bash
curl -X GET "https://api.gtvmotor.dev/api/v1/analytics?type=keys&days=7" \
  -H "X-API-Key: 060e3af76e06c63208b07be5c9f949c935eaf00ae09153d7fd82e6e18bd0710b"
```

#### 15. Get Error Analytics
```bash
curl -X GET "https://api.gtvmotor.dev/api/v1/analytics?type=errors&days=7" \
  -H "X-API-Key: 060e3af76e06c63208b07be5c9f949c935eaf00ae09153d7fd82e6e18bd0710b"
```

#### 16. Get Performance Analytics
```bash
curl -X GET "https://api.gtvmotor.dev/api/v1/analytics?type=performance&days=7" \
  -H "X-API-Key: 060e3af76e06c63208b07be5c9f949c935eaf00ae09153d7fd82e6e18bd0710b"
```

#### 17. Get Traffic Analytics
```bash
curl -X GET "https://api.gtvmotor.dev/api/v1/analytics?type=traffic" \
  -H "X-API-Key: 060e3af76e06c63208b07be5c9f949c935eaf00ae09153d7fd82e6e18bd0710b"
```

---

## Using JavaScript/Fetch

```javascript
const apiKey = '060e3af76e06c63208b07be5c9f949c935eaf00ae09153d7fd82e6e18bd0710b';
const baseUrl = 'https://api.gtvmotor.dev/api/v1';

// Get all customers
fetch(`${baseUrl}/customers?page=1&limit=10`, {
  method: 'GET',
  headers: {
    'X-API-Key': apiKey,
    'Content-Type': 'application/json'
  }
})
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));

// Get customer by ID
fetch(`${baseUrl}/customers/1`, {
  method: 'GET',
  headers: {
    'X-API-Key': apiKey,
    'Content-Type': 'application/json'
  }
})
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));

// Get analytics overview
fetch(`${baseUrl}/analytics?type=overview&days=7&breakdown=day`, {
  method: 'GET',
  headers: {
    'X-API-Key': apiKey,
    'Content-Type': 'application/json'
  }
})
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));
```

---

## Using Postman

1. **Method:** GET
2. **URL:** `https://api.gtvmotor.dev/api/v1/customers`
3. **Headers:**
   - `X-API-Key`: `060e3af76e06c63208b07be5c9f949c935eaf00ae09153d7fd82e6e18bd0710b`
   - `Content-Type`: `application/json`

---

## Quick Test Links (Browser - Requires Extension)

**Note:** These links won't work directly in a browser without a REST client extension. Use Postman, Insomnia, or a browser extension like "REST Client" or "ModHeader".

### Direct Test URLs (with API Key in Header):

1. **API Status:**
   ```
   https://api.gtvmotor.dev/api/v1/
   Header: X-API-Key: 060e3af76e06c63208b07be5c9f949c935eaf00ae09153d7fd82e6e18bd0710b
   ```

2. **Customers List:**
   ```
   https://api.gtvmotor.dev/api/v1/customers?page=1&limit=10
   Header: X-API-Key: 060e3af76e06c63208b07be5c9f949c935eaf00ae09153d7fd82e6e18bd0710b
   ```

3. **Customer by ID:**
   ```
   https://api.gtvmotor.dev/api/v1/customers/1
   Header: X-API-Key: 060e3af76e06c63208b07be5c9f949c935eaf00ae09153d7fd82e6e18bd0710b
   ```

4. **Vehicles List:**
   ```
   https://api.gtvmotor.dev/api/v1/vehicles?page=1&limit=10
   Header: X-API-Key: 060e3af76e06c63208b07be5c9f949c935eaf00ae09153d7fd82e6e18bd0710b
   ```

5. **Vehicle by ID:**
   ```
   https://api.gtvmotor.dev/api/v1/vehicles/1
   Header: X-API-Key: 060e3af76e06c63208b07be5c9f949c935eaf00ae09153d7fd82e6e18bd0710b
   ```

6. **Invoices List:**
   ```
   https://api.gtvmotor.dev/api/v1/invoices?page=1&limit=10
   Header: X-API-Key: 060e3af76e06c63208b07be5c9f949c935eaf00ae09153d7fd82e6e18bd0710b
   ```

7. **Analytics Overview (Daily):**
   ```
   https://api.gtvmotor.dev/api/v1/analytics?type=overview&days=7&breakdown=day
   Header: X-API-Key: 060e3af76e06c63208b07be5c9f949c935eaf00ae09153d7fd82e6e18bd0710b
   ```

8. **Analytics Overview (Monthly):**
   ```
   https://api.gtvmotor.dev/api/v1/analytics?type=overview&days=365&breakdown=month
   Header: X-API-Key: 060e3af76e06c63208b07be5c9f949c935eaf00ae09153d7fd82e6e18bd0710b
   ```

9. **Analytics Overview (Yearly):**
   ```
   https://api.gtvmotor.dev/api/v1/analytics?type=overview&days=1825&breakdown=year
   Header: X-API-Key: 060e3af76e06c63208b07be5c9f949c935eaf00ae09153d7fd82e6e18bd0710b
   ```

10. **Endpoint Analytics:**
    ```
    https://api.gtvmotor.dev/api/v1/analytics?type=endpoints&days=7
    Header: X-API-Key: 060e3af76e06c63208b07be5c9f949c935eaf00ae09153d7fd82e6e18bd0710b
    ```

---

## Response Format

All API responses follow this format:

```json
{
  "success": true,
  "message": "Data retrieved successfully",
  "data": {
    // Response data here
  },
  "pagination": {
    // Pagination info (if applicable)
    "page": 1,
    "limit": 10,
    "total": 100,
    "total_pages": 10
  }
}
```

---

## Error Responses

If the API key is invalid or missing:

```json
{
  "success": false,
  "error": "API key is required. Please provide X-API-Key header.",
  "code": 401
}
```

---

## Testing Tips

1. **Always include the `X-API-Key` header** in your requests
2. **Use pagination** for large datasets (`?page=1&limit=10`)
3. **Check response status codes**: 200 = success, 401 = unauthorized, 404 = not found
4. **Use the analytics endpoint** to track your API usage
5. **Test with different breakdown periods** (day/month/year) for analytics

---

## Example: Complete Test Script

Save this as `test-api.sh`:

```bash
#!/bin/bash

API_KEY="060e3af76e06c63208b07be5c9f949c935eaf00ae09153d7fd82e6e18bd0710b"
BASE_URL="https://api.gtvmotor.dev/api/v1"

echo "Testing API Status..."
curl -X GET "${BASE_URL}/" \
  -H "X-API-Key: ${API_KEY}" \
  -H "Content-Type: application/json"

echo -e "\n\nTesting Customers List..."
curl -X GET "${BASE_URL}/customers?page=1&limit=5" \
  -H "X-API-Key: ${API_KEY}" \
  -H "Content-Type: application/json"

echo -e "\n\nTesting Analytics Overview (Daily)..."
curl -X GET "${BASE_URL}/analytics?type=overview&days=7&breakdown=day" \
  -H "X-API-Key: ${API_KEY}" \
  -H "Content-Type: application/json"
```

Make it executable and run:
```bash
chmod +x test-api.sh
./test-api.sh
```

