/**
 * GTV Motor Authentication Fix
 * This script fixes the frontend authentication issue immediately
 * Add this to your frontend HTML: <script src="https://api.gtvmotor.dev/gtv-auth-direct-fix.js"></script>
 */

(function() {
    'use strict';

    console.log('🔧 GTV Motor Authentication Fix Loading...');

    // Override fetch to automatically add Authorization header
    const originalFetch = window.fetch;

    window.fetch = function(url, options = {}) {
        // Check if this is a request to /api/auth/me
        if (url.includes('/api/auth/me')) {
            const token = localStorage.getItem('auth_token');

            if (token) {
                // Add Authorization header
                options.headers = options.headers || {};
                options.headers['Authorization'] = `Bearer ${token}`;

                console.log('🔧 Added Authorization header to /api/auth/me request');
            }
        }

        return originalFetch.call(this, url, options);
    };

    // Override auth provider login function
    function applyAuthFix() {
        if (window.AuthProvider && window.AuthProvider.login) {
            const originalLogin = window.AuthProvider.login;

            window.AuthProvider.login = async function(email, password) {
                try {
                    console.log('🔧 Using fixed login function...');

                    const response = await fetch('https://api.gtvmotor.dev/api/auth/login', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Cache-Control': 'no-cache',
                            'Pragma': 'no-cache'
                        },
                        body: JSON.stringify({ email, password })
                    });

                    const data = await response.json();

                    console.log('Login response:', data);

                    if (response.ok && data.success && data.data) {
                        const token = data.data.token || data.data.access_token;

                        if (token) {
                            // Store token in localStorage
                            localStorage.setItem('auth_token', token);

                            console.log('✅ Login successful!');
                            console.log('User:', data.data.user.email);
                            console.log('Token stored:', token.substring(0, 50) + '...');

                            // Update auth state
                            if (this.setToken) this.setToken(token);
                            if (this.setUser) this.setUser(data.data.user);
                            if (this.setIsAuthenticated) this.setIsAuthenticated(true);

                            return true;
                        } else {
                            console.error('❌ No token in response');
                            return false;
                        }
                    } else {
                        console.error('❌ Login failed:', data.error);
                        return false;
                    }
                } catch (error) {
                    console.error('❌ Login error:', error);
                    return false;
                }
            };

            console.log('✅ AuthProvider login function overridden');
        }
    }

    // Apply fix when page loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(applyAuthFix, 1000);
        });
    } else {
        setTimeout(applyAuthFix, 1000);
    }

    // Also try to apply fix after a longer delay in case auth provider loads later
    setTimeout(applyAuthFix, 3000);

    console.log('✅ GTV Motor Authentication Fix Applied!');
})();
