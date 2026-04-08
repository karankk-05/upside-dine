import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  getInlineValidationMessage,
  STANDARD_INPUT_PROPS,
  sanitizeEmail,
  sanitizeOtp,
  sanitizePassword,
} from '../../../lib/formValidation';
import './AuthPage.css';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Email, 2: OTP + New Password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [blurredFields, setBlurredFields] = useState({});

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

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const emailError = getInlineValidationMessage('email', email, { required: true });
    if (emailError) {
      setBlurredFields((current) => ({ ...current, email: true }));
      setError('Please correct the highlighted field.');
      setLoading(false);
      return;
    }

    try {
      await axios.post('/api/auth/forgot-password/', { email });
      setBlurredFields({});
      setStep(2);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.detail ||
          'Unable to send OTP. Please check your email.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const emailError = getInlineValidationMessage('email', email, { required: true });
    const otpFieldError = getInlineValidationMessage('otp', otp, { required: true });
    const passwordFieldError = getInlineValidationMessage('password', newPassword, {
      required: true,
    });
    const confirmPasswordError = !confirmPassword
      ? 'This field is required.'
      : newPassword === confirmPassword
      ? ''
      : 'Passwords do not match.';

    if (emailError || otpFieldError || passwordFieldError || confirmPasswordError) {
      setBlurredFields((current) => ({
        ...current,
        ...(emailError ? { email: true } : {}),
        ...(otpFieldError ? { otp: true } : {}),
        ...(passwordFieldError ? { newPassword: true } : {}),
        ...(confirmPasswordError ? { confirmPassword: true } : {}),
      }));
      setError('Please correct the highlighted fields.');
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      await axios.post('/api/auth/reset-password/', {
        email,
        otp,
        new_password: newPassword,
      });
      navigate('/auth');
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.detail ||
          'Unable to reset password. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const emailError = getInlineValidationMessage('email', email, { required: true });
  const otpFieldError = getInlineValidationMessage('otp', otp, { required: true });
  const passwordFieldError = getInlineValidationMessage('password', newPassword, {
    required: true,
  });
  const confirmPasswordError = !confirmPassword
    ? 'This field is required.'
    : newPassword === confirmPassword
    ? ''
    : 'Passwords do not match.';

  const shouldShowFieldMessage = (fieldName, message) =>
    Boolean(message) && blurredFields[fieldName];

  return (
    <div className="auth-container">
      <div className="auth-content">
        <div className="auth-logo-container">
          <img src="/logo.png" alt="Upside Dine" className="auth-logo" />
        </div>

        <h1 className="auth-title">Reset Password</h1>
        <p className="auth-subtitle">
          {step === 1 && 'Enter your email to receive OTP'}
          {step === 2 && 'Enter OTP and create new password'}
        </p>

        {error && <div className="error-message">{error}</div>}

        {step === 1 && (
          <form className="auth-form" onSubmit={handleRequestOTP} noValidate>
            <div className="input-group">
              <label className="input-label">
                <span className="input-label-row">
                  Email <strong className="input-label-required">*</strong>
                </span>
              </label>
              <input
                className={`input-field ${shouldShowFieldMessage('email', emailError) ? 'input-field--error' : ''}`}
                placeholder="Enter your email"
                value={email}
                onChange={(e) => {
                  setEmail(sanitizeEmail(e.target.value));
                  setError('');
                }}
                onBlur={() => setBlurredFields((current) => ({ ...current, email: true }))}
                {...STANDARD_INPUT_PROPS.email}
                required
              />
              {shouldShowFieldMessage('email', emailError) ? (
                <small className="input-helper-text input-helper-text--error">{emailError}</small>
              ) : null}
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>

            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate('/auth')}
            >
              Back to Sign In
            </button>
          </form>
        )}

        {step === 2 && (
          <form className="auth-form" onSubmit={handleResetPassword} noValidate>
            <div className="otp-info">
              <p className="otp-message">
                We've sent a 6-digit OTP to <strong>{email}</strong>
              </p>
            </div>

            <div className="input-group">
              <label className="input-label">
                <span className="input-label-row">
                  Enter OTP <strong className="input-label-required">*</strong>
                </span>
              </label>
              <input
                className={`input-field ${shouldShowFieldMessage('otp', otpFieldError) ? 'input-field--error' : ''}`}
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
              {shouldShowFieldMessage('otp', otpFieldError) ? (
                <small className="input-helper-text input-helper-text--error">{otpFieldError}</small>
              ) : null}
            </div>

            <div className="input-group">
              <label className="input-label">
                <span className="input-label-row">
                  New Password <strong className="input-label-required">*</strong>
                </span>
              </label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={`input-field ${shouldShowFieldMessage('newPassword', passwordFieldError) ? 'input-field--error' : ''}`}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(sanitizePassword(e.target.value));
                    setError('');
                  }}
                  onBlur={() => setBlurredFields((current) => ({ ...current, newPassword: true }))}
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
              {shouldShowFieldMessage('newPassword', passwordFieldError) ? (
                <small className="input-helper-text input-helper-text--error">{passwordFieldError}</small>
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
                  className={`input-field ${shouldShowFieldMessage('confirmPassword', confirmPasswordError) ? 'input-field--error' : ''}`}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(sanitizePassword(e.target.value));
                    setError('');
                  }}
                  onBlur={() => setBlurredFields((current) => ({ ...current, confirmPassword: true }))}
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
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>

            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setBlurredFields({});
                setStep(1);
              }}
            >
              Back
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
