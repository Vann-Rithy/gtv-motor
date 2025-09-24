/**
 * Simple Authentication Fix for GTV Motor
 * Add this JavaScript to your frontend to fix the authentication issue
 */

// Simple authentication fix
window.GTVAuth = {
    // Store session ID in localStorage
    setSessionId: function(sessionId) {
        localStorage.setItem('gtv_session_id', sessionId);
        console.log('Session ID stored:', sessionId);
    },

    // Get session ID from localStorage
    getSessionId: function() {
        return localStorage.getItem('gtv_session_id');
    },

    // Clear session ID
    clearSession: function() {
        localStorage.removeItem('gtv_session_id');
        console.log('Session cleared');
    },

    // Make authenticated API request
    apiRequest: function(url, options = {}) {
        const sessionId = this.getSessionId();

        if (!sessionId) {
            console.error('No session ID found');
            return Promise.reject('No session ID');
        }

        // Add session ID as query parameter
        const separator = url.includes('?') ? '&' : '?';
        const urlWithSession = url + separator + 'session_id=' + encodeURIComponent(sessionId);

        // Add session ID as header (alternative)
        const headers = {
            'X-Session-ID': sessionId,
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            ...options.headers
        };

        return fetch(urlWithSession, {
            ...options,
            headers
        });
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

            const result = await response.json();

            if (result.success && result.session_id) {
                this.setSessionId(result.session_id);
                console.log('Login successful, session stored');
                return { success: true, user: result.user };
            } else {
                console.error('Login failed:', result.error);
                return { success: false, error: result.error };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: 'Network error' };
        }
    },

    // Get current user
    getCurrentUser: async function() {
        try {
            const response = await this.apiRequest('https://api.gtvmotor.dev/api/auth/me');
            const result = await response.json();

            if (result.success) {
                return { success: true, user: result.data };
            } else {
                this.clearSession();
                return { success: false, error: result.error };
            }
        } catch (error) {
            console.error('Get user error:', error);
            return { success: false, error: 'Network error' };
        }
    },

    // Logout function
    logout: function() {
        this.clearSession();
        window.location.href = '/login';
    }
};

// Test the authentication
console.log('GTV Auth loaded. Available methods:');
console.log('- GTVAuth.login(email, password)');
console.log('- GTVAuth.getCurrentUser()');
console.log('- GTVAuth.logout()');

// Example usage:
/*
// Login
GTVAuth.login('admin@rhtower.com', 'your_password').then(result => {
    if (result.success) {
        console.log('Logged in as:', result.user.email);
    } else {
        console.error('Login failed:', result.error);
    }
});

// Get current user
GTVAuth.getCurrentUser().then(result => {
    if (result.success) {
        console.log('Current user:', result.user);
    } else {
        console.log('Not logged in:', result.error);
    }
});
*/
