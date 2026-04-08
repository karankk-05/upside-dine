import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  BedDouble,
  Building2,
  CheckCircle2,
  LogOut,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  Store,
  Truck,
  User,
  Users,
  UtensilsCrossed,
  Wallet,
} from 'lucide-react';
import api from '../lib/api';
import PullToRefresh from '../components/PullToRefresh';
import { getDefaultRouteForRole, logoutUser, setAuthSession } from '../lib/auth';
import { CURRENT_USER_QUERY_KEY, PUBLIC_HALLS_QUERY_KEY, useCurrentUser, usePublicHalls } from '../hooks/useCurrentUser';
import {
  getInlineValidationMessage,
  STANDARD_INPUT_PROPS,
  sanitizePersonName,
  sanitizePhone,
  sanitizeRoomNumber,
} from '../lib/formValidation';
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

const ROLE_COPY = {
  student: {
    subtitle: 'Update your account and dining details.',
    overviewTitle: 'Dining overview',
    overviewDescription: 'Live details from your current student account.',
  },
  mess_manager: {
    subtitle: 'Update your account details and review your mess assignment.',
    overviewTitle: 'Work overview',
    overviewDescription: 'Your manager account is currently linked to mess operations.',
  },
  mess_worker: {
    subtitle: 'Update your account details and review your worker assignment.',
    overviewTitle: 'Work overview',
    overviewDescription: 'Your worker account is linked to live scan and redemption operations.',
  },
  canteen_manager: {
    subtitle: 'Update your account details and review your assigned canteen.',
    overviewTitle: 'Work overview',
    overviewDescription: 'Your manager account is currently linked to canteen operations.',
  },
  delivery_person: {
    subtitle: 'Update your account details and review your delivery assignment.',
    overviewTitle: 'Work overview',
    overviewDescription: 'Your delivery account is linked to active pickup and drop tasks.',
  },
  admin_manager: {
    subtitle: 'Update your account details and review your admin access.',
    overviewTitle: 'Admin overview',
    overviewDescription: 'Your account has control over managers, messes, and canteens.',
  },
  superadmin: {
    subtitle: 'Update your account details and review your platform access.',
    overviewTitle: 'Admin overview',
    overviewDescription: 'Your account has full platform-level access.',
  },
};

const MESS_ACCOUNT_QUERY_KEY = ['current-user', 'mess-account'];

const toProfileForm = (user) => ({
  phone: user?.phone || '',
  full_name: user?.profile?.full_name || '',
  hostel_name: user?.profile?.hostel_name || '',
  room_number: user?.profile?.room_number || '',
});

const formatRole = (role) => ROLE_LABELS[role] || 'Account';
const formatAssignmentRole = (value) =>
  value === 'manager' ? 'Manager' : value === 'worker' ? 'Worker' : 'Team member';

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
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [blurredFields, setBlurredFields] = useState({});
  const [hasLocalEdits, setHasLocalEdits] = useState(false);
  const [hydratedUserId, setHydratedUserId] = useState(null);

  const { data: user, isLoading: isUserLoading, error: userLoadError } = useCurrentUser();
  const { data: availableHalls = [] } = usePublicHalls();
  const isStudent = user?.role === 'student';
  const { data: messAccount = null, isLoading: isMessAccountLoading } = useQuery({
    queryKey: MESS_ACCOUNT_QUERY_KEY,
    queryFn: async () => {
      const { data } = await api.get('/users/me/mess-account/');
      return data;
    },
    enabled: isStudent,
    retry: false,
  });

  const loadProfile = useCallback(async () => {
    const cachedUser = queryClient.getQueryData(CURRENT_USER_QUERY_KEY);
    const nextRole = user?.role || cachedUser?.role;
    const refreshTasks = [
      queryClient.invalidateQueries({ queryKey: CURRENT_USER_QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: PUBLIC_HALLS_QUERY_KEY }),
    ];

    if (nextRole === 'student') {
      refreshTasks.push(queryClient.invalidateQueries({ queryKey: MESS_ACCOUNT_QUERY_KEY }));
    }

    await Promise.all(refreshTasks);
  }, [queryClient, user?.role]);

  useEffect(() => {
    if (user?.role) {
      setAuthSession({ role: user.role });
    }
  }, [user?.role]);

  useEffect(() => {
    if (!user) {
      return;
    }

    if (hydratedUserId !== user.id || !hasLocalEdits) {
      setFormData(toProfileForm(user));
      setHydratedUserId(user.id);
    }
  }, [user, hydratedUserId, hasLocalEdits]);

  const roleCopy = ROLE_COPY[user?.role] || {
    subtitle: 'Update your account details.',
    overviewTitle: 'Account overview',
    overviewDescription: 'Live details from your current account.',
  };
  const activeMessAssignments = Array.isArray(user?.profile?.active_mess_assignments)
    ? user.profile.active_mess_assignments
    : [];
  const primaryMessAssignment = activeMessAssignments[0] || null;
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

  const overviewCards = useMemo(() => {
    if (isStudent) {
      return [
        {
          key: 'balance',
          icon: <Wallet size={16} />,
          label: 'Mess account balance',
          value: messAccount ? formatCurrency(messAccount.balance) : 'Unavailable',
          note: `Last updated ${
            messAccount ? formatDateTime(messAccount.last_updated) : 'Not available'
          }`,
        },
        {
          key: 'hall',
          icon: <Building2 size={16} />,
          label: 'Assigned dining hall',
          value: formData.hostel_name || 'Not selected',
          note: formData.room_number
            ? `Room ${formData.room_number}`
            : 'Select your hall to keep mess suggestions accurate.',
        },
      ];
    }

    if (user?.role === 'mess_manager' || user?.role === 'mess_worker') {
      return [
        {
          key: 'access',
          icon: <ShieldCheck size={16} />,
          label: 'Access type',
          value: user.role === 'mess_manager' ? 'Mess management' : 'Mess operations',
          note: primaryMessAssignment
            ? `Assigned as ${formatAssignmentRole(primaryMessAssignment.assignment_role)}`
            : 'Your role permissions are active on supported mess screens.',
        },
        {
          key: 'assignment',
          icon: <UtensilsCrossed size={16} />,
          label: 'Assigned mess',
          value: primaryMessAssignment?.mess_name || 'Not assigned',
          note: primaryMessAssignment?.hall_name
            ? `Hall: ${primaryMessAssignment.hall_name}`
            : 'Connect with an admin manager to link a mess.',
        },
      ];
    }

    if (user?.role === 'canteen_manager') {
      return [
        {
          key: 'access',
          icon: <Store size={16} />,
          label: 'Access type',
          value: 'Canteen management',
          note: 'Manage menu, orders, delivery staff, and payment settings.',
        },
        {
          key: 'assignment',
          icon: <MapPin size={16} />,
          label: 'Assigned canteen',
          value: user?.profile?.canteen_name || 'Not assigned',
          note:
            user?.profile?.canteen_location || 'Connect with an admin manager to link a canteen.',
        },
      ];
    }

    if (user?.role === 'delivery_person') {
      return [
        {
          key: 'access',
          icon: <Truck size={16} />,
          label: 'Access type',
          value: 'Delivery operations',
          note: 'Accept deliveries, verify OTPs, and complete student orders.',
        },
        {
          key: 'assignment',
          icon: <Store size={16} />,
          label: 'Pickup canteen',
          value: user?.profile?.canteen_name || 'Not assigned',
          note:
            user?.profile?.canteen_location || 'Connect with a canteen manager to link a base.',
        },
      ];
    }

    if (user?.role === 'admin_manager' || user?.role === 'superadmin') {
      return [
        {
          key: 'access',
          icon: <ShieldCheck size={16} />,
          label: 'Access type',
          value: user?.role === 'superadmin' ? 'Super admin control' : 'Admin control panel',
          note:
            user?.role === 'superadmin'
              ? 'Your account has full platform-level privileges.'
              : 'Your account can manage managers, messes, and canteens.',
        },
        {
          key: 'scope',
          icon: <Users size={16} />,
          label: 'Operational scope',
          value:
            user?.role === 'superadmin'
              ? 'Platform administration'
              : 'Campus administration',
          note: 'Use your dashboard to maintain operational accounts and outlets.',
        },
      ];
    }

    return [];
  }, [formData.hostel_name, formData.room_number, isStudent, messAccount, primaryMessAssignment, user]);

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
    const nextValueByField = {
      full_name: sanitizePersonName(value),
      phone: sanitizePhone(value),
      room_number: sanitizeRoomNumber(value),
    };

    setFormData((current) => ({
      ...current,
      [name]: nextValueByField[name] ?? value,
    }));
    setHasLocalEdits(true);
    setSuccessMessage('');
    setError('');
  };

  const handleBlur = (event) => {
    const { name } = event.target;
    setBlurredFields((current) => ({ ...current, [name]: true }));
  };

  const fullNameError = getInlineValidationMessage('personName', formData.full_name, {
    required: true,
  });
  const phoneError = getInlineValidationMessage('phone', formData.phone);
  const roomNumberError = getInlineValidationMessage('roomNumber', formData.room_number);

  const shouldShowFieldMessage = (fieldName, message) =>
    Boolean(message) && blurredFields[fieldName];

  const handleSave = async (event) => {
    event.preventDefault();
    if (!user) {
      return;
    }

    if (fullNameError || phoneError || roomNumberError) {
      setBlurredFields((current) => ({
        ...current,
        ...(fullNameError ? { full_name: true } : {}),
        ...(phoneError ? { phone: true } : {}),
        ...(roomNumberError ? { room_number: true } : {}),
      }));
      setError('Please correct the highlighted fields before saving.');
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
      queryClient.setQueryData(CURRENT_USER_QUERY_KEY, response.data);
      setFormData(toProfileForm(response.data));
      setHasLocalEdits(false);
      setHydratedUserId(response.data.id);
      setBlurredFields({});
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

  const heroTitle = user?.profile?.full_name || user?.email?.split('@')[0] || 'Account';
  const initials = heroTitle
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return (
    <PullToRefresh onRefresh={loadProfile}>
      <div className="profile-page-shell">
        <div className="profile-page-frame">
        <div className="profile-page-header">
          <button className="profile-icon-button" onClick={() => navigate(getDefaultRouteForRole())}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1>Profile & Settings</h1>
            <p>{user ? roleCopy.subtitle : 'Your account settings will appear here.'}</p>
          </div>
        </div>

        <div className="profile-hero-card">
          <div className="profile-avatar">{user ? initials || 'UD' : '··'}</div>
          <div className="profile-hero-copy">
            {user ? (
              <>
                <h2>{heroTitle}</h2>
                <p>{user?.email}</p>
                <div className="profile-role-pill">{formatRole(user?.role)}</div>
              </>
            ) : (
              <>
                <div className="ui-skeleton ui-skeleton-text" style={{ width: '48%', height: 24, marginBottom: 10 }} />
                <div className="ui-skeleton ui-skeleton-text" style={{ width: '72%', height: 14, marginBottom: 12 }} />
                <div className="ui-skeleton ui-skeleton-text" style={{ width: 118, height: 30, borderRadius: 999 }} />
              </>
            )}
          </div>
        </div>

        {error || userLoadError ? (
          <div className="profile-banner profile-banner-error">
            {error ||
              userLoadError?.response?.data?.detail ||
              'We could not load your profile right now. Please try again.'}
          </div>
        ) : null}
        {successMessage ? <div className="profile-banner profile-banner-success">{successMessage}</div> : null}

        <div className="profile-summary-grid">
          {user
            ? readOnlyMeta.map((item) => (
                <div className="profile-summary-card" key={item.label}>
                  <span className="profile-summary-icon">{item.icon}</span>
                  <div>
                    <p>{item.label}</p>
                    <strong>{item.value}</strong>
                  </div>
                </div>
              ))
            : Array.from({ length: 4 }).map((_, index) => (
                <div className="profile-summary-card" key={`summary-skeleton-${index}`}>
                  <span className="profile-summary-icon ui-skeleton ui-skeleton-circle" />
                  <div style={{ flex: 1 }}>
                    <div className="ui-skeleton ui-skeleton-text" style={{ width: '38%', height: 12, marginBottom: 10 }} />
                    <div className="ui-skeleton ui-skeleton-text" style={{ width: '74%', height: 16 }} />
                  </div>
                </div>
              ))}
        </div>

        <form className="profile-section-card" onSubmit={handleSave} noValidate>
          <div className="profile-section-heading">
            <div>
              <h3>Personal details</h3>
              <p>These details are used across your account.</p>
            </div>
          </div>

          {user ? (
            <div className="profile-form-grid">
              <label className="profile-field">
                <span className="profile-label-row">
                  Full name <strong className="profile-required-indicator">*</strong>
                </span>
                <input
                  className={shouldShowFieldMessage('full_name', fullNameError) ? 'profile-field-control profile-field-control--error' : 'profile-field-control'}
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Enter your full name"
                  {...STANDARD_INPUT_PROPS.personName}
                  required
                />
                {shouldShowFieldMessage('full_name', fullNameError) ? (
                  <small className="profile-field-note profile-field-note-error">{fullNameError}</small>
                ) : null}
              </label>

              <label className="profile-field">
                <span>Phone number</span>
                <div className="profile-input-with-icon">
                  <Phone size={16} />
                  <input
                    className={shouldShowFieldMessage('phone', phoneError) ? 'profile-field-control profile-field-control--error' : 'profile-field-control'}
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Enter your phone number"
                    {...STANDARD_INPUT_PROPS.phone}
                  />
                </div>
                {shouldShowFieldMessage('phone', phoneError) ? (
                  <small className="profile-field-note profile-field-note-error">{phoneError}</small>
                ) : null}
              </label>
            </div>
          ) : (
            <div className="profile-form-grid">
              {Array.from({ length: 2 }).map((_, index) => (
                <div className="profile-field" key={`profile-field-skeleton-${index}`}>
                  <div className="ui-skeleton ui-skeleton-text" style={{ width: '32%', height: 12 }} />
                  <div className="ui-skeleton ui-skeleton-card" style={{ width: '100%', height: 48, borderRadius: 14 }} />
                </div>
              ))}
            </div>
          )}

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
                      className={shouldShowFieldMessage('room_number', roomNumberError) ? 'profile-field-control profile-field-control--error' : 'profile-field-control'}
                      name="room_number"
                      value={formData.room_number}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="Enter your room number"
                      {...STANDARD_INPUT_PROPS.roomNumber}
                    />
                  </div>
                  {shouldShowFieldMessage('room_number', roomNumberError) ? (
                    <small className="profile-field-note profile-field-note-error">{roomNumberError}</small>
                  ) : null}
                </label>
              </div>
            </>
          ) : null}

          <div className="profile-actions">
            <button className="profile-save-button" type="submit" disabled={!user || saving || !hasChanges}>
              <Save size={18} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>

        {overviewCards.length > 0 ? (
          <div className="profile-section-card">
            <div className="profile-section-heading">
              <div>
                <h3>{roleCopy.overviewTitle}</h3>
                <p>{roleCopy.overviewDescription}</p>
              </div>
            </div>

            <div className="profile-dining-grid">
              {overviewCards.map((card) => (
                <div className="profile-dining-card" key={card.key}>
                  <span className="profile-summary-icon">{card.icon}</span>
                  <p>{card.label}</p>
                  <strong>{card.value}</strong>
                  {card.note ? <small>{card.note}</small> : null}
                </div>
              ))}
            </div>
          </div>
        ) : isUserLoading ? (
          <div className="profile-section-card">
            <div className="profile-section-heading">
              <div>
                <div className="ui-skeleton ui-skeleton-text" style={{ width: '36%', height: 18, marginBottom: 8 }} />
                <div className="ui-skeleton ui-skeleton-text" style={{ width: '72%', height: 12 }} />
              </div>
            </div>

            <div className="profile-dining-grid">
              {Array.from({ length: 2 }).map((_, index) => (
                <div className="profile-dining-card" key={`profile-overview-skeleton-${index}`}>
                  <span className="profile-summary-icon ui-skeleton ui-skeleton-circle" />
                  <div className="ui-skeleton ui-skeleton-text" style={{ width: '42%', height: 12, marginBottom: 8 }} />
                  <div className="ui-skeleton ui-skeleton-text" style={{ width: '68%', height: 18, marginBottom: 10 }} />
                  <div className="ui-skeleton ui-skeleton-text" style={{ width: '82%', height: 12 }} />
                </div>
              ))}
            </div>
          </div>
        ) : null}

          <button className="profile-logout-button" onClick={handleLogout}>
            <LogOut size={18} />
            Log Out
          </button>
        </div>
      </div>
    </PullToRefresh>
  );
};

export default ProfilePage;
