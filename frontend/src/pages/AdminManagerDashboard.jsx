import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  LogOut,
  Plus,
  ShieldCheck,
  Store,
  Trash2,
  UserCog,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import { logoutUser } from '../lib/auth';
import {
  STANDARD_INPUT_PROPS,
  sanitizeEmail,
  sanitizeEntityName,
  sanitizeLocationText,
  sanitizePersonName,
  sanitizePhone,
} from '../lib/formValidation';
import './AdminManagerDashboard.css';

const TAB_ITEMS = [
  { id: 'managers', label: 'Managers', icon: UserCog },
  { id: 'messes', label: 'Messes', icon: UtensilsCrossed },
  { id: 'canteens', label: 'Canteens', icon: Store },
];

const TAB_META = {
  managers: {
    title: 'Managers',
    description: 'Create accounts and control who can access operations.',
    addLabel: 'Add Manager',
    closeLabel: 'Close Form',
    emptyTitle: 'No managers found',
    emptyDescription: 'Create a manager account to get started.',
    loadingText: 'Loading managers...',
  },
  messes: {
    title: 'Messes',
    description: 'Add halls and manage which messes stay active.',
    addLabel: 'Add Mess',
    closeLabel: 'Close Form',
    emptyTitle: 'No messes found',
    emptyDescription: 'Create a mess to start assigning operations.',
    loadingText: 'Loading messes...',
  },
  canteens: {
    title: 'Canteens',
    description: 'Add outlets and manage their availability.',
    addLabel: 'Add Canteen',
    closeLabel: 'Close Form',
    emptyTitle: 'No canteens found',
    emptyDescription: 'Create a canteen to make it available in the app.',
    loadingText: 'Loading canteens...',
  },
};

const formatRoleLabel = (value) => {
  if (value === 'mess_manager') return 'Mess Manager';
  if (value === 'canteen_manager') return 'Canteen Manager';
  if (value === 'admin_manager') return 'Admin Manager';
  return value ? value.replace(/_/g, ' ') : 'Unknown';
};

const getInactiveLabel = (type) => (type === 'managers' ? 'Frozen' : 'Inactive');

const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token');
  return { Authorization: `Bearer ${token}` };
};

const EmptyState = ({ title, description }) => (
  <div className="admin-empty-state">
    <div className="admin-empty-state__icon">⌁</div>
    <h3>{title}</h3>
    <p>{description}</p>
  </div>
);

const StatusBadge = ({ isActive, type }) => (
  <span
    className={`admin-status-badge ${
      isActive ? 'admin-status-badge--active' : 'admin-status-badge--inactive'
    }`}
  >
    {isActive ? 'Active' : getInactiveLabel(type)}
  </span>
);

const CompactEntityCard = ({ title, subtitle, isActive, onClick }) => (
  <button type="button" className="admin-mini-card" onClick={onClick}>
    <span
      className={`admin-status-dot ${
        isActive ? 'admin-status-dot--active' : 'admin-status-dot--inactive'
      }`}
      aria-hidden="true"
    />
    <strong>{title}</strong>
    <span>{subtitle}</span>
  </button>
);

const DetailSheet = ({
  entity,
  onClose,
  onToggleManager,
  onToggleMess,
  onToggleCanteen,
  onDeleteMess,
  onDeleteCanteen,
}) => {
  if (!entity) {
    return null;
  }

  const { type, item } = entity;

  let eyebrow = '';
  let title = '';
  let subtitle = '';
  let details = [];
  let primaryAction = null;
  let secondaryAction = null;

  if (type === 'managers') {
    eyebrow = 'Manager';
    title = item.full_name;
    subtitle = formatRoleLabel(item.role_name);
    details = [
      { label: 'Email', value: item.email },
      { label: 'Phone', value: item.phone || 'Not set' },
      { label: 'Role', value: formatRoleLabel(item.role_name) },
      { label: 'Employee Code', value: item.employee_code || 'Not assigned' },
    ];
    primaryAction = {
      label: item.is_active ? 'Freeze Manager' : 'Activate Manager',
      className: item.is_active
        ? 'admin-action-button admin-action-button--danger'
        : 'admin-action-button admin-action-button--success',
      onClick: () => onToggleManager(item.id, item.is_active),
      icon: ShieldCheck,
    };
  }

  if (type === 'messes') {
    eyebrow = 'Mess';
    title = item.name;
    subtitle = item.hall_display || 'Hall not set';
    details = [
      { label: 'Hall', value: item.hall_display || 'Not set' },
      { label: 'Status', value: item.is_active ? 'Active' : 'Inactive' },
    ];
    primaryAction = {
      label: item.is_active ? 'Freeze Mess' : 'Activate Mess',
      className: item.is_active
        ? 'admin-action-button admin-action-button--danger'
        : 'admin-action-button admin-action-button--success',
      onClick: () => onToggleMess(item.id, item.is_active),
      icon: ShieldCheck,
    };
    secondaryAction = {
      label: 'Delete Mess',
      className: 'admin-action-button admin-action-button--ghost',
      onClick: () => onDeleteMess(item.id),
      icon: Trash2,
    };
  }

  if (type === 'canteens') {
    eyebrow = 'Canteen';
    title = item.name;
    subtitle = item.location || 'Location not set';
    details = [
      { label: 'Location', value: item.location || 'Not set' },
      { label: 'Status', value: item.is_active ? 'Active' : 'Inactive' },
    ];
    primaryAction = {
      label: item.is_active ? 'Freeze Canteen' : 'Activate Canteen',
      className: item.is_active
        ? 'admin-action-button admin-action-button--danger'
        : 'admin-action-button admin-action-button--success',
      onClick: () => onToggleCanteen(item.id, item.is_active),
      icon: ShieldCheck,
    };
    secondaryAction = {
      label: 'Delete Canteen',
      className: 'admin-action-button admin-action-button--ghost',
      onClick: () => onDeleteCanteen(item.id),
      icon: Trash2,
    };
  }

  const PrimaryIcon = primaryAction?.icon;
  const SecondaryIcon = secondaryAction?.icon;

  return (
    <div className="admin-detail-backdrop" onClick={onClose}>
      <div className="admin-detail-sheet" onClick={(event) => event.stopPropagation()}>
        <div className="admin-detail-sheet__header">
          <div>
            <span className="admin-detail-sheet__eyebrow">{eyebrow}</span>
            <div className="admin-detail-sheet__title-row">
              <h3>{title}</h3>
              <StatusBadge isActive={item.is_active} type={type} />
            </div>
            <p>{subtitle}</p>
          </div>

          <button
            type="button"
            className="admin-icon-button admin-icon-button--ghost"
            onClick={onClose}
            aria-label="Close details"
          >
            <X size={18} />
          </button>
        </div>

        <div className="admin-detail-sheet__details">
          {details.map((detail) => (
            <div className="admin-detail-row" key={detail.label}>
              <span>{detail.label}</span>
              <strong className="admin-break">{detail.value}</strong>
            </div>
          ))}
        </div>

        <div className="admin-detail-sheet__actions">
          {primaryAction ? (
            <button
              type="button"
              className={primaryAction.className}
              onClick={primaryAction.onClick}
            >
              {PrimaryIcon ? <PrimaryIcon size={16} /> : null}
              {primaryAction.label}
            </button>
          ) : null}

          {secondaryAction ? (
            <button
              type="button"
              className={secondaryAction.className}
              onClick={secondaryAction.onClick}
            >
              {SecondaryIcon ? <SecondaryIcon size={16} /> : null}
              {secondaryAction.label}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};

const AdminManagerDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('managers');
  const [managers, setManagers] = useState([]);
  const [messes, setMesses] = useState([]);
  const [canteens, setCanteens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAddMessForm, setShowAddMessForm] = useState(false);
  const [showAddCanteenForm, setShowAddCanteenForm] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    phone: '',
    role_name: 'mess_manager',
    canteen_id: '',
    mess_id: '',
  });
  const [messFormData, setMessFormData] = useState({ hall_name: '' });
  const [canteenFormData, setCanteenFormData] = useState({ name: '', location: '' });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [availableCanteens, setAvailableCanteens] = useState([]);
  const [availableMesses, setAvailableMesses] = useState([]);

  const counts = useMemo(
    () => ({
      managers: managers.length,
      messes: messes.length,
      canteens: canteens.length,
    }),
    [canteens.length, managers.length, messes.length]
  );

  const activeMeta = TAB_META[activeTab];
  const isCurrentFormOpen =
    (activeTab === 'managers' && showAddForm) ||
    (activeTab === 'messes' && showAddMessForm) ||
    (activeTab === 'canteens' && showAddCanteenForm);

  const closeAllForms = () => {
    setShowAddForm(false);
    setShowAddMessForm(false);
    setShowAddCanteenForm(false);
  };

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      navigate('/auth');
      return;
    }

    Promise.allSettled([
      axios.get('/api/admin/managers/', { headers: getAuthHeaders() }),
      axios.get('/api/admin/messes/', { headers: getAuthHeaders() }),
      axios.get('/api/admin/canteens/', { headers: getAuthHeaders() }),
    ]).then(([managersResult, messesResult, canteensResult]) => {
      if (managersResult.status === 'fulfilled') {
        setManagers(Array.isArray(managersResult.value.data) ? managersResult.value.data : []);
      }

      if (messesResult.status === 'fulfilled') {
        const nextMesses = Array.isArray(messesResult.value.data) ? messesResult.value.data : [];
        setMesses(nextMesses);
        setAvailableMesses(nextMesses);
      }

      if (canteensResult.status === 'fulfilled') {
        const nextCanteens = Array.isArray(canteensResult.value.data)
          ? canteensResult.value.data
          : [];
        setCanteens(nextCanteens);
        setAvailableCanteens(nextCanteens);
      }
    });
  }, [navigate]);

  useEffect(() => {
    if (activeTab === 'managers') {
      fetchManagers();
    }

    if (activeTab === 'messes') {
      fetchMesses();
    }

    if (activeTab === 'canteens') {
      fetchCanteens();
    }
  }, [activeTab]);

  const updateManagerForm = (field, value) => {
    const nextValueByField = {
      email: sanitizeEmail(value),
      full_name: sanitizePersonName(value),
      phone: sanitizePhone(value),
    };

    setFormData((current) => ({
      ...current,
      [field]: nextValueByField[field] ?? value,
    }));
    setMessage({ type: '', text: '' });
  };

  const updateMessForm = (field, value) => {
    setMessFormData((current) => ({
      ...current,
      [field]: sanitizeEntityName(value, 120),
    }));
    setMessage({ type: '', text: '' });
  };

  const updateCanteenForm = (field, value) => {
    const nextValueByField = {
      name: sanitizeEntityName(value, 120),
      location: sanitizeLocationText(value, 200),
    };

    setCanteenFormData((current) => ({
      ...current,
      [field]: nextValueByField[field] ?? value,
    }));
    setMessage({ type: '', text: '' });
  };

  const fetchManagers = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/admin/managers/', {
        headers: getAuthHeaders(),
      });
      setManagers(Array.isArray(response.data) ? response.data : []);
    } catch {
      setMessage({ type: 'error', text: 'Managers are not available right now.' });
    } finally {
      setLoading(false);
    }
  };

  const fetchMesses = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/admin/messes/', {
        headers: getAuthHeaders(),
      });
      const nextMesses = Array.isArray(response.data) ? response.data : [];
      setMesses(nextMesses);
      setAvailableMesses(nextMesses);
    } catch {
      setMessage({ type: 'error', text: 'Messes are not available right now.' });
    } finally {
      setLoading(false);
    }
  };

  const fetchCanteens = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/admin/canteens/', {
        headers: getAuthHeaders(),
      });
      const nextCanteens = Array.isArray(response.data) ? response.data : [];
      setCanteens(nextCanteens);
      setAvailableCanteens(nextCanteens);
    } catch {
      setMessage({ type: 'error', text: 'Canteens are not available right now.' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddManager = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const payload = {
        email: formData.email,
        full_name: formData.full_name,
        phone: formData.phone,
        role_name: formData.role_name,
      };

      if (formData.role_name === 'canteen_manager' && formData.canteen_id) {
        payload.canteen_id = parseInt(formData.canteen_id, 10);
      }

      if (formData.role_name === 'mess_manager' && formData.mess_id) {
        payload.mess_id = parseInt(formData.mess_id, 10);
      }

      const response = await axios.post('/api/admin/managers/', payload, {
        headers: getAuthHeaders(),
      });

      setMessage({
        type: 'success',
        text: `Manager created. Email: ${response.data.email}, Employee Code: ${response.data.employee_code}.`,
      });
      setFormData({
        email: '',
        full_name: '',
        phone: '',
        role_name: 'mess_manager',
        canteen_id: '',
        mess_id: '',
      });
      setShowAddForm(false);
      fetchManagers();
    } catch (error) {
      const data = error.response?.data;
      let errorMsg = 'Unable to create manager.';

      if (data) {
        if (data.email) errorMsg = `Email error: ${data.email[0] || data.email}`;
        else if (data.phone) errorMsg = `Phone error: ${data.phone[0] || data.phone}`;
        else if (data.full_name) errorMsg = `Name error: ${data.full_name[0] || data.full_name}`;
        else if (data.role_name) errorMsg = `Role error: ${data.role_name[0] || data.role_name}`;
        else if (data.canteen_id) errorMsg = `Canteen error: ${data.canteen_id[0] || data.canteen_id}`;
        else if (data.mess_id) errorMsg = `Mess error: ${data.mess_id[0] || data.mess_id}`;
        else if (data.detail) errorMsg = data.detail;
        else if (typeof data === 'string') errorMsg = data;
      }

      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const handleAddMess = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await axios.post('/api/admin/messes/', messFormData, {
        headers: getAuthHeaders(),
      });
      setMessage({ type: 'success', text: `Mess created: ${response.data.name}` });
      setMessFormData({ hall_name: '' });
      setShowAddMessForm(false);
      fetchMesses();
    } catch (error) {
      const errorMessage =
        error.response?.data?.hall_name?.[0] ||
        error.response?.data?.detail ||
        'Unable to create mess.';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleAddCanteen = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await axios.post('/api/admin/canteens/', canteenFormData, {
        headers: getAuthHeaders(),
      });
      setMessage({ type: 'success', text: `Canteen created: ${response.data.name}` });
      setCanteenFormData({ name: '', location: '' });
      setShowAddCanteenForm(false);
      fetchCanteens();
    } catch {
      setMessage({ type: 'error', text: 'Unable to create canteen.' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      await axios.patch(
        `/api/admin/managers/${userId}/`,
        {},
        { headers: getAuthHeaders() }
      );
      setSelectedEntity(null);
      fetchManagers();
      setMessage({
        type: 'success',
        text: `Manager ${currentStatus ? 'frozen' : 'activated'} successfully.`,
      });
    } catch {
      setMessage({ type: 'error', text: 'Unable to update manager status.' });
    }
  };

  const handleToggleMess = async (messId, currentStatus) => {
    try {
      await axios.patch(
        `/api/admin/messes/${messId}/`,
        {},
        { headers: getAuthHeaders() }
      );
      setSelectedEntity(null);
      fetchMesses();
      setMessage({
        type: 'success',
        text: `Mess ${currentStatus ? 'frozen' : 'activated'} successfully.`,
      });
    } catch {
      setMessage({ type: 'error', text: 'Unable to update mess status.' });
    }
  };

  const handleDeleteMess = async (messId) => {
    if (!window.confirm('Are you sure you want to delete this mess?')) {
      return;
    }

    try {
      await axios.delete(`/api/admin/messes/${messId}/`, {
        headers: getAuthHeaders(),
      });
      setSelectedEntity(null);
      fetchMesses();
      setMessage({ type: 'success', text: 'Mess deleted successfully.' });
    } catch {
      setMessage({ type: 'error', text: 'Unable to delete mess.' });
    }
  };

  const handleToggleCanteen = async (canteenId, currentStatus) => {
    try {
      await axios.patch(
        `/api/admin/canteens/${canteenId}/`,
        {},
        { headers: getAuthHeaders() }
      );
      setSelectedEntity(null);
      fetchCanteens();
      setMessage({
        type: 'success',
        text: `Canteen ${currentStatus ? 'frozen' : 'activated'} successfully.`,
      });
    } catch {
      setMessage({ type: 'error', text: 'Unable to update canteen status.' });
    }
  };

  const handleDeleteCanteen = async (canteenId) => {
    if (!window.confirm('Are you sure you want to delete this canteen?')) {
      return;
    }

    try {
      await axios.delete(`/api/admin/canteens/${canteenId}/`, {
        headers: getAuthHeaders(),
      });
      setSelectedEntity(null);
      fetchCanteens();
      setMessage({ type: 'success', text: 'Canteen deleted successfully.' });
    } catch {
      setMessage({ type: 'error', text: 'Unable to delete canteen.' });
    }
  };

  const handleLogout = async () => {
    if (!window.confirm('Do you want to logout?')) {
      return;
    }

    await logoutUser();
    navigate('/auth');
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    closeAllForms();
    setSelectedEntity(null);
    setMessage({ type: '', text: '' });
  };

  const toggleCurrentForm = () => {
    setSelectedEntity(null);
    setMessage({ type: '', text: '' });

    if (activeTab === 'managers') {
      setShowAddForm((current) => !current);
      setShowAddMessForm(false);
      setShowAddCanteenForm(false);
      return;
    }

    if (activeTab === 'messes') {
      setShowAddMessForm((current) => !current);
      setShowAddForm(false);
      setShowAddCanteenForm(false);
      return;
    }

    setShowAddCanteenForm((current) => !current);
    setShowAddForm(false);
    setShowAddMessForm(false);
  };

  const renderManagerSection = () => {
    if (loading && !showAddForm) {
      return <div className="admin-loading">{TAB_META.managers.loadingText}</div>;
    }

    if (managers.length === 0) {
      return (
        <EmptyState
          title={TAB_META.managers.emptyTitle}
          description={TAB_META.managers.emptyDescription}
        />
      );
    }

    return (
      <>
        <div className="admin-mobile-grid">
          {managers.map((manager) => (
            <CompactEntityCard
              key={manager.id}
              title={manager.full_name}
              subtitle={formatRoleLabel(manager.role_name)}
              isActive={manager.is_active}
              onClick={() => setSelectedEntity({ type: 'managers', item: manager })}
            />
          ))}
        </div>

        <div className="admin-table-panel">
          <div className="admin-table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Employee Code</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {managers.map((manager) => (
                  <tr key={manager.id}>
                    <td>{manager.full_name}</td>
                    <td className="admin-break">{manager.email}</td>
                    <td>{manager.phone || 'Not set'}</td>
                    <td>{formatRoleLabel(manager.role_name)}</td>
                    <td>{manager.employee_code}</td>
                    <td>
                      <StatusBadge isActive={manager.is_active} type="managers" />
                    </td>
                    <td>
                      <div className="admin-action-row admin-action-row--desktop">
                        <button
                          type="button"
                          className={`admin-action-button ${
                            manager.is_active
                              ? 'admin-action-button--danger'
                              : 'admin-action-button--success'
                          }`}
                          onClick={() =>
                            handleToggleStatus(manager.id, manager.is_active)
                          }
                        >
                          {manager.is_active ? 'Freeze' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </>
    );
  };

  const renderMessSection = () => {
    if (loading && !showAddMessForm) {
      return <div className="admin-loading">{TAB_META.messes.loadingText}</div>;
    }

    if (messes.length === 0) {
      return (
        <EmptyState
          title={TAB_META.messes.emptyTitle}
          description={TAB_META.messes.emptyDescription}
        />
      );
    }

    return (
      <>
        <div className="admin-mobile-grid">
          {messes.map((mess) => (
            <CompactEntityCard
              key={mess.id}
              title={mess.name}
              subtitle={mess.hall_display || 'Hall not set'}
              isActive={mess.is_active}
              onClick={() => setSelectedEntity({ type: 'messes', item: mess })}
            />
          ))}
        </div>

        <div className="admin-table-panel">
          <div className="admin-table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Mess Name</th>
                  <th>Hall</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {messes.map((mess) => (
                  <tr key={mess.id}>
                    <td>{mess.name}</td>
                    <td>{mess.hall_display}</td>
                    <td>
                      <StatusBadge isActive={mess.is_active} type="messes" />
                    </td>
                    <td>
                      <div className="admin-action-row admin-action-row--desktop">
                        <button
                          type="button"
                          className={`admin-action-button ${
                            mess.is_active
                              ? 'admin-action-button--danger'
                              : 'admin-action-button--success'
                          }`}
                          onClick={() => handleToggleMess(mess.id, mess.is_active)}
                        >
                          {mess.is_active ? 'Freeze' : 'Activate'}
                        </button>
                        <button
                          type="button"
                          className="admin-action-button admin-action-button--ghost"
                          onClick={() => handleDeleteMess(mess.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </>
    );
  };

  const renderCanteenSection = () => {
    if (loading && !showAddCanteenForm) {
      return <div className="admin-loading">{TAB_META.canteens.loadingText}</div>;
    }

    if (canteens.length === 0) {
      return (
        <EmptyState
          title={TAB_META.canteens.emptyTitle}
          description={TAB_META.canteens.emptyDescription}
        />
      );
    }

    return (
      <>
        <div className="admin-mobile-grid">
          {canteens.map((canteen) => (
            <CompactEntityCard
              key={canteen.id}
              title={canteen.name}
              subtitle={canteen.location || 'Location not set'}
              isActive={canteen.is_active}
              onClick={() => setSelectedEntity({ type: 'canteens', item: canteen })}
            />
          ))}
        </div>

        <div className="admin-table-panel">
          <div className="admin-table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {canteens.map((canteen) => (
                  <tr key={canteen.id}>
                    <td>{canteen.name}</td>
                    <td>{canteen.location}</td>
                    <td>
                      <StatusBadge isActive={canteen.is_active} type="canteens" />
                    </td>
                    <td>
                      <div className="admin-action-row admin-action-row--desktop">
                        <button
                          type="button"
                          className={`admin-action-button ${
                            canteen.is_active
                              ? 'admin-action-button--danger'
                              : 'admin-action-button--success'
                          }`}
                          onClick={() =>
                            handleToggleCanteen(canteen.id, canteen.is_active)
                          }
                        >
                          {canteen.is_active ? 'Freeze' : 'Activate'}
                        </button>
                        <button
                          type="button"
                          className="admin-action-button admin-action-button--ghost"
                          onClick={() => handleDeleteCanteen(canteen.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-layout">
        <aside className="admin-sidebar">
          <div className="admin-sidebar__brand">
            <span className="admin-sidebar__eyebrow">Admin Manager</span>
            <h1>Control Panel</h1>
            <p>Manage campus operations from one place.</p>
          </div>

          <nav className="admin-sidebar__nav">
            {TAB_ITEMS.map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  className={`admin-sidebar__nav-button ${
                    isActive ? 'admin-sidebar__nav-button--active' : ''
                  }`}
                  onClick={() => handleTabChange(tab.id)}
                >
                  <span className="admin-sidebar__nav-content">
                    <TabIcon size={18} />
                    <span>{tab.label}</span>
                  </span>
                  <span className="admin-nav-count">{counts[tab.id]}</span>
                </button>
              );
            })}
          </nav>

          <button
            type="button"
            className="admin-sidebar__logout"
            onClick={handleLogout}
          >
            <LogOut size={18} />
            Log Out
          </button>
        </aside>

        <main className="admin-main">
          <header className="admin-topbar">
            <div className="admin-topbar__copy">
              <h2>{activeMeta.title}</h2>
              <p>{activeMeta.description}</p>
            </div>

            <div className="admin-topbar__actions">
              <button
                type="button"
                className="admin-primary-button"
                onClick={toggleCurrentForm}
              >
                {isCurrentFormOpen ? <X size={16} /> : <Plus size={16} />}
                {isCurrentFormOpen ? activeMeta.closeLabel : activeMeta.addLabel}
              </button>

              <button
                type="button"
                className="admin-icon-button admin-mobile-logout"
                onClick={handleLogout}
                aria-label="Log out"
              >
                <LogOut size={18} />
              </button>
            </div>
          </header>

          {message.text ? (
            <div
              className={`admin-banner ${
                message.type === 'success'
                  ? 'admin-banner--success'
                  : 'admin-banner--error'
              }`}
            >
              {message.text}
            </div>
          ) : null}

          <section className="admin-panel">
            {activeTab === 'managers' && showAddForm ? (
              <form className="admin-form-panel" onSubmit={handleAddManager} noValidate>
                <div className="admin-form-grid">
                  <label className="admin-field">
                    <span>Full Name *</span>
                    <input
                      className="admin-input"
                      placeholder="Enter full name"
                      value={formData.full_name}
                      onChange={(event) =>
                        updateManagerForm('full_name', event.target.value)
                      }
                      {...STANDARD_INPUT_PROPS.personName}
                      required
                    />
                  </label>

                  <label className="admin-field">
                    <span>Email *</span>
                    <input
                      className="admin-input"
                      placeholder="Enter email"
                      value={formData.email}
                      onChange={(event) =>
                        updateManagerForm('email', event.target.value)
                      }
                      {...STANDARD_INPUT_PROPS.email}
                      required
                    />
                  </label>

                  <label className="admin-field">
                    <span>Phone *</span>
                    <input
                      className="admin-input"
                      placeholder="10-digit phone number"
                      value={formData.phone}
                      onChange={(event) =>
                        updateManagerForm('phone', event.target.value)
                      }
                      {...STANDARD_INPUT_PROPS.phone}
                      required
                    />
                  </label>

                  <label className="admin-field">
                    <span>Role *</span>
                    <select
                      className="admin-select"
                      value={formData.role_name}
                      onChange={(event) =>
                        setFormData((current) => ({
                          ...current,
                          role_name: event.target.value,
                          canteen_id: '',
                          mess_id: '',
                        }))
                      }
                    >
                      <option value="mess_manager">Mess Manager</option>
                      <option value="canteen_manager">Canteen Manager</option>
                    </select>
                  </label>

                  {formData.role_name === 'canteen_manager' ? (
                    <label className="admin-field admin-field--full">
                      <span>Assign Canteen *</span>
                      <select
                        className="admin-select"
                        value={formData.canteen_id}
                        onChange={(event) =>
                          setFormData((current) => ({
                            ...current,
                            canteen_id: event.target.value,
                          }))
                        }
                        required
                      >
                        <option value="">Select canteen</option>
                        {availableCanteens.map((canteen) => (
                          <option key={canteen.id} value={canteen.id}>
                            {canteen.name} ({canteen.location})
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}

                  {formData.role_name === 'mess_manager' ? (
                    <label className="admin-field admin-field--full">
                      <span>Assign Mess *</span>
                      <select
                        className="admin-select"
                        value={formData.mess_id}
                        onChange={(event) =>
                          setFormData((current) => ({
                            ...current,
                            mess_id: event.target.value,
                          }))
                        }
                        required
                      >
                        <option value="">Select mess</option>
                        {availableMesses.map((mess) => (
                          <option key={mess.id} value={mess.id}>
                            {mess.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                </div>

                <div className="admin-form-actions">
                  <button type="submit" className="admin-primary-button" disabled={loading}>
                    {loading ? 'Creating...' : 'Create Manager'}
                  </button>
                </div>
              </form>
            ) : null}

            {activeTab === 'messes' && showAddMessForm ? (
              <form className="admin-form-panel" onSubmit={handleAddMess} noValidate>
                <div className="admin-form-grid admin-form-grid--single">
                  <label className="admin-field admin-field--full">
                    <span>Hall Name *</span>
                    <input
                      className="admin-input"
                      placeholder="For example: Hall 15"
                      value={messFormData.hall_name}
                      onChange={(event) =>
                        updateMessForm('hall_name', event.target.value)
                      }
                      maxLength={120}
                      required
                    />
                  </label>
                </div>

                <div className="admin-form-actions">
                  <button type="submit" className="admin-primary-button" disabled={loading}>
                    {loading ? 'Creating...' : 'Create Mess'}
                  </button>
                </div>
              </form>
            ) : null}

            {activeTab === 'canteens' && showAddCanteenForm ? (
              <form className="admin-form-panel" onSubmit={handleAddCanteen} noValidate>
                <div className="admin-form-grid">
                  <label className="admin-field">
                    <span>Name *</span>
                    <input
                      className="admin-input"
                      placeholder="Enter canteen name"
                      value={canteenFormData.name}
                      onChange={(event) =>
                        updateCanteenForm('name', event.target.value)
                      }
                      maxLength={120}
                      required
                    />
                  </label>

                  <label className="admin-field">
                    <span>Location *</span>
                    <input
                      className="admin-input"
                      placeholder="Enter location"
                      value={canteenFormData.location}
                      onChange={(event) =>
                        updateCanteenForm('location', event.target.value)
                      }
                      maxLength={200}
                      required
                    />
                  </label>
                </div>

                <div className="admin-form-actions">
                  <button type="submit" className="admin-primary-button" disabled={loading}>
                    {loading ? 'Creating...' : 'Create Canteen'}
                  </button>
                </div>
              </form>
            ) : null}

            {activeTab === 'managers' ? renderManagerSection() : null}
            {activeTab === 'messes' ? renderMessSection() : null}
            {activeTab === 'canteens' ? renderCanteenSection() : null}
          </section>
        </main>
      </div>

      <nav className="admin-bottom-nav">
        {TAB_ITEMS.map((tab) => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              className={`admin-bottom-nav__button ${
                isActive ? 'admin-bottom-nav__button--active' : ''
              }`}
              onClick={() => handleTabChange(tab.id)}
            >
              <TabIcon size={18} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      <DetailSheet
        entity={selectedEntity}
        onClose={() => setSelectedEntity(null)}
        onToggleManager={handleToggleStatus}
        onToggleMess={handleToggleMess}
        onToggleCanteen={handleToggleCanteen}
        onDeleteMess={handleDeleteMess}
        onDeleteCanteen={handleDeleteCanteen}
      />
    </div>
  );
};

export default AdminManagerDashboard;
