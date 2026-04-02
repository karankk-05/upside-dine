const MenuItemCard = ({ item, onBook, showQuantity = true }) => {
  const getQtyClass = (qty) => {
    if (qty > 20) return 'mess-qty-high';
    if (qty > 5) return 'mess-qty-medium';
    return 'mess-qty-low';
  };

  return (
    <div className="mess-menu-item" id={`menu-item-${item.id}`}>
      <div className="mess-menu-item-info">
        <div className="mess-menu-item-name">{item.item_name}</div>
        {item.description && (
          <div className="mess-menu-item-desc">{item.description}</div>
        )}
        <div className="mess-menu-item-meta">
          <span className="mess-menu-item-price">₹{item.price}</span>
          <span className={`mess-badge ${item.meal_type}`}>{item.meal_type}</span>
          {showQuantity && (
            <span className={getQtyClass(item.available_quantity)}>
              ● {item.available_quantity} left
            </span>
          )}
        </div>
      </div>
      {onBook && item.available_quantity > 0 && (
        <div className="mess-menu-item-actions">
          <button
            className="mess-btn"
            onClick={(e) => {
              e.stopPropagation();
              onBook(item);
            }}
          >
            Book
          </button>
        </div>
      )}
    </div>
  );
};

export default MenuItemCard;
