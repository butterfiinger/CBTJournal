import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import wounds from '../data/wounds.json';

export default function ReprogramAudio() {
  const navigate = useNavigate();
  const { woundId } = useParams();
  const audioRef = useRef(null);

  const [woundData, setWoundData] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const w = wounds.find((x) => x.id === woundId);
    if (!w) {
      navigate('/reprogram');
      return;
    }
    if (!w.audioUrl) {
      // No audio for this wound — send them back
      navigate('/reprogram');
      return;
    }
    setWoundData(w);
  }, [woundId, navigate]);

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);
  const handleEnded = () => setIsPlaying(false);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleScrub = (e) => {
    if (!audioRef.current) return;
    const newTime = parseFloat(e.target.value);
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const skip = (seconds) => {
    if (!audioRef.current) return;
    const newTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + seconds));
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!woundData) {
    return <div className="app-content">Loading...</div>;
  }

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fade-in subpage">
      <div className="top-bar">
        <button className="top-bar-action" onClick={() => navigate('/reprogram')}>← Back</button>
        <span className="top-bar-title">Audio</span>
        <span style={{ width: '60px' }}></span>
      </div>

      <div className="subpage-content">
        <div className="app-content" style={{ paddingTop: 'var(--space-6)' }}>

          {/* Header — the wound and its opposite */}
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
            <p style={{
              fontSize: '11px',
              color: 'rgb(80, 105, 140)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontWeight: 500,
              marginBottom: 'var(--space-2)',
            }}>
              Guided audio
            </p>
            <p style={{
              fontSize: '26px',
              fontFamily: 'var(--font-serif)',
              fontWeight: 500,
              color: 'var(--text-primary)',
              marginBottom: 'var(--space-2)',
            }}>
              {woundData.opposite}
            </p>
            <p style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
              Reprogramming "{woundData.wound}"
            </p>
          </div>

          {/* Album-art-like visual element */}
          <div
            style={{
              width: '180px',
              height: '180px',
              borderRadius: '50%',
              background: `radial-gradient(circle at 30% 30%, rgba(120, 145, 175, 0.25), rgba(120, 145, 175, 0.08))`,
              border: '0.5px solid rgba(120, 145, 175, 0.3)',
              margin: '0 auto var(--space-8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: isPlaying ? 'pulse 3s ease-in-out infinite' : 'none',
            }}
          >
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="rgb(80, 105, 140)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
            </svg>
          </div>

          {loadError && (
            <div style={{
              padding: 'var(--space-4)',
              background: 'rgba(184, 122, 82, 0.08)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--accent-warm)',
              fontSize: '14px',
              textAlign: 'center',
              marginBottom: 'var(--space-4)',
            }}>
              Couldn't load this audio. The file might still be uploading.
            </div>
          )}

          {/* Hidden HTML5 audio element */}
          <audio
            ref={audioRef}
            src={woundData.audioUrl}
            onPlay={handlePlay}
            onPause={handlePause}
            onEnded={handleEnded}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onError={() => setLoadError(true)}
            preload="metadata"
          />

          {/* Progress bar */}
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleScrub}
              style={{
                width: '100%',
                appearance: 'none',
                height: '4px',
                background: `linear-gradient(to right, rgb(80, 105, 140) 0%, rgb(80, 105, 140) ${progressPercent}%, rgba(120, 145, 175, 0.2) ${progressPercent}%, rgba(120, 145, 175, 0.2) 100%)`,
                borderRadius: '2px',
                outline: 'none',
                cursor: 'pointer',
              }}
            />
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '6px',
              fontSize: '11px',
              color: 'var(--text-tertiary)',
              fontVariantNumeric: 'tabular-nums',
            }}>
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--space-6)',
            marginBottom: 'var(--space-8)',
          }}>
            {/* Skip back 15s */}
            <button
              onClick={() => skip(-15)}
              style={{
                background: 'transparent',
                color: 'var(--text-secondary)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
                padding: 'var(--space-2)',
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="1 4 1 10 7 10"/>
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
              </svg>
              <span style={{ fontSize: '10px' }}>15s</span>
            </button>

            {/* Play/Pause */}
            <button
              onClick={togglePlayPause}
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: 'rgb(80, 105, 140)',
                color: 'var(--bg-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
              }}
            >
              {isPlaying ? (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" rx="1"/>
                  <rect x="14" y="4" width="4" height="16" rx="1"/>
                </svg>
              ) : (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: '4px' }}>
                  <polygon points="6 4 20 12 6 20 6 4"/>
                </svg>
              )}
            </button>

            {/* Skip forward 15s */}
            <button
              onClick={() => skip(15)}
              style={{
                background: 'transparent',
                color: 'var(--text-secondary)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
                padding: 'var(--space-2)',
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10"/>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
              </svg>
              <span style={{ fontSize: '10px' }}>15s</span>
            </button>
          </div>

          {/* Guidance */}
          <p style={{
            fontSize: '13px',
            color: 'var(--text-tertiary)',
            textAlign: 'center',
            lineHeight: 1.6,
            fontStyle: 'italic',
            marginBottom: 'var(--space-4)',
          }}>
            Most effective in the early morning, late evening, or when tired or overwhelmed —
            when your subconscious is most receptive.
          </p>

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

      {/* Pulse animation for the album art when playing */}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.04); opacity: 0.9; }
        }
      `}</style>
    </div>
  );
}
