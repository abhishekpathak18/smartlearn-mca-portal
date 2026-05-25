'use client';

/**
 * =============================================================================
 * AuthContext.jsx — Global Authentication State Manager
 * =============================================================================
 *
 * Provides authentication context to the entire application via React Context.
 *
 * Features:
 *  • Stores current user object + loading state
 *  • login(email, password)   → POST /auth/login
 *  • register(formData)       → POST /auth/register
 *  • logout()                 → clears cookie & redirects to /login
 *  • updateProfile(data)      → PUT /auth/update-profile
 *  • Auto-fetches current user on mount via GET /auth/me
 *  • JWT is persisted in a cookie named 'token' (7-day expiry)
 *
 * Usage:
 *   import { useAuth } from '@/context/AuthContext';
 *   const { user, login, logout } = useAuth();
 * =============================================================================
 */

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import api from '@/lib/api';
import toast from 'react-hot-toast';

/* ── Create the context ────────────────────────────────────────────────────── */
const AuthContext = createContext(null);

/* ── Custom hook for consuming the context ─────────────────────────────────── */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/* ── Provider component ────────────────────────────────────────────────────── */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);       // Current authenticated user
  const [loading, setLoading] = useState(true);  // True while checking auth on mount
  const router = useRouter();

  /* ── Check if user is already logged in on mount ─────────────────────────── */
  useEffect(() => {
    const loadUser = async () => {
      const token = Cookies.get('token');
      if (token) {
        try {
          const { data } = await api.get('/auth/me');
          setUser(data.data?.user || data.user || data.data);
        } catch (error) {
          // Token is invalid or expired — clean up
          console.error('Auth check failed:', error);
          Cookies.remove('token');
          setUser(null);
        }
      }
      setLoading(false);
    };
    loadUser();
  }, []);

  /**
   * Login — authenticates user and stores JWT
   * @param {string} email
   * @param {string} password
   */
  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    const token = data.data?.token || data.token;
    const userData = data.data?.user || data.user;
    if (token) Cookies.set('token', token, { expires: 7 });
    setUser(userData);
    return userData;
  };

  /**
   * Register — creates a new account and stores JWT
   * @param {Object} formData — { name, email, phone, password, university, department, semester }
   */
  const register = async (formData) => {
    const { data } = await api.post('/auth/register', formData);
    const token = data.data?.token || data.token;
    const userData = data.data?.user || data.user;
    if (token) Cookies.set('token', token, { expires: 7 });
    setUser(userData);
    return userData;
  };

  /**
   * Logout — clears token cookie and redirects to login
   */
  const logout = () => {
    Cookies.remove('token');
    setUser(null);
    router.push('/login');
    toast.success('Logged out successfully');
  };

  /**
   * Update Profile — patches the user's profile data
   * @param {Object} profileData
   */
  const updateProfile = async (profileData) => {
    const { data } = await api.put('/auth/update-profile', profileData);
    setUser(data.user);
    return data;
  };

  /* ── Context value exposed to consumers ──────────────────────────────────── */
  const value = {
    user,
    setUser,
    loading,
    login,
    register,
    logout,
    updateProfile,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
