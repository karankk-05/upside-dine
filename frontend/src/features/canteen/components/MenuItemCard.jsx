import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';
import { useCartStore } from '../../../stores/cartStore';
import '../canteen.css';

const MenuItemCard = forwardRef(function MenuItemCard(
  { item, canteenId, index = 0, isHighlighted = false },
  ref
) {
  const cart = useCartStore((state) => state.getCart(canteenId));
  const addItem = useCartStore((state) => state.addItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const quantity = cart.find((cartItem) => cartItem.id === item.id)?.quantity || 0;
  const isVeg = item.is_veg;
  const isAvailable = item.is_available && item.available_quantity > 0;

  const handleAdd = () => {
    if (!isAvailable) return;
    addItem({ id: item.id, name: item.item_name, price: item.price, canteen_id: canteenId });
  };

  const handleDecrement = () => {
    updateQuantity(canteenId, item.id, quantity <= 1 ? 0 : quantity - 1);
  };

  return (
    <motion.div
      ref={ref}
      id={`canteen-menu-item-${item.id}`}
      className={`canteen-menu-item ${!isAvailable ? 'canteen-menu-item--unavailable' : ''} ${isHighlighted ? 'canteen-menu-item--highlighted' : ''}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.05 }}
    >
      <div className="canteen-menu-item__info">
        <div className="canteen-menu-item__name-row">
          <span className={`canteen-menu-item__veg-dot ${isVeg ? 'canteen-menu-item__veg-dot--veg' : 'canteen-menu-item__veg-dot--nonveg'}`} />
          <span className="canteen-menu-item__name">{item.item_name}</span>
        </div>
        {item.description && <p className="canteen-menu-item__desc">{item.description}</p>}
        <div className="canteen-menu-item__meta">
          <span className="canteen-menu-item__price">₹{item.price}</span>
          {item.preparation_time_mins && <span className="canteen-menu-item__prep">⏱ {item.preparation_time_mins} min</span>}
        </div>
        {!isAvailable && <p style={{ fontSize: 12, color: '#ff6b6b', marginTop: 4 }}>Out of stock</p>}
      </div>

      <div className="canteen-menu-item__actions">
        {item.image_url && <img className="canteen-menu-item__image" src={item.image_url} alt={item.item_name} />}
        {quantity === 0 ? (
          <button className="canteen-btn-add" onClick={handleAdd} disabled={!isAvailable}>Add</button>
        ) : (
          <div className="canteen-qty-stepper">
            <button onClick={handleDecrement}><Minus size={14} /></button>
            <span>{quantity}</span>
            <button onClick={handleAdd}><Plus size={14} /></button>
          </div>
        )}
      </div>
    </motion.div>
  );
});

export default MenuItemCard;
