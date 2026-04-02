import { useState } from 'react';
import { Search } from 'lucide-react';
import { useMenuSearch } from '../hooks/useMenuSearch';
import '../canteen.css';

export default function MenuSearch({ onSelectItem }) {
  const [query, setQuery] = useState('');
  const { data: results = [], isLoading } = useMenuSearch(query);

  return (
    <div style={{ padding: 20 }}>
      <div className="canteen-search">
        <input
          className="canteen-search__input"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for food, canteen..."
        />
        <span className="canteen-search__icon"><Search size={18} /></span>
      </div>

      {isLoading && <div className="canteen-loading"><div className="canteen-loading-spinner" /><span style={{ color: '#999' }}>Searching...</span></div>}

      {!isLoading && query && results.length === 0 && (
        <div className="canteen-empty">
          <div className="canteen-empty__icon">🔍</div>
          <p className="canteen-empty__text">No items found for "{query}"</p>
        </div>
      )}

      {results.map((item) => (
        <div
          key={item.id}
          className="canteen-menu-item"
          onClick={() => onSelectItem?.(item)}
          style={{ cursor: 'pointer' }}
        >
          <div className="canteen-menu-item__info">
            <div className="canteen-menu-item__name-row">
              <span className="canteen-menu-item__name">{item.item_name}</span>
            </div>
            {item.canteen_name && <p className="canteen-menu-item__desc">from {item.canteen_name}</p>}
            <span className="canteen-menu-item__price">₹{item.price}</span>
          </div>
        </div>
      ))}
    </div>
  );
}