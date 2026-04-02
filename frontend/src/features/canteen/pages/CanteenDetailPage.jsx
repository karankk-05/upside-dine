import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingCart } from 'lucide-react';
import { useCanteenDetail } from '../hooks/useCanteenDetail';
import { useCanteenMenu } from '../hooks/useCanteenMenu';
import { useCartStore } from '../../../stores/cartStore';
import MenuItemCard from '../components/MenuItemCard';
import CartDrawer from '../components/CartDrawer';
import '../canteen.css';

export default function CanteenDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [orderType, setOrderType] = useState('pickup');
  const [cartOpen, setCartOpen] = useState(false);
  const { data: canteen, isLoading: loadingCanteen } = useCanteenDetail(id);
  const { data: menuItems = [], isLoading: loadingMenu } = useCanteenMenu(id);
  const { cart, getTotal, getItemCount } = useCartStore();
  const itemCount = getItemCount();
  const total = getTotal();

  const emojis = ['🍕', '🍔', '🥡', '☕', '🍜', '🧁'];

  if (loadingCanteen) {
    return <div className="canteen-page"><div className="canteen-loading"><div className="canteen-loading-spinner" /><span style={{ color: '#999' }}>Loading...</span></div></div>;
  }

  return (
    <div className="canteen-page">
      {/* Header */}
      <div className="canteen-page-header">
        <button className="canteen-back-btn" onClick={() => navigate(-1)}><ArrowLeft size={18} /></button>
        <h1 className="canteen-page-title">{canteen?.name || 'Canteen'}</h1>
      </div>

      {/* Canteen Info */}
      <div className="canteen-detail-header">
        <div className="canteen-detail-hero">
          <div className="canteen-detail-icon">{emojis[Number(id) % emojis.length]}</div>
          <div className="canteen-detail-meta">
            <h2 className="canteen-detail-name">{canteen?.name}</h2>
            <div className="canteen-detail-status">
              <span style={{ width: 8, height: 8, background: '#00ff00', borderRadius: '50%', boxShadow: '0 0 8px #00ff00' }} />
              <span>Open Now{canteen?.opening_time ? ` • ${canteen.opening_time.slice(0,5)} - ${canteen.closing_time?.slice(0,5)}` : ''}</span>
            </div>
            <div className="canteen-detail-rating">
              ⭐ {canteen?.rating || '4.0'} • {canteen?.location || ''}
            </div>
          </div>
        </div>

        {/* Order Type Toggle */}
        <div className="canteen-order-type">
          {['pickup', 'delivery'].map((type) => (
            <button key={type} className={`canteen-order-type-btn ${orderType === type ? 'active' : ''}`} onClick={() => setOrderType(type)}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Menu */}
      <div className="canteen-menu">
        <h3 className="canteen-menu-section-title">Menu Items</h3>
        {loadingMenu ? (
          <div className="canteen-loading"><div className="canteen-loading-spinner" /></div>
        ) : menuItems.length === 0 ? (
          <div className="canteen-empty"><div className="canteen-empty__icon">📋</div><p className="canteen-empty__text">No menu items available</p></div>
        ) : (
          menuItems.map((item, i) => (
            <MenuItemCard key={item.id} item={item} canteenId={Number(id)} index={i} />
          ))
        )}
      </div>

      {/* Cart Bar */}
      {itemCount > 0 && (
        <div className="canteen-cart-bar">
          <button className="canteen-cart-bar__btn" onClick={() => setCartOpen(true)}>
            <span><ShoppingCart size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />View Cart</span>
            <span>{itemCount} items • ₹{total}</span>
          </button>
        </div>
      )}

      {/* Cart Drawer */}
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} onCheckout={() => { setCartOpen(false); navigate('/checkout'); }} />
    </div>
  );
}