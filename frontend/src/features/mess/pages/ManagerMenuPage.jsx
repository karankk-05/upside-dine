import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, X } from 'lucide-react';
import { useManagerMenuList, useCreateMenuItem, useUpdateMenuItem, useDeleteMenuItem } from '../hooks/useManagerMenu';
import '../mess.css';

const MEAL_TYPES = [
  { value: '', label: 'All' },
  { value: 'breakfast', label: '🌅 Breakfast' },
  { value: 'lunch', label: '☀️ Lunch' },
  { value: 'dinner', label: '🌙 Dinner' },
  { value: 'snack', label: '🍿 Snack' },
];

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const ManagerMenuPage = () => {
  const navigate = useNavigate();
  const [mealType, setMealType] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({
    item_name: '', description: '', price: '', meal_type: 'lunch',
    day_of_week: 'monday', available_quantity: '', default_quantity: '', is_active: true,
  });

  const filters = {};
  if (mealType) filters.meal_type = mealType;

  const { data: menuItems, isLoading, isError } = useManagerMenuList(filters);
  const createMutation = useCreateMenuItem();
  const updateMutation = useUpdateMenuItem();
  const deleteMutation = useDeleteMenuItem();

  const resetForm = () => {
    setForm({ item_name: '', description: '', price: '', meal_type: 'lunch', day_of_week: 'monday', available_quantity: '', default_quantity: '', is_active: true });
    setEditItem(null);
    setShowForm(false);
  };

  const openEdit = (item) => {
    setForm({
      item_name: item.item_name, description: item.description || '', price: item.price,
      meal_type: item.meal_type, day_of_week: item.day_of_week,
      available_quantity: item.available_quantity, default_quantity: item.default_quantity, is_active: item.is_active,
    });
    setEditItem(item);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, price: parseFloat(form.price), available_quantity: parseInt(form.available_quantity) || 0, default_quantity: parseInt(form.default_quantity) || 0 };
    try {
      if (editItem) await updateMutation.mutateAsync({ id: editItem.id, ...payload });
      else await createMutation.mutateAsync(payload);
      resetForm();
    } catch { /* handled */ }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const mutationError = createMutation.error || updateMutation.error;

  return (
    <div className="mess-page">
      <div className="mess-page-header">
        <button className="mess-back-btn" onClick={() => navigate('/manager/mess')}>
          <ArrowLeft size={18} />
        </button>
        <h1 className="mess-page-title">Mess Manager</h1>
      </div>

      <div className="mess-content">
        <div className="mess-tabs">
          {MEAL_TYPES.map((mt) => (
            <button key={mt.value} className={`mess-tab ${mealType === mt.value ? 'active' : ''}`} onClick={() => setMealType(mt.value)}>{mt.label}</button>
          ))}
        </div>

        <div className="mess-section-header">
          <h3 className="mess-section-title">{mealType ? `${mealType.charAt(0).toUpperCase() + mealType.slice(1)} Extras` : "Today's Extras"}</h3>
          <button className="mess-btn-small" onClick={() => { resetForm(); setShowForm(true); }}>
            <Plus size={14} style={{ marginRight: 4 }} /> Add Extra
          </button>
        </div>

        {isLoading ? (
          <div className="mess-loading"><div className="mess-loading-spinner" /><span className="mess-loading-text">Loading menu...</span></div>
        ) : isError ? (
          <div className="mess-error">Failed to load menu items.</div>
        ) : (menuItems || []).length === 0 ? (
          <div className="mess-empty"><div className="mess-empty-icon">🍽️</div><div>No menu items found</div></div>
        ) : (
          (menuItems || []).map((item) => (
            <div key={item.id} className="mess-menu-item">
              <div className="mess-menu-item-info">
                <div className="mess-menu-item-name">{item.item_name}</div>
                <div className="mess-menu-item-desc">₹{item.price} · {item.meal_type}</div>
                <span className={item.available_quantity > 20 ? 'mess-qty-high' : item.available_quantity > 5 ? 'mess-qty-medium' : 'mess-qty-low'}>
                  ● {item.available_quantity} remaining
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="mess-btn-small" onClick={() => openEdit(item)}>Edit</button>
                <button className="mess-btn-outline" onClick={() => deleteMutation.mutate(item.id)} disabled={deleteMutation.isPending}
                  style={{ color: '#ff3333', borderColor: '#ff3333', fontSize: 12, padding: '8px 12px' }}>✕</button>
              </div>
            </div>
          ))
        )}
      </div>

      {showForm && (
        <div className="mess-modal-overlay" onClick={resetForm}>
          <div className="mess-modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 className="mess-modal-title" style={{ marginBottom: 0 }}>{editItem ? 'Edit Item' : 'Add New Extra'}</h2>
              <button onClick={resetForm} style={{ background: 'none', border: 'none', color: 'var(--st-text-dim)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="mess-input-group">
                <label className="mess-input-label">Item Name</label>
                <input className="mess-input-field" value={form.item_name} onChange={(e) => setForm({ ...form, item_name: e.target.value })} placeholder="e.g. Paneer Butter Masala" required />
              </div>
              <div className="mess-input-group">
                <label className="mess-input-label">Description</label>
                <input className="mess-input-field" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="With rice, roti & salad" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="mess-input-group">
                  <label className="mess-input-label">Price (₹)</label>
                  <input className="mess-input-field" type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
                </div>
                <div className="mess-input-group">
                  <label className="mess-input-label">Meal Type</label>
                  <select className="mess-select" value={form.meal_type} onChange={(e) => setForm({ ...form, meal_type: e.target.value })}>
                    <option value="breakfast">Breakfast</option><option value="lunch">Lunch</option><option value="dinner">Dinner</option><option value="snack">Snack</option>
                  </select>
                </div>
              </div>
              <div className="mess-input-group">
                <label className="mess-input-label">Day of Week</label>
                <select className="mess-select" value={form.day_of_week} onChange={(e) => setForm({ ...form, day_of_week: e.target.value })}>
                  {DAYS.map((d) => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="mess-input-group">
                  <label className="mess-input-label">Available Qty</label>
                  <input className="mess-input-field" type="number" min="0" value={form.available_quantity} onChange={(e) => setForm({ ...form, available_quantity: e.target.value })} required />
                </div>
                <div className="mess-input-group">
                  <label className="mess-input-label">Default Qty</label>
                  <input className="mess-input-field" type="number" min="0" value={form.default_quantity} onChange={(e) => setForm({ ...form, default_quantity: e.target.value })} required />
                </div>
              </div>
              {mutationError && (
                <div style={{ background: 'rgba(255,51,51,0.1)', border: '1px solid #ff3333', borderRadius: 8, padding: 12, marginBottom: 16, color: '#ff3333', fontSize: 13 }}>
                  {mutationError?.response?.data?.detail || JSON.stringify(mutationError?.response?.data) || 'Failed to save.'}
                </div>
              )}
              <button className="mess-btn-primary" type="submit" disabled={isPending}>{isPending ? 'Saving...' : editItem ? 'Update Item' : 'Add Item'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerMenuPage;
