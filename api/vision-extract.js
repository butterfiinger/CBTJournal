// Vercel serverless function for extracting text from photos of journal entries.
// Accepts a base64-encoded image, sends it to Claude Vision, returns just the text.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'API key not configured' });
    return;
  }

  try {
    const { imageBase64, mediaType } = req.body;

    if (!imageBase64) {
      res.status(400).json({ error: 'imageBase64 is required' });
      return;
    }

    const validMediaTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const type = mediaType || 'image/jpeg';
    if (!validMediaTypes.includes(type)) {
      res.status(400).json({ error: 'Unsupported media type' });
      return;
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 2000,
        system: `You are a transcription assistant. Your only job is to accurately transcribe handwritten or typed text from an image the user provides.

Rules:
- Output ONLY the transcribed text. No preamble, no explanation, no commentary.
- Preserve the original wording exactly. Don't paraphrase, correct grammar, or "clean up" the text.
- Preserve line breaks where they naturally exist in the source.
- If words are unclear or illegible, put [?] in place of the unclear word — don't guess.
- If the image contains no text at all, respond with just: [no text found]
- If the image is unreadable (too blurry, wrong orientation, etc.), respond with just: [could not read image]
- Do not add quotation marks around the transcribed text.
- Do not add your own header, title, or framing text.`,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: type,
                  data: imageBase64,
                },
              },
              {
                type: 'text',
                text: 'Transcribe the text in this image.',
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', errorText);
      res.status(response.status).json({ error: 'Vision extraction failed' });
      return;
    }

    const data = await response.json();
    const extractedText = data.content?.[0]?.text || '';

    res.status(200).json({ text: extractedText.trim() });
  } catch (err) {
    console.error('Vision extract handler error:', err);
    res.status(500).json({ error: err.message || 'Internal error' });
  }
}
