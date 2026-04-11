import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import api from '../lib/api';
import {
  clearAuthSession,
  getAccessToken,
  getDefaultRouteForRole,
  getRefreshToken,
  getStoredRole,
  normalizeRole,
  restoreSession,
  setAuthSession,
} from '../lib/auth';

const SessionLoader = ({ message = 'Restoring your session...' }) => (
  <div
    style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--st-dark)',
      color: 'var(--st-text)',
    }}
  >
    <div style={{ textAlign: 'center' }}>
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          border: '3px solid rgba(255,255,255,0.12)',
          borderTopColor: 'var(--st-accent)',
          margin: '0 auto 14px',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <p style={{ color: 'var(--st-text-dim)', fontSize: 14 }}>{message}</p>
    </div>
  </div>
);

const requiresRoleVerification = (mode, allowedRoles) =>
  mode !== 'protected' || (Array.isArray(allowedRoles) && allowedRoles.length > 0);

const SessionGate = ({ children, mode, allowedRoles }) => {
  const normalizedAllowedRoles = Array.isArray(allowedRoles)
    ? allowedRoles.map(normalizeRole).filter(Boolean)
    : [];
  const allowedRoleKey = normalizedAllowedRoles.join('|');
  const [session, setSession] = useState({ status: 'loading', role: '' });

  useEffect(() => {
    let cancelled = false;

    const updateSession = (nextSession) => {
      if (!cancelled) {
        setSession(nextSession);
      }
    };

    const resolveCurrentUserRole = async () => {
      const { data } = await api.get('/users/me/');
      const resolvedRole = normalizeRole(data?.role);

      if (resolvedRole) {
        setAuthSession({ role: resolvedRole });
      }

      return resolvedRole;
    };

    const hydrateSession = async () => {
      const existingAccessToken = getAccessToken();

      if (existingAccessToken && !requiresRoleVerification(mode, normalizedAllowedRoles)) {
        updateSession({ status: 'authenticated', role: getStoredRole() });
        return;
      }

      const restoredAccess = existingAccessToken || (getRefreshToken() ? await restoreSession() : null);
      if (!restoredAccess) {
        updateSession({ status: 'guest', role: '' });
        return;
      }

      if (!requiresRoleVerification(mode, normalizedAllowedRoles)) {
        updateSession({ status: 'authenticated', role: getStoredRole() });
        return;
      }

      try {
        const resolvedRole = await resolveCurrentUserRole();
        updateSession({ status: resolvedRole ? 'authenticated' : 'guest', role: resolvedRole || '' });
      } catch (error) {
        const isAuthError = error?.response?.status === 401 || error?.response?.status === 403;

        if (isAuthError) {
          clearAuthSession();
          updateSession({ status: 'guest', role: '' });
          return;
        }

        if (normalizedAllowedRoles.length > 0) {
          console.warn('Unable to verify session role for a protected route.', error);
          updateSession({ status: 'guest', role: '' });
          return;
        }

        console.warn('Unable to verify session role. Falling back to the stored role.', error);
        updateSession({ status: 'authenticated', role: getStoredRole() });
      }
    };

    hydrateSession();

    return () => {
      cancelled = true;
    };
  }, [allowedRoleKey, mode]);

  if (session.status === 'loading') {
    return <SessionLoader message={normalizedAllowedRoles.length > 0 ? 'Verifying your access...' : undefined} />;
  }

  if (mode === 'landing') {
    return (
      <Navigate
        to={session.status === 'authenticated' ? getDefaultRouteForRole(session.role) : '/auth'}
        replace
      />
    );
  }

  if (mode === 'public' && session.status === 'authenticated') {
    return <Navigate to={getDefaultRouteForRole(session.role)} replace />;
  }

  if (mode === 'protected' && session.status !== 'authenticated') {
    return <Navigate to="/auth" replace />;
  }

  if (
    mode === 'protected' &&
    normalizedAllowedRoles.length > 0 &&
    !normalizedAllowedRoles.includes(normalizeRole(session.role))
  ) {
    return <Navigate to={getDefaultRouteForRole(session.role)} replace />;
  }

  return children;
};

export const AuthLanding = () => <SessionGate mode="landing" />;
export const PublicOnlyRoute = ({ children }) => <SessionGate mode="public">{children}</SessionGate>;
export const ProtectedRoute = ({ children, allowedRoles }) => (
  <SessionGate mode="protected" allowedRoles={allowedRoles}>
    {children}
  </SessionGate>
);
