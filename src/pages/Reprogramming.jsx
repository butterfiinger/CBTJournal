import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import wounds from '../data/wounds.json';
import { getAllEntries } from '../lib/storage';
import {
  getCurrentStreak,
  getLongestStreak,
  getSessionCountByWound,
  hasSessionToday,
} from '../lib/streaks';

const STREAK_GOAL = 21;

export default function Reprogramming() {
  const navigate = useNavigate();
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [sessionCounts, setSessionCounts] = useState({});
  const [woundLogCounts, setWoundLogCounts] = useState({});
  const [doneToday, setDoneToday] = useState(false);

  useEffect(() => {
    setCurrentStreak(getCurrentStreak());
    setLongestStreak(getLongestStreak());
    setSessionCounts(getSessionCountByWound());
    setDoneToday(hasSessionToday());

    // Count wounds from processed/captured entries (how often they've appeared in triggers)
    const allEntries = getAllEntries().filter((e) => e.status !== 'good_moment');
    const counts = {};
    allEntries.forEach((entry) => {
      (entry.wounds || []).forEach((w) => {
        counts[w] = (counts[w] || 0) + 1;
      });
    });
    setWoundLogCounts(counts);
  }, []);

  // Sort wounds: logged-most first, then alphabetical for the rest
  // Hide wounds that have hit 21 reprogramming sessions
  const sortedWounds = useMemo(() => {
    const visible = wounds.filter(
      (w) => (sessionCounts[w.wound] || 0) < STREAK_GOAL
    );
    const logged = visible.filter((w) => (woundLogCounts[w.wound] || 0) > 0);
    const unlogged = visible.filter((w) => !(woundLogCounts[w.wound] > 0));
    logged.sort(
      (a, b) => (woundLogCounts[b.wound] || 0) - (woundLogCounts[a.wound] || 0)
    );
    unlogged.sort((a, b) => a.wound.localeCompare(b.wound));
    return { logged, unlogged };
  }, [sessionCounts, woundLogCounts]);

  // Build the 21-dot visual
  const dots = useMemo(() => {
    const arr = [];
    for (let i = 0; i < STREAK_GOAL; i++) {
      arr.push(i < currentStreak);
    }
    return arr;
  }, [currentStreak]);

  // Streak banner copy
  const streakHeader = currentStreak === 0
    ? 'Today is day 1'
    : `Day ${currentStreak} · keep going`;

  const streakSubcopy = currentStreak === 0
    ? "that's the practice"
    : (currentStreak >= STREAK_GOAL ? 'cycle complete' : `${STREAK_GOAL} day cycle`);

  return (
    <div className="fade-in subpage">
      <div className="top-bar">
        <button className="top-bar-action" onClick={() => navigate('/')}>← Cancel</button>
        <span className="top-bar-title">Reprogramming</span>
        <span style={{ width: '60px' }}></span>
      </div>

      <div className="subpage-content">
        <div className="app-content" style={{ paddingTop: 'var(--space-4)' }}>

          {/* Streak banner */}
          <div
            style={{
              background: 'rgba(120, 145, 175, 0.08)',
              border: '0.5px solid rgba(120, 145, 175, 0.18)',
              borderRadius: '14px',
              padding: 'var(--space-4)',
              marginBottom: 'var(--space-5)',
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
                {streakHeader}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                {streakSubcopy}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {dots.map((filled, i) => (
                <span
                  key={i}
                  style={{
                    width: '11px',
                    height: '11px',
                    borderRadius: '50%',
                    background: filled ? 'rgb(80, 105, 140)' : 'rgba(120, 145, 175, 0.2)',
                  }}
                />
              ))}
            </div>
            {longestStreak > currentStreak && (
              <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '8px' }}>
                Longest: {longestStreak} {longestStreak === 1 ? 'day' : 'days'}
              </p>
            )}
          </div>

          {/* Helper text */}
          <p style={{
            fontSize: '14px',
            color: 'var(--text-secondary)',
            lineHeight: 1.55,
            marginBottom: 'var(--space-5)',
          }}>
            Pick a belief to work with today. We'll walk through 7 places it was true for you.
            {doneToday && ' You already did a session today — extra sessions are great, but won\'t add to your streak.'}
          </p>

          {/* Empty state if no wounds */}
          {sortedWounds.logged.length === 0 && sortedWounds.unlogged.length === 0 && (
            <div className="empty-state">
              <p className="empty-state-message">All wounds reprogrammed.</p>
              <p className="empty-state-helper">
                You've completed 21+ sessions on every wound in the canon. Remarkable.
              </p>
            </div>
          )}

          {/* Logged wounds — most frequent first */}
          {sortedWounds.logged.length > 0 && (
            <>
              {sortedWounds.logged.map((w) => (
                <WoundRow
                  key={w.id}
                  wound={w}
                  logCount={woundLogCounts[w.wound] || 0}
                  sessionCount={sessionCounts[w.wound] || 0}
                  onClick={() => navigate(`/reprogram/${w.id}`)}
                />
              ))}
            </>
          )}

          {/* The rest of the list */}
          {sortedWounds.unlogged.length > 0 && (
            <>
              {sortedWounds.logged.length > 0 && (
                <p style={{
                  fontSize: '11px',
                  color: 'var(--text-tertiary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  margin: 'var(--space-5) 0 var(--space-3) var(--space-2)',
                }}>
                  The rest of the list
                </p>
              )}
              {sortedWounds.unlogged.map((w) => (
                <WoundRow
                  key={w.id}
                  wound={w}
                  logCount={0}
                  sessionCount={sessionCounts[w.wound] || 0}
                  onClick={() => navigate(`/reprogram/${w.id}`)}
                />
              ))}
            </>
          )}

        </div>
      </div>
    </div>
  );
}

function WoundRow({ wound, logCount, sessionCount, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'var(--bg-card)',
        borderRadius: '10px',
        padding: 'var(--space-4)',
        marginBottom: '8px',
        border: '0.5px solid var(--border-subtle)',
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        textAlign: 'left',
      }}
    >
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: '15px', color: 'var(--text-primary)', marginBottom: '2px', fontWeight: 500 }}>
          {wound.wound}
        </p>
        <p style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
          → {wound.opposite}
        </p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
        {sessionCount > 0 && (
          <span style={{
            fontSize: '11px',
            background: 'rgba(120, 145, 175, 0.12)',
            color: 'rgb(80, 105, 140)',
            padding: '3px 8px',
            borderRadius: '10px',
            fontWeight: 500,
          }}>
            {sessionCount}/21
          </span>
        )}
        {logCount > 0 && (
          <span style={{
            fontSize: '10px',
            color: 'var(--text-tertiary)',
          }}>
            logged {logCount}×
          </span>
        )}
      </div>
    </button>
  );
}
