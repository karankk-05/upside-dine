import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { useManagerInventory, useUpdateInventory } from '../hooks/useManagerInventory';
import '../mess.css';

const ManagerInventoryPage = () => {
  const navigate = useNavigate();
  const { data: items, isLoading, isError } = useManagerInventory();
  const updateMutation = useUpdateInventory();
  const [editingId, setEditingId] = useState(null);
  const [editQty, setEditQty] = useState('');

  const handleSave = async (itemId) => {
    const qty = parseInt(editQty);
    if (isNaN(qty) || qty < 0) return;
    try {
      await updateMutation.mutateAsync({ menu_item_id: itemId, available_quantity: qty });
      setEditingId(null);
      setEditQty('');
    } catch { /* handled */ }
  };

  return (
    <div className="mess-page">
      <div className="mess-page-header">
        <button className="mess-back-btn" onClick={() => navigate('/manager/mess')}><ArrowLeft size={18} /></button>
        <h1 className="mess-page-title">Inventory</h1>
      </div>

      <div className="mess-content">
        <h3 className="mess-section-title" style={{ marginBottom: 16 }}>Update Available Quantities</h3>

        {isLoading ? (
          <div className="mess-loading"><div className="mess-loading-spinner" /><span className="mess-loading-text">Loading inventory...</span></div>
        ) : isError ? (
          <div className="mess-error">Inventory currently not available.</div>
        ) : (items || []).length === 0 ? (
          <div className="mess-empty"><div className="mess-empty-icon">📦</div><div>No inventory items</div></div>
        ) : (
          (items || []).map((item) => (
            <div key={item.id} className="mess-inventory-item">
              <div className="mess-inventory-info">
                <div className="mess-inventory-name">{item.item_name}</div>
                <div className="mess-inventory-meta">₹{item.price} · {item.meal_type} · {item.day_of_week}</div>
                <span className={item.available_quantity > 20 ? 'mess-qty-high' : item.available_quantity > 5 ? 'mess-qty-medium' : 'mess-qty-low'}>
                  ● {item.available_quantity} / {item.default_quantity}
                </span>
              </div>
              <div className="mess-inventory-qty">
                {editingId === item.id ? (
                  <>
                    <input className="mess-inventory-qty-input" type="number" min="0" value={editQty} onChange={(e) => setEditQty(e.target.value)} autoFocus />
                    <button className="mess-btn-small" onClick={() => handleSave(item.id)} disabled={updateMutation.isPending} style={{ padding: '8px 12px' }}><Save size={14} /></button>
                  </>
                ) : (
                  <button className="mess-btn-outline" onClick={() => { setEditingId(item.id); setEditQty(String(item.available_quantity)); }}>Update</button>
                )}
              </div>
            </div>
          ))
        )}

        {updateMutation.isError && (
          <div style={{ background: 'rgba(255,51,51,0.1)', border: '1px solid #ff3333', borderRadius: 8, padding: 12, marginTop: 16, color: '#ff3333', fontSize: 13, textAlign: 'center' }}>
            {updateMutation.error?.response?.data?.detail || 'Unable to update inventory.'}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagerInventoryPage;
