import { useNavigate, useLocation } from 'react-router-dom';

export default function TabBar() {
  const navigate = useNavigate();
  const location = useLocation();

  // Hide tab bar on chat screen for focus
  if (location.pathname.startsWith('/process/') && location.pathname !== '/process') {
    return null;
  }

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="tab-bar">
      <button
        className={`tab-bar-item ${isActive('/') ? 'active' : ''}`}
        onClick={() => navigate('/')}
      >
        Home
      </button>
      <button
        className={`tab-bar-item`}
        onClick={() => alert('Patterns coming soon')}
      >
        Patterns
      </button>
      <button
        className={`tab-bar-item ${isActive('/bank') ? 'active' : ''}`}
        onClick={() => navigate('/bank')}
      >
        Bank
      </button>
    </nav>
  );
}
