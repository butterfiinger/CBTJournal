# Emotional Processing App

A mobile-first PWA for guided emotional processing using the BTEA framework (Beliefs → Thoughts → Emotions → Actions).

## What this is

A personal tool for processing emotional triggers, banking evidence of opposing truths, and seeing patterns over time. Built around Thais Gibson's 6-step Emotional Processing Tool from the Personal Development School.

## Architecture

- **Frontend:** React + Vite, mobile-first PWA
- **Hosting:** Vercel (auto-deploys from this repo)
- **Data:** Local-only via browser localStorage (privacy-first)
- **AI:** Anthropic Claude via Vercel serverless function

## Setup on Vercel

1. Connect this repo to Vercel (one-time)
2. In Vercel project settings → Environment Variables, add:
   - `ANTHROPIC_API_KEY` — your Anthropic API key
3. Deploy

The first deploy ships:
- Home with three doorways
- Capture trigger flow (saves to local storage)
- Log good moment flow
- Bank to browse saved entries

The chat flow (Process) and AI integration come in subsequent iterations.

## Editing canonical data

The framework's canonical lists (wounds, emotions, needs, system prompt) live in `src/data/`. To edit, open the file in GitHub's web interface, edit, commit. Vercel auto-deploys the change.

- `src/data/wounds.json` — 27 core wounds with opposites, AI phrasing, gentle prompts
- `src/data/emotions.json` — 53 emotions with opposite-mappings
- `src/data/needs.json` — 80 tertiary needs grouped by category
- `src/data/defaults.json` — starter chip suggestions
- `src/data/systemPrompt.js` — the AI's behavioral instructions

## Privacy

All entries live in your browser's localStorage. Nothing is uploaded except active LLM conversations. Clearing browser data wipes the bank. Use the export feature (coming soon) to back up.
