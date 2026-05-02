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
            <span style={{ fontWeight: 500, fontSize: '17px' }}>Log a good moment</span>
            <span style={{ color: 'var(--text-tertiary)' }}>→</span>
          </div>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            Bank evidence of an opposing truth.
          </p>
        </button>
      </div>

      {topWound && (
        <div style={{ marginTop: 'var(--space-6)' }}>
          <div
            style={{
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-4)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <p className="field-label" style={{ marginBottom: '2px' }}>This month</p>
              <p style={{ fontSize: '15px' }}>
                Top wound: <span style={{ fontWeight: 500 }}>{topWound}</span>
              </p>
            </div>
            <span style={{ color: 'var(--text-tertiary)' }}>→</span>
          </div>
        </div>
      )}
    </div>
  );
}
