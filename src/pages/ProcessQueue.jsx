import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOpenCaptures } from '../lib/storage';

export default function ProcessQueue() {
  const navigate = useNavigate();
  const [captures, setCaptures] = useState([]);

  useEffect(() => {
    setCaptures(getOpenCaptures());
  }, []);

  const formatAge = (iso) => {
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 30) return `${diffDays} days ago`;
    return `${diffDays}+ days ago`;
  };

  const isStale = (iso) => {
    const days = (new Date() - new Date(iso)) / (1000 * 60 * 60 * 24);
    return days > 30;
  };

  // EMPTY STATE
  if (captures.length === 0) {
    return (
      <div className="app-content fade-in">
        <div className="page-header">
          <h1 className="page-title">Process</h1>
        </div>

        <div className="empty-state" style={{ paddingTop: 'var(--space-10)' }}>
          <p className="empty-state-message">Nothing to process right now.</p>
          <p className="empty-state-helper">
            Processing starts with capturing what's actually charged. When you
            have something to work through, capture it first — even just a
            sentence.
          </p>
          <button
            className="btn-primary"
            onClick={() => navigate('/capture')}
          >
            Start here →
          </button>
        </div>
      </div>
    );
  }

  // QUEUE STATE
  return (
    <div className="app-content fade-in">
      <div className="page-header">
        <h1 className="page-title">Process</h1>
      </div>

      <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.55, marginBottom: 'var(--space-4)' }}>
        Pick one to work through, or capture something new.
      </p>

      <button
        className="btn-secondary"
        onClick={() => navigate('/capture')}
        style={{ marginBottom: 'var(--space-5)' }}
      >
        + Capture something new
      </button>

      <p className="field-label">Open captures · {captures.length}</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {captures.map((entry) => {
          const stale = isStale(entry.createdAt);
          return (
            <button
              key={entry.id}
              className="card"
              onClick={() => navigate(`/process/${entry.id}`)}
              style={{
                textAlign: 'left',
                opacity: stale ? 0.65 : 1,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                <p style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
                  {formatAge(entry.createdAt)}
                  {entry.contextNote && ` · ${entry.contextNote}`}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  {entry.status === 'processing' && entry.chatState && (
                    <span className="tag-mini" style={{
                      background: 'var(--accent-info-bg)',
                      color: 'var(--accent-info)',
                      fontSize: '11px',
                    }}>
                      in progress · step {entry.chatState.currentStep}
                    </span>
                  )}
                  <span style={{ color: 'var(--text-tertiary)', fontSize: '16px' }}>→</span>
                </div>
              </div>
              <p style={{ fontSize: '16px', marginBottom: 'var(--space-2)', lineHeight: 1.5 }}>
                {entry.situation}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {(entry.wounds || []).map((tag) => (
                  <span key={tag} className="tag-mini wound">
                    {tag}
                  </span>
                ))}
                {(entry.emotions || []).map((tag) => (
                  <span key={tag} className="tag-mini emotion">
                    {tag}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
