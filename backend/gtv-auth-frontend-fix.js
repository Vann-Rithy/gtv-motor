/**
 * GTV Motor Frontend Authentication Fix
 * This script fixes the authentication issue immediately
 */

(function() {
    'use strict';

    console.log('🔧 GTV Motor Authentication Fix Loading...');

    // Wait for the page to load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    function init() {
        console.log('🔧 Initializing GTV Authentication Fix...');

        // Wait a bit for the auth provider to load
        setTimeout(function() {
            applyAuthFix();
        }, 1000);
    }

    function applyAuthFix() {
        console.log('🔧 Applying authentication fix...');

        // Override the fetch function to add Authorization header
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

        // Override the auth provider's login function if it exists
        if (window.AuthProvider) {
            console.log('🔧 Found AuthProvider, overriding login function...');

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
                            // Store token
                            localStorage.setItem('auth_token', token);

                            console.log('✅ Login successful!');
                            console.log('User:', data.data.user.email);
                            console.log('Token stored:', token.substring(0, 50) + '...');

                            // Update auth state if methods exist
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

        // Create a global auth object for manual use
        window.GTVAuth = {
            login: async function(email, password) {
                try {
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

                    if (response.ok && data.success && data.data) {
                        const token = data.data.token || data.data.access_token;

                        if (token) {
                            localStorage.setItem('auth_token', token);

                            return {
                                success: true,
                                user: data.data.user,
                                token: token
                            };
                        }
                    }

                    return { success: false, error: data.error || 'Login failed' };
                } catch (error) {
                    return { success: false, error: 'Network error' };
                }
            },

            getCurrentUser: async function() {
                const token = localStorage.getItem('auth_token');

                if (!token) {
                    return { success: false, error: 'No token found' };
                }

                try {
                    const response = await fetch('https://api.gtvmotor.dev/api/auth/me', {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Cache-Control': 'no-cache',
                            'Pragma': 'no-cache'
                        }
                    });

                    const data = await response.json();

                    if (response.ok && data.success) {
                        return { success: true, user: data.data };
                    } else {
                        localStorage.removeItem('auth_token');
                        return { success: false, error: data.error || 'Authentication failed' };
                    }
                } catch (error) {
                    return { success: false, error: 'Network error' };
                }
            },

            logout: function() {
                localStorage.removeItem('auth_token');
                console.log('✅ Logged out');
            },

            isAuthenticated: function() {
                return !!localStorage.getItem('auth_token');
            }
        };

        console.log('✅ GTV Authentication Fix Applied Successfully!');

        // Test the fix
        setTimeout(function() {
            testAuthFix();
        }, 2000);
    }

    function testAuthFix() {
        console.log('🧪 Testing authentication fix...');

        // Test if we can make a successful login
        GTVAuth.login('admin@rhtower.com', 'test123').then(function(result) {
            if (result.success) {
                console.log('✅ Authentication fix test passed!');
                console.log('User:', result.user.email);

                // Test get current user
                return GTVAuth.getCurrentUser();
            } else {
                console.log('❌ Authentication fix test failed:', result.error);
            }
        }).then(function(userResult) {
            if (userResult && userResult.success) {
                console.log('✅ Get current user test passed!');
                console.log('Current user:', userResult.user.email);
            } else if (userResult) {
                console.log('❌ Get current user test failed:', userResult.error);
            }
        }).catch(function(error) {
            console.log('❌ Test error:', error);
        });
    }

})();
