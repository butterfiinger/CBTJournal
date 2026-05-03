import { useState, useEffect, useMemo } from 'react';
import { getAllEntries } from '../lib/storage';

const WINDOWS = [
  { id: '30', label: '30 days', days: 30 },
  { id: '90', label: '90 days', days: 90 },
  { id: 'all', label: 'All time', days: null },
];

const DAYS_OF_WEEK = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function Patterns() {
  const [windowId, setWindowId] = useState('30');
  const [allEntries, setAllEntries] = useState([]);

  useEffect(() => {
    setAllEntries(getAllEntries());
  }, []);

  const window = WINDOWS.find((w) => w.id === windowId);

  // Filter entries to time window
  const filteredEntries = useMemo(() => {
    if (!window.days) return allEntries;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - window.days);
    return allEntries.filter((e) => new Date(e.createdAt) >= cutoff);
  }, [allEntries, window]);

  // Split into triggers vs good moments
  const triggers = filteredEntries.filter((e) => e.status !== 'good_moment');
  const goodMoments = filteredEntries.filter((e) => e.status === 'good_moment');

  // Aggregate wound counts
  const woundCounts = useMemo(() => {
    const counts = {};
    triggers.forEach((entry) => {
      (entry.wounds || []).forEach((w) => {
        counts[w] = (counts[w] || 0) + 1;
      });
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [triggers]);

  const topWoundCount = woundCounts.length > 0 ? woundCounts[0][1] : 0;
  const topWounds = woundCounts.slice(0, 5);

  // Day-of-week aggregation
  const dayOfWeekCounts = useMemo(() => {
    const counts = [0, 0, 0, 0, 0, 0, 0]; // Sun, Mon, ..., Sat
    triggers.forEach((entry) => {
      const dayIdx = new Date(entry.createdAt).getDay();
      counts[dayIdx] += 1;
    });
    return counts;
  }, [triggers]);

  const maxDayCount = Math.max(...dayOfWeekCounts, 1);
  const peakDayIndex = dayOfWeekCounts.indexOf(maxDayCount);

  // Only generate interpretive callout if we have enough data
  const hasEnoughForCallout = triggers.length >= 10;
  const dayCallout = hasEnoughForCallout
    ? `${DAY_NAMES[peakDayIndex]}s show up most.`
    : null;

  // Empty state
  if (allEntries.length === 0 || filteredEntries.length === 0) {
    return (
      <div className="app-content fade-in">
        <div className="page-header">
          <h1 className="page-title">Patterns</h1>
        </div>

        <div style={{ display: 'flex', gap: '6px', marginTop: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
          {WINDOWS.map((w) => (
            <button
              key={w.id}
              className={`chip ${windowId === w.id ? 'selected-wound' : ''}`}
              onClick={() => setWindowId(w.id)}
            >
              {w.label}
            </button>
          ))}
        </div>

        <div className="empty-state">
          <p className="empty-state-message">
            {allEntries.length === 0
              ? 'Patterns need data.'
              : 'Nothing in this window yet.'}
          </p>
          <p className="empty-state-helper">
            Come back after you have a few entries — usually 5+ before anything
            meaningful shows up.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-content fade-in">
      <div className="page-header">
        <h1 className="page-title">Patterns</h1>
      </div>

      {/* Time window toggle */}
      <div style={{ display: 'flex', gap: '6px', marginTop: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
        {WINDOWS.map((w) => (
          <button
            key={w.id}
            className={`chip ${windowId === w.id ? 'selected-wound' : ''}`}
            onClick={() => setWindowId(w.id)}
          >
            {w.label}
          </button>
        ))}
      </div>

      {/* Two balance cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: 'var(--space-5)' }}>
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)' }}>
          <p className="field-label" style={{ marginBottom: '4px' }}>Triggers</p>
          <p style={{ fontSize: '28px', fontWeight: 500, fontFamily: 'var(--font-serif)' }}>{triggers.length}</p>
        </div>
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)' }}>
          <p className="field-label" style={{ marginBottom: '4px' }}>Good moments</p>
          <p style={{ fontSize: '28px', fontWeight: 500, fontFamily: 'var(--font-serif)' }}>{goodMoments.length}</p>
        </div>
      </div>

      {/* Top wounds */}
      {topWounds.length > 0 && (
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <p className="field-label" style={{ marginBottom: 'var(--space-3)' }}>Top wounds</p>
          {topWounds.map(([wound, count]) => {
            const percentage = (count / topWoundCount) * 100;
            return (
              <div key={wound} style={{ marginBottom: 'var(--space-3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <p style={{ fontSize: '15px' }}>{wound}</p>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{count}</p>
                </div>
                <div style={{ background: 'var(--bg-secondary)', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                  <div
                    style={{
                      background: 'var(--text-primary)',
                      height: '100%',
                      width: `${percentage}%`,
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Day-of-week chart */}
      {triggers.length > 0 && (
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <p className="field-label" style={{ marginBottom: 'var(--space-4)' }}>When triggers happen</p>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '6px', height: '90px' }}>
            {dayOfWeekCounts.map((count, idx) => {
              const heightPct = (count / maxDayCount) * 100;
              const isPeak = idx === peakDayIndex && count > 0;
              return (
                <div
                  key={idx}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <div
                    style={{
                      background: isPeak ? 'var(--text-primary)' : 'var(--bg-secondary)',
                      width: '100%',
                      height: `${Math.max(heightPct, 4)}%`,
                      borderRadius: '3px',
                      transition: 'height 0.3s ease',
                    }}
                  />
                  <p style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{DAYS_OF_WEEK[idx]}</p>
                </div>
              );
            })}
          </div>
          {dayCallout && (
            <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginTop: 'var(--space-3)', textAlign: 'center' }}>
              {dayCallout}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
