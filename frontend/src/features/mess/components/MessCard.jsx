import { MapPin } from 'lucide-react';

const MessCard = ({ mess, onClick }) => {
  return (
    <div className="mess-feature-card" onClick={onClick} id={`mess-card-${mess.id}`}>
      <div className="mess-feature-header">
        <div className="mess-feature-icon">🏛️</div>
        <h2 className="mess-feature-title">{mess.name}</h2>
      </div>
      <p className="mess-feature-description">
        <MapPin size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
        {mess.hall_name} — {mess.location}
      </p>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 12, color: 'var(--st-text-dim)' }}>
        <span className={`mess-status-dot ${mess.is_active ? 'active' : 'inactive'}`} />
        {mess.is_active ? 'Currently Active' : 'Inactive'}
      </span>
    </div>
  );
};

export default MessCard;
