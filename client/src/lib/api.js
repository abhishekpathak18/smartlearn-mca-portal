/**
 * =============================================================================
 * api.js — Centralised Axios Instance for Backend Communication
 * =============================================================================
 *
 * Creates and exports a pre-configured Axios instance that:
 *  1. Points to our Express backend at http://localhost:5000/api
 *  2. Automatically attaches the JWT token from cookies on every request
 *  3. Intercepts 401 responses to redirect to the login page
 *
 * Usage:
 *   import api from '@/lib/api';
 *   const { data } = await api.get('/auth/me');
 * =============================================================================
 */

import axios from 'axios';
import Cookies from 'js-cookie';

/* ── Create Axios instance with base URL ───────────────────────────────────── */
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

/* ── Request interceptor: attach Bearer token ──────────────────────────────── */
api.interceptors.request.use(
  (config) => {
    // Read the JWT from the 'token' cookie (set during login/register)
    const token = Cookies.get('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/* ── Response interceptor: handle auth errors globally ─────────────────────── */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If the server responds with 401 Unauthorized, clear token and redirect
    if (error.response && error.response.status === 401) {
      Cookies.remove('token');
      // Only redirect in browser environment (not during SSR)
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
