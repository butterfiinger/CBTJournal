import { useRef, useState } from 'react';

/**
 * A camera icon button that lets the user upload a photo of handwriting.
 * The photo gets sent to /api/vision-extract to pull out the text,
 * then the extracted text is passed back via onExtracted callback.
 * The photo itself is not stored — one-time use only.
 *
 * Props:
 *   onExtracted(text)  — called with extracted text on success
 *   onError(message)   — called with error message on failure (optional)
 *   disabled           — hides / disables the button
 *   size               — 'sm' (36px) or 'md' (44px), default 'md'
 */
export default function PhotoUploadButton({ onExtracted, onError, disabled, size = 'md' }) {
  const fileInputRef = useRef(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const dimension = size === 'sm' ? '36px' : '44px';
  const iconSize = size === 'sm' ? 18 : 22;

  const handleClick = () => {
    if (isProcessing || disabled) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    // Reset the input value so the same file can be picked again
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onError?.('That doesn\'t look like a photo. Try again.');
      return;
    }

    setIsProcessing(true);

    try {
      // Resize the image before sending — keep it under ~1MB and 1024px wide
      const resized = await resizeImage(file, 1024, 0.75);

      // Extract just the base64 portion (strip the data URL prefix)
      const base64 = resized.dataUrl.split(',')[1];

      const response = await fetch('/api/vision-extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64,
          mediaType: resized.mediaType,
        }),
      });

      if (!response.ok) {
        throw new Error('Extraction failed');
      }

      const data = await response.json();
      const text = (data.text || '').trim();

      if (text === '[no text found]') {
        onError?.('No text found in that photo. Try again with a clearer image.');
      } else if (text === '[could not read image]') {
        onError?.('Couldn\'t read that photo. Try again with better lighting or focus.');
      } else if (!text) {
        onError?.('No text came back. Try again.');
      } else {
        onExtracted(text);
      }
    } catch (err) {
      console.error('Photo upload failed:', err);
      onError?.('Something went wrong reading the photo. Try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      <button
        onClick={handleClick}
        disabled={isProcessing || disabled}
        aria-label="Upload photo of journal entry"
        style={{
          width: dimension,
          height: dimension,
          borderRadius: '50%',
          background: 'var(--bg-secondary)',
          color: isProcessing ? 'var(--text-tertiary)' : 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '0.5px solid var(--border-subtle)',
          flexShrink: 0,
          transition: 'opacity 0.2s ease',
          opacity: (isProcessing || disabled) ? 0.6 : 1,
        }}
      >
        {isProcessing ? (
          <Spinner size={iconSize} />
        ) : (
          <CameraIcon size={iconSize} />
        )}
      </button>
    </>
  );
}

function CameraIcon({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  );
}

function Spinner({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </svg>
  );
}

/**
 * Resize an image file to fit within maxWidth, output as JPEG with the given quality.
 * Returns { dataUrl, mediaType }.
 */
function resizeImage(file, maxWidth, quality) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image'));
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const width = Math.round(img.width * scale);
        const height = Math.round(img.height * scale);

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve({ dataUrl, mediaType: 'image/jpeg' });
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}
