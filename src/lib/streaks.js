// Streak logic for reprogramming sessions.
// Rules:
// - One session per day counts (first session of the day)
// - Streak resets if a day is missed
// - Wounds disappear from selection list after 21 sessions on that wound
// - Tracks current streak + longest streak separately

import { getAllEntries } from './storage';

// Returns YYYY-MM-DD string for a date in the local timezone
const dateKey = (date) => {
  const d = new Date(date);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

// Returns YYYY-MM-DD for today in local timezone
const todayKey = () => dateKey(new Date());

// Returns YYYY-MM-DD for N days before today
const daysAgoKey = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return dateKey(d);
};

/**
 * Get all completed reprogramming sessions sorted by date ascending.
 * A session is "complete" if it has status === 'reprogramming' and completedAreas >= 4.
 */
export const getReprogrammingSessions = () => {
  return getAllEntries()
    .filter((e) => e.status === 'reprogramming' && (e.completedAreas || 0) >= 4)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
};

/**
 * Calculate current streak — consecutive days with a completed session,
 * counting backward from today (or yesterday if today doesn't have one yet).
 *
 * Returns 0 if the most recent session was more than 1 day ago.
 */
export const getCurrentStreak = () => {
  const sessions = getReprogrammingSessions();
  if (sessions.length === 0) return 0;

  // Get unique session days
  const sessionDays = new Set(sessions.map((s) => dateKey(s.createdAt)));

  const today = todayKey();
  const yesterday = daysAgoKey(1);

  // If most recent session isn't today or yesterday, streak is broken
  if (!sessionDays.has(today) && !sessionDays.has(yesterday)) {
    return 0;
  }

  // Count backwards from today
  let streak = 0;
  let checkDate = sessionDays.has(today) ? new Date() : (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d;
  })();

  while (true) {
    if (sessionDays.has(dateKey(checkDate))) {
      streak += 1;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
};

/**
 * Calculate longest streak ever achieved.
 */
export const getLongestStreak = () => {
  const sessions = getReprogrammingSessions();
  if (sessions.length === 0) return 0;

  const sessionDays = [...new Set(sessions.map((s) => dateKey(s.createdAt)))].sort();

  let longest = 1;
  let current = 1;

  for (let i = 1; i < sessionDays.length; i++) {
    const prev = new Date(sessionDays[i - 1]);
    const curr = new Date(sessionDays[i]);
    const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      current += 1;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }

  return longest;
};

/**
 * Count sessions per wound (by wound text).
 * Used to: rank wounds for the selection screen, and hide wounds at 21+ sessions.
 */
export const getSessionCountByWound = () => {
  const sessions = getReprogrammingSessions();
  const counts = {};
  sessions.forEach((s) => {
    if (s.wound) {
      counts[s.wound] = (counts[s.wound] || 0) + 1;
    }
  });
  return counts;
};

/**
 * Has the user already done a session today?
 */
export const hasSessionToday = () => {
  const sessions = getReprogrammingSessions();
  const today = todayKey();
  return sessions.some((s) => dateKey(s.createdAt) === today);
};

/**
 * Total reprogramming sessions completed (all time).
 */
export const getTotalSessions = () => {
  return getReprogrammingSessions().length;
};

/**
 * Count of bank entries auto-generated from reprogramming sessions.
 */
export const getReprogrammingBankCount = () => {
  return getAllEntries().filter(
    (e) => e.status === 'good_moment' && e.source === 'reprogramming'
  ).length;
};

/**
 * Returns top N most reprogrammed wounds.
 */
export const getMostReprogrammed = (n = 5) => {
  const counts = getSessionCountByWound();
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n);
};
