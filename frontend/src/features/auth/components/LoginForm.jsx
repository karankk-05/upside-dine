import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const EyeIcon = ({ isVisible }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {isVisible ? (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ) : (
      <>
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </>
    )}
  </svg>
);

const LoginForm = ({ selectedRole }) => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/auth/login/', {
        email: formData.email,
        password: formData.password,
      });

      // Store tokens
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      
      // Get actual role from backend response
      const userRole = response.data.user?.role;
      localStorage.setItem('user_role', userRole);

      // Navigate based on actual user role from backend
      const roleRoutes = {
        student: '/dashboard',
        mess_manager: '/manager/mess',
        mess_worker: '/worker/scan',
        canteen_manager: '/manager/canteen',
        delivery_person: '/delivery',
        admin_manager: '/admin/managers',
        superadmin: '/admin',
      };

      navigate(roleRoutes[userRole] || '/dashboard');
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.detail ||
          'Login failed. Please check your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="input-group">
        <label className="input-label">Email</label>
        <input
          type="email"
          name="email"
          className="input-field"
          placeholder="Enter your email"
          value={formData.email}
          onChange={handleChange}
          required
        />
      </div>

      <div className="input-group">
        <label className="input-label">Password</label>
        <div className="password-input-wrapper">
          <input
            type={showPassword ? 'text' : 'password'}
            name="password"
            className="input-field"
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleChange}
            required
          />
          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            <EyeIcon isVisible={showPassword} />
          </button>
        </div>
      </div>

      <div className="forgot-password">
        <a href="/forgot-password">Forgot Password?</a>
      </div>

      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? (
          <span className="loading-spinner">Signing In...</span>
        ) : (
          'Sign In'
        )}
      </button>
    </form>
  );
};

export default LoginForm;
