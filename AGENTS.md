# Development workflow

- Work in small, coherent changes on main. Finish one change before beginning the next.
- Turn each behavioral specification and bug fix into a regression test when feasible.
- Run `npm test`, fix every failure, then commit and push the passing change.
- Never bypass the pre-commit hook or weaken assertions to make a failing change pass.
- Run `npm run hooks:install` on a fresh checkout. `npm install` also installs the hook.
- Preserve unrelated local changes. Do not commit credentials or environment files.
- Keep unit tests deterministic: mock MLB/Gemini responses, clocks and animation frames.
- Live API/browser checks supplement the suite; they do not replace unit tests.
