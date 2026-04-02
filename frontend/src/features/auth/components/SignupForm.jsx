import { useState, useEffect } from 'react';
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

const SignupForm = ({ selectedRole }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Basic Info, 2: OTP Verification
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    // Student specific
    roll_number: '',
    full_name: '',
    hostel_name: '',
    room_number: '',
    // Staff specific
    employee_code: '',
  });
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [availableHalls, setAvailableHalls] = useState([]);

  // Fetch available halls for student registration
  useEffect(() => {
    if (selectedRole === 'student') {
      const fetchHalls = async () => {
        try {
          const response = await axios.get('/api/public/halls/');
          // response.data is an array of strings e.g. ["Hall 1", "Hall 2"]
          setAvailableHalls(response.data);
        } catch (err) {
          console.error("Failed to load halls", err);
        }
      };
      fetchHalls();
    }
  }, [selectedRole]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        role_name: selectedRole, // Changed from 'role' to 'role_name'
      };

      // Add role-specific fields
      if (selectedRole === 'student') {
        payload.roll_number = formData.roll_number;
        payload.full_name = formData.full_name;
        payload.hostel_name = formData.hostel_name;
        payload.room_number = formData.room_number;
      } else {
        payload.full_name = formData.full_name;
        payload.employee_code = formData.employee_code;
      }

      console.log('Sending registration payload:', payload);
      
      const response = await axios.post('/api/auth/register/', payload);
      console.log('Registration response:', response.data);
      setStep(2); // Move to OTP verification
    } catch (err) {
      console.error('Registration error:', err.response?.data);
      const errorMessage = 
        err.response?.data?.email?.[0] ||
        err.response?.data?.phone?.[0] ||
        err.response?.data?.roll_number?.[0] ||
        err.response?.data?.employee_code?.[0] ||
        err.response?.data?.message ||
        err.response?.data?.detail ||
        err.response?.data?.error ||
        (typeof err.response?.data === 'string' ? err.response.data : null) ||
        'Registration failed. Please check your information and try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/auth/verify-otp/', {
        email: formData.email,
        otp: otp,
      });

      // Store tokens
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      localStorage.setItem('user_role', selectedRole);

      // Navigate based on role
      const roleRoutes = {
        student: '/dashboard',
        mess_manager: '/manager/mess',
        mess_worker: '/worker/scan',
        canteen_manager: '/manager/canteen',
        delivery_person: '/delivery',
      };

      navigate(roleRoutes[selectedRole] || '/dashboard');
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.detail ||
          'Invalid OTP. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (step === 2) {
    return (
      <form className="auth-form" onSubmit={handleVerifyOTP}>
        {error && <div className="error-message">{error}</div>}

        <div className="otp-info">
          <p className="otp-message">
            We've sent a 6-digit OTP to <strong>{formData.email}</strong>
          </p>
        </div>

        <div className="input-group">
          <label className="input-label">Enter OTP</label>
          <input
            type="text"
            className="input-field"
            placeholder="Enter 6-digit OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            maxLength={6}
            required
          />
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Verifying...' : 'Verify & Sign Up'}
        </button>

        <button
          type="button"
          className="btn-secondary"
          onClick={() => setStep(1)}
        >
          Back to Registration
        </button>
      </form>
    );
  }

  return (
    <form className="auth-form" onSubmit={handleRegister}>
      {error && <div className="error-message">{error}</div>}

      <div className="input-group">
        <label className="input-label">Full Name</label>
        <input
          type="text"
          name="full_name"
          className="input-field"
          placeholder="Enter your full name"
          value={formData.full_name}
          onChange={handleChange}
          required
        />
      </div>

      <div className="input-group">
        <label className="input-label">Email</label>
        <input
          type="email"
          name="email"
          className="input-field"
          placeholder={
            selectedRole === 'student'
              ? 'your.email@iitk.ac.in'
              : 'Enter your email'
          }
          value={formData.email}
          onChange={handleChange}
          required
        />
      </div>

      <div className="input-group">
        <label className="input-label">Phone</label>
        <input
          type="tel"
          name="phone"
          className="input-field"
          placeholder="Enter your phone number"
          value={formData.phone}
          onChange={handleChange}
          required
        />
      </div>

      {selectedRole === 'student' && (
        <>
          <div className="input-group">
            <label className="input-label">Roll Number</label>
            <input
              type="text"
              name="roll_number"
              className="input-field"
              placeholder="Enter your roll number"
              value={formData.roll_number}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label">Hostel / Hall</label>
            <select
              name="hostel_name"
              className="input-field"
              value={formData.hostel_name}
              onChange={handleChange}
            >
              <option value="">Select your hostel</option>
              {availableHalls.map((hall) => (
                <option key={hall} value={hall}>{hall}</option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label className="input-label">Room Number</label>
            <input
              type="text"
              name="room_number"
              className="input-field"
              placeholder="Enter your room number"
              value={formData.room_number}
              onChange={handleChange}
            />
          </div>
        </>
      )}

      <div className="input-group">
        <label className="input-label">Password</label>
        <div className="password-input-wrapper">
          <input
            type={showPassword ? 'text' : 'password'}
            name="password"
            className="input-field"
            placeholder="Create a password"
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

      <div className="input-group">
        <label className="input-label">Confirm Password</label>
        <div className="password-input-wrapper">
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            name="confirmPassword"
            className="input-field"
            placeholder="Confirm your password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />
          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
          >
            <EyeIcon isVisible={showConfirmPassword} />
          </button>
        </div>
      </div>

      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? 'Creating Account...' : 'Sign Up'}
      </button>
    </form>
  );
};

export default SignupForm;
