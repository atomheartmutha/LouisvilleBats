# Question-first derby

Each correct answer unlocks one pitch. An incorrect answer counts as one strike,
shows an explanation for 1.8 seconds, then loads another question. A missed pitch
also counts as one strike. Three strikes make one out; three outs retire the side.
Time Out pauses the pitch; it does not open a quiz or unlock another attempt.

## Questions and real players

Set `GEMINI_API_KEY` in the server's `.env` and restart Node. Optional
`GEMINI_MODEL` defaults to `gemini-3.8-flash`. Keys remain on the server.
The question generator uses Google's Interactions REST API with JSON schema
output and `store: false`; no player answers or child identifiers are sent.
Only recent question text, difficulty and public baseball facts enter the prompt.

Gemini generates small question batches from supplied MLB roster/statistics and
curated MiLB history facts. Answer indices, unique options, source fact IDs and
correct-answer text are validated before delivery. Semantic wording still comes
from a model, so editorial review remains useful. Pools expire after five minutes;
recent question IDs are excluded. A failed generation uses sourced questions and
backs off for one minute. No key means sourced questions only.

Louisville's active roster comes from MLB team 416, with hitting statistics from
sport 11. Data is cached for five minutes. Stale fetched names can be used during
an outage; a cold outage uses “You — Hometown Slugger,” never invented real names.
Missing statistics are left unknown, with neutral game ratings. Game ratings are
not real statistics. Buddy remains the mascot/pitcher, not a roster entry.

Sources are stored beside facts in `src/questions.js`. Add reviewed facts there
to expand local history coverage. School-standard terminology is kept out of
the player-facing question flow.

Run `npm test` for deterministic gameplay and API-contract regression checks.
