import axios from 'axios';
import { store } from '../store/store';
import { logout } from '../store/slices/authSlice';

const axiosInstance = axios.create({
  // Aapke bataye gaye IP and port ke hisab se baseURL set kar diya hai
  baseURL: 'http://192.168.1.46:5000/api', 
});

// Request Interceptor: Attach JWT token to headers
axiosInstance.interceptors.request.use(
  (config) => {
    const token = store.getState().auth.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle 401 Unauthorized (Token Expired)
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired ya invalid hai, auto logout
      store.dispatch(logout());
      globalThis.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
