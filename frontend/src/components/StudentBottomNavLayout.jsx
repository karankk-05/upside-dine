import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { getStoredRole } from '../lib/auth';

const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: '🏠', route: '/dashboard' },
  { id: 'orders', label: 'Orders', icon: '📦', route: '/orders' },
  { id: 'mess', label: 'Mess', icon: '🍽️', route: '/mess/bookings' },
  { id: 'profile', label: 'Profile', icon: '👤', route: '/profile' },
];

const StudentBottomNavLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isStudent = getStoredRole() === 'student';

  return (
    <>
      <div className={isStudent ? 'student-tab-layout' : undefined}>
        <Outlet />
      </div>

      {isStudent ? (
        <nav className="student-bottom-nav" aria-label="Student Navigation">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.route;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(item.route)}
                className={`student-bottom-nav__item ${isActive ? 'student-bottom-nav__item--active' : ''}`}
              >
                <span className="student-bottom-nav__icon" aria-hidden="true">
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      ) : null}
    </>
  );
};

export default StudentBottomNavLayout;
