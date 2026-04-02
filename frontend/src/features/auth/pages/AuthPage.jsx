import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from '../components/LoginForm';
import SignupForm from '../components/SignupForm';
import './AuthPage.css';

const AuthPage = () => {
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  const [selectedRole, setSelectedRole] = useState('student');
  const navigate = useNavigate();

  // Only show Student role for signup, all roles for login
  const roles = authMode === 'signup' 
    ? [{ id: 'student', label: 'Student' }]
    : [
        { id: 'student', label: 'Student' },
        { id: 'mess_manager', label: 'Mess Manager' },
        { id: 'canteen_manager', label: 'Canteen Manager' },
        { id: 'delivery_person', label: 'Delivery Person' },
      ];

  return (
    <div className="auth-container">
      <div className="auth-content">
        {/* Logo */}
        <div className="auth-logo-container">
          <img src="/logo.png" alt="Upside Dine" className="auth-logo" />
        </div>

        {/* Title */}
        <h1 className="auth-title">
          {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
        </h1>
        <p className="auth-subtitle">
          {authMode === 'login' ? 'Sign in to your account' : 'Sign up as a student'}
        </p>

        {/* No role selector needed - students only for signup */}

        {/* Auth Forms */}
        {authMode === 'login' ? (
          <LoginForm selectedRole={selectedRole} />
        ) : (
          <SignupForm selectedRole={selectedRole} />
        )}

        {/* Toggle Auth Mode */}
        <div className="auth-toggle">
          <p className="auth-toggle-text">
            {authMode === 'login'
              ? "Don't have an account? "
              : 'Already have an account? '}
            <button
              className="auth-toggle-link"
              onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
            >
              {authMode === 'login' ? 'Register' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
