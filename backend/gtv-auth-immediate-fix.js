/**
 * Immediate Frontend Authentication Fix
 * This script fixes the authentication issues immediately
 */

// Override the existing auth provider's login function
window.addEventListener('load', function() {
    console.log('🔧 Loading GTV Authentication Fix...');

    // Wait for the auth provider to load
    setTimeout(function() {
        // Find the auth provider context
        const authProvider = document.querySelector('[data-auth-provider]') ||
                           document.querySelector('script[src*="auth-provider"]') ||
                           window.AuthProvider;

        if (authProvider) {
            console.log('✅ Found auth provider, applying fix...');
            applyAuthFix();
        } else {
            console.log('⚠️ Auth provider not found, applying global fix...');
            applyGlobalAuthFix();
        }
    }, 1000);
});

function applyAuthFix() {
    // Override the login function
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
                    // Handle both 'token' and 'access_token' fields
                    const token = data.data.token || data.data.access_token;

                    if (token) {
                        // Store token
                        localStorage.setItem('auth_token', token);

                        console.log('✅ Login successful!');
                        console.log('User:', data.data.user.email);
                        console.log('Token:', token.substring(0, 50) + '...');

                        return {
                            success: true,
                            user: data.data.user,
                            token: token
                        };
                    } else {
                        console.error('❌ No token in response');
                        return { success: false, error: 'No token received' };
                    }
                } else {
                    console.error('❌ Login failed:', data.error);
                    return { success: false, error: data.error || 'Login failed' };
                }
            } catch (error) {
                console.error('❌ Login error:', error);
                return { success: false, error: 'Network error' };
            }
        };

        console.log('✅ Auth provider login function overridden');
    }
}

function applyGlobalAuthFix() {
    // Create a global authentication object
    window.GTVAuthFix = {
        login: async function(email, password) {
            try {
                console.log('🔧 Using global auth fix...');

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

                        console.log('✅ Global login successful!');
                        console.log('User:', data.data.user.email);

                        return {
                            success: true,
                            user: data.data.user,
                            token: token
                        };
                    }
                }

                return { success: false, error: data.error || 'Login failed' };
            } catch (error) {
                console.error('❌ Global login error:', error);
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
                console.error('❌ Get user error:', error);
                return { success: false, error: 'Network error' };
            }
        },

        logout: function() {
            localStorage.removeItem('auth_token');
            console.log('✅ Logged out');
        }
    };

    console.log('✅ Global auth fix applied');
}

// Test function
window.testAuthFix = async function() {
    console.log('🧪 Testing authentication fix...');

    try {
        // Test login
        const loginResult = await GTVAuthFix.login('admin@rhtower.com', 'test123');

        if (loginResult.success) {
            console.log('✅ Login test passed');

            // Test get current user
            const userResult = await GTVAuthFix.getCurrentUser();

            if (userResult.success) {
                console.log('✅ Get user test passed');
                console.log('Current user:', userResult.user.email);
            } else {
                console.log('❌ Get user test failed:', userResult.error);
            }
        } else {
            console.log('❌ Login test failed:', loginResult.error);
        }
    } catch (error) {
        console.log('❌ Test error:', error);
    }
};

console.log('🔧 GTV Authentication Fix loaded');
