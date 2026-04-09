import axios from 'axios';
import { configureAxiosAuth } from './auth';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

configureAxiosAuth(api);

export default api;
