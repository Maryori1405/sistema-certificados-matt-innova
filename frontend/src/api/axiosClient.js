import axios from 'axios';

const axiosClient = axios.create({
  baseURL: 'https://sistema-certificados-matt-innova.onrender.com/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Mantén aquí tus interceptores de token si los tienes
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axiosClient;