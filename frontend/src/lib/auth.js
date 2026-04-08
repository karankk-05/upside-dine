import axios from 'axios';

const STORAGE_KEYS = {
  access: 'access_token',
  refresh: 'refresh_token',
  role: 'user_role',
};

const ROLE_ROUTES = {
  student: '/dashboard',
  mess_manager: '/manager/mess',
  mess_worker: '/worker/scan',
  canteen_manager: '/manager/canteen',
  delivery_person: '/delivery',
  admin_manager: '/admin/managers',
  superadmin: '/admin',
};

let refreshRequest = null;

export const normalizeRole = (role) =>
  typeof role === 'string' ? role.toLowerCase().trim().replace(/\s+/g, '_') : '';

export const getAccessToken = () => localStorage.getItem(STORAGE_KEYS.access);
export const getRefreshToken = () => localStorage.getItem(STORAGE_KEYS.refresh);
export const getStoredRole = () => normalizeRole(localStorage.getItem(STORAGE_KEYS.role));

export const getDefaultRouteForRole = (role = getStoredRole()) =>
  ROLE_ROUTES[normalizeRole(role)] || '/dashboard';

export const setAuthSession = ({ access, refresh, role }) => {
  if (access) {
    localStorage.setItem(STORAGE_KEYS.access, access);
  }
  if (refresh) {
    localStorage.setItem(STORAGE_KEYS.refresh, refresh);
  }
  if (role) {
    localStorage.setItem(STORAGE_KEYS.role, normalizeRole(role));
  }
};

export const clearAuthSession = () => {
  Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
};

const redirectToAuth = () => {
  if (typeof window === 'undefined') {
    return;
  }

  const isPublicRoute =
    window.location.pathname.startsWith('/auth') ||
    window.location.pathname.startsWith('/forgot-password');

  if (!isPublicRoute) {
    window.location.replace('/auth');
  }
};

export const refreshAccessToken = async () => {
  const refresh = getRefreshToken();
  if (!refresh) {
    clearAuthSession();
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
        const access = response.data?.access;
        if (!access) {
          throw new Error('Access token missing from refresh response.');
        }

        localStorage.setItem(STORAGE_KEYS.access, access);
        return access;
      })
      .catch((error) => {
        clearAuthSession();
        throw error;
      })
      .finally(() => {
        refreshRequest = null;
      });
  }

  try {
    return await refreshRequest;
  } catch {
    redirectToAuth();
    return null;
  }
};

export const restoreSession = async () => {
  const access = getAccessToken();
  if (access) {
    return access;
  }

  return refreshAccessToken();
};

export const logoutUser = async () => {
  const refresh = getRefreshToken();

  try {
    if (refresh) {
      await axios.post(
        '/api/auth/logout/',
        { refresh },
        {
          _skipAuthRefresh: true,
        }
      );
    }
  } catch (error) {
    console.warn('Logout request failed, clearing session locally.', error);
  } finally {
    clearAuthSession();
  }
};

export const configureAxiosAuth = (client) => {
  if (!client || client.__UPSIDE_DINE_AUTH_CONFIGURED__) {
    return client;
  }

  client.interceptors.request.use((config) => {
    const token = getAccessToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = config.headers.Authorization || `Bearer ${token}`;
    }
    return config;
  });

  client.interceptors.response.use(
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
          clearAuthSession();
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
      return client(originalRequest);
    }
  );

  client.__UPSIDE_DINE_AUTH_CONFIGURED__ = true;
  return client;
};
