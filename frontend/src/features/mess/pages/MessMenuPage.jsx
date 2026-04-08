import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, SlidersHorizontal, X } from 'lucide-react';
import { useMessMenu } from '../hooks/useMessMenu';
import InfiniteScrollSentinel from '../../../components/InfiniteScrollSentinel';
import { useIncrementalList } from '../../../hooks/useIncrementalList';
import MenuItemCard from '../components/MenuItemCard';
import ExtrasBookingModal from '../components/ExtrasBookingModal';
import '../mess.css';

const MEAL_TYPES = [
  { value: '', label: 'All' },
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snack' },
];

const DAYS = [
  { value: '', label: 'All Days' },
  { value: 'monday', label: 'Mon' },
  { value: 'tuesday', label: 'Tue' },
  { value: 'wednesday', label: 'Wed' },
  { value: 'thursday', label: 'Thu' },
  { value: 'friday', label: 'Fri' },
  { value: 'saturday', label: 'Sat' },
  { value: 'sunday', label: 'Sun' },
];

const SORT_OPTIONS = [
  { value: 'default', label: 'Default' },
  { value: 'name', label: 'Name A-Z' },
  { value: 'price-low-high', label: 'Price Low-High' },
  { value: 'price-high-low', label: 'Price High-Low' },
];

const DAY_SECTION_ORDER = DAYS.filter((day) => day.value);

const FilterChoiceButton = ({ active, children, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      padding: '10px 14px',
      borderRadius: 12,
      border: active ? '1px solid #d45555' : '1px solid var(--st-border)',
      background: active ? 'rgba(212,85,85,0.16)' : 'var(--st-gray)',
      color: active ? '#ff7d7d' : 'var(--st-text-dim)',
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

const MessMenuPage = () => {
  const { messId } = useParams();
  const navigate = useNavigate();
  const [mealType, setMealType] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState('');
  const [bookingItem, setBookingItem] = useState(null);
  const [sortBy, setSortBy] = useState('default');
  const [showFilters, setShowFilters] = useState(false);
  const [draftFilters, setDraftFilters] = useState({
    mealType: '',
    dayOfWeek: '',
    sortBy: 'default',
  });

  const filters = {};
  if (mealType) filters.meal_type = mealType;
  if (dayOfWeek) filters.day_of_week = dayOfWeek;

  const { data: menuItems, isLoading, isError } = useMessMenu(messId, filters);

  const handleBookingSuccess = (result) => {
    setBookingItem(null);
    navigate(`/mess/bookings/${result.id}`);
  };

  const displayItems = useMemo(() => {
    const items = [...(menuItems || [])];

    if (sortBy === 'name') {
      items.sort((a, b) => a.item_name.localeCompare(b.item_name));
    } else if (sortBy === 'price-low-high') {
      items.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    } else if (sortBy === 'price-high-low') {
      items.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    }

    return items;
  }, [menuItems, sortBy]);
  const {
    visibleItems: visibleDisplayItems,
    hasMore: hasMoreVisibleItems,
    loadMore: loadMoreVisibleItems,
  } = useIncrementalList(displayItems, {
    initialCount: 8,
    step: 6,
    resetKey: `${mealType}:${dayOfWeek}:${sortBy}:${displayItems.length}`,
  });

  const groupedDisplayItems = useMemo(
    () =>
      DAY_SECTION_ORDER.reduce((sections, day) => {
        const dayItems = displayItems.filter((item) => item.day_of_week === day.value);
        if (dayItems.length > 0) {
          sections.push({
            day: day.value,
            label: day.label,
            items: dayItems,
          });
        }
        return sections;
      }, []),
    [displayItems]
  );

  const {
    visibleItems: visibleDaySections,
    hasMore: hasMoreDaySections,
    loadMore: loadMoreDaySections,
  } = useIncrementalList(groupedDisplayItems, {
    initialCount: 2,
    step: 2,
    resetKey: `${mealType}:${sortBy}:${groupedDisplayItems.length}`,
  });

  const activeFilterCount = [mealType, dayOfWeek, sortBy !== 'default']
    .filter(Boolean)
    .length;

  const activeFilterSummary = useMemo(() => {
    const summary = [];

    if (mealType) {
      summary.push(getOptionLabel(MEAL_TYPES, mealType, mealType));
    }
    if (dayOfWeek) {
      summary.push(getOptionLabel(DAYS, dayOfWeek, dayOfWeek));
    }
    if (sortBy !== 'default') {
      summary.push(getOptionLabel(SORT_OPTIONS, sortBy, sortBy));
    }

    return summary;
  }, [dayOfWeek, mealType, sortBy]);

  const openFilters = () => {
    setDraftFilters({ mealType, dayOfWeek, sortBy });
    setShowFilters(true);
  };

  const closeFilters = () => {
    setShowFilters(false);
  };

  const applyFilters = () => {
    setMealType(draftFilters.mealType);
    setDayOfWeek(draftFilters.dayOfWeek);
    setSortBy(draftFilters.sortBy);
    setShowFilters(false);
  };

  const clearDraftFilters = () => {
    setDraftFilters({
      mealType: '',
      dayOfWeek: '',
      sortBy: 'default',
    });
  };

  return (
    <div className="mess-page">
      <div className="mess-page-header">
        <button className="mess-back-btn" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={18} />
        </button>
        <h1 className="mess-page-title">Book Extras</h1>
      </div>

      <div className="mess-content">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 12,
            marginBottom: 16,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <h3 style={{ fontSize: 16, color: 'var(--st-text)', marginBottom: 6 }}>
              Available Extras
            </h3>
            <p style={{ fontSize: 13, color: 'var(--st-text-dim)', margin: 0 }}>
              {activeFilterSummary.length > 0
                ? activeFilterSummary.join(' • ')
                : 'All meals • All days'}
            </p>
          </div>
          <button
            type="button"
            onClick={openFilters}
            style={{
              minHeight: 42,
              padding: '0 14px',
              background: 'var(--st-gray)',
              border: '1px solid var(--st-border)',
              color: 'var(--st-text)',
              borderRadius: 12,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <SlidersHorizontal size={16} />
            Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
          </button>
        </div>

        {isLoading ? (
          <div className="mess-loading">
            <div className="mess-loading-spinner" />
            <span className="mess-loading-text">Loading menu...</span>
          </div>
        ) : isError ? (
          <div className="mess-error">Menu currently not available.</div>
        ) : (menuItems || []).length === 0 ? (
          <div className="mess-empty">
            <div className="mess-empty-icon">🍽️</div>
            <div>No menu items available for this selection.</div>
          </div>
        ) : dayOfWeek === '' ? (
          <div>
            {visibleDaySections.map((section) => (
              <div key={section.day} style={{ marginBottom: 32 }}>
                <h3
                  style={{
                    fontSize: 16,
                    color: 'var(--st-accent)',
                    marginBottom: 16,
                    borderBottom: '1px solid var(--st-border)',
                    paddingBottom: 8,
                  }}
                >
                  {section.label}
                </h3>
                <div className="mess-menu-grid">
                  {section.items.map((item) => (
                    <MenuItemCard key={item.id} item={item} onBook={setBookingItem} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : displayItems.length === 0 ? (
          <div className="mess-empty">
            <div className="mess-empty-icon">🍽️</div>
            <div>No menu items available for this selection.</div>
          </div>
        ) : (
          <div className="mess-menu-grid">
            {visibleDisplayItems.map((item) => (
              <MenuItemCard key={item.id} item={item} onBook={setBookingItem} />
            ))}
          </div>
        )}

        {displayItems.length > 0 ? (
          <InfiniteScrollSentinel
            hasMore={dayOfWeek === '' ? hasMoreDaySections : hasMoreVisibleItems}
            onLoadMore={dayOfWeek === '' ? loadMoreDaySections : loadMoreVisibleItems}
            skeletonCount={2}
            minHeight={164}
            columns={2}
          />
        ) : null}

        <div className="mess-note">
          <strong>Note:</strong> After booking, you'll receive a QR code valid until the end of the day. The amount will be deducted from your mess account.
        </div>
      </div>

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
                <p style={{ fontSize: 13, color: 'var(--st-text-dim)', margin: 0 }}>
                  Choose meal type, day, and sort order in one place.
                </p>
              </div>
              <button
                type="button"
                onClick={closeFilters}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  border: '1px solid var(--st-border)',
                  background: 'var(--st-gray)',
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
                Meal Type
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {MEAL_TYPES.map((meal) => (
                  <FilterChoiceButton
                    key={meal.value}
                    active={draftFilters.mealType === meal.value}
                    onClick={() =>
                      setDraftFilters((current) => ({ ...current, mealType: meal.value }))
                    }
                  >
                    {meal.label}
                  </FilterChoiceButton>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 10 }}>
                Day
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {DAYS.map((day) => (
                  <FilterChoiceButton
                    key={day.value}
                    active={draftFilters.dayOfWeek === day.value}
                    onClick={() =>
                      setDraftFilters((current) => ({ ...current, dayOfWeek: day.value }))
                    }
                  >
                    {day.label}
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
                  border: '1px solid var(--st-border)',
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

      {bookingItem && (
        <ExtrasBookingModal item={bookingItem} onClose={() => setBookingItem(null)} onSuccess={handleBookingSuccess} />
      )}
    </div>
  );
};

export default MessMenuPage;
