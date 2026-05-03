import { useState, useRef, useEffect } from 'react';

const REVEAL_THRESHOLD = 80; // pixels to drag before snap-open
const ACTION_WIDTH = 80; // width of the delete action zone
const SNAP_OPEN_AT = 40; // velocity-friendly threshold for opening

/**
 * Wraps any card with iOS-style swipe-left-to-reveal-delete behavior.
 *
 * Behavior:
 * - Swipe left on the card → red delete zone reveals behind it
 * - Tap the delete zone → calls onDelete()
 * - Swipe back right OR tap the card itself → closes the swipe state
 * - Only one card can be open at a time (managed externally if needed)
 *
 * Props:
 *   children - the card content
 *   onDelete - function to call when delete is tapped
 *   onClick - optional, called when card is tapped (only when not swiped open)
 */
export default function SwipeableCard({ children, onDelete, onClick }) {
  const [translateX, setTranslateX] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const startTranslateX = useRef(0);
  const isHorizontalDrag = useRef(false);
  const cardRef = useRef(null);

  // Close swipe state when user taps anywhere outside this card
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e) => {
      if (cardRef.current && !cardRef.current.contains(e.target)) {
        close();
      }
    };

    document.addEventListener('touchstart', handleOutsideClick);
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('touchstart', handleOutsideClick);
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  const close = () => {
    setTranslateX(0);
    setIsOpen(false);
  };

  const open = () => {
    setTranslateX(-ACTION_WIDTH);
    setIsOpen(true);
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    startTranslateX.current = translateX;
    isHorizontalDrag.current = false;
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    if (touchStartX.current === null) return;

    const deltaX = e.touches[0].clientX - touchStartX.current;
    const deltaY = e.touches[0].clientY - touchStartY.current;

    // First few pixels: figure out if this is horizontal or vertical drag
    if (!isHorizontalDrag.current) {
      if (Math.abs(deltaX) > 8 && Math.abs(deltaX) > Math.abs(deltaY)) {
        isHorizontalDrag.current = true;
      } else if (Math.abs(deltaY) > 8) {
        // Vertical scroll — abort gesture
        touchStartX.current = null;
        return;
      } else {
        return;
      }
    }

    // Calculate new position with bounds: can't go right past 0, can't go too far left
    let newX = startTranslateX.current + deltaX;
    if (newX > 0) newX = 0;
    if (newX < -ACTION_WIDTH * 1.3) newX = -ACTION_WIDTH * 1.3;

    setTranslateX(newX);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);

    if (touchStartX.current === null) return;
    touchStartX.current = null;

    // Decide whether to snap open or closed based on current position
    if (isOpen) {
      // Was open — close only if dragged significantly right
      if (translateX > -ACTION_WIDTH + SNAP_OPEN_AT) {
        close();
      } else {
        open();
      }
    } else {
      // Was closed — open only if dragged significantly left
      if (translateX < -SNAP_OPEN_AT) {
        open();
      } else {
        close();
      }
    }
  };

  const handleCardClick = (e) => {
    if (isOpen) {
      e.stopPropagation();
      e.preventDefault();
      close();
      return;
    }
    if (onClick) onClick(e);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    onDelete();
  };

  return (
    <div
      ref={cardRef}
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 'var(--radius-lg)',
        marginBottom: 'var(--space-3)',
      }}
    >
      {/* Delete action zone — sits behind the card, revealed by swipe */}
      <button
        onClick={handleDeleteClick}
        aria-label="Delete entry"
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          width: `${ACTION_WIDTH}px`,
          background: '#b85252',
          color: '#faf8f3',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '4px',
          fontSize: '11px',
          fontWeight: 500,
          letterSpacing: '0.03em',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          <path d="M10 11v6M14 11v6" />
          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
        </svg>
        Delete
      </button>

      {/* The card content — slides left to reveal delete */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleCardClick}
        style={{
          transform: `translateX(${translateX}px)`,
          transition: isDragging ? 'none' : 'transform 0.25s ease',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {children}
      </div>
    </div>
  );
}
