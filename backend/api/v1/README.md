# GTV Motor API v1

Complete API v1 implementation for GTV Motor PHP Backend.

## 📁 **Directory Structure**

### **Core Files:**
- `index.php` - Main router and entry point
- `config.php` - API configuration (keys, settings)
- `config.example.php` - Example configuration file

### **Endpoints:**
- `customers.php` - Customer management (GET, POST, PUT, PATCH, DELETE)
- `vehicles.php` - Vehicle management (GET, POST, PUT, PATCH, DELETE)
- `invoices.php` - Invoice retrieval (GET only)
- `api-keys.php` - API key management (GET, POST, PATCH, DELETE)
- `analytics.php` - API analytics and traffic data (GET)
- `test-api-key.php` - API key testing endpoint (POST)

### **Middleware:**
- `middleware/ApiAuth.php` - API key authentication (checks database + config.php)
- `middleware/ApiAnalytics.php` - Request logging and analytics

### **Database:**
- `create_complete_api_tables.sql` - Creates all required tables with proper linkages
- `fix_collation_for_existing_tables.sql` - Fixes collation issues for existing tables

### **Documentation:**
- `README.md` - This file
- `SETUP.md` - Setup instructions
- `TROUBLESHOOTING.md` - Common issues and solutions
- `FULL_API_CONTROL_SYSTEM.md` - Complete API control system documentation

## 🔑 **API Key Management**

### **How It Works:**
1. **Database Storage:** API keys are stored in `api_keys` table (hashed)
2. **Authentication:** `ApiAuth` checks database first, then falls back to `config.php`
3. **Analytics:** All requests are logged to `api_requests` table
4. **Linking:** Analytics linked to keys via `api_key_id` (key name)

### **Key Features:**
- ✅ Create, list, update, delete API keys
- ✅ Test API keys
- ✅ View usage statistics per key
- ✅ Rate limiting per key
- ✅ Permission-based access (read, write, admin)

## 📊 **Analytics Dashboard**

### **Tables:**
- `api_keys` - API key storage
- `api_requests` - Request logs
- `api_analytics_summary` - Pre-aggregated statistics
- `api_performance_metrics` - Performance tracking

### **Views:**
- `v_api_usage_by_key` - Usage statistics by API key
- `v_api_traffic_overview` - Traffic overview (24 hours)
- `v_api_key_statistics` - Complete key statistics

### **Endpoints:**
- `GET /v1/analytics?type=overview` - Overview statistics
- `GET /v1/analytics?type=endpoints` - Endpoint statistics
- `GET /v1/analytics?type=keys` - API key usage
- `GET /v1/analytics?type=errors` - Error analysis
- `GET /v1/analytics?type=performance` - Performance metrics
- `GET /v1/analytics?type=traffic` - Traffic overview

## 🚀 **Setup**

1. **Run SQL Script:**
   ```sql
   -- Create all tables
   source create_complete_api_tables.sql;

   -- If tables already exist with wrong collation:
   source fix_collation_for_existing_tables.sql;
   ```

2. **Configure:**
   - Copy `config.example.php` to `config.php`
   - Set your API keys in `config.php` or create via API

3. **Deploy:**
   - Upload all files to `api.gtvmotor.dev/api/v1/`
   - Ensure `.htaccess` is in place for routing

## ✅ **What's Working:**

- ✅ API Key Management (create, list, update, delete, test)
- ✅ API Authentication (database + config.php)
- ✅ Request Analytics (logging to database)
- ✅ Analytics Dashboard (all endpoints working)
- ✅ Proper table linkages (api_keys ↔ api_requests)
- ✅ CORS configured correctly
- ✅ Error handling and validation

## 🔗 **Table Linkages:**

- `api_keys.key_name` ← `api_requests.api_key_id` (by name)
- `api_keys.key_name` ← `api_analytics_summary.api_key_id` (by name)
- All using `utf8mb4_unicode_ci` collation

## 📝 **Notes:**

- API keys are stored as SHA256 hashes (not plain text)
- Analytics automatically links to keys via key name
- Database keys take precedence over config.php
- All tables use proper foreign key relationships
