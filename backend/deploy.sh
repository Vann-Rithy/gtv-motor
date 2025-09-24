#!/bin/bash

# GTV Motor PHP Backend Deployment Script
# This script helps deploy the PHP backend to Namecheap hosting

echo "🚀 GTV Motor PHP Backend Deployment Script"
echo "=========================================="

# Check if required files exist
if [ ! -f "database/schema.sql" ]; then
    echo "❌ Error: database/schema.sql not found"
    exit 1
fi

if [ ! -f "index.php" ]; then
    echo "❌ Error: index.php not found"
    exit 1
fi

echo "✅ Required files found"

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from template..."
    cp env.example .env
    echo "⚠️  Please edit .env file with your database credentials before deployment"
fi

# Set file permissions
echo "🔧 Setting file permissions..."
find . -type d -exec chmod 755 {} \;
find . -type f -name "*.php" -exec chmod 644 {} \;
find . -type f -name "*.sql" -exec chmod 644 {} \;
find . -type f -name "*.md" -exec chmod 644 {} \;

echo "✅ File permissions set"

# Create .htaccess for Apache
echo "📝 Creating .htaccess file..."
cat > .htaccess << 'EOF'
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.php [QSA,L]

# Security headers
Header always set X-Content-Type-Options nosniff
Header always set X-Frame-Options DENY
Header always set X-XSS-Protection "1; mode=block"

# CORS headers for API
Header always set Access-Control-Allow-Origin "*"
Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
Header always set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With"

# Handle preflight requests
RewriteCond %{REQUEST_METHOD} OPTIONS
RewriteRule ^(.*)$ $1 [R=200,L]
EOF

echo "✅ .htaccess file created"

# Create logs directory
mkdir -p logs
chmod 755 logs

echo "📁 Logs directory created"

echo ""
echo "🎉 Deployment preparation complete!"
echo ""
echo "Next steps:"
echo "1. Upload all files to your Namecheap hosting"
echo "2. Create MySQL database 'gtv_motor_php'"
echo "3. Import database/schema.sql into your database"
echo "4. Edit .env file with your database credentials"
echo "5. Test the API endpoints"
echo "6. Update frontend API client URL"
echo ""
echo "API Base URL: https://your-domain.com/backend"
echo "Health Check: https://your-domain.com/backend/api/health"
echo ""
echo "For detailed instructions, see README.md"
