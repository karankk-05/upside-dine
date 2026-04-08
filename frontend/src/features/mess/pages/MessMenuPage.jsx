import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useMessMenu } from '../hooks/useMessMenu';
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

const MessMenuPage = () => {
  const { messId } = useParams();
  const navigate = useNavigate();
  const [mealType, setMealType] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState('');
  const [bookingItem, setBookingItem] = useState(null);
  const [dietPref, setDietPref] = useState('all');

  const filters = {};
  if (mealType) filters.meal_type = mealType;
  if (dayOfWeek) filters.day_of_week = dayOfWeek;

  const { data: menuItems, isLoading, isError } = useMessMenu(messId, filters);

  const handleBookingSuccess = (result) => {
    setBookingItem(null);
    navigate(`/mess/bookings/${result.id}`);
  };

  const displayItems = (menuItems || []).filter(item => {
    if (dietPref === 'veg') return item.is_veg;
    if (dietPref === 'non-veg') return !item.is_veg;
    return true;
  });

  const groupedItems = displayItems.reduce((acc, item) => {
    if (!acc[item.day_of_week]) acc[item.day_of_week] = [];
    acc[item.day_of_week].push(item);
    return acc;
  }, {});

  return (
    <div className="mess-page">
      <div className="mess-page-header">
        <button className="mess-back-btn" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={18} />
        </button>
        <h1 className="mess-page-title">Book Extras</h1>
      </div>

      <div className="mess-content">
        <div className="mess-tabs">
          {MEAL_TYPES.map((mt) => (
            <button key={mt.value} className={`mess-tab ${mealType === mt.value ? 'active' : ''}`} onClick={() => setMealType(mt.value)}>
              {mt.label}
            </button>
          ))}
        </div>

        <div className="mess-tabs" style={{ marginBottom: 16 }}>
          {DAYS.map((d) => (
            <button key={d.value} className={`mess-tab ${dayOfWeek === d.value ? 'active' : ''}`} onClick={() => setDayOfWeek(d.value)}>
              {d.label}
            </button>
          ))}
        </div>

        <div className="mess-tabs" style={{ marginBottom: 16 }}>
          {[{ value: 'all', label: 'All' }, { value: 'veg', label: '🟢 Veg' }, { value: 'non-veg', label: '🔴 Non-Veg' }].map((d) => (
            <button key={d.value} className={`mess-tab ${dietPref === d.value ? 'active' : ''}`} onClick={() => setDietPref(d.value)}>
              {d.label}
            </button>
          ))}
        </div>

        <h3 style={{ fontSize: 14, color: 'var(--st-text-dim)', marginBottom: 16 }}>
          {mealType ? `${mealType.charAt(0).toUpperCase() + mealType.slice(1)} Menu` : "Today's Menu"}
        </h3>

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
            {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => {
              if (!groupedItems[day] || groupedItems[day].length === 0) return null;
              return (
                <div key={day} style={{ marginBottom: 32 }}>
                  <h3 style={{ fontSize: 16, color: 'var(--st-accent)', marginBottom: 16, textTransform: 'capitalize', borderBottom: '1px solid var(--st-border)', paddingBottom: 8 }}>
                    {day}
                  </h3>
                  <div className="mess-menu-grid">
                    {groupedItems[day].map((item) => (
                      <MenuItemCard key={item.id} item={item} onBook={setBookingItem} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : displayItems.length === 0 ? (
          <div className="mess-empty">
            <div className="mess-empty-icon">🍽️</div>
            <div>No matching dietary items found.</div>
          </div>
        ) : (
          <div className="mess-menu-grid">
            {displayItems.map((item) => (
              <MenuItemCard key={item.id} item={item} onBook={setBookingItem} />
            ))}
          </div>
        )}

        <div className="mess-note">
          <strong>Note:</strong> After booking, you'll receive a QR code valid until the end of the day. The amount will be deducted from your mess account.
        </div>
      </div>

      {bookingItem && (
        <ExtrasBookingModal item={bookingItem} onClose={() => setBookingItem(null)} onSuccess={handleBookingSuccess} />
      )}
    </div>
  );
};

export default MessMenuPage;
