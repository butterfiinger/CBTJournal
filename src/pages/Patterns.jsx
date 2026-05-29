import { useState, useEffect, useMemo } from 'react';
import { getAllEntries } from '../lib/storage';
import {
  getCurrentStreak,
  getLongestStreak,
  getTotalSessions,
  getReprogrammingBankCount,
  getMostReprogrammed,
} from '../lib/streaks';

const WINDOWS = [
  { id: '30', label: '30 days', days: 30 },
  { id: '90', label: '90 days', days: 90 },
  { id: 'all', label: 'All time', days: null },
];

const DAYS_OF_WEEK = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const STREAK_GOAL = 21;

export default function Patterns() {
  const [windowId, setWindowId] = useState('30');
  const [allEntries, setAllEntries] = useState([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);
  const [bankCount, setBankCount] = useState(0);
  const [mostReprogrammed, setMostReprogrammed] = useState([]);

  useEffect(() => {
    setAllEntries(getAllEntries());
    setCurrentStreak(getCurrentStreak());
    setLongestStreak(getLongestStreak());
    setTotalSessions(getTotalSessions());
    setBankCount(getReprogrammingBankCount());
    setMostReprogrammed(getMostReprogrammed(5));
  }, []);

  const window = WINDOWS.find((w) => w.id === windowId);

  // Filter entries to time window
  const filteredEntries = useMemo(() => {
    if (!window.days) return allEntries;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - window.days);
    return allEntries.filter((e) => new Date(e.createdAt) >= cutoff);
  }, [allEntries, window]);

  // Split into triggers vs good moments (exclude reprogramming sessions from trigger counts)
  const triggers = filteredEntries.filter(
    (e) => e.status !== 'good_moment' && e.status !== 'reprogramming'
  );
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

  // Streak card encouragement copy
  const streakEncouragement = () => {
    if (currentStreak === 0 && totalSessions === 0) return 'Start a daily reprogramming practice from Home.';
    if (currentStreak === 0) return "You've practiced before. The pattern will rebuild when you do.";
    if (currentStreak < 7) return "You've been showing up. The pattern is forming.";
    if (currentStreak < 14) return "One week in. The new wiring is taking hold.";
    if (currentStreak < STREAK_GOAL) return "Past two weeks. You're nearly through the first cycle.";
    return `You've completed ${Math.floor(currentStreak / STREAK_GOAL)} full ${STREAK_GOAL}-day cycle${Math.floor(currentStreak / STREAK_GOAL) > 1 ? 's' : ''}. The pattern is established.`;
  };

  // Empty state
  if (allEntries.length === 0 || (filteredEntries.length === 0 && totalSessions === 0)) {
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

      {/* Reprogramming streak card — always at the top when there's a practice or history */}
      {(currentStreak > 0 || totalSessions > 0) && (
        <div
          style={{
            background: 'rgba(120, 145, 175, 0.08)',
            border: '0.5px solid rgba(120, 145, 175, 0.18)',
            borderRadius: '14px',
            padding: 'var(--space-4)',
            marginTop: 'var(--space-4)',
            marginBottom: 'var(--space-4)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '10px' }}>
            <span style={{
              fontSize: '12px',
              color: 'rgb(80, 105, 140)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              fontWeight: 500,
            }}>
              Reprogramming streak
            </span>
            {longestStreak > 0 && (
              <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                longest: {longestStreak} {longestStreak === 1 ? 'day' : 'days'}
              </span>
            )}
          </div>
          <p style={{
            fontSize: '28px',
            color: 'var(--text-primary)',
            margin: '0 0 4px',
            fontWeight: 500,
            fontFamily: 'var(--font-serif)',
          }}>
            Day {currentStreak} <span style={{ fontSize: '15px', color: 'var(--text-tertiary)', fontWeight: 400 }}>of 21</span>
          </p>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
            {streakEncouragement()}
          </p>
        </div>
      )}

      {/* Reprogramming stats — sessions + bank count */}
      {totalSessions > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: 'var(--space-5)' }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: '10px', padding: 'var(--space-3) var(--space-4)', border: '0.5px solid var(--border-subtle)' }}>
            <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Sessions</p>
            <p style={{ fontSize: '22px', color: 'var(--text-primary)', margin: 0, fontWeight: 500 }}>{totalSessions}</p>
          </div>
          <div style={{ background: 'var(--bg-card)', borderRadius: '10px', padding: 'var(--space-3) var(--space-4)', border: '0.5px solid var(--border-subtle)' }}>
            <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Proofs banked</p>
            <p style={{ fontSize: '22px', color: 'var(--text-primary)', margin: 0, fontWeight: 500 }}>{bankCount}</p>
          </div>
        </div>
      )}

      {/* Most reprogrammed wounds */}
      {mostReprogrammed.length > 0 && (
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <p className="field-label" style={{ marginBottom: 'var(--space-3)' }}>Most reprogrammed</p>
          <div style={{ background: 'var(--bg-card)', borderRadius: '10px', padding: 'var(--space-3) var(--space-4)', border: '0.5px solid var(--border-subtle)' }}>
            {mostReprogrammed.map(([wound, count], idx) => (
              <div
                key={wound}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: idx === 0 ? 0 : 'var(--space-2)',
                  paddingBottom: idx === mostReprogrammed.length - 1 ? 0 : 'var(--space-2)',
                  borderBottom: idx === mostReprogrammed.length - 1 ? 'none' : '0.5px solid var(--border-subtle)',
                }}
              >
                <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{wound}</span>
                <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                  {count} session{count === 1 ? '' : 's'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Divider before triggers section if reprogramming surface above */}
      {(currentStreak > 0 || totalSessions > 0) && triggers.length > 0 && (
        <div style={{ height: '0.5px', background: 'var(--border-subtle)', margin: 'var(--space-5) 0 var(--space-5)' }} />
      )}

      {/* Time window toggle */}
      <div style={{ display: 'flex', gap: '6px', marginTop: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
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
          <p className="field-label" style={{ marginBottom: '4px' }}>Positive memories</p>
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
