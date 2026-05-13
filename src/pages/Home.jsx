import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getOpenCaptures, getAllEntries } from '../lib/storage';

export default function Home() {
  const navigate = useNavigate();
  const [openCount, setOpenCount] = useState(0);
  const [topWound, setTopWound] = useState(null);

  useEffect(() => {
    const open = getOpenCaptures();
    setOpenCount(open.length);

    // Calculate top wound from all entries (excluding good moments)
    const allEntries = getAllEntries().filter((e) => e.status !== 'good_moment');
    const woundCounts = {};
    allEntries.forEach((entry) => {
      (entry.wounds || []).forEach((w) => {
        woundCounts[w] = (woundCounts[w] || 0) + 1;
      });
    });

    const sorted = Object.entries(woundCounts).sort((a, b) => b[1] - a[1]);
    if (sorted.length > 0) {
      setTopWound(sorted[0][0]);
    }
  }, []);

  const greeting = () => {
    const hour = new Date().getHours();
    const day = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    if (hour < 12) return `${day} morning`;
    if (hour < 17) return `${day} afternoon`;
    return `${day} evening`;
  };

  return (
    <div className="app-content fade-in">
      {/* Settings gear — top right of page, opens settings page */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
        <button
          onClick={() => navigate('/settings')}
          aria-label="Settings"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-tertiary)',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </button>
      </div>

      <div className="page-header">
        <p className="greeting">{greeting()}</p>
        <h1 className="page-title">How are you arriving today?</h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: 'var(--space-6)' }}>
        <button
          className="card"
          onClick={() => navigate('/capture')}
          style={{ textAlign: 'left', padding: 'var(--space-5)' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span style={{ fontWeight: 500, fontSize: '17px' }}>Capture a trigger</span>
            <span style={{ color: 'var(--text-tertiary)' }}>→</span>
          </div>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            Something just happened. Save it for later.
          </p>
        </button>

        <button
          className="card"
          onClick={() => navigate('/process')}
          style={{ textAlign: 'left', padding: 'var(--space-5)' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <span style={{ fontWeight: 500, fontSize: '17px' }}>Process</span>
              {openCount > 0 && (
                <span className="tag-mini wound" style={{ fontSize: '10px' }}>
                  {openCount} open
                </span>
              )}
            </div>
            <span style={{ color: 'var(--text-tertiary)' }}>→</span>
          </div>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            Walk through the 6 steps with guidance.
          </p>
        </button>

        <button
          className="card"
          onClick={() => navigate('/log-good-moment')}
          style={{ textAlign: 'left', padding: 'var(--space-5)' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span style={{ fontWeight: 500, fontSize: '17px' }}>Log a positive memory</span>
            <span style={{ color: 'var(--text-tertiary)' }}>→</span>
          </div>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            Bank a moment that feels true to draw on later.
          </p>
        </button>
      </div>

      {topWound && (
        <div style={{ marginTop: 'var(--space-6)' }}>
          <button
            onClick={() => navigate('/patterns')}
            style={{
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-4)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
              textAlign: 'left',
            }}
          >
            <div>
              <p className="field-label" style={{ marginBottom: '2px' }}>This month</p>
              <p style={{ fontSize: '15px' }}>
                Top belief: <span style={{ fontWeight: 500 }}>{topWound}</span>
              </p>
            </div>
            <span style={{ color: 'var(--text-tertiary)' }}>→</span>
          </button>
        </div>
      )}
    </div>
  );
}
