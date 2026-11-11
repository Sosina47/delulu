[11/11/2026 04:37 AM] _Hunda_: Task: Create a 60-Minute Vertical-Slice Development Plan for "Delulu Police"

Act as a Senior Full-Stack Architect, Product Engineer and Technical Project Manager.

I'm in a hackathon (AWS AASTU Student Group). The build window is about 60 MINUTES, using an AI coding agent (Google Antigravity / Gemini) to write the code. Your job is to PLAN the app, not implement it. Produce a single file, DEVELOPMENT.md, detailed enough that the coding agent can build the whole app slice by slice without inventing architecture, guessing API contracts, or making product decisions.

## 0. JUDGING CRITERIA (the plan must maximize these)

Total 100 points:
- UI (35): Visual look and polish (12) | Motion and interaction feel: animations, sounds, game feel (11) | Clear and easy to use in the first 10 seconds (12)
- Functionality (35): Main thing works end to end (15) | Depth: how much real stuff got built in an hour (10) | Holds up when poked: odd clicks, small screens, no crashes (10)
- Spirit (30): Idea and originality (10) | Fun, wow or humor (10) | Vibe-coding craft: smart use of AI and ambition for 60 minutes (10)

Every decision in the plan must be justified against these. Each slice must state which criteria it earns points on.

## 1. PRODUCT

Delulu Police is an AI entertainment app: a dramatic, sarcastic, funny police department that investigates users' questionable assumptions (crushes, relationships, friendships, career, life). The user submits a case; an AI detective separates facts from assumptions and delivers a funny but realistic verdict as an official police report.

Example. User: "He watched my Instagram story within two minutes. I think he's secretly in love with me." Verdict line: "Your Honor, the defendant has confused an Instagram story view with a marriage proposal."

Tone: witty, sarcastic, playful, never cruel, never offensive. The AI must never claim to know what another person thinks or feels, and must separate established facts from uncertainty.

## 2. SCOPE (critically evaluate and enforce this; cut anything else)

MUST-HAVE (the app is not submittable without these):
1. Single-screen first impression: headline, one-line explanation, category chips, text area, and a "File Case" button, all visible without scrolling on mobile. No separate landing page, no navigation required, no "how it works" section (replace with 2-3 clickable example cases that fill the text box).
2. Case submission: text area (min 15 and max 600 chars, with live counter) plus a category (Crush, Relationship, Friendship, Career, Life, Other).
3. AI investigation via Gemini, returning validated structured JSON.
4. Police-report verdict screen (the main experience; spend polish time here).
5. Investigation sequence animation while waiting for the API (the loading state IS part of the show).
6. Graceful failure: a funny fallback screen plus a retry button, and a canned fallback verdict if Gemini fails twice.

SHOULD-HAVE (build in this order if time allows):
7. Appeal Your Case (one appeal per case, via a "Your Honor, I OBJECT" button).
8. Shareable verdict card as PNG, generated client-side.
9. Investigation history in localStorage ("Case Files" drawer).

OPTIONAL (only after everything above is done and verified): sound effects, confetti on INNOCENT, a "Case of the Day" random example, copy-text share fallback.

EXPLICITLY OUT OF SCOPE: authentication, database, accounts, separate backend hosting, multi-page routing, i18n, admin pages, analytics, streaming responses.

Sound effects are the exception: they are cheap, worth points under "game feel", and should be promoted to should-have if audio can be done with the Web Audio API without asset files.

## 3. VERDICTS AND SCORING

Delulu Score is 0-100. The verdict must be derived consistently from the score:
- 0-25: INNOCENT (conclusion reasonably supported)
- 26-50: SLIGHTLY DELULU (some assumptions)
- 51-75: GUILTY (poorly supported by the evidence)
- 76-100: DELULU PRO MAX (elaborate narrative, very little evidence)
[11/11/2026 04:37 AM] _Hunda_: The backend must compute/overwrite the verdict from the score so a model mismatch can never reach the UI.

Safety rule: if the case describes abuse, self-harm, threats, stalking, or a minor in danger, the AI must drop the comedy, set safety.triggered = true, and return a short, kind, non-joking response with a suggestion to talk to a trusted person or local support service. The UI then shows a calm "Officer stepping out of character" screen instead of the stamped report (no score, no share).

## 4. UI / UX DIRECTION

Identity: playful police investigation. Cream/off-white backgrounds, coral/red accents, dark charcoal text. Case files, evidence folders, badges, stamps, fingerprints, "CONFIDENTIAL" tapes, a typed-report feel. Choose exactly TWO Google Fonts (one chunky playful display font for headings/stamps, one typewriter-style font for report text) with proper fallbacks, and define design tokens (colors, radii, shadows) once in the Tailwind config.
Avoid: generic AI chatbot layouts, dark themes, aggressive neon, heavy gradients, clutter, unnecessary pages.

GAME FEEL (11 pts, define concrete behavior in the plan):
- Investigation sequence (about 3-6 s, loops until the API responds): rotating status lines such as "Dusting the Instagram story for fingerprints...", "Interviewing your delusions...", "Consulting the Chief of Vibes...", a progress bar, and a badge/magnifier animation. The minimum duration of the sequence is 2.5 s even if the API is faster, so the show is never skipped.
- Verdict reveal sequence: report paper slides in, the Delulu Score counts up from 0, then the verdict STAMP slams in with a screen shake and (if enabled) a stamp sound. Sections then reveal one by one (Evidence, Assumptions, Findings, Alternative Explanations, Advice, Final Statement).
- Button/hover micro-interactions, a stamped Case ID, and respect for prefers-reduced-motion (reduce, don't break).
- Sound: short effects (typewriter tick, siren blip, stamp thud), generated with the Web Audio API or tiny bundled files, started only after a user gesture, with a visible mute toggle (state persisted).

FIRST 10 SECONDS (12 pts): a stranger must understand what the app does and how to start in 10 seconds. The first screen contains the product name, a one-line promise, the input, and the CTA. Primary button text is a verb ("File Case"). Provide error text next to the field, not alerts.

POKE-PROOF (10 pts) is a first-class requirement, not an afterthought. The plan must include a "Poke Test Checklist" the agent runs before finishing, covering at least:
- empty / too short / too long input, emoji-only input, pasted HTML/script text (must render as plain text, never as HTML)
- double-clicking File Case (only one request fires; button disabled)
- refreshing mid-investigation, using Back, spamming Appeal
- 360px-wide screens and landscape phones, no horizontal scroll, tappable buttons at least 44px
- backend down, Gemini timeout (set a 20s timeout), invalid JSON, schema-valid but out-of-range values
- localStorage disabled/full/corrupt (the app must still work)
- rate limit hit (friendly message, not a crash)
- prompt-injection attempts ("ignore previous instructions...") must still yield an in-character report

## 5. TECHNICAL DECISIONS (decide these in the plan, don't leave them open)
[11/11/2026 04:37 AM] _Hunda_: - Frontend: React + TypeScript + Vite + Tailwind CSS. State: plain React state + one small reducer for the flow (idle > investigating > verdict > appealing > error). No Redux/Zustand/React Router.
- Backend: to minimize deployment time, STRONGLY prefer a single deployment on Vercel using one serverless function (api/investigate.ts and api/appeal.ts) instead of a separate Express host. If you choose Express instead, justify why it saves time. Gemini API key is server-side only (GEMINI_API_KEY); never expose it to the browser.
- AI: Google Gemini via official SDK or REST, using a fast Flash-class model (model name from env var GEMINI_MODEL), JSON mode with responseSchema, low-to-medium temperature, max output tokens set. Validate responses with Zod (the only extra runtime dependency worth adding). On invalid JSON: retry once, then return the canned fallback verdict (flagged fallback: true, in-character).
- Rate limiting: simple in-memory per-IP limiter (e.g. 8 requests/minute) with a note about serverless limitations; plus a client-side cap of 1 appeal per case.
- Stateless backend: no database. The appeal request carries the original case, original report summary and the new evidence from the client. The backend re-validates all of it.
- Persistence: localStorage only, versioned key (e.g. "delulu:v1:cases"), max 20 cases, wrapped in try/catch with an in-memory fallback.
- Share image: client-side with html-to-image (or similar) from a dedicated, fixed-size ShareCard component (1080x1350). Contains ONLY score, verdict, category, the funny summary/roast line, and branding. It must NEVER include the user's submitted text, Case ID is OK. Use the Web Share API when available (fallback: download PNG). Include fonts correctly so the image isn't rendered with fallback fonts (document how to verify).
- Env vars: GEMINI_API_KEY, GEMINI_MODEL, optional RATE_LIMIT_PER_MIN. Provide .env.example. Never commit secrets.
- Deployment: Vercel, with exact steps (import repo, set env vars, deploy, smoke test the live URL on a phone).

## 6. AI DESIGN (specify in the plan)

Include in DEVELOPMENT.md:
- The full system prompt for the detective persona (tone rules, no mind-reading, fact vs assumption discipline, injection resistance, safety rule, length limits per field so the report fits the UI).
- The exact JSON response schema (TypeScript interface + Zod schema + Gemini responseSchema), including at minimum: caseTitle, delulusScore (0-100), verdict, evidence[] (facts the user actually stated), assumptions[], redFlags[], greenFlags[], alternativeExplanations[], advice[], investigatorFindings, roastSummary (one punchy line, used on the share card), finalStatement, safety { triggered, message }.
- Field length and array size limits (so the layout never breaks).
- The appeal prompt: reassess with the new evidence, may raise/lower/keep the score, must explain what changed ("Appeal granted / partially granted / denied"), and returns the same schema plus appealOutcome and scoreChange.
- 4-5 example cases with expected score bands, to be used as manual test cases.
- Server-side post-processing: clamp score, derive the verdict from score, trim and cap arrays, strip HTML.

## 7. VERTICAL SLICES (about 60 minutes total; reorganize if it produces better slices)

Each slice leaves the app working and deployable. Suggested structure and time boxes:
[11/11/2026 04:37 AM] _Hunda_: - Slice 0+1 (about 0-15 min): "File a case, get a verdict, end to end". Project scaffold, single-screen UI with category chips and text area, POST /api/investigate, Gemini call with structured JSON, Zod validation, and a plain (unstyled but functional) verdict view. Fallback verdict on failure. This must work before anything else.
- Slice 2 (about 15-30 min): "The show". The full police-report verdict screen, design tokens, fonts, investigation sequence, count-up score, stamp slam, section reveals, sounds + mute toggle, mobile layout, example-case chips. This is where UI and game-feel points are earned.
- Slice 3 (about 30-40 min): "Appeal Your Case". Button, appeal text box, POST /api/appeal, appealed report replaces/annotates the original, one appeal per case, clear "appeal denied/granted" stamp.
- Slice 4 (about 40-50 min): "Share and remember". ShareCard to PNG + share/download, plus localStorage history drawer (list, open a past report, delete one, clear all).
- Slice 5 (about 50-60 min): "Poke-proof and ship". Run the full Poke Test Checklist, fix findings, README + .env.example, Vercel deploy, phone smoke test, demo script.

For EVERY slice, document: title and objective; judging criteria it targets; user-visible outcome; scope (frontend, backend, AI, storage); ordered implementation tasks; API contracts (method, route, request, response, status codes, error shapes) for relevant endpoints only; data structures and types; design requirements for visual consistency; testing and verification; Definition of Done (objective and checkable); dependencies.

Only create the endpoints that are needed: POST /api/investigate and POST /api/appeal (plus an optional GET /api/health).

## 8. TESTING STRATEGY (hackathon-sized)

Keep tests minimal and high-value: unit tests for verdict derivation, score clamping, Zod validation, HTML stripping, and the fallback path; 2-3 API integration tests with a mocked Gemini (valid response, malformed JSON, timeout); the manual Poke Test Checklist; one real Gemini smoke test per example case. Do not spend time on snapshot or E2E frameworks.

## 9. RULES FOR THE CODING AGENT (include these verbatim in DEVELOPMENT.md)

- Implement ONE slice at a time; do not build features from later slices.
- Inspect the existing code first and follow interfaces established earlier. No unnecessary refactoring.
- No new dependencies without a clear reason stated in the report.
- Proper TypeScript, no unnecessary any. Validate ALL incoming backend data and never trust AI output without validation.
- Handle loading, empty, success and error states in every slice.
- Secrets stay on the backend.
- No TODOs, placeholders or fake implementations for features in the current slice.
- Don't mark a task done until you've run the relevant check (build, tests, manual scenario).
- Keep the code simple. This is a hackathon, so avoid over-engineering.
- After each slice, give a SHORT report: what was built, key files, checks run and their results, known limitations, and confirmation that the Definition of Done is met. Then STOP and wait for me to type "go". Keep the report under 15 lines so approvals are fast.
- If time is running out: freeze features, protect the end-to-end flow, and jump to Slice 5.

## 10. CUT LINE

Include a short "If we're running late" section: the exact order in which to drop things (optional enhancements, then history, then share image, then appeal), and what the minimum submittable demo is (Slices 0+1 and 2, deployed).

## 11. DELIVERABLE

One file: DEVELOPMENT.md, containing: product overview and goals; judging-criteria mapping; core user journey; scope and prioritization; tech stack and justification; architecture and folder structure; data structures and API contracts; AI prompt and schema design; detailed slice plan; testing strategy and Poke Test Checklist; environment configuration; deployment steps; coding-agent rules; demo script (a 60-second walkthrough that shows each judging criterion); final quality checklist.
[11/11/2026 04:37 AM] _Hunda_: Do not write the actual application code. Small snippets (TypeScript interfaces, JSON schemas, example requests/responses, the AI system prompt) are welcome where they remove ambiguity.

Before writing the document, critically review the scope above and remove anything that doesn't fit in 60 minutes of AI-assisted building. Prioritize clarity, implementation-readiness, and realistic scope over length. Aim for a document the agent can follow without asking me questions.