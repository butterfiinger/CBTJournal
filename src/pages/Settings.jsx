import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { exportAllData, importData, getAllEntries } from '../lib/storage';

export default function Settings({ onReplayOnboarding }) {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [confirmingImport, setConfirmingImport] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const totalEntries = getAllEntries().length;

  const formatDate = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const handleExport = () => {
    const json = exportAllData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `emotional-processing-backup-${formatDate()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setFeedback({ type: 'success', message: `Exported ${totalEntries} ${totalEntries === 1 ? 'entry' : 'entries'}.` });
  };

  const handleFilePick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setConfirmingImport({ jsonString: ev.target.result, fileName: file.name });
    };
    reader.readAsText(file);
    // Reset the input so the user can pick the same file again later if needed
    e.target.value = '';
  };

  const confirmImport = () => {
    if (!confirmingImport) return;
    const result = importData(confirmingImport.jsonString);
    setConfirmingImport(null);
    if (result.success) {
      setFeedback({ type: 'success', message: `Imported ${result.count} ${result.count === 1 ? 'entry' : 'entries'}. Reloading…` });
      // Reload so all pages pick up the new data fresh
      setTimeout(() => window.location.reload(), 800);
    } else {
      setFeedback({ type: 'error', message: result.error || 'Import failed.' });
    }
  };

  return (
    <div className="fade-in subpage">
      <div className="top-bar">
        <button className="top-bar-action" onClick={() => navigate('/')}>← Cancel</button>
        <span className="top-bar-title">Settings</span>
        <span style={{ width: '60px' }}></span>
      </div>

      <div className="subpage-content">
        <div className="app-content" style={{ paddingTop: 'var(--space-5)' }}>

          {/* Feedback toast */}
          {feedback && (
            <div
              style={{
                background: feedback.type === 'success' ? 'var(--accent-success-bg)' : 'rgba(184, 122, 82, 0.1)',
                color: feedback.type === 'success' ? 'var(--accent-success)' : 'var(--accent-warm)',
                padding: 'var(--space-3) var(--space-4)',
                borderRadius: 'var(--radius-md)',
                fontSize: '14px',
                marginBottom: 'var(--space-5)',
                lineHeight: 1.5,
              }}
            >
              {feedback.message}
            </div>
          )}

          {/* Your data section */}
          <div className="section">
            <p className="field-label">Your data</p>
            <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.55, marginBottom: 'var(--space-4)' }}>
              You have <strong style={{ color: 'var(--text-primary)' }}>{totalEntries}</strong> {totalEntries === 1 ? 'entry' : 'entries'} stored on this device.
              Export to back them up or move to another device. Import to restore from a backup.
            </p>

            <button className="btn-primary" onClick={handleExport} style={{ marginBottom: 'var(--space-3)' }}>
              Export all data
            </button>

            <button className="btn-secondary" onClick={() => fileInputRef.current?.click()}>
              Import from file
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFilePick}
              style={{ display: 'none' }}
            />

            <p className="field-helper" style={{ marginTop: 'var(--space-3)' }}>
              Importing replaces all current entries on this device. Export first if you want to keep what's already here.
            </p>
          </div>

          <div style={{ height: '0.5px', background: 'var(--border-subtle)', margin: 'var(--space-6) 0' }}></div>

          {/* About section */}
          <div className="section">
            <p className="field-label">About</p>
            <button
              onClick={() => {
                onReplayOnboarding();
                navigate('/');
              }}
              style={{
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-4)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
                textAlign: 'left',
              }}
            >
              <span style={{ fontSize: '15px' }}>What is this app?</span>
              <span style={{ color: 'var(--text-tertiary)' }}>→</span>
            </button>
          </div>

        </div>
      </div>

      {/* Import confirmation modal */}
      {confirmingImport && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(42, 39, 36, 0.4)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            zIndex: 250,
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
              Replace all current data?
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '20px' }}>
              This will permanently replace all entries currently on this device with the ones in
              <strong style={{ color: 'var(--text-primary)' }}> {confirmingImport.fileName}</strong>.
              {totalEntries > 0 && ` Your existing ${totalEntries} ${totalEntries === 1 ? 'entry' : 'entries'} will be lost.`}
            </p>

            <button
              onClick={confirmImport}
              className="btn-primary"
              style={{ marginBottom: '8px', background: '#b85252' }}
            >
              Replace and import
            </button>
            <button
              onClick={() => setConfirmingImport(null)}
              style={{
                width: '100%',
                padding: '12px',
                color: 'var(--text-tertiary)',
                fontSize: '14px',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
