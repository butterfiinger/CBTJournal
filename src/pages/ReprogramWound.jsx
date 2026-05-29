import { useNavigate } from 'react-router-dom';
import wounds from '../data/wounds.json';

export default function ReprogramWound() {
  const navigate = useNavigate();

  return (
    <div className="app-content fade-in">
      <div className="top-bar" style={{ marginLeft: 'calc(-1 * var(--space-5))', marginRight: 'calc(-1 * var(--space-5))', paddingLeft: 'var(--space-5)', paddingRight: 'var(--space-5)' }}>
        <button className="top-bar-action" onClick={() => navigate('/')}>←</button>
        <p className="top-bar-title">Reprogram a Wound</p>
        <span style={{ width: '24px' }} />
      </div>

      <div style={{ marginTop: 'var(--space-6)' }}>
        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 'var(--space-6)' }}>
          Choose a core wound to work on. You'll get a brief education about it, then walk through reprogramming it at the belief, thought, emotion, and action levels.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {wounds.map((w) => (
            <button
              key={w.id}
              className="card"
              onClick={() => navigate(`/reprogram/${w.id}`)}
              style={{ textAlign: 'left', padding: 'var(--space-4) var(--space-5)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontWeight: 500, fontSize: '16px', marginBottom: '2px' }}>{w.wound}</p>
                  <p style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>→ {w.opposite}</p>
                </div>
                <span style={{ color: 'var(--text-tertiary)', fontSize: '18px' }}>›</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
