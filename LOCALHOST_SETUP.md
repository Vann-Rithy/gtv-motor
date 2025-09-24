# GTV Motor - Localhost Testing Setup

This guide will help you set up the GTV Motor system for local testing with the PHP backend.

## Prerequisites

- **XAMPP** (recommended) or **WAMP** or **MAMP**
- **Node.js** (for frontend)
- **MySQL/MariaDB**

## Quick Setup with XAMPP

### 1. Install XAMPP
Download and install XAMPP from https://www.apachefriends.org/

### 2. Start Services
- Start **Apache** and **MySQL** from XAMPP Control Panel

### 3. Setup Backend
```bash
# Copy backend folder to XAMPP htdocs
# Copy the entire backend/ folder to C:\xampp\htdocs\backend
```

### 4. Create Database
1. Open phpMyAdmin (http://localhost/phpmyadmin)
2. Create new database: `gtv_motor_php`
3. Import the schema: `backend/database/schema.sql`

### 5. Configure Backend
```bash
# Edit backend/.env file
DB_HOST=localhost
DB_NAME=gtv_motor_php
DB_USER=root
DB_PASSWORD=
DB_PORT=3306
JWT_SECRET=your-local-secret-key
```

### 6. Test Backend
```bash
# Test health endpoint
curl http://localhost/backend/api/health

# Test login (default admin)
curl -X POST http://localhost/backend/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gtvmotor.com","password":"admin123"}'
```

### 7. Setup Frontend
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### 8. Access Application
- Frontend: http://localhost:3000
- Backend API: http://localhost/backend
- phpMyAdmin: http://localhost/phpmyadmin

## Default Login Credentials

- **Email**: admin@gtvmotor.com
- **Password**: admin123

## Troubleshooting

### Backend Issues
- Check Apache is running
- Verify database connection in `.env`
- Check PHP error logs in XAMPP

### Frontend Issues
- Ensure backend is accessible at http://localhost/backend
- Check browser console for CORS errors
- Verify API client configuration

### Database Issues
- Ensure MySQL is running
- Check database exists: `gtv_motor_php`
- Verify schema was imported correctly

## File Structure After Cleanup

```
gtv_motor_php/
├── backend/                 # PHP Backend
│   ├── api/                # API endpoints
│   ├── config/             # Configuration
│   ├── database/           # Database schema
│   ├── includes/           # Core classes
│   └── index.php           # Entry point
├── app/                    # Next.js Frontend
├── components/             # React components
├── lib/                    # Frontend utilities
│   └── api-client.ts       # Updated for localhost
└── public/                 # Static assets
```

## Next Steps

1. Test all functionality locally
2. Fix any issues
3. Deploy to Namecheap when ready
4. Update API client URL to production domain

## Production Deployment

When ready for production:
1. Update `lib/api-client.ts` baseUrl to your Namecheap domain
2. Upload backend to Namecheap hosting
3. Create production database
4. Update environment variables
