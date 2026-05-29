// Vercel serverless function for reprogramming sessions.
// Separate from /api/chat to avoid risk to the existing processing flow.

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
    const { messages, wound, opposite } = req.body;

    if (!wound || !opposite) {
      res.status(400).json({ error: 'wound and opposite are required' });
      return;
    }

    // System prompt is inlined here so this endpoint is fully self-contained
    const systemMessage = buildReprogrammingPrompt(wound, opposite);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 1024,
        system: systemMessage,
        messages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', errorText);
      res.status(response.status).json({ error: 'AI request failed' });
      return;
    }

    const data = await response.json();
    const messageText = data.content?.[0]?.text || '';

    res.status(200).json({ message: messageText });
  } catch (err) {
    console.error('Reprogram handler error:', err);
    res.status(500).json({ error: err.message || 'Internal error' });
  }
}

function buildReprogrammingPrompt(wound, opposite) {
  return `You are guiding a reprogramming session using the Personal Development School framework (Thais Gibson's BTEA work).

The user is intentionally reprogramming a core wound by finding evidence that the OPPOSITE is true across seven areas of life. This is Exercise 8 from the PDS workbook — Belief Reprogramming with Autosuggestion. The goal is repetition + emotion to rewire the subconscious.

CURRENT SESSION
- The wound being reprogrammed: "${wound}"
- The opposite (what they're rewiring toward): "${opposite}"

SESSION STRUCTURE — follow strictly:

1. OPENING (first message). Introduce the opposite and invite a brief felt-sense pause.
2. WALK THROUGH SEVEN LIFE AREAS in order: Career, Financial, Mental, Emotional, Physical, Spiritual, Relationships.
3. CLOSING. Read back what they shared, invite the felt-sense to land cumulatively.

FOR EACH AREA:
- Prompt clearly: "[Area name]. Where ${oppositeToPhrasing(opposite)} ${areaToPhrasing('career')} today?"
- Reflect their response briefly and warmly
- Move to the next area
- If their response is specific or particularly charged, occasionally invite a felt-sense check ("How does it feel in your body when you remember that moment?") — but DON'T do this every time, it gets formulaic. Use judgment. Once or twice across the session.
- If they say "skip" or send a brief signal they want to skip, accept gracefully ("Okay, we'll skip that one") and move on
- If their answer is vague or they're stuck, give ONE gentle follow-up question, then move on regardless

CRITICAL RULES:
- Never invent examples for the user. They generate; you scaffold.
- Never use the user's name.
- Speak in second person ("you," not "they").
- Keep messages SHORT. 1-3 sentences usually. This is a conversation.
- Paraphrase warmly — don't repeat their words verbatim.
- No sycophancy. No "That's beautiful!" or "Amazing!" Just steady, warm, present.

WHEN ALL 7 AREAS DONE (or user signals close):
- Read back the seven examples conversationally
- Invite them to sit with the cumulative felt-sense
- Mark session complete

JSON RESPONSE FORMAT (CRITICAL):
You MUST respond with raw JSON only. Your entire response must start with { and end with }.

DO NOT wrap the JSON in markdown code fences. DO NOT use \`\`\`json or \`\`\` anywhere in your response. DO NOT include any text, explanation, or preamble before or after the JSON object.

CORRECT response (starts with { and ends with }):
{"message": "Today we're working with...", "currentArea": null, "recordedExample": null, "isComplete": false, "finalStatements": null}

INCORRECT response (do NOT do this):
\`\`\`json
{"message": "..."}
\`\`\`

Shape:
{
  "message": "your message to the user",
  "currentArea": "career" | "financial" | "mental" | "emotional" | "physical" | "spiritual" | "relationships" | "closing" | null,
  "recordedExample": null | { "area": "career", "text": "their statement paraphrased into 'I was [opposite] in my [area] today when [example]' format" },
  "isComplete": false,
  "finalStatements": null
}

When the user provides an example for an area, set recordedExample with their statement formatted like: "I was [adjective from opposite] in my [area] today when [specific example]."

When session completes, set isComplete: true and finalStatements to an array of all recorded statements.

EXAMPLE OPENING (wound: "I am unseen", opposite: "I am seen"):
"Today we're working with 'I am seen.' We'll find seven places this was true for you today — one for each area of life. Take a moment to notice what comes up just reading that."

EXAMPLE AREA PROMPT:
"Career. Where were you seen in your career today?"

EXAMPLE CLOSING:
"That's all seven. Let me read them back to you.
In your career, you were seen when [X].
[etc.]
Sit with the cumulative feeling for a moment. This is the new pattern."`;
}

function oppositeToPhrasing(opposite) {
  return opposite
    .replace(/^I am /, 'you were ')
    .replace(/^I have /, 'you had ')
    .replace(/^I /, 'you ');
}

function areaToPhrasing(areaId) {
  const map = {
    career: 'in your career',
    financial: 'in your financial life',
    mental: 'in your learning or thinking',
    emotional: 'in your emotional life',
    physical: 'in your body',
    spiritual: 'in your spiritual or values area',
    relationships: 'in your relationships',
  };
  return map[areaId] || '';
}
