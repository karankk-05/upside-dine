import { X, Minus, Plus, Trash2 } from 'lucide-react';
import { useCartStore } from '../../../stores/cartStore';
import '../canteen.css';

export default function CartDrawer({ open, onClose, onCheckout }) {
  const { cart, updateQuantity, removeItem, clearCart, getTotal } = useCartStore();
  const total = getTotal();

  if (!open) return null;

  return (
    <>
      <div className="canteen-cart-overlay" onClick={onClose} />
      <div className="canteen-cart-drawer">
        <div className="canteen-cart-drawer__header">
          <h2 className="canteen-cart-drawer__title">Your Cart</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {cart.length === 0 ? (
          <div className="canteen-empty">
            <div className="canteen-empty__icon">🛒</div>
            <p className="canteen-empty__text">Your cart is empty</p>
          </div>
        ) : (
          <>
            {cart.map((item) => (
              <div key={item.id} className="canteen-cart-item">
                <div>
                  <div className="canteen-cart-item__name">{item.name}</div>
                  <div className="canteen-cart-item__price">₹{item.price} each</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className="canteen-qty-stepper">
                    <button onClick={() => updateQuantity(item.id, Math.max(0, item.quantity - 1))}>
                      <Minus size={14} />
                    </button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                      <Plus size={14} />
                    </button>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 600, minWidth: 50, textAlign: 'right' }}>
                    ₹{item.price * item.quantity}
                  </span>
                  <button onClick={() => removeItem(item.id)} style={{
                    background: 'transparent', border: 'none', color: '#ff6b6b', cursor: 'pointer', padding: 4,
                  }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}

            <div className="canteen-cart-summary">
              <div className="canteen-cart-summary__row">
                <span style={{ color: '#999' }}>Subtotal</span>
                <span className="canteen-cart-summary__total">₹{total}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <button className="canteen-btn-small" onClick={clearCart} style={{ flex: 1 }}>Clear Cart</button>
              <button className="canteen-btn-small canteen-btn-small--primary" onClick={onCheckout} style={{ flex: 2 }}>
                Checkout • ₹{total}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}