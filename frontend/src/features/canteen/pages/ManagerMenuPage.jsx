import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useManagerMenu } from '../hooks/useManagerMenu';
import {
  FIELD_LIMITS,
  STANDARD_INPUT_PROPS,
  sanitizeDecimalInput,
  sanitizeEntityName,
  sanitizeMultilineText,
} from '../../../lib/formValidation';
import '../canteen.css';

export default function ManagerMenuPage() {
  const navigate = useNavigate();
  const { menuItems = [], isLoading, addItem, updateItem, deleteItem } = useManagerMenu();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({ item_name: '', description: '', price: '', category: 'snacks', is_veg: true, preparation_time_mins: 10, is_available: true });
  const formRef = useRef(null);
  const itemNameInputRef = useRef(null);
  const shouldScrollToFormRef = useRef(false);

  useEffect(() => {
    if (!showForm || !shouldScrollToFormRef.current) {
      return;
    }

    shouldScrollToFormRef.current = false;

    window.requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      itemNameInputRef.current?.focus({ preventScroll: true });
      itemNameInputRef.current?.select?.();
    });
  }, [showForm, editing]);

  const handleSubmit = async () => {
    try {
      if (editing) {
        await updateItem({ id: editing, ...formData, price: Number(formData.price) });
      } else {
        await addItem({ ...formData, price: Number(formData.price) });
      }
      setShowForm(false);
      setEditing(null);
      setFormData({ item_name: '', description: '', price: '', category: 'snacks', is_veg: true, preparation_time_mins: 10, is_available: true });
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to save item');
    }
  };

  const startEdit = (item) => {
    shouldScrollToFormRef.current = true;
    setEditing(item.id);
    setFormData({ item_name: item.item_name, description: item.description || '', price: String(item.price), category: item.category || 'snacks', is_veg: item.is_veg, preparation_time_mins: item.preparation_time_mins || 10, is_available: item.is_available });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    try { await deleteItem(id); } catch { alert('Failed to delete'); }
  };

  const updateFormField = (field, value) => {
    const nextValueByField = {
      item_name: sanitizeEntityName(value, FIELD_LIMITS.entityName),
      description: sanitizeMultilineText(value, FIELD_LIMITS.description),
      price: sanitizeDecimalInput(value),
    };

    setFormData((current) => ({
      ...current,
      [field]: nextValueByField[field] ?? value,
    }));
  };

  return (
    <div className="canteen-page">
      <div className="canteen-page-header">
        <button className="canteen-back-btn" onClick={() => navigate(-1)}><ArrowLeft size={18} /></button>
        <h1 className="canteen-page-title">Manage Menu</h1>
      </div>

      <div style={{ padding: 20, paddingBottom: 100 }}>
        {/* Add Button */}
        <button className="canteen-btn-small canteen-btn-small--primary" onClick={() => { shouldScrollToFormRef.current = false; setShowForm(!showForm); setEditing(null); }} style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px' }}>
          {showForm ? <X size={14} /> : <Plus size={14} />} {showForm ? 'Cancel' : 'Add Item'}
        </button>

        {/* Add/Edit Form */}
        {showForm && (
          <motion.div
            ref={formRef}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="canteen-checkout__section"
            style={{ marginBottom: 20, scrollMarginTop: 16 }}
          >
            <p className="canteen-checkout__section-title">{editing ? 'Edit Item' : 'New Item'}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input ref={itemNameInputRef} className="canteen-checkout__input" placeholder="Item name" value={formData.item_name} onChange={(e) => updateFormField('item_name', e.target.value)} maxLength={FIELD_LIMITS.entityName} />
              <textarea className="canteen-checkout__input" placeholder="Description" value={formData.description} onChange={(e) => updateFormField('description', e.target.value)} rows={2} maxLength={FIELD_LIMITS.description} style={{ resize: 'none' }} />
              <div style={{ display: 'flex', gap: 12 }}>
                <input className="canteen-checkout__input" type="number" placeholder="Price" value={formData.price} onChange={(e) => updateFormField('price', e.target.value)} {...STANDARD_INPUT_PROPS.price} style={{ flex: 1 }} />
                <select className="canteen-checkout__input" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} style={{ flex: 1 }}>
                  <option value="snacks">Snacks</option>
                  <option value="beverages">Beverages</option>
                  <option value="meals">Meals</option>
                  <option value="desserts">Desserts</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input type="checkbox" checked={formData.is_veg} onChange={(e) => setFormData({ ...formData, is_veg: e.target.checked })} />
                  <span style={{ color: formData.is_veg ? '#33aa33' : '#d45555' }}>{formData.is_veg ? '🟢 Veg' : '🔴 Non-Veg'}</span>
                </label>
                <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input type="checkbox" checked={formData.is_available} onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })} /> Available
                </label>
              </div>
              <button className="canteen-btn-small canteen-btn-small--primary" onClick={handleSubmit} style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', padding: 12 }}>
                <Save size={14} /> {editing ? 'Update Item' : 'Add Item'}
              </button>
            </div>
          </motion.div>
        )}

        {/* Menu List */}
        {isLoading ? (
          <div className="canteen-loading"><div className="canteen-loading-spinner" /></div>
        ) : menuItems.length === 0 ? (
          <div className="canteen-empty"><div className="canteen-empty__icon">📋</div><p className="canteen-empty__text">No menu items yet</p></div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
            {menuItems.map((item, idx) => (
              <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}
                style={{
                  background: '#1a1a1a', border: '1px solid #333', borderRadius: 16, padding: 16,
                  display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                  opacity: item.is_available ? 1 : 0.5, transition: 'border-color 0.2s',
                  minHeight: 200,
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#d45555'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = '#333'}
              >
                {/* Top: Name + Badge */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: item.is_veg ? '#33aa33' : '#d45555', flexShrink: 0 }} />
                    <span style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.3 }}>{item.item_name}</span>
                  </div>
                  {item.description && <p style={{ fontSize: 12, color: '#999', marginBottom: 10, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.description}</p>}
                </div>

                {/* Price + Availability */}
                <div style={{ marginBottom: 12 }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: '#d45555' }}>₹{item.price}</span>
                  {!item.is_available && <span style={{ fontSize: 11, color: '#ff6b6b', marginLeft: 8, padding: '2px 6px', background: '#331111', borderRadius: 4 }}>Unavailable</span>}
                  {item.preparation_time_mins && <p style={{ fontSize: 11, color: '#666', marginTop: 4 }}>⏱ {item.preparation_time_mins} min</p>}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="canteen-btn-small" onClick={() => startEdit(item)} style={{ flex: 1, padding: '8px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}><Edit2 size={13} /> Edit</button>
                  <button className="canteen-btn-small canteen-btn-small--danger" onClick={() => handleDelete(item.id)} style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={13} /></button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
