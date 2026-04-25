import { createContext, useContext, useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [helperProfile, setHelperProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch profile on mount if token exists
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API_BASE}/helpers/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setHelperProfile(data.profile);
        } else {
          localStorage.removeItem('auth_token');
        }
      } catch (err) {
        console.error('Auth: Failed to fetch profile', err);
        setError('Session expired');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const register = async (email, fullName, phone) => {
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, fullName, phone })
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Registration failed' };
      }

      localStorage.setItem('auth_token', data.token);
      setHelperProfile(data.helper);
      return { success: true, profile: data.helper, generatedUsername: data.helper.username };
    } catch (err) {
      console.error('Registration error:', err);
      return { success: false, error: err.message };
    }
  };

  const login = async (email) => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Login failed' };
      }

      localStorage.setItem('auth_token', data.token);
      setHelperProfile(data.helper);
      return { success: true, profile: data.helper };
    } catch (err) {
      console.error('Login error:', err);
      return { success: false, error: err.message };
    }
  };

  const logout = async () => {
    const token = localStorage.getItem('auth_token');
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => {}); // ignore if backend fails
    } finally {
      localStorage.removeItem('auth_token');
      setHelperProfile(null);
    }
  };

  const updateHelperProfile = async (updates) => {
    const token = localStorage.getItem('auth_token');
    if (!token) return { success: false, error: 'Not authenticated' };

    try {
      const res = await fetch(`${API_BASE}/helpers/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });

      const data = await res.json();
      if (res.ok) {
        setHelperProfile(data.profile);
        return { success: true, profile: data.profile };
      } else {
        return { success: false, error: data.error };
      }
    } catch (err) {
      console.error('Update profile error:', err);
      return { success: false, error: err.message };
    }
  };

  const value = {
    helperProfile,
    user: helperProfile ? { uid: helperProfile.uid, email: helperProfile.email } : null,
    loading,
    error,
    register,
    login,
    logout,
    updateHelperProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
