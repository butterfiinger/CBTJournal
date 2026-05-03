// Shown contextually after onboarding for iOS Safari users who haven't saved
// the app to their home screen yet. Dismissable, shown once per device.

export default function HomeScreenPrompt({ onDismiss }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(42, 39, 36, 0.4)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        zIndex: 250,
        animation: 'fadeIn 0.25s ease',
      }}
    >
      <div
        style={{
          background: 'var(--bg-primary)',
          borderRadius: '24px 24px 0 0',
          maxWidth: '480px',
          width: '100%',
          padding: '28px 24px calc(24px + env(safe-area-inset-bottom))',
          boxShadow: '0 -4px 30px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div
          style={{
            width: '40px',
            height: '4px',
            background: 'var(--border-medium)',
            borderRadius: '2px',
            margin: '0 auto 20px',
          }}
        />

        <h2
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '22px',
            fontWeight: 500,
            lineHeight: 1.25,
            marginBottom: '12px',
            color: 'var(--text-primary)',
          }}
        >
          One more thing — make this yours.
        </h2>

        <p
          style={{
            fontSize: '14px',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            marginBottom: '18px',
          }}
        >
          This works best when it's right there. Save it to your home screen
          so it opens like a real app — no browser bar, just you and the
          practice.
        </p>

        <div
          style={{
            background: 'var(--bg-secondary)',
            borderRadius: '12px',
            padding: '14px 16px',
            marginBottom: '20px',
          }}
        >
          <p
            style={{
              fontSize: '11px',
              color: 'var(--text-tertiary)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              fontWeight: 500,
              marginBottom: '8px',
            }}
          >
            How to add it
          </p>
          <ol
            style={{
              fontSize: '13px',
              color: 'var(--text-secondary)',
              lineHeight: 1.7,
              paddingLeft: '20px',
              margin: 0,
            }}
          >
            <li>Tap the share icon at the bottom of Safari</li>
            <li>Scroll down and tap "Add to Home Screen"</li>
            <li>Tap "Add" in the top right</li>
          </ol>
        </div>

        <button
          onClick={onDismiss}
          className="btn-primary"
          style={{ marginBottom: '8px' }}
        >
          Got it
        </button>
        <button
          onClick={onDismiss}
          style={{
            width: '100%',
            padding: '12px',
            color: 'var(--text-tertiary)',
            fontSize: '14px',
          }}
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}
