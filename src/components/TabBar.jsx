import { useNavigate, useLocation } from 'react-router-dom';

// Inline SVG outline icons — kept consistent with the warm/grounded aesthetic
const HomeIcon = () => (
  <svg className="tab-bar-icon" viewBox="0 0 24 24">
    <path d="M3 11.5L12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1v-8.5z" />
  </svg>
);

const PatternsIcon = () => (
  <svg className="tab-bar-icon" viewBox="0 0 24 24">
    <path d="M4 19V5" />
    <path d="M4 19h16" />
    <path d="M8 15v-4" />
    <path d="M12 15V8" />
    <path d="M16 15v-6" />
  </svg>
);

const BankIcon = () => (
  <svg className="tab-bar-icon" viewBox="0 0 24 24">
    <path d="M19 5H5a2 2 0 0 0-2 2v12l4-2 4 2 4-2 4 2V7a2 2 0 0 0-2-2z" />
  </svg>
);

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
        <HomeIcon />
        <span>Home</span>
      </button>
      <button
        className={`tab-bar-item ${isActive('/patterns') ? 'active' : ''}`}
        onClick={() => navigate('/patterns')}
      >
        <PatternsIcon />
        <span>Patterns</span>
      </button>
      <button
        className={`tab-bar-item ${isActive('/bank') ? 'active' : ''}`}
        onClick={() => navigate('/bank')}
      >
        <BankIcon />
        <span>Journal</span>
      </button>
    </nav>
  );
}
