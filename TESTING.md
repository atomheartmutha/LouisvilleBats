# Trunk-based testing workflow

1. Start from the last committed and pushed change.
2. Express the new behavior as a test, or extend an existing regression test.
3. Implement the smallest coherent change; run `npm test` and resolve failures.
4. Stage the intended change, commit, and push to `main` before starting the next change.
5. Check the GitHub Actions **Unit tests** result; repair a failure immediately.

## Setup and enforcement

Use Node 22 (the CI version). Run `npm run hooks:install` once in an existing clone;
`npm install` runs it automatically for future clones. Git does not activate tracked
hooks merely by cloning, so this installation step matters.

The tracked `.githooks/pre-commit` runs `npm test` and aborts the commit on any
nonzero exit code. The suite runs against the working tree: stage the complete
intended change and avoid leaving related test/code edits unstaged. CI independently
tests the committed tree after every push to main and on pull requests.

No API keys, network calls, third-party test framework or installed dependencies are
needed for the suite. Node's built-in runner discovers `tests/*.test.js`; a missing
test directory fails rather than silently producing a zero-test success.

GitHub Actions reports failures but does not itself block direct pushes. Local
hooks can technically be bypassed; our workflow forbids that. Repository rules
requiring checks are separate settings and have not been changed.

## Specifications covered

| Specification | Regression suite |
| --- | --- |
| Question required; one correct answer earns one pitch | gameplay.test.js |
| Wrong answer adds one strike, rotates question; three strikes make one out | gameplay.test.js |
| Unattended pitch and early swing resolve once without a frame-loop lockup | gameplay.test.js |
| Contact consumes the earned attempt; timeout pauses without opening a quiz | gameplay.test.js |
| Leaving the quiz cannot bypass it; offline questions rotate | gameplay.test.js |
| Live roster mapping preserves names and zero-valued stats | questions.test.js |
| Gemini receives grounded facts; malformed answers fall back safely | questions.test.js |
| Question exclusions, distinct choices, valid answer index and no school jargon | questions.test.js |
| A failing suite blocks a real fixture commit; a passing suite permits it | pre-commit.test.js |
| Vultr deploy waits for passing main tests, pins the exact commit and verifies health | deploy.test.js |
| ElevenLabs keys remain server-side; approved lines cache and mobile browser speech falls back synchronously | announcer.test.js |
| Slugger/Hot Rod pitcher wind-ups and base-running assets stay named, local and gameplay-driven | animations.test.js |
| Drafted batter identity, team colors, scale and skin tone persist while running | animations.test.js |
| Supplied Louisville Slugger Field artwork replaces the procedural field background | animations.test.js |
| Cold questions return immediately, preserve correct answer keys, emphasize baseball math, and never repeat a fact within a session | questions.test.js, gameplay.test.js |
| Win expectancy uses readable semantic math and fixed three-decimal output | sabermetrics.test.js |
| ElevenLabs game sounds effects assets are valid, routed to game events, and retain offline synthesis fallbacks | sfx.test.js |

## Continuous deployment

After **Unit tests** succeeds for a push to `main`, **Deploy to Vultr** checks out
the exact tested commit, packages it without `.env`, deploys it through a dedicated
SSH key, rebuilds the Docker service, and requires internal and public health checks.
Pull requests and manual test runs never deploy. Production `.env` remains only on
the Vultr host at `/opt/road-to-the-bats/.env`.

Deployment remains dormant until the repository variable `VULTR_DEPLOY_ENABLED`
is explicitly set to `true`. Enable it only after the dedicated public key is in
the server's `authorized_keys` and `VULTR_SSH_PRIVATE_KEY` is stored as a GitHub
Actions secret.

Add tests alongside future specifications, especially additional inning rules,
roster outage/cache behavior and adaptive difficulty boundaries.
