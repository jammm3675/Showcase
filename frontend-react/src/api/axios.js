import axios from 'axios';

// Create an axios instance.
// In development, the Vite proxy will catch the relative /api path.
// In production, we'll set the VITE_API_BASE_URL environment variable
// to the full URL of our deployed Go backend.
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
});

export default apiClient;
