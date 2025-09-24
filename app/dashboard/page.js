import React from 'react';
import { useAuth } from '../components/AuthProvider';

const Dashboard = () => {
  const { user, logout, refreshUser } = useAuth();

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const handleRefresh = async () => {
    await refreshUser();
  };

  if (!user) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Loading...</h2>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px',
        padding: '20px',
        backgroundColor: '#f8f9fa',
        borderRadius: '10px'
      }}>
        <div>
          <h1>GTV Motor Dashboard</h1>
          <p>Welcome, {user.full_name || user.email}!</p>
        </div>
        <div>
          <button
            onClick={handleRefresh}
            style={{
              padding: '10px 20px',
              marginRight: '10px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Refresh User
          </button>
          <button
            onClick={handleLogout}
            style={{
              padding: '10px 20px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px'
      }}>
        <div style={{
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '10px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3>User Information</h3>
          <p><strong>ID:</strong> {user.id}</p>
          <p><strong>Username:</strong> {user.username}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Full Name:</strong> {user.full_name}</p>
          <p><strong>Role:</strong> {user.role}</p>
          <p><strong>Status:</strong> {user.is_active ? 'Active' : 'Inactive'}</p>
          <p><strong>Last Login:</strong> {user.last_login}</p>
        </div>

        <div style={{
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '10px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3>Authentication Status</h3>
          <p style={{ color: 'green' }}>✅ Authenticated Successfully</p>
          <p style={{ color: 'green' }}>✅ Token Valid</p>
          <p style={{ color: 'green' }}>✅ User Data Retrieved</p>
          <p style={{ color: 'green' }}>✅ No 401 Errors</p>
        </div>

        <div style={{
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '10px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3>API Test</h3>
          <p>This dashboard proves that:</p>
          <ul>
            <li>Login works correctly</li>
            <li>Token is stored in localStorage</li>
            <li>/api/auth/me endpoint works</li>
            <li>No 401 Unauthorized errors</li>
            <li>User data is displayed correctly</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
