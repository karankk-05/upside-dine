import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, SlidersHorizontal, X } from 'lucide-react';
import { useCanteenDetail } from '../hooks/useCanteenDetail';
import { useCanteenMenu } from '../hooks/useCanteenMenu';
import { useCartStore } from '../../../stores/cartStore';
import MenuItemCard from '../components/MenuItemCard';
import CartDrawer from '../components/CartDrawer';
import InfiniteScrollSentinel from '../../../components/InfiniteScrollSentinel';
import { useIncrementalList } from '../../../hooks/useIncrementalList';
import '../canteen.css';

const DIET_OPTIONS = [
  { value: 'all', label: 'All Items' },
  { value: 'veg', label: 'Veg' },
  { value: 'non-veg', label: 'Non-Veg' },
];

const SORT_OPTIONS = [
  { value: 'default', label: 'Default' },
  { value: 'name', label: 'Name A-Z' },
  { value: 'price-low-high', label: 'Price Low-High' },
  { value: 'price-high-low', label: 'Price High-Low' },
];

const FilterChoiceButton = ({ active, children, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      padding: '10px 14px',
      borderRadius: 12,
      border: active ? '1px solid #d45555' : '1px solid #333',
      background: active ? 'rgba(212,85,85,0.16)' : '#1a1a1a',
      color: active ? '#ff8b8b' : '#ddd',
      fontSize: 13,
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    }}
  >
    {children}
  </button>
);

const getOptionLabel = (options, value, fallback) =>
  options.find((option) => option.value === value)?.label || fallback;

const MENU_SKELETON_COUNT = 6;

const CanteenHeroSkeleton = () => (
  <div className="canteen-detail-header">
    <div className="canteen-detail-hero">
      <div className="canteen-detail-icon canteen-detail-icon--skeleton ui-skeleton" />
      <div className="canteen-detail-meta">
        <div className="ui-skeleton ui-skeleton-text" style={{ width: '58%', height: 24, marginBottom: 10 }} />
        <div className="ui-skeleton ui-skeleton-text" style={{ width: '72%', height: 12, marginBottom: 10 }} />
        <div className="ui-skeleton ui-skeleton-text" style={{ width: '44%', height: 12 }} />
      </div>
    </div>
  </div>
);

const MenuItemSkeletonCard = ({ index = 0 }) => (
  <div className="canteen-menu-item canteen-menu-item--skeleton" style={{ animationDelay: `${index * 0.05}s` }}>
    <div className="canteen-menu-item__info">
      <div className="canteen-menu-item__name-row" style={{ marginBottom: 10 }}>
        <span className="ui-skeleton ui-skeleton-circle" style={{ width: 10, height: 10 }} />
        <span className="ui-skeleton ui-skeleton-text" style={{ width: '44%', height: 16 }} />
      </div>
      <div className="ui-skeleton ui-skeleton-text" style={{ width: '78%', height: 12, marginBottom: 8 }} />
      <div className="ui-skeleton ui-skeleton-text" style={{ width: '62%', height: 12, marginBottom: 14 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span className="ui-skeleton ui-skeleton-text" style={{ width: 54, height: 16 }} />
        <span className="ui-skeleton ui-skeleton-text" style={{ width: 72, height: 12 }} />
      </div>
    </div>

    <div className="canteen-menu-item__actions">
      <div className="ui-skeleton ui-skeleton-card" style={{ width: 80, height: 80, borderRadius: 12 }} />
      <div className="ui-skeleton ui-skeleton-card" style={{ width: 72, height: 36, borderRadius: 10 }} />
    </div>
  </div>
);

export default function CanteenDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [cartOpen, setCartOpen] = useState(false);
  const [dietPref, setDietPref] = useState('all');
  const [sortBy, setSortBy] = useState('default');
  const [showFilters, setShowFilters] = useState(false);
  const [highlightedItemId, setHighlightedItemId] = useState(null);
  const [draftFilters, setDraftFilters] = useState({
    dietPref: 'all',
    sortBy: 'default',
  });
  const { data: canteen, isLoading: loadingCanteen } = useCanteenDetail(id);
  const { data: menuItems = [], isLoading: loadingMenu } = useCanteenMenu(id);
  const { getTotal, getItemCount } = useCartStore();
  const itemCount = getItemCount();
  const total = getTotal();
  const isCanteenLoading = loadingCanteen && !canteen;
  const isMenuLoading = loadingMenu && menuItems.length === 0;

  const emojis = ['🍕', '🍔', '🥡', '☕', '🍜', '🧁'];
  const filteredMenuItems = useMemo(() => {
    const visibleItems = menuItems.filter((item) => {
      if (dietPref === 'veg') return item.is_veg === true;
      if (dietPref === 'non-veg') return item.is_veg === false;
      return true;
    });

    const sortedItems = [...visibleItems];
    if (sortBy === 'name') {
      sortedItems.sort((a, b) => a.item_name.localeCompare(b.item_name));
    } else if (sortBy === 'price-low-high') {
      sortedItems.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    } else if (sortBy === 'price-high-low') {
      sortedItems.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    }

    return sortedItems;
  }, [dietPref, menuItems, sortBy]);
  const {
    visibleItems: visibleMenuItems,
    visibleCount,
    hasMore,
    loadMore,
    showThroughIndex,
  } = useIncrementalList(filteredMenuItems, {
    initialCount: 8,
    step: 6,
    resetKey: `${dietPref}:${sortBy}`,
  });
  const requestedHighlightItemId = location.state?.highlightItemId ?? null;
  const activeFilterSummary = useMemo(() => {
    const summary = [];

    if (dietPref !== 'all') {
      summary.push(getOptionLabel(DIET_OPTIONS, dietPref, dietPref));
    }
    if (sortBy !== 'default') {
      summary.push(getOptionLabel(SORT_OPTIONS, sortBy, sortBy));
    }

    return summary;
  }, [dietPref, sortBy]);

  const openFilters = () => {
    setDraftFilters({ dietPref, sortBy });
    setShowFilters(true);
  };

  const closeFilters = () => {
    setShowFilters(false);
  };

  const applyFilters = () => {
    setDietPref(draftFilters.dietPref);
    setSortBy(draftFilters.sortBy);
    setShowFilters(false);
  };

  const clearDraftFilters = () => {
    setDraftFilters({
      dietPref: 'all',
      sortBy: 'default',
    });
  };

  useEffect(() => {
    if (!requestedHighlightItemId) {
      return;
    }

    const targetIndex = filteredMenuItems.findIndex((item) => item.id === requestedHighlightItemId);
    if (targetIndex === -1) {
      return;
    }

    showThroughIndex(targetIndex);
  }, [filteredMenuItems, requestedHighlightItemId, showThroughIndex]);

  useEffect(() => {
    if (!requestedHighlightItemId) {
      return;
    }

    const targetIndex = filteredMenuItems.findIndex((item) => item.id === requestedHighlightItemId);
    if (targetIndex === -1 || targetIndex >= visibleCount) {
      return;
    }

    const animationFrame = window.requestAnimationFrame(() => {
      const targetElement = document.getElementById(`canteen-menu-item-${requestedHighlightItemId}`);
      if (!targetElement) {
        return;
      }

      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
      setHighlightedItemId(requestedHighlightItemId);
    });

    return () => window.cancelAnimationFrame(animationFrame);
  }, [filteredMenuItems, requestedHighlightItemId, visibleCount]);

  useEffect(() => {
    if (!highlightedItemId) {
      return;
    }

    const clearHighlightTimeout = window.setTimeout(() => {
      setHighlightedItemId(null);
      if (location.state?.highlightItemId) {
        navigate(location.pathname, { replace: true, state: {} });
      }
    }, 5000);

    return () => window.clearTimeout(clearHighlightTimeout);
  }, [highlightedItemId, location.pathname, location.state, navigate]);

  return (
    <div className="canteen-page">
      {/* Header */}
      <div className="canteen-page-header">
        <button className="canteen-back-btn" onClick={() => navigate(-1)}><ArrowLeft size={18} /></button>
        <h1 className="canteen-page-title">
          {canteen?.name || (isCanteenLoading ? <span className="ui-skeleton ui-skeleton-text canteen-page-title-skeleton" /> : 'Canteen')}
        </h1>
      </div>

      {/* Canteen Info */}
      {isCanteenLoading ? (
        <CanteenHeroSkeleton />
      ) : (
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
        </div>
      )}

      {/* Menu */}
      <div className="canteen-menu">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <div>
            <h3 className="canteen-menu-section-title" style={{ marginBottom: 6 }}>Menu Items</h3>
            {isMenuLoading ? (
              <div className="ui-skeleton ui-skeleton-text" style={{ width: 104, height: 12 }} />
            ) : (
              <p style={{ fontSize: 13, color: '#999', margin: 0 }}>
                {activeFilterSummary.length > 0
                  ? activeFilterSummary.join(' • ')
                  : 'All items'}
              </p>
            )}
          </div>
          {isMenuLoading ? (
            <div className="ui-skeleton ui-skeleton-card" style={{ width: 108, height: 40, borderRadius: 12 }} />
          ) : (
            <button
              type="button"
              onClick={openFilters}
              style={{
                minHeight: 40,
                padding: '0 14px',
                borderRadius: 12,
                background: '#1a1a1a',
                color: '#fff',
                border: '1px solid #333',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <SlidersHorizontal size={16} />
              Filters{activeFilterSummary.length > 0 ? ` (${activeFilterSummary.length})` : ''}
            </button>
          )}
        </div>
        {isMenuLoading ? (
          <div>
            {Array.from({ length: MENU_SKELETON_COUNT }).map((_, index) => (
              <MenuItemSkeletonCard key={`canteen-menu-skeleton-${index}`} index={index} />
            ))}
          </div>
        ) : menuItems.length === 0 ? (
          <div className="canteen-empty"><div className="canteen-empty__icon">📋</div><p className="canteen-empty__text">No menu items available</p></div>
        ) : filteredMenuItems.length === 0 ? (
          <div className="canteen-empty"><div className="canteen-empty__icon">🥗</div><p className="canteen-empty__text">No items match this filter</p></div>
        ) : (
          <>
            {visibleMenuItems.map((item, i) => (
              <MenuItemCard
                key={item.id}
                item={item}
                canteenId={Number(id)}
                index={i}
                isHighlighted={highlightedItemId === item.id}
              />
            ))}
            <InfiniteScrollSentinel
              hasMore={hasMore}
              onLoadMore={loadMore}
              skeletonCount={2}
              minHeight={124}
            />
          </>
        )}
      </div>

      {/* Cart Bar */}
      {itemCount > 0 && (
        <div className="canteen-cart-bar">
          <button className="canteen-cart-bar__btn" onClick={() => setCartOpen(true)}>
            <span className="canteen-cart-bar__content">
              <span className="canteen-cart-bar__primary">
                <ShoppingCart size={18} />
                <span>View Cart</span>
              </span>
              <span className="canteen-cart-bar__meta">
                <span className="canteen-cart-bar__total">₹{total}</span>
                <span className="canteen-cart-bar__count">
                  {itemCount} {itemCount === 1 ? 'item' : 'items'}
                </span>
              </span>
            </span>
          </button>
        </div>
      )}

      {/* Cart Drawer */}
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} onCheckout={() => { setCartOpen(false); navigate('/checkout'); }} />

      {showFilters ? (
        <div
          onClick={closeFilters}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.72)',
            backdropFilter: 'blur(4px)',
            zIndex: 220,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 480,
              background: '#111',
              border: '1px solid #2a2a2a',
              borderRadius: 24,
              padding: 20,
              boxShadow: '0 -12px 48px rgba(0, 0, 0, 0.45)',
              maxHeight: '85vh',
              overflowY: 'auto',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: 12,
                marginBottom: 20,
              }}
            >
              <div>
                <h3 style={{ fontSize: 18, color: '#fff', marginBottom: 6 }}>Filters</h3>
                <p style={{ fontSize: 13, color: '#999', margin: 0 }}>
                  Choose diet preference and sort order in one place.
                </p>
              </div>
              <button
                type="button"
                onClick={closeFilters}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  border: '1px solid #333',
                  background: '#1a1a1a',
                  color: '#fff',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 10 }}>
                Diet Preference
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {DIET_OPTIONS.map((option) => (
                  <FilterChoiceButton
                    key={option.value}
                    active={draftFilters.dietPref === option.value}
                    onClick={() =>
                      setDraftFilters((current) => ({ ...current, dietPref: option.value }))
                    }
                  >
                    {option.label}
                  </FilterChoiceButton>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 10 }}>
                Sort
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {SORT_OPTIONS.map((option) => (
                  <FilterChoiceButton
                    key={option.value}
                    active={draftFilters.sortBy === option.value}
                    onClick={() =>
                      setDraftFilters((current) => ({ ...current, sortBy: option.value }))
                    }
                  >
                    {option.label}
                  </FilterChoiceButton>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                type="button"
                onClick={clearDraftFilters}
                style={{
                  flex: 1,
                  minHeight: 46,
                  borderRadius: 12,
                  border: '1px solid #333',
                  background: 'transparent',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Clear All
              </button>
              <button
                type="button"
                onClick={applyFilters}
                style={{
                  flex: 1.2,
                  minHeight: 46,
                  borderRadius: 12,
                  border: 'none',
                  background: 'linear-gradient(135deg, #d45555, #f06666)',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
