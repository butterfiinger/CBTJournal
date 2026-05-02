// Renders a surfaced bank entry as an evidence card in the chat.
// Shows the moment, the matched tag, and which axis it matched on.

export default function EvidenceCard({ entry }) {
  const isWoundMatch = entry.matchType === 'wound';

  const formatDate = (iso) => {
    const date = new Date(iso);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: `0.5px solid ${isWoundMatch ? 'var(--accent-success)' : 'var(--border-medium)'}`,
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-4)',
        marginBottom: 'var(--space-3)',
      }}
    >
      <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: 'var(--space-2)' }}>
        {formatDate(entry.createdAt)}
      </p>
      <p style={{ fontSize: '15px', lineHeight: 1.55, marginBottom: 'var(--space-3)' }}>
        {entry.situation}
      </p>
      {entry.senseDetail && (
        <p
          style={{
            fontSize: '13px',
            color: 'var(--text-secondary)',
            fontStyle: 'italic',
            marginBottom: 'var(--space-3)',
            lineHeight: 1.5,
          }}
        >
          {entry.senseDetail}
        </p>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
        <span
          className={isWoundMatch ? 'tag-mini good' : 'tag-mini emotion'}
          style={{ fontSize: '11px' }}
        >
          {entry.matchedTag}
        </span>
        <span
          style={{
            fontSize: '10px',
            color: 'var(--text-tertiary)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          matched by {isWoundMatch ? 'core wound' : 'emotion'}
        </span>
      </div>
    </div>
  );
}
