import axios from 'axios';

const STORAGE_KEYS = {
  access: 'access_token',
  refresh: 'refresh_token',
};

const isBrowser = typeof window !== 'undefined';

const getAccessToken = () =>
  isBrowser ? window.localStorage.getItem(STORAGE_KEYS.access) : null;

const getRefreshToken = () =>
  isBrowser ? window.localStorage.getItem(STORAGE_KEYS.refresh) : null;

const clearStoredTokens = () => {
  if (!isBrowser) {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEYS.access);
  window.localStorage.removeItem(STORAGE_KEYS.refresh);
  window.localStorage.removeItem('user_role');
};

const redirectToAuth = () => {
  if (!isBrowser) {
    return;
  }

  const isPublicRoute =
    window.location.pathname.startsWith('/auth') ||
    window.location.pathname.startsWith('/forgot-password');

  if (!isPublicRoute) {
    window.location.replace('/auth');
  }
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

let refreshRequest = null;

const refreshAccessToken = async () => {
  const refresh = getRefreshToken();
  if (!refresh) {
    clearStoredTokens();
    redirectToAuth();
    return null;
  }

  if (!refreshRequest) {
    refreshRequest = axios
      .post(
        '/api/auth/refresh/',
        { refresh },
        {
          _skipAuthRefresh: true,
        }
      )
      .then((response) => {
        const nextAccessToken = response.data?.access;
        if (!nextAccessToken) {
          throw new Error('Access token missing from refresh response.');
        }

        if (isBrowser) {
          window.localStorage.setItem(STORAGE_KEYS.access, nextAccessToken);
        }

        return nextAccessToken;
      })
      .catch((error) => {
        clearStoredTokens();
        throw error;
      })
      .finally(() => {
        refreshRequest = null;
      });
  }

  try {
    return await refreshRequest;
  } catch (error) {
    redirectToAuth();
    return null;
  }
};

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = config.headers.Authorization || `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};
    const shouldRetry =
      error.response?.status === 401 &&
      Boolean(getRefreshToken()) &&
      !originalRequest._retry &&
      !originalRequest._skipAuthRefresh;

    if (!shouldRetry) {
      if (error.response?.status === 401 && !getRefreshToken()) {
        clearStoredTokens();
        redirectToAuth();
      }
      return Promise.reject(error);
    }

    const nextAccessToken = await refreshAccessToken();
    if (!nextAccessToken) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    originalRequest.headers = originalRequest.headers || {};
    originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`;
    return api(originalRequest);
  }
);

export default api;
