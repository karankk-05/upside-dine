import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  LogOut,
  Pencil,
  Plus,
  ShieldCheck,
  Store,
  Trash2,
  User,
  UserCog,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import api from '../lib/api';
import { logoutUser } from '../lib/auth';
import {
  STANDARD_INPUT_PROPS,
  sanitizeEmail,
  sanitizeEntityName,
  sanitizeLocationText,
  sanitizePersonName,
  sanitizePhone,
} from '../lib/formValidation';
import { compareNaturalText } from '../lib/naturalSort';
import PullToRefresh from '../components/PullToRefresh';
import './AdminManagerDashboard.css';

const INITIAL_MESS_FORM_DATA = { hall_name: '', location: '' };

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
  },
  messes: {
    title: 'Messes',
    description: 'Add halls and manage which messes stay active.',
    addLabel: 'Add Mess',
    closeLabel: 'Close Form',
    emptyTitle: 'No messes found',
    emptyDescription: 'Create a mess to start assigning operations.',
  },
  canteens: {
    title: 'Canteens',
    description: 'Add outlets and manage their availability.',
    addLabel: 'Add Canteen',
    closeLabel: 'Close Form',
    emptyTitle: 'No canteens found',
    emptyDescription: 'Create a canteen to make it available in the app.',
  },
};

const MANAGERS_QUERY_KEY = ['admin', 'managers'];
const MESSES_QUERY_KEY = ['admin', 'messes'];
const CANTEENS_QUERY_KEY = ['admin', 'canteens'];

const formatRoleLabel = (value) => {
  if (value === 'mess_manager') return 'Mess Manager';
  if (value === 'canteen_manager') return 'Canteen Manager';
  if (value === 'admin_manager') return 'Admin Manager';
  return value ? value.replace(/_/g, ' ') : 'Unknown';
};

const getInactiveLabel = (type) => (type === 'managers' ? 'Frozen' : 'Inactive');
const normalizeList = (data) => (Array.isArray(data) ? data : []);

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

const CompactEntityCard = ({ title, subtitle, isActive, onClick, disabled = false }) => (
  <button
    type="button"
    className="admin-mini-card"
    onClick={onClick}
    disabled={disabled}
    style={disabled ? { cursor: 'default' } : undefined}
  >
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

const EntitySectionSkeleton = ({ columns = 6 }) => (
  <>
    <div className="admin-mobile-grid">
      {Array.from({ length: 4 }).map((_, index) => (
        <div className="admin-mini-card" key={`admin-mobile-skeleton-${index}`}>
          <span className="admin-status-dot ui-skeleton ui-skeleton-circle" />
          <div
            className="ui-skeleton ui-skeleton-text"
            style={{ width: '74%', height: 18 }}
          />
          <div
            className="ui-skeleton ui-skeleton-text"
            style={{ width: '58%', height: 12 }}
          />
        </div>
      ))}
    </div>

    <div className="admin-table-panel">
      <div className="admin-table-scroll">
        <table className="admin-table">
          <thead>
            <tr>
              {Array.from({ length: columns }).map((_, index) => (
                <th key={`admin-header-skeleton-${index}`}>
                  <div
                    className="ui-skeleton ui-skeleton-text"
                    style={{ width: '68%', height: 12 }}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 4 }).map((_, rowIndex) => (
              <tr key={`admin-row-skeleton-${rowIndex}`}>
                {Array.from({ length: columns }).map((__, cellIndex) => (
                  <td key={`admin-cell-skeleton-${rowIndex}-${cellIndex}`}>
                    <div
                      className="ui-skeleton ui-skeleton-text"
                      style={{ width: cellIndex === columns - 1 ? '54%' : '82%', height: 14 }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </>
);

const DetailSheet = ({
  entity,
  onClose,
  onEditMess,
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
  let tertiaryAction = null;

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
      { label: 'Location', value: item.location || 'Not set' },
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
      label: 'Edit Mess',
      className: 'admin-action-button',
      onClick: () => onEditMess(item),
      icon: Pencil,
    };
    tertiaryAction = {
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
  const TertiaryIcon = tertiaryAction?.icon;

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

          {tertiaryAction ? (
            <button
              type="button"
              className={tertiaryAction.className}
              onClick={tertiaryAction.onClick}
            >
              {TertiaryIcon ? <TertiaryIcon size={16} /> : null}
              {tertiaryAction.label}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};

const AdminManagerDashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('managers');
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
  const [messFormData, setMessFormData] = useState(INITIAL_MESS_FORM_DATA);
  const [editingMessId, setEditingMessId] = useState(null);
  const [canteenFormData, setCanteenFormData] = useState({ name: '', location: '' });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [submittingType, setSubmittingType] = useState('');

  const shouldLoadManagers = activeTab === 'managers';
  const shouldLoadMesses =
    activeTab === 'messes' ||
    (activeTab === 'managers' && showAddForm && formData.role_name === 'mess_manager');
  const shouldLoadCanteens =
    activeTab === 'canteens' ||
    (activeTab === 'managers' && showAddForm && formData.role_name === 'canteen_manager');

  const { data: managersQueryData = [], isLoading: isLoadingManagers } = useQuery({
    queryKey: MANAGERS_QUERY_KEY,
    queryFn: async () => {
      const { data } = await api.get('/admin/managers/');
      return normalizeList(data);
    },
    enabled: shouldLoadManagers,
  });

  const { data: messesQueryData = [], isLoading: isLoadingMesses } = useQuery({
    queryKey: MESSES_QUERY_KEY,
    queryFn: async () => {
      const { data } = await api.get('/admin/messes/');
      return normalizeList(data);
    },
    enabled: shouldLoadMesses,
  });

  const { data: canteensQueryData = [], isLoading: isLoadingCanteens } = useQuery({
    queryKey: CANTEENS_QUERY_KEY,
    queryFn: async () => {
      const { data } = await api.get('/admin/canteens/');
      return normalizeList(data);
    },
    enabled: shouldLoadCanteens,
  });

  const managers = managersQueryData;
  const messes = useMemo(
    () =>
      [...messesQueryData].sort((left, right) =>
        compareNaturalText(left.hall_name || left.name, right.hall_name || right.name)
      ),
    [messesQueryData]
  );
  const canteens = canteensQueryData;

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
    setShowAddCanteenForm(false);
    setShowAddMessForm(false);
    setEditingMessId(null);
    setMessFormData(INITIAL_MESS_FORM_DATA);
  };

  const refreshManagers = useCallback(
    async () => queryClient.invalidateQueries({ queryKey: MANAGERS_QUERY_KEY }),
    [queryClient]
  );
  const refreshMesses = useCallback(
    async () => queryClient.invalidateQueries({ queryKey: MESSES_QUERY_KEY }),
    [queryClient]
  );
  const refreshCanteens = useCallback(
    async () => queryClient.invalidateQueries({ queryKey: CANTEENS_QUERY_KEY }),
    [queryClient]
  );

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
    const nextValueByField = {
      hall_name: sanitizeEntityName(value, 120),
      location: sanitizeLocationText(value, 200),
    };

    setMessFormData((current) => ({
      ...current,
      [field]: nextValueByField[field] ?? value,
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

  const handleAddManager = async (event) => {
    event.preventDefault();
    setSubmittingType('manager');
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

      const { data } = await api.post('/admin/managers/', payload);
      setMessage({
        type: 'success',
        text: `Manager created. Email: ${data.email}, Employee Code: ${data.employee_code}.`,
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
      await refreshManagers();
    } catch (error) {
      const data = error.response?.data;
      let errorMessage = 'Unable to create manager.';

      if (data) {
        if (data.email) errorMessage = `Email error: ${data.email[0] || data.email}`;
        else if (data.phone) errorMessage = `Phone error: ${data.phone[0] || data.phone}`;
        else if (data.full_name) errorMessage = `Name error: ${data.full_name[0] || data.full_name}`;
        else if (data.role_name) errorMessage = `Role error: ${data.role_name[0] || data.role_name}`;
        else if (data.canteen_id) errorMessage = `Canteen error: ${data.canteen_id[0] || data.canteen_id}`;
        else if (data.mess_id) errorMessage = `Mess error: ${data.mess_id[0] || data.mess_id}`;
        else if (data.detail) errorMessage = data.detail;
        else if (typeof data === 'string') errorMessage = data;
      }

      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setSubmittingType('');
    }
  };

  const resetMessForm = () => {
    setMessFormData(INITIAL_MESS_FORM_DATA);
    setEditingMessId(null);
    setShowAddMessForm(false);
  };

  const getMessErrorMessage = (error, fallbackMessage) =>
    error.response?.data?.hall_name?.[0] ||
    error.response?.data?.hall_name ||
    error.response?.data?.location?.[0] ||
    error.response?.data?.location ||
    error.response?.data?.detail ||
    fallbackMessage;

  const handleEditMess = (mess) => {
    setSelectedEntity(null);
    setMessage({ type: '', text: '' });
    setEditingMessId(mess.id);
    setMessFormData({
      hall_name: mess.hall_name || '',
      location: mess.location || '',
    });
    setShowAddForm(false);
    setShowAddCanteenForm(false);
    setShowAddMessForm(true);
  };

  const handleSaveMess = async (event) => {
    event.preventDefault();
    setSubmittingType('mess');
    setMessage({ type: '', text: '' });

    try {
      const { data } = editingMessId
        ? await api.put(`/admin/messes/${editingMessId}/`, messFormData)
        : await api.post('/admin/messes/', messFormData);
      setMessage({
        type: 'success',
        text: editingMessId ? `Mess updated: ${data.name}` : `Mess created: ${data.name}`,
      });
      resetMessForm();
      await refreshMesses();
    } catch (error) {
      setMessage({
        type: 'error',
        text: getMessErrorMessage(
          error,
          editingMessId ? 'Unable to update mess.' : 'Unable to create mess.'
        ),
      });
    } finally {
      setSubmittingType('');
    }
  };

  const handleAddCanteen = async (event) => {
    event.preventDefault();
    setSubmittingType('canteen');
    setMessage({ type: '', text: '' });

    try {
      const { data } = await api.post('/admin/canteens/', canteenFormData);
      setMessage({ type: 'success', text: `Canteen created: ${data.name}` });
      setCanteenFormData({ name: '', location: '' });
      setShowAddCanteenForm(false);
      await refreshCanteens();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.detail || 'Unable to create canteen.',
      });
    } finally {
      setSubmittingType('');
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      await api.patch(`/admin/managers/${userId}/`, {});
      setSelectedEntity(null);
      await refreshManagers();
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
      await api.patch(`/admin/messes/${messId}/`, {});
      setSelectedEntity(null);
      await refreshMesses();
      if (editingMessId === messId) {
        resetMessForm();
      }
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
      await api.delete(`/admin/messes/${messId}/`);
      setSelectedEntity(null);
      await refreshMesses();
      if (editingMessId === messId) {
        resetMessForm();
      }
      setMessage({ type: 'success', text: 'Mess deleted successfully.' });
    } catch {
      setMessage({ type: 'error', text: 'Unable to delete mess.' });
    }
  };

  const handleToggleCanteen = async (canteenId, currentStatus) => {
    try {
      await api.patch(`/admin/canteens/${canteenId}/`, {});
      setSelectedEntity(null);
      await refreshCanteens();
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
      await api.delete(`/admin/canteens/${canteenId}/`);
      setSelectedEntity(null);
      await refreshCanteens();
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

  const handleRefresh = useCallback(async () => {
    if (activeTab === 'managers') {
      await refreshManagers();
      return;
    }
    if (activeTab === 'messes') {
      await refreshMesses();
      return;
    }
    await refreshCanteens();
  }, [activeTab, refreshCanteens, refreshManagers, refreshMesses]);

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
      if (showAddMessForm) {
        resetMessForm();
      } else {
        setEditingMessId(null);
        setMessFormData(INITIAL_MESS_FORM_DATA);
        setShowAddMessForm(true);
      }
      setShowAddForm(false);
      setShowAddCanteenForm(false);
      return;
    }

    setShowAddCanteenForm((current) => !current);
    setShowAddForm(false);
    setShowAddMessForm(false);
  };

  const renderManagerSection = () => {
    if (isLoadingManagers && managers.length === 0 && !showAddForm) {
      return <EntitySectionSkeleton columns={7} />;
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
                          onClick={() => handleToggleStatus(manager.id, manager.is_active)}
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
    if (isLoadingMesses && messes.length === 0 && !showAddMessForm) {
      return <EntitySectionSkeleton columns={4} />;
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
                  <th>Location</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {messes.map((mess) => (
                  <tr key={mess.id}>
                    <td>{mess.name}</td>
                    <td>{mess.hall_display}</td>
                    <td>{mess.location || 'Not set'}</td>
                    <td>
                      <StatusBadge isActive={mess.is_active} type="messes" />
                    </td>
                    <td>
                      <div className="admin-action-row admin-action-row--desktop">
                        <button
                          type="button"
                          className="admin-action-button"
                          onClick={() => handleEditMess(mess)}
                        >
                          Edit
                        </button>
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
    if (isLoadingCanteens && canteens.length === 0 && !showAddCanteenForm) {
      return <EntitySectionSkeleton columns={4} />;
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
                          onClick={() => handleToggleCanteen(canteen.id, canteen.is_active)}
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
    <PullToRefresh onRefresh={handleRefresh}>
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
              className="admin-sidebar__profile"
              onClick={() => navigate('/profile')}
            >
              <User size={18} />
              My Profile
            </button>

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
                  className="admin-icon-button"
                  onClick={() => navigate('/profile')}
                  aria-label="Open profile"
                >
                  <User size={18} />
                </button>

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
                        onChange={(event) => updateManagerForm('full_name', event.target.value)}
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
                        onChange={(event) => updateManagerForm('email', event.target.value)}
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
                        onChange={(event) => updateManagerForm('phone', event.target.value)}
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
                          <option value="">
                            {isLoadingCanteens && canteens.length === 0
                              ? 'Loading canteens...'
                              : 'Select canteen'}
                          </option>
                          {canteens.map((canteen) => (
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
                          <option value="">
                            {isLoadingMesses && messes.length === 0
                              ? 'Loading messes...'
                              : 'Select mess'}
                          </option>
                          {messes.map((mess) => (
                            <option key={mess.id} value={mess.id}>
                              {mess.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : null}
                  </div>

                  <div className="admin-form-actions">
                    <button
                      type="submit"
                      className="admin-primary-button"
                      disabled={submittingType === 'manager'}
                    >
                      {submittingType === 'manager' ? 'Creating...' : 'Create Manager'}
                    </button>
                  </div>
                </form>
              ) : null}

              {activeTab === 'messes' && showAddMessForm ? (
                <form className="admin-form-panel" onSubmit={handleSaveMess} noValidate>
                  <div className="admin-form-grid">
                    <label className="admin-field">
                      <span>Hall Name *</span>
                      <input
                        className="admin-input"
                        placeholder="For example: Hall 15"
                        value={messFormData.hall_name}
                        onChange={(event) => updateMessForm('hall_name', event.target.value)}
                        maxLength={120}
                        required
                      />
                    </label>

                    <label className="admin-field">
                      <span>Location</span>
                      <input
                        className="admin-input"
                        placeholder="Optional location"
                        value={messFormData.location}
                        onChange={(event) => updateMessForm('location', event.target.value)}
                        maxLength={200}
                      />
                    </label>
                  </div>

                  <div className="admin-form-actions">
                    <button
                      type="submit"
                      className="admin-primary-button"
                      disabled={submittingType === 'mess'}
                    >
                      {submittingType === 'mess'
                        ? editingMessId
                          ? 'Saving...'
                          : 'Creating...'
                        : editingMessId
                          ? 'Save Changes'
                          : 'Create Mess'}
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
                        onChange={(event) => updateCanteenForm('name', event.target.value)}
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
                    <button
                      type="submit"
                      className="admin-primary-button"
                      disabled={submittingType === 'canteen'}
                    >
                      {submittingType === 'canteen' ? 'Creating...' : 'Create Canteen'}
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
          onEditMess={handleEditMess}
          onToggleManager={handleToggleStatus}
          onToggleMess={handleToggleMess}
          onToggleCanteen={handleToggleCanteen}
          onDeleteMess={handleDeleteMess}
          onDeleteCanteen={handleDeleteCanteen}
        />
      </div>
    </PullToRefresh>
  );
};

export default AdminManagerDashboard;
