/**
 * GTV Motor React Frontend Authentication Fix
 * Simple solution for 401 Unauthorized error
 */

// Method 1: URL Parameter Authentication (Recommended)
export const authAPI = {
  // Login function
  login: async (email: string, password: string) => {
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

      if (response.ok && data.success) {
        // Store token in localStorage
        localStorage.setItem('auth_token', data.data.token);
        return {
          success: true,
          user: data.data.user,
          token: data.data.token
        };
      } else {
        return {
          success: false,
          error: data.error || 'Login failed'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Network error'
      };
    }
  },

  // Get current user using URL parameter method
  getCurrentUser: async () => {
    try {
      const token = localStorage.getItem('auth_token');

      if (!token) {
        return {
          success: false,
          error: 'No token found'
        };
      }

      // Use URL parameter instead of Authorization header
      const response = await fetch(`https://api.gtvmotor.dev/api/auth/me?token=${token}`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        return {
          success: true,
          user: data.data
        };
      } else {
        // Clear invalid token
        localStorage.removeItem('auth_token');
        return {
          success: false,
          error: data.error || 'Authentication failed'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Network error'
      };
    }
  },

  // Logout function
  logout: () => {
    localStorage.removeItem('auth_token');
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('auth_token');
  }
};

// Method 2: Custom Header Authentication (Alternative)
export const authAPIWithCustomHeader = {
  // Login function (same as above)
  login: async (email: string, password: string) => {
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

      if (response.ok && data.success) {
        localStorage.setItem('auth_token', data.data.token);
        return {
          success: true,
          user: data.data.user,
          token: data.data.token
        };
      } else {
        return {
          success: false,
          error: data.error || 'Login failed'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Network error'
      };
    }
  },

  // Get current user using custom header
  getCurrentUser: async () => {
    try {
      const token = localStorage.getItem('auth_token');

      if (!token) {
        return {
          success: false,
          error: 'No token found'
        };
      }

      // Use X-Auth-Token header instead of Authorization
      const response = await fetch('https://api.gtvmotor.dev/api/auth/me', {
        headers: {
          'X-Auth-Token': token,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        return {
          success: true,
          user: data.data
        };
      } else {
        localStorage.removeItem('auth_token');
        return {
          success: false,
          error: data.error || 'Authentication failed'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Network error'
      };
    }
  },

  logout: () => {
    localStorage.removeItem('auth_token');
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('auth_token');
  }
};

// React Hook for Authentication
import { useState, useEffect } from 'react';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      setLoading(true);
      const result = await authAPI.getCurrentUser();

      if (result.success) {
        setUser(result.user);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const result = await authAPI.login(email, password);

      if (result.success) {
        setUser(result.user);
        setIsAuthenticated(true);
        return true;
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  };

  const logout = () => {
    authAPI.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  return {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    refreshUser: checkAuth
  };
};

// Usage Example:
/*
import { useAuth } from './authAPI';

function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    const success = await login(email, password);

    if (success) {
      // Redirect to dashboard
      window.location.href = '/dashboard';
    } else {
      alert('Login failed');
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <button type="submit">Login</button>
    </form>
  );
}
*/
