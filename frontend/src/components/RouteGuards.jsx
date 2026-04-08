import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { getAccessToken, getDefaultRouteForRole, getRefreshToken, restoreSession } from '../lib/auth';

const SessionLoader = () => (
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
      <p style={{ color: 'var(--st-text-dim)', fontSize: 14 }}>Restoring your session...</p>
    </div>
  </div>
);

const SessionGate = ({ children, mode }) => {
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let cancelled = false;

    const hydrateSession = async () => {
      if (getAccessToken()) {
        if (!cancelled) {
          setStatus('authenticated');
        }
        return;
      }

      if (!getRefreshToken()) {
        if (!cancelled) {
          setStatus('guest');
        }
        return;
      }

      const restoredAccess = await restoreSession();
      if (!cancelled) {
        setStatus(restoredAccess ? 'authenticated' : 'guest');
      }
    };

    hydrateSession();

    return () => {
      cancelled = true;
    };
  }, []);

  if (status === 'loading') {
    return <SessionLoader />;
  }

  if (mode === 'landing') {
    return <Navigate to={status === 'authenticated' ? getDefaultRouteForRole() : '/auth'} replace />;
  }

  if (mode === 'public' && status === 'authenticated') {
    return <Navigate to={getDefaultRouteForRole()} replace />;
  }

  if (mode === 'protected' && status !== 'authenticated') {
    return <Navigate to="/auth" replace />;
  }

  return children;
};

export const AuthLanding = () => <SessionGate mode="landing" />;
export const PublicOnlyRoute = ({ children }) => <SessionGate mode="public">{children}</SessionGate>;
export const ProtectedRoute = ({ children }) => <SessionGate mode="protected">{children}</SessionGate>;
