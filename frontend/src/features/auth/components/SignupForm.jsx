import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import {
  getInlineValidationMessage,
  STANDARD_INPUT_PROPS,
  sanitizeEmail,
  sanitizeOtp,
  sanitizePassword,
  sanitizePersonName,
  sanitizePhone,
  sanitizeRollNumber,
  sanitizeRoomNumber,
} from '../../../lib/formValidation';

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
  const [searchParams, setSearchParams] = useSearchParams();
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
  const [blurredFields, setBlurredFields] = useState({});
  const step = searchParams.get('step') === 'verify' ? 2 : 1;

  // Fetch available halls for student registration
  useEffect(() => {
    if (selectedRole === 'student') {
      const fetchHalls = async () => {
        try {
          const response = await axios.get('/api/public/halls/');
          // response.data is an array of strings e.g. ["Hall 1", "Hall 2"]
          setAvailableHalls(response.data);
        } catch (err) {
          console.error("Halls currently not available", err);
        }
      };
      fetchHalls();
    }
  }, [selectedRole]);

  useEffect(() => {
    if (step === 2 && !formData.email) {
      setSearchParams({ mode: 'signup' }, { replace: true });
    }
  }, [formData.email, setSearchParams, step]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const nextValueByField = {
      email: sanitizeEmail(value),
      password: sanitizePassword(value),
      confirmPassword: sanitizePassword(value),
      phone: sanitizePhone(value),
      full_name: sanitizePersonName(value),
      roll_number: sanitizeRollNumber(value),
      room_number: sanitizeRoomNumber(value),
    };

    setFormData({
      ...formData,
      [name]: nextValueByField[name] ?? value,
    });
    setError('');
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setBlurredFields((current) => ({ ...current, [name]: true }));
  };

  const fullNameError = getInlineValidationMessage('personName', formData.full_name, {
    required: true,
  });
  const emailError = getInlineValidationMessage('email', formData.email, { required: true });
  const phoneError = getInlineValidationMessage('phone', formData.phone, { required: true });
  const rollNumberError =
    selectedRole === 'student'
      ? getInlineValidationMessage('rollNumber', formData.roll_number, { required: true })
      : '';
  const passwordError = getInlineValidationMessage('password', formData.password, {
    required: true,
  });
  const confirmPasswordError = !formData.confirmPassword
    ? 'This field is required.'
    : formData.password === formData.confirmPassword
    ? ''
    : 'Passwords do not match.';
  const otpError = getInlineValidationMessage('otp', otp, { required: true });

  const shouldShowFieldMessage = (fieldName, message) =>
    Boolean(message) && blurredFields[fieldName];

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const fieldErrors = [
      fullNameError,
      emailError,
      phoneError,
      rollNumberError,
      passwordError,
      confirmPasswordError,
    ].filter(Boolean);

    if (fieldErrors.length > 0) {
      setBlurredFields((current) => ({
        ...current,
        ...(fullNameError ? { full_name: true } : {}),
        ...(emailError ? { email: true } : {}),
        ...(phoneError ? { phone: true } : {}),
        ...(rollNumberError ? { roll_number: true } : {}),
        ...(passwordError ? { password: true } : {}),
        ...(confirmPasswordError ? { confirmPassword: true } : {}),
      }));
      setError('Please correct the highlighted fields before continuing.');
      setLoading(false);
      return;
    }

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
      setBlurredFields({});
      setSearchParams({ mode: 'signup', step: 'verify' });
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

    if (otpError) {
      setBlurredFields((current) => ({ ...current, otp: true }));
      setError('Please enter the OTP correctly.');
      setLoading(false);
      return;
    }

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
        student: '/crowd',
        mess_manager: '/manager/crowd',
        mess_worker: '/worker/scan',
        canteen_manager: '/manager/canteen',
        delivery_person: '/delivery',
      };

      const normalizedRole = typeof selectedRole === 'string' ? selectedRole.toLowerCase().replace(/\s+/g, '_') : 'student';
      navigate(roleRoutes[normalizedRole] || '/dashboard');
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
      <form className="auth-form" onSubmit={handleVerifyOTP} noValidate>
        {error && <div className="error-message">{error}</div>}

        <div className="otp-info">
          <p className="otp-message">
            We've sent a 6-digit OTP to <strong>{formData.email}</strong>
          </p>
        </div>

        <div className="input-group">
          <label className="input-label">
            <span className="input-label-row">
              Enter OTP <strong className="input-label-required">*</strong>
            </span>
          </label>
          <input
            className={`input-field ${shouldShowFieldMessage('otp', otpError) ? 'input-field--error' : ''}`}
            placeholder="Enter 6-digit OTP"
            value={otp}
            onChange={(e) => {
              setOtp(sanitizeOtp(e.target.value));
              setError('');
            }}
            onBlur={() => setBlurredFields((current) => ({ ...current, otp: true }))}
            {...STANDARD_INPUT_PROPS.otp}
            required
          />
          {shouldShowFieldMessage('otp', otpError) ? (
            <small className="input-helper-text input-helper-text--error">{otpError}</small>
          ) : null}
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Verifying...' : 'Verify & Sign Up'}
        </button>

        <button
          type="button"
          className="btn-secondary"
          onClick={() => {
            setBlurredFields({});
            setSearchParams({ mode: 'signup' });
          }}
        >
          Back to Registration
        </button>
      </form>
    );
  }

  return (
    <form className="auth-form" onSubmit={handleRegister} noValidate>
      {error && <div className="error-message">{error}</div>}

      <div className="input-group">
        <label className="input-label">
          <span className="input-label-row">
            Full Name <strong className="input-label-required">*</strong>
          </span>
        </label>
        <input
          name="full_name"
          className={`input-field ${shouldShowFieldMessage('full_name', fullNameError) ? 'input-field--error' : ''}`}
          placeholder="Enter your full name"
          value={formData.full_name}
          onChange={handleChange}
          onBlur={handleBlur}
          {...STANDARD_INPUT_PROPS.personName}
          required
        />
        {shouldShowFieldMessage('full_name', fullNameError) ? (
          <small className="input-helper-text input-helper-text--error">{fullNameError}</small>
        ) : null}
      </div>

      <div className="input-group">
        <label className="input-label">
          <span className="input-label-row">
            Email <strong className="input-label-required">*</strong>
          </span>
        </label>
        <input
          name="email"
          className={`input-field ${shouldShowFieldMessage('email', emailError) ? 'input-field--error' : ''}`}
          placeholder={
            selectedRole === 'student'
              ? 'your.email@iitk.ac.in'
              : 'Enter your email'
          }
          value={formData.email}
          onChange={handleChange}
          onBlur={handleBlur}
          {...STANDARD_INPUT_PROPS.email}
          required
        />
        {shouldShowFieldMessage('email', emailError) ? (
          <small className="input-helper-text input-helper-text--error">{emailError}</small>
        ) : null}
      </div>

      <div className="input-group">
        <label className="input-label">
          <span className="input-label-row">
            Phone <strong className="input-label-required">*</strong>
          </span>
        </label>
        <input
          name="phone"
          className={`input-field ${shouldShowFieldMessage('phone', phoneError) ? 'input-field--error' : ''}`}
          placeholder="Enter your phone number"
          value={formData.phone}
          onChange={handleChange}
          onBlur={handleBlur}
          {...STANDARD_INPUT_PROPS.phone}
          required
        />
        {shouldShowFieldMessage('phone', phoneError) ? (
          <small className="input-helper-text input-helper-text--error">{phoneError}</small>
        ) : null}
      </div>

      {selectedRole === 'student' && (
        <>
          <div className="input-group">
            <label className="input-label">
              <span className="input-label-row">
                Roll Number <strong className="input-label-required">*</strong>
              </span>
            </label>
            <input
              name="roll_number"
              className={`input-field ${shouldShowFieldMessage('roll_number', rollNumberError) ? 'input-field--error' : ''}`}
              placeholder="Enter your roll number"
              value={formData.roll_number}
              onChange={handleChange}
              onBlur={handleBlur}
              {...STANDARD_INPUT_PROPS.rollNumber}
              required
            />
            {shouldShowFieldMessage('roll_number', rollNumberError) ? (
              <small className="input-helper-text input-helper-text--error">{rollNumberError}</small>
            ) : null}
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
              name="room_number"
              className="input-field"
              placeholder="Enter your room number"
              value={formData.room_number}
              onChange={handleChange}
              {...STANDARD_INPUT_PROPS.roomNumber}
            />
          </div>
        </>
      )}

      <div className="input-group">
        <label className="input-label">
          <span className="input-label-row">
            Password <strong className="input-label-required">*</strong>
          </span>
        </label>
        <div className="password-input-wrapper">
          <input
            type={showPassword ? 'text' : 'password'}
            name="password"
            className={`input-field ${shouldShowFieldMessage('password', passwordError) ? 'input-field--error' : ''}`}
            placeholder="Create a password"
            value={formData.password}
            onChange={handleChange}
            onBlur={handleBlur}
            {...STANDARD_INPUT_PROPS.password}
            autoComplete="new-password"
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
        {shouldShowFieldMessage('password', passwordError) ? (
          <small className="input-helper-text input-helper-text--error">{passwordError}</small>
        ) : null}
      </div>

      <div className="input-group">
        <label className="input-label">
          <span className="input-label-row">
            Confirm Password <strong className="input-label-required">*</strong>
          </span>
        </label>
        <div className="password-input-wrapper">
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            name="confirmPassword"
            className={`input-field ${shouldShowFieldMessage('confirmPassword', confirmPasswordError) ? 'input-field--error' : ''}`}
            placeholder="Confirm your password"
            value={formData.confirmPassword}
            onChange={handleChange}
            onBlur={handleBlur}
            {...STANDARD_INPUT_PROPS.password}
            autoComplete="new-password"
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
        {shouldShowFieldMessage('confirmPassword', confirmPasswordError) ? (
          <small className="input-helper-text input-helper-text--error">{confirmPasswordError}</small>
        ) : null}
      </div>

      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? 'Creating Account...' : 'Sign Up'}
      </button>
    </form>
  );
};

export default SignupForm;
