// Bank retrieval — finds gratitude entries that match an active wound's opposite.
// Returns wound-axis matches first (most direct), then emotion-axis matches as fill.

import { getGoodMoments } from './storage';
import wounds from '../data/wounds.json';
import emotions from '../data/emotions.json';

/**
 * Retrieves matching bank entries for a given wound.
 * Returns up to 3 entries, ranked by match type:
 *   1. Direct wound-opposite tag match (primary)
 *   2. Opposite-emotion tag match (secondary fill)
 *
 * Each result is annotated with `matchType: 'wound' | 'emotion'`
 * and `matchedTag` for UI display.
 */
export function retrieveBankMatches(activeWound, maxResults = 3) {
  const goodMoments = getGoodMoments();

  if (goodMoments.length === 0) {
    return [];
  }

  // Find the wound's opposite
  const woundData = wounds.find((w) => w.wound === activeWound);
  if (!woundData) {
    return [];
  }

  const woundOpposite = woundData.opposite;

  // PRIMARY MATCH: gratitude entries tagged with the wound's opposite
  const woundMatches = goodMoments
    .filter((entry) => (entry.woundOpposites || []).includes(woundOpposite))
    .map((entry) => ({
      ...entry,
      matchType: 'wound',
      matchedTag: woundOpposite,
    }));

  // If we have enough wound matches, return those
  if (woundMatches.length >= maxResults) {
    return woundMatches.slice(0, maxResults);
  }

  // SECONDARY MATCH: gratitude entries with opposite emotions
  // Look at the user's emotions in the active session and find their opposites
  // Then find good moments tagged with those opposite emotions
  // For simplicity in v1, we look for opposites of emotions in the entries themselves
  // - i.e. find good-moment entries whose emotions are opposites of any emotion the user might be feeling

  // Better approach: for each emotion in the wound's opposite emotional cluster,
  // find good moments tagged with those emotions

  // Build a list of "positive emotions" — emotions that appear as opposites in our taxonomy
  const positiveEmotionsSet = new Set();
  emotions.forEach((emo) => {
    (emo.opposites || []).forEach((opp) => positiveEmotionsSet.add(opp.toLowerCase()));
  });

  // Find good moments tagged with any of these positive emotions
  // (and that haven't already been selected as wound matches)
  const woundMatchIds = new Set(woundMatches.map((m) => m.id));

  const emotionMatches = goodMoments
    .filter((entry) => {
      if (woundMatchIds.has(entry.id)) return false;
      const entryEmotions = (entry.emotions || []).map((e) => e.toLowerCase());
      return entryEmotions.some((e) => positiveEmotionsSet.has(e));
    })
    .map((entry) => {
      // Find which emotion matched for display
      const matchedEmotion = (entry.emotions || []).find((e) =>
        positiveEmotionsSet.has(e.toLowerCase())
      );
      return {
        ...entry,
        matchType: 'emotion',
        matchedTag: matchedEmotion || 'positive feeling',
      };
    });

  // Combine, with wound matches first
  const combined = [...woundMatches, ...emotionMatches];
  return combined.slice(0, maxResults);
}
