import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import wounds from '../data/wounds.json';

/**
 * Split the teaching paragraph into three sections based on semantic markers.
 * The teachings all follow a similar arc: origin → manifestation → reprogramming.
 * We find the boundaries between them.
 */
function splitTeaching(teaching) {
  if (!teaching) return null;

  // Split into sentences (rough — handles most punctuation patterns)
  const sentences = teaching.match(/[^.!?]+[.!?]+(?:\s|$)/g) || [teaching];

  // Markers that indicate the start of the "manifestation" section
  const manifestationMarkers = [
    /\bshows up as\b/i,
    /\bas an adult\b/i,
    /\bemotions that come with\b/i,
    /\bthe emotions that\b/i,
    /\bthe wound\b.*\bshows up\b/i,
    /\byou might\b/i,
  ];

  // Markers that indicate the start of the "reprogramming" section
  const reprogrammingMarkers = [
    /^reprogramming\b/i,
    /\breprogramming this\b/i,
    /\breprogramming work\b/i,
    /\breprogramming insight\b/i,
    /\breprogramming hack\b/i,
    /\bto reprogram\b/i,
    /\breprogrammed through\b/i,
    /\bmost powerfully reprogrammed\b/i,
    /\bthe work is\b/i,
    /\bhere'?s the\b.*\bhack\b/i,
    /\bthe key reprogramming\b/i,
    /\bhere'?s the critical\b/i,
    /\bthe deepest healing\b/i,
    /\bthe key.*\binsight\b/i,
  ];

  // Find first sentence that matches a manifestation marker
  let manifestStart = -1;
  for (let i = 1; i < sentences.length; i++) {
    if (manifestationMarkers.some((re) => re.test(sentences[i]))) {
      manifestStart = i;
      break;
    }
  }

  // Find first sentence that matches a reprogramming marker
  let reprogramStart = -1;
  for (let i = (manifestStart > 0 ? manifestStart : 1); i < sentences.length; i++) {
    if (reprogrammingMarkers.some((re) => re.test(sentences[i]))) {
      reprogramStart = i;
      break;
    }
  }

  // If we couldn't find proper boundaries, fall back to thirds
  if (manifestStart === -1 || reprogramStart === -1 || reprogramStart <= manifestStart) {
    const third = Math.floor(sentences.length / 3);
    manifestStart = third;
    reprogramStart = third * 2;
  }

  return {
    origin: sentences.slice(0, manifestStart).join('').trim(),
    manifestation: sentences.slice(manifestStart, reprogramStart).join('').trim(),
    reprogramming: sentences.slice(reprogramStart).join('').trim(),
  };
}

export default function ReprogramEducation() {
  const navigate = useNavigate();
  const { woundId } = useParams();
  const [woundData, setWoundData] = useState(null);
  const [sections, setSections] = useState(null);

  useEffect(() => {
    const w = wounds.find((x) => x.id === woundId);
    if (!w) {
      navigate('/reprogram');
      return;
    }
    setWoundData(w);
    setSections(splitTeaching(w.teaching));
  }, [woundId, navigate]);

  if (!woundData) {
    return <div className="app-content">Loading...</div>;
  }

  return (
    <div className="fade-in subpage">
      <div className="top-bar">
        <button className="top-bar-action" onClick={() => navigate('/reprogram')}>← Back</button>
        <span className="top-bar-title">Teaching</span>
        <span style={{ width: '60px' }}></span>
      </div>

      <div className="subpage-content">
        <div className="app-content" style={{ paddingTop: 'var(--space-4)' }}>

          {/* Header — the wound and its opposite */}
          <div
            style={{
              background: 'rgba(120, 145, 175, 0.08)',
              border: '0.5px solid rgba(120, 145, 175, 0.18)',
              borderRadius: '14px',
              padding: 'var(--space-5)',
              marginBottom: 'var(--space-5)',
              textAlign: 'center',
            }}
          >
            <p style={{
              fontSize: '11px',
              color: 'rgb(80, 105, 140)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontWeight: 500,
              marginBottom: 'var(--space-2)',
            }}>
              Core wound
            </p>
            <p style={{
              fontSize: '22px',
              fontFamily: 'var(--font-serif)',
              fontWeight: 500,
              color: 'var(--text-primary)',
              marginBottom: 'var(--space-3)',
            }}>
              {woundData.wound}
            </p>
            <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginBottom: 'var(--space-2)' }}>
              rewires toward
            </p>
            <p style={{
              fontSize: '18px',
              fontFamily: 'var(--font-serif)',
              color: 'rgb(80, 105, 140)',
              fontWeight: 500,
            }}>
              {woundData.opposite}
            </p>
          </div>

          {/* Section: Where this wound comes from */}
          {sections?.origin && (
            <div style={{ marginBottom: 'var(--space-6)' }}>
              <p style={{
                fontSize: '11px',
                color: 'var(--text-tertiary)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontWeight: 500,
                marginBottom: 'var(--space-3)',
              }}>
                Where this comes from
              </p>
              <p style={{
                fontSize: '16px',
                lineHeight: 1.65,
                color: 'var(--text-primary)',
              }}>
                {sections.origin}
              </p>
            </div>
          )}

          {/* Section: How it shows up */}
          {sections?.manifestation && (
            <div style={{ marginBottom: 'var(--space-6)' }}>
              <p style={{
                fontSize: '11px',
                color: 'var(--text-tertiary)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontWeight: 500,
                marginBottom: 'var(--space-3)',
              }}>
                How it shows up
              </p>
              <p style={{
                fontSize: '16px',
                lineHeight: 1.65,
                color: 'var(--text-primary)',
              }}>
                {sections.manifestation}
              </p>
            </div>
          )}

          {/* Section: The reprogramming approach */}
          {sections?.reprogramming && (
            <div style={{ marginBottom: 'var(--space-6)' }}>
              <p style={{
                fontSize: '11px',
                color: 'var(--text-tertiary)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontWeight: 500,
                marginBottom: 'var(--space-3)',
              }}>
                The reprogramming approach
              </p>
              <p style={{
                fontSize: '16px',
                lineHeight: 1.65,
                color: 'var(--text-primary)',
              }}>
                {sections.reprogramming}
              </p>
            </div>
          )}

          {/* Section: Where to look for evidence (gentle prompts) */}
          {woundData.gentlePrompts && woundData.gentlePrompts.length > 0 && (
            <div style={{ marginBottom: 'var(--space-6)' }}>
              <p style={{
                fontSize: '11px',
                color: 'var(--text-tertiary)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontWeight: 500,
                marginBottom: 'var(--space-3)',
              }}>
                Where to look for evidence
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {woundData.gentlePrompts.map((prompt, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: 'var(--bg-card)',
                      border: '0.5px solid var(--border-subtle)',
                      borderRadius: '10px',
                      padding: 'var(--space-3) var(--space-4)',
                    }}
                  >
                    <p style={{
                      fontSize: '15px',
                      lineHeight: 1.55,
                      color: 'var(--text-secondary)',
                      fontStyle: 'italic',
                    }}>
                      {prompt}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA — start a session */}
          <div style={{ marginTop: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
            <button
              className="btn-primary"
              onClick={() => navigate(`/reprogram/${woundId}/session`)}
              style={{ width: '100%' }}
            >
              Start a reprogramming session
            </button>
            <p style={{
              fontSize: '12px',
              color: 'var(--text-tertiary)',
              textAlign: 'center',
              marginTop: 'var(--space-3)',
              fontStyle: 'italic',
            }}>
              Walk through 7 life areas finding evidence the opposite is true.
            </p>
          </div>

          {/* Attribution */}
          <p style={{
            fontSize: '11px',
            color: 'var(--text-tertiary)',
            textAlign: 'center',
            marginBottom: 'var(--space-6)',
          }}>
            Draws on the Personal Development School framework by Thais Gibson.
          </p>

        </div>
      </div>
    </div>
  );
}
