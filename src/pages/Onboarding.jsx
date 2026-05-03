import { useState } from 'react';

// Inline illustration for card 1 — glasses with red-tinted lenses
function LensIllustration() {
  return (
    <svg width="180" height="110" viewBox="0 0 160 100" fill="none">
      <rect x="18" y="28" width="52" height="36" rx="18" fill="rgba(220,60,60,0.13)" stroke="var(--text-primary)" strokeWidth="2"/>
      <rect x="90" y="28" width="52" height="36" rx="18" fill="rgba(220,60,60,0.13)" stroke="var(--text-primary)" strokeWidth="2"/>
      <line x1="70" y1="46" x2="90" y2="46" stroke="var(--text-primary)" strokeWidth="2" strokeLinecap="round"/>
      <line x1="4" y1="38" x2="18" y2="43" stroke="var(--text-primary)" strokeWidth="2" strokeLinecap="round"/>
      <line x1="156" y1="38" x2="142" y2="43" stroke="var(--text-primary)" strokeWidth="2" strokeLinecap="round"/>
      <ellipse cx="44" cy="46" rx="18" ry="12" fill="rgba(220,60,60,0.22)"/>
      <ellipse cx="116" cy="46" rx="18" ry="12" fill="rgba(220,60,60,0.22)"/>
    </svg>
  );
}

// Phone-frame mockups for cards 2-4
function ChatMockup() {
  return (
    <div style={mockupStyles.frame}>
      <p style={mockupStyles.kicker}>Process · Step 2 of 6</p>
      <div style={mockupStyles.bubble}>
        <p style={mockupStyles.bubbleText}>What did you make this mean about you?</p>
      </div>
      <div style={mockupStyles.chipRow}>
        <span style={{ ...mockupStyles.tag, background: 'var(--accent-info-bg)', color: 'var(--accent-info)' }}>I am unseen ✓</span>
        <span style={{ ...mockupStyles.tag, background: 'var(--bg-secondary)' }}>I am not enough</span>
        <span style={{ ...mockupStyles.tag, background: 'var(--bg-secondary)' }}>I am alone</span>
      </div>
      <div style={mockupStyles.inputRow}>
        <div style={mockupStyles.inputBar}></div>
        <div style={mockupStyles.sendBtn}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 8L5 2L8 8" stroke="var(--bg-primary)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
    </div>
  );
}

function BankMockup() {
  return (
    <div style={mockupStyles.frame}>
      <p style={mockupStyles.kicker}>Log positive memory</p>
      <div style={mockupStyles.bubble}>
        <p style={mockupStyles.bubbleText}>My friend just listened. Didn't try to fix anything.</p>
      </div>
      <p style={mockupStyles.smallLabel}>This is evidence of</p>
      <div style={mockupStyles.chipRow}>
        <span style={{ ...mockupStyles.tag, background: 'var(--accent-success-bg)', color: 'var(--accent-success)' }}>I am loved ✓</span>
        <span style={{ ...mockupStyles.tag, background: 'var(--accent-success-bg)', color: 'var(--accent-success)' }}>I am seen ✓</span>
      </div>
      <div style={mockupStyles.darkBtn}>
        <span style={mockupStyles.darkBtnText}>Bank this moment</span>
      </div>
    </div>
  );
}

function PatternsMockup() {
  const bars = [
    { label: 'I am unseen', count: 6, width: '100%' },
    { label: 'I am not enough', count: 4, width: '67%' },
  ];
  const dayHeights = [40, 30, 60, 40, 50, 70, 100];
  return (
    <div style={mockupStyles.frame}>
      <p style={mockupStyles.kicker}>Patterns</p>
      <p style={{ ...mockupStyles.smallLabel, marginBottom: '5px' }}>Top beliefs</p>
      {bars.map(({ label, count, width }) => (
        <div key={label} style={{ marginBottom: '5px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', color: 'var(--text-secondary)', marginBottom: '3px' }}>
            <span>{label}</span><span>{count}</span>
          </div>
          <div style={{ background: 'rgba(42,39,36,0.1)', height: '4px', borderRadius: '2px' }}>
            <div style={{ background: 'var(--text-primary)', height: '100%', width, borderRadius: '2px' }}></div>
          </div>
        </div>
      ))}
      <p style={{ ...mockupStyles.smallLabel, margin: '8px 0 5px' }}>When triggers happen</p>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '28px' }}>
        {dayHeights.map((h, i) => (
          <div key={i} style={{
            flex: 1,
            background: i === 6 ? 'var(--text-primary)' : 'rgba(42,39,36,0.15)',
            borderRadius: '2px',
            height: `${h}%`
          }}></div>
        ))}
      </div>
    </div>
  );
}

const mockupStyles = {
  frame: {
    width: '210px',
    background: 'var(--bg-secondary)',
    borderRadius: '20px',
    border: '1.5px solid var(--border-medium)',
    padding: '12px 14px',
  },
  kicker: {
    fontSize: '9px',
    color: 'var(--text-tertiary)',
    marginBottom: '8px',
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  bubble: {
    background: 'var(--bg-card)',
    borderRadius: '10px',
    padding: '8px 10px',
    marginBottom: '6px',
  },
  bubbleText: {
    fontSize: '9px',
    lineHeight: 1.5,
    color: 'var(--text-secondary)',
    margin: 0,
  },
  chipRow: {
    display: 'flex',
    gap: '4px',
    flexWrap: 'wrap',
    marginBottom: '8px',
  },
  tag: {
    display: 'inline-block',
    fontSize: '9px',
    padding: '3px 7px',
    borderRadius: '8px',
    fontWeight: 500,
  },
  smallLabel: {
    fontSize: '8px',
    color: 'var(--text-tertiary)',
    marginBottom: '5px',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    margin: 0,
  },
  inputRow: {
    display: 'flex',
    gap: '6px',
    alignItems: 'center',
  },
  inputBar: {
    flex: 1,
    background: 'var(--bg-secondary)',
    borderRadius: '10px',
    height: '22px',
  },
  sendBtn: {
    width: '22px',
    height: '22px',
    background: 'var(--text-primary)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  darkBtn: {
    background: 'var(--text-primary)',
    borderRadius: '8px',
    padding: '7px',
    textAlign: 'center',
    marginTop: '2px',
  },
  darkBtnText: {
    fontSize: '9px',
    color: 'var(--bg-primary)',
    fontWeight: 500,
  },
};

const CARDS = [
  {
    image: LensIllustration,
    kicker: 'An emotional processing tool',
    title: 'Most of our emotional patterns are shaped in childhood.',
    paragraphs: [
      'These early beliefs become the lens through which we experience everything — relationships, work, our own worth. They run quietly in the background, shaping how we feel and react.',
      ['The only way to update them is through ', { em: 'repetition and emotion' }, ' — the same mechanism that created them.'],
    ],
  },
  {
    image: ChatMockup,
    title: 'Real-time emotional processing tool.',
    paragraphs: [
      'When something charges you, capture it. When you have capacity, work through it with a 6-step AI-guided process that surfaces the belief underneath and helps you find opposing proof.',
      'Every processed session becomes a memory your subconscious can actually use.',
    ],
  },
  {
    image: BankMockup,
    title: 'Save the moments that feel right.',
    paragraphs: [
      'When something feels good — log it. Tag it with the truth it proves. These positive memories get banked and saved for later.',
      ['When you\'re triggered, your brain has trouble accessing memories that contradict what you\'re feeling. The app ', { em: 'surfaces them for you' }, ' — right when you need them.'],
    ],
  },
  {
    image: PatternsMockup,
    title: 'See what keeps coming up.',
    paragraphs: [
      'Over time, patterns become visible. Which beliefs activate most. Which days carry the most charge. Awareness of the pattern is the first step to changing it.',
    ],
    privacy: true,
    cta: 'Get started →',
  },
];

// Render paragraph that can include emphasis spans
function renderParagraph(content) {
  if (typeof content === 'string') return content;
  return content.map((part, i) => {
    if (typeof part === 'string') return part;
    if (part.em) return <span key={i} style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{part.em}</span>;
    return null;
  });
}

export default function Onboarding({ onComplete }) {
  const [cardIndex, setCardIndex] = useState(0);
  const card = CARDS[cardIndex];
  const isLast = cardIndex === CARDS.length - 1;
  const Image = card.image;

  const advance = () => {
    if (isLast) onComplete();
    else setCardIndex((i) => i + 1);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'var(--bg-primary)',
      display: 'flex',
      flexDirection: 'column',
      maxWidth: '480px',
      margin: '0 auto',
      zIndex: 200,
    }}>
      {/* Skip button — top right */}
      <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
        <button
          onClick={onComplete}
          style={{ fontSize: '14px', color: 'var(--text-tertiary)' }}
        >
          Skip
        </button>
      </div>

      {/* Image area */}
      <div style={{
        height: '220px',
        background: 'var(--bg-secondary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Image />
      </div>

      {/* Body — scrollable if content overflows */}
      <div style={{
        flex: 1,
        padding: '28px 28px 0',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {card.kicker && (
          <p style={{
            fontSize: '11px',
            color: 'var(--text-tertiary)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            fontWeight: 500,
            marginBottom: '10px',
          }}>{card.kicker}</p>
        )}

        <h2 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '24px',
          fontWeight: 500,
          lineHeight: 1.25,
          marginBottom: '16px',
          color: 'var(--text-primary)',
        }}>
          {card.title}
        </h2>

        {card.paragraphs.map((p, i) => (
          <p key={i} style={{
            fontSize: '15px',
            color: 'var(--text-secondary)',
            lineHeight: 1.65,
            marginBottom: '14px',
          }}>
            {renderParagraph(p)}
          </p>
        ))}

        {card.privacy && (
          <div style={{
            background: 'rgba(120, 145, 175, 0.10)',
            border: '0.5px solid rgba(120, 145, 175, 0.25)',
            borderRadius: '12px',
            padding: '14px 16px',
            marginTop: '4px',
            marginBottom: '8px',
          }}>
            <p style={{
              fontSize: '11px',
              color: 'rgb(80, 105, 140)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              fontWeight: 500,
              marginBottom: '6px',
            }}>Your data stays yours</p>
            <p style={{
              fontSize: '13px',
              color: 'var(--text-secondary)',
              lineHeight: 1.55,
            }}>
              Everything you log lives only on your device. The only thing the AI sees is your active conversation — your past stays yours.
            </p>
          </div>
        )}
      </div>

      {/* Footer — progress dots + button */}
      <div style={{ padding: '20px 28px 32px', flexShrink: 0 }}>
        {/* Progress dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: '16px' }}>
          {CARDS.map((_, i) => (
            <div
              key={i}
              style={{
                height: '4px',
                borderRadius: '2px',
                background: i === cardIndex ? 'var(--text-primary)' : 'var(--border-subtle)',
                width: i === cardIndex ? '20px' : '6px',
                transition: 'all 0.25s ease',
              }}
            />
          ))}
        </div>

        <button
          onClick={advance}
          style={{
            width: '100%',
            background: 'var(--text-primary)',
            color: 'var(--bg-primary)',
            padding: '16px',
            borderRadius: '14px',
            fontSize: '16px',
            fontWeight: 500,
          }}
        >
          {card.cta || 'Next →'}
        </button>
      </div>
    </div>
  );
}
