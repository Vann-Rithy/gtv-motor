/**
 * Simple Working Authentication Fix
 * GTV Motor Frontend - Quick Fix Version
 */

// Simple authentication functions that work immediately
window.GTVAuth = {
    // Store token in localStorage
    setToken: function(token) {
        localStorage.setItem('gtv_access_token', token);
    },

    // Get token from localStorage
    getToken: function() {
        return localStorage.getItem('gtv_access_token');
    },

    // Clear token from localStorage
    clearToken: function() {
        localStorage.removeItem('gtv_access_token');
    },

    // Login function
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

            if (data.success && data.data.access_token) {
                // Store the token
                this.setToken(data.data.access_token);

                console.log('✅ Login successful!');
                console.log('User:', data.data.user.email);
                console.log('Token:', data.data.access_token.substring(0, 50) + '...');

                return {
                    success: true,
                    user: data.data.user,
                    token: data.data.access_token
                };
            } else {
                console.error('❌ Login failed:', data.error);
                return {
                    success: false,
                    error: data.error || 'Login failed'
                };
            }
        } catch (error) {
            console.error('❌ Login error:', error);
            return {
                success: false,
                error: 'Network error'
            };
        }
    },

    // Get current user
    getCurrentUser: async function() {
        const token = this.getToken();

        if (!token) {
            return {
                success: false,
                error: 'No token found'
            };
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

            if (data.success && data.data) {
                console.log('✅ User authenticated successfully!');
                console.log('User:', data.data.email);

                return {
                    success: true,
                    user: data.data
                };
            } else {
                console.error('❌ Authentication failed:', data.error);
                this.clearToken();
                return {
                    success: false,
                    error: data.error || 'Authentication failed'
                };
            }
        } catch (error) {
            console.error('❌ Get user error:', error);
            this.clearToken();
            return {
                success: false,
                error: 'Network error'
            };
        }
    },

    // Logout function
    logout: function() {
        this.clearToken();
        console.log('✅ Logged out successfully');
    },

    // Check if user is authenticated
    isAuthenticated: function() {
        return !!this.getToken();
    }
};

// Auto-fix for existing auth provider
if (typeof window !== 'undefined') {
    // Override the existing auth provider's fetchUser function
    window.addEventListener('load', function() {
        console.log('🔧 GTV Auth Fix loaded');

        // If there's a token, test it
        const token = GTVAuth.getToken();
        if (token) {
            console.log('🔍 Found existing token, testing...');
            GTVAuth.getCurrentUser().then(result => {
                if (result.success) {
                    console.log('✅ Existing token is valid');
                } else {
                    console.log('❌ Existing token is invalid, clearing...');
                    GTVAuth.clearToken();
                }
            });
        }
    });
}

// Export for use in React components
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.GTVAuth;
}
