import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BedDouble,
  Building2,
  CheckCircle2,
  LogOut,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  User,
  Wallet,
} from 'lucide-react';
import api from '../lib/api';
import { getDefaultRouteForRole, logoutUser, setAuthSession } from '../lib/auth';
import './ProfilePage.css';

const EMPTY_FORM = {
  phone: '',
  full_name: '',
  hostel_name: '',
  room_number: '',
};

const ROLE_LABELS = {
  student: 'Student',
  mess_manager: 'Mess Manager',
  mess_worker: 'Mess Worker',
  canteen_manager: 'Canteen Manager',
  delivery_person: 'Delivery Person',
  admin_manager: 'Admin Manager',
  superadmin: 'Super Admin',
};

const toProfileForm = (user) => ({
  phone: user?.phone || '',
  full_name: user?.profile?.full_name || '',
  hostel_name: user?.profile?.hostel_name || '',
  room_number: user?.profile?.room_number || '',
});

const formatRole = (role) => ROLE_LABELS[role] || 'Account';

const formatDateTime = (value) => {
  if (!value) {
    return 'Not available';
  }

  return new Date(value).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

const formatCurrency = (value) => {
  const amount = Number(value || 0);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
};

const ProfilePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [availableHalls, setAvailableHalls] = useState([]);
  const [messAccount, setMessAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      setLoading(true);
      setError('');

      try {
        const [userResponse, hallsResponse] = await Promise.all([
          api.get('/users/me/'),
          api.get('/public/halls/'),
        ]);

        const nextUser = userResponse.data;
        let nextMessAccount = null;

        if (nextUser.role === 'student') {
          try {
            const messAccountResponse = await api.get('/users/me/mess-account/');
            nextMessAccount = messAccountResponse.data;
          } catch (accountError) {
            if (accountError.response?.status !== 404) {
              throw accountError;
            }
          }
        }

        if (cancelled) {
          return;
        }

        setUser(nextUser);
        setFormData(toProfileForm(nextUser));
        setAvailableHalls(Array.isArray(hallsResponse.data) ? hallsResponse.data : []);
        setMessAccount(nextMessAccount);
        setAuthSession({ role: nextUser.role });
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError.response?.data?.detail ||
              'We could not load your profile right now. Please try again.'
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  const isStudent = user?.role === 'student';
  const isStaff = Boolean(user?.profile && !isStudent);
  const readOnlyMeta = useMemo(
    () => [
      { label: 'Email', value: user?.email || 'Not available', icon: <Mail size={16} /> },
      {
        label: 'Role',
        value: formatRole(user?.role),
        icon: <ShieldCheck size={16} />,
      },
      {
        label: isStudent ? 'Roll Number' : 'Employee Code',
        value: isStudent ? user?.profile?.roll_number || 'Not assigned' : user?.profile?.employee_code || 'Not assigned',
        icon: <User size={16} />,
      },
      {
        label: 'Joined',
        value: formatDateTime(user?.date_joined),
        icon: <CheckCircle2 size={16} />,
      },
    ],
    [isStudent, user]
  );

  const initialForm = useMemo(() => toProfileForm(user), [user]);
  const hasChanges = useMemo(
    () => JSON.stringify(formData) !== JSON.stringify(initialForm),
    [formData, initialForm]
  );

  const availableHallOptions = useMemo(() => {
    const halls = [...availableHalls];
    if (formData.hostel_name && !halls.includes(formData.hostel_name)) {
      halls.unshift(formData.hostel_name);
    }
    return halls;
  }, [availableHalls, formData.hostel_name]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
    setSuccessMessage('');
    setError('');
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!user) {
      return;
    }

    setSaving(true);
    setError('');
    setSuccessMessage('');

    const payload = {
      phone: formData.phone.trim(),
      full_name: formData.full_name.trim(),
    };

    if (isStudent) {
      payload.hostel_name = formData.hostel_name;
      payload.room_number = formData.room_number.trim();
    }

    try {
      const response = await api.patch('/users/me/', payload);
      setUser(response.data);
      setFormData(toProfileForm(response.data));
      setSuccessMessage('Your profile settings have been saved.');
    } catch (saveError) {
      const firstFieldError = Object.values(saveError.response?.data || {}).find((value) =>
        Array.isArray(value)
      );
      setError(
        firstFieldError?.[0] ||
          saveError.response?.data?.detail ||
          'We could not save your changes. Please review the form and try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    if (!window.confirm('Do you want to logout?')) {
      return;
    }

    await logoutUser();
    navigate('/auth');
  };

  if (loading) {
    return (
      <div className="profile-page-shell">
        <div className="profile-page-card profile-loading-card">
          <div className="profile-loading-spinner" />
          <p>Loading your profile...</p>
        </div>
      </div>
    );
  }

  const heroTitle = user?.profile?.full_name || user?.email?.split('@')[0] || 'Account';
  const initials = heroTitle
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return (
    <div className="profile-page-shell">
      <div className="profile-page-frame">
        <div className="profile-page-header">
          <button className="profile-icon-button" onClick={() => navigate(getDefaultRouteForRole())}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1>Profile & Settings</h1>
            <p>Update your account and dining details.</p>
          </div>
        </div>

        <div className="profile-hero-card">
          <div className="profile-avatar">{initials || 'UD'}</div>
          <div className="profile-hero-copy">
            <h2>{heroTitle}</h2>
            <p>{user?.email}</p>
            <div className="profile-role-pill">{formatRole(user?.role)}</div>
          </div>
        </div>

        {error ? <div className="profile-banner profile-banner-error">{error}</div> : null}
        {successMessage ? <div className="profile-banner profile-banner-success">{successMessage}</div> : null}

        <div className="profile-summary-grid">
          {readOnlyMeta.map((item) => (
            <div className="profile-summary-card" key={item.label}>
              <span className="profile-summary-icon">{item.icon}</span>
              <div>
                <p>{item.label}</p>
                <strong>{item.value}</strong>
              </div>
            </div>
          ))}
        </div>

        <form className="profile-section-card" onSubmit={handleSave}>
          <div className="profile-section-heading">
            <div>
              <h3>Personal details</h3>
              <p>These details are used across your account.</p>
            </div>
          </div>

          <div className="profile-form-grid">
            <label className="profile-field">
              <span>Full name</span>
              <input
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="Enter your full name"
                required
              />
            </label>

            <label className="profile-field">
              <span>Phone number</span>
              <div className="profile-input-with-icon">
                <Phone size={16} />
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter your phone number"
                />
              </div>
            </label>
          </div>

          {isStudent ? (
            <>
              <div className="profile-section-heading profile-section-subheading">
                <div>
                  <h3>Dining settings</h3>
                  <p>Your hostel decides the mess shown across the app.</p>
                </div>
              </div>

              <div className="profile-form-grid">
                <label className="profile-field">
                  <span>Hostel / Hall</span>
                  <div className="profile-input-with-icon">
                    <Building2 size={16} />
                    <select name="hostel_name" value={formData.hostel_name} onChange={handleChange}>
                      <option value="">Select your hostel</option>
                      {availableHallOptions.map((hall) => (
                        <option key={hall} value={hall}>
                          {hall}
                        </option>
                      ))}
                    </select>
                  </div>
                </label>

                <label className="profile-field">
                  <span>Room number</span>
                  <div className="profile-input-with-icon">
                    <BedDouble size={16} />
                    <input
                      name="room_number"
                      value={formData.room_number}
                      onChange={handleChange}
                      placeholder="Enter your room number"
                    />
                  </div>
                </label>
              </div>
            </>
          ) : null}

          <div className="profile-actions">
            <button className="profile-save-button" type="submit" disabled={saving || !hasChanges}>
              <Save size={18} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>

        {isStudent ? (
          <div className="profile-section-card">
            <div className="profile-section-heading">
              <div>
                <h3>Dining overview</h3>
                <p>Live details from your current student account.</p>
              </div>
            </div>

            <div className="profile-dining-grid">
              <div className="profile-dining-card">
                <span className="profile-summary-icon">
                  <Wallet size={16} />
                </span>
                <p>Mess account balance</p>
                <strong>{messAccount ? formatCurrency(messAccount.balance) : 'Unavailable'}</strong>
                <small>
                  Last updated {messAccount ? formatDateTime(messAccount.last_updated) : 'Not available'}
                </small>
              </div>

              <div className="profile-dining-card">
                <span className="profile-summary-icon">
                  <Building2 size={16} />
                </span>
                <p>Assigned dining hall</p>
                <strong>{formData.hostel_name || 'Not selected'}</strong>
              </div>
            </div>
          </div>
        ) : null}

        {isStaff ? (
          <div className="profile-section-card">
            <div className="profile-section-heading">
              <div>
                <h3>Work profile</h3>
                <p>Your operational details remain linked to your current staff role.</p>
              </div>
            </div>

            <div className="profile-dining-card">
              <span className="profile-summary-icon">
                <ShieldCheck size={16} />
              </span>
              <p>Access type</p>
              <strong>{user?.profile?.is_mess_staff ? 'Mess operations' : 'Canteen operations'}</strong>
              <small>{user?.profile?.canteen ? `Assigned canteen ID: ${user.profile.canteen}` : 'No canteen linked'}</small>
            </div>
          </div>
        ) : null}

        <button className="profile-logout-button" onClick={handleLogout}>
          <LogOut size={18} />
          Log Out
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;
