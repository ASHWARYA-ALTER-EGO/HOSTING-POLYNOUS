// Auto-detect environment
const isProduction = !window.location.hostname.includes('localhost') && 
                     !window.location.hostname.includes('127.0.0.1')

export const API_BASE_URL = isProduction 
  ? 'https://polynous-api.onrender.com'   // Production backend
  : 'http://localhost:8000'                // Development backend

export const FRONTEND_URL = isProduction
  ? 'https://polynous-frontend.onrender.com'
  : 'http://localhost:5174'