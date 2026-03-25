import { useNavigate } from 'react-router-dom';
import { UtensilsCrossed, ClipboardList, Package, BarChart3 } from 'lucide-react';
import '../features/mess/mess.css';

const MessManagerDashboard = () => {
  const navigate = useNavigate();

  const cards = [
    { icon: <UtensilsCrossed size={22} />, title: 'Menu Management', desc: 'Add, edit, or remove extras from the mess menu.', route: '/manager/mess/menu' },
    { icon: <ClipboardList size={22} />, title: "Today's Bookings", desc: "View today's bookings and redemption stats.", route: '/manager/mess/bookings' },
    { icon: <Package size={22} />, title: 'Inventory', desc: 'Update available quantities for menu items.', route: '/manager/mess/inventory' },
    { icon: <BarChart3 size={22} />, title: 'Statistics', desc: 'Revenue, redemption rates, and popular items.', route: '/manager/mess/stats' },
  ];

  return (
    <div className="mess-page">
      <div className="mess-page-header">
        <h1 className="mess-page-title">Mess Manager</h1>
      </div>

      <div className="mess-content">
        <div className="mess-feature-cards">
          {cards.map((card) => (
            <div key={card.route} className="mess-feature-card" onClick={() => navigate(card.route)} id={`mgr-${card.title.toLowerCase().replace(/\s/g, '-')}`}>
              <div className="mess-feature-header">
                <div className="mess-feature-icon">{card.icon}</div>
                <h2 className="mess-feature-title">{card.title}</h2>
              </div>
              <p className="mess-feature-description">{card.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MessManagerDashboard;
