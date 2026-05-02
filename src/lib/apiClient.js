// API client for calling our Vercel serverless function.
// The serverless function at /api/chat adds the API key server-side and forwards to Anthropic.

import { SYSTEM_PROMPT } from '../data/systemPrompt';

/**
 * Calls the AI with a conversation history.
 * Returns parsed JSON response from the AI: { message, chipType, chipSuggestions, advanceToStep, isComplete }
 */
export async function callAI(conversationMessages, contextData = {}) {
  // Build the system prompt with any contextual data appended
  let fullSystemPrompt = SYSTEM_PROMPT;

  if (contextData.currentStep) {
    fullSystemPrompt += `\n\n═══════════════════════════════════════════════\nCURRENT CONTEXT\n═══════════════════════════════════════════════\n\nThe user is currently at Step ${contextData.currentStep}.`;
  }

  if (contextData.entryData) {
    fullSystemPrompt += `\n\nEntry data so far:\n${JSON.stringify(contextData.entryData, null, 2)}`;
  }

  if (contextData.canonicalLists) {
    fullSystemPrompt += `\n\nCanonical lists available for chip suggestions:\n${JSON.stringify(contextData.canonicalLists, null, 2)}`;
  }

  if (contextData.bankMatches) {
    fullSystemPrompt += `\n\nBank entries matched for this wound (use these when surfacing evidence at Step 4):\n${JSON.stringify(contextData.bankMatches, null, 2)}`;
  }

  if (contextData.gentlePrompt) {
    fullSystemPrompt += `\n\nThe bank returned no matches for this wound. Use this gentle prompt when offering help: "${contextData.gentlePrompt}"`;
  }

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 1024,
        system: fullSystemPrompt,
        messages: conversationMessages,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API error:', response.status, errorData);
      throw new Error(`API returned ${response.status}: ${errorData.error || 'Unknown error'}`);
    }

    const data = await response.json();

    // Extract the text content from Anthropic's response format
    const aiTextContent = data.content?.find((c) => c.type === 'text')?.text;
    if (!aiTextContent) {
      throw new Error('No text content in AI response');
    }

    // Parse the JSON our system prompt instructed the AI to return
    let parsed;
    try {
      // Strip any markdown code fences if the AI accidentally added them
      const cleaned = aiTextContent
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```\s*$/i, '')
        .trim();
      parsed = JSON.parse(cleaned);
    } catch (parseError) {
      console.error('Failed to parse AI JSON:', aiTextContent);
      // Fallback: treat entire response as a plain message
      parsed = {
        message: aiTextContent,
        chipType: null,
        chipSuggestions: null,
        advanceToStep: null,
        isComplete: false,
      };
    }

    return parsed;
  } catch (error) {
    console.error('callAI error:', error);
    throw error;
  }
}
