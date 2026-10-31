## Current submission status

The owner resumed after historical cutoffs and waived physical multiplayer testing. SUBMIT-01 and MVP preparation gates are verified by automated evidence: full 1/2/3/4 CI campaigns and full public two/four campaigns pass, with one recorded public four-player Level 10 replay. Physical tests remain unperformed, not a request for owner work. Personal eligibility review and final submission remain separate. See docs/PROJECT_STATUS.md and QA_LOG.md for exact evidence. No new autonomous feature expansion is needed for this submission.

# Priority Roadmap — Make the Contest Build Work First

**Purpose:** Stretch limited ChatGPT/Codex usage. Complete the smallest real, testable, public multiplayer game first. Do not spend the remaining budget completing all 15 levels or polishing every animation before the game is deployed and externally verified.

## Rule of work

User override, 2026-10-29: continue campaign implementation and remaining MVP materials while physical-device testing is deferred. See AGENTS.md, User-directed campaign expansion. Do not mark deferred acceptance verified. Release 0.3.0 now implements the expanded campaign, co-op/life systems, original comic presentation and release materials; CAMP-01 is verified after full local/public campaigns. The historical sequence below explains the original gates, not a direction to revert completed work. The current owner waiver supersedes the old physical-test preparation gate; personal eligibility review and submission remain owner actions. Exact current evidence and the evening submission authorization are in CODEX_START_HERE.md and docs/PROJECT_STATUS.md; historical cutoffs are superseded.

1. Run `npm test` first. If it fails, diagnose the earliest failing check before adding features.
2. Work top-to-bottom through the **mandatory submission path**. Do not jump to lower-priority work because it is more fun.
3. For each task, inspect only the relevant files, make the smallest change that satisfies the acceptance criteria, add or update a test, run relevant checks, update `QA_LOG.md`, then update `TASK_LIST.md` and `docs/PROJECT_STATUS.md`.
4. Avoid broad rewrites, new frameworks, speculative features, and engine migrations. Preserve existing working functionality. Do not spend time polishing art that will not be seen in the submitted playable slice.
5. Never mark work verified based only on source inspection or syntax checks. Public deployment is not verified until another device/network successfully plays it.

## Gate 0 — Baseline (do this once at the beginning of a work session)

- Run `npm test` and preserve the result in the QA log if it is a new verification session.
- Run `npm run offline` and open `http://localhost:4173` to confirm the game still launches.
- Read `docs/PROJECT_STATUS.md` and the next mandatory task below.
- If a test fails, fix it before stacking additional changes on top.

## Mandatory submission path — finish in this order

### 1. `MVP-01` — One complete playable level

**Goal:** A small but complete game loop, not the whole 15-level campaign.

Required: title/menu → controllable level → at least one readable obstacle/hazard → reachable goal/exit → clear victory state → replay/restart. Keyboard controls must work, no fatal browser console errors, and the user must understand how to start and finish. Make Level 1 the polished vertical slice. It is acceptable for later level entries to remain variants/prototypes for now.

Existing tasks to use: `CORE-01`, `CORE-02`, `CORE-03`, `SYS-01`.

**Gate:** A human can play Level 1 from a fresh load to a win/restart in a real browser. Record browser/version and results.

### 2. `MVP-02` — A real two-player cooperative session

**Goal:** Demonstrate that the project is genuinely multiplayer, not just a local mockup.

Required: a player creates a room, the server gives a random room code, a second browser/device joins with that code, both see the correct players move in the same world, a basic shared objective/door interaction is synchronized, invalid codes give a readable error, and separate rooms stay isolated. Keep the scope small; implement one simple teamwork interaction before advanced carrying/throwing/rescue systems. Use the authoritative server for movement and shared objective state.

Existing tasks to use: `NET-01`, the minimum needed from `NET-03`, `NET-04`, `NET-08`, and `COOP-04`.

**Gate:** Test in two separate browser sessions. Also test two different room codes and confirm players/state do not leak between rooms. Do not count two tabs as proof of public internet play.

### 3. `MVP-03` — Publish the game and verify the public URL

**Goal:** Anyone with the game link can play without logging into ChatGPT or installing the project.

Required: deploy the Node/Express/Socket.IO server and static client to a host that supports long-running Node applications and WebSockets (or a correctly connected equivalent). The app must use the hosting provider's `PORT`, serve the page/assets over HTTPS, and have a working health endpoint. A static-only host by itself is not enough for the current Socket.IO setup. Store secrets in host environment variables; never commit passwords or tokens.

Existing tasks to use: `QA-010`, `NET-08`, `SYS-01`.

**Gate:** Open the HTTPS URL from a separate device/network, create a room, join it from another device, play together, and check `/health`. Record the exact public URL and test result. Do not report “deployed” before this passes.

### 4. `MVP-04` — Submission-ready project materials

Required: concise title and description, an attractive original cover image/screenshot, public game URL, brief control instructions, and a final checklist against the current official mission instructions. The human user must review and submit the entry themselves; do not claim it was submitted unless the user confirms it.

Existing tasks to use: `QA-011`, `ART-02` only to the extent needed for the cover/presentation.

**Gate:** The submission fields and URL are prepared, the URL is playable from outside the developer's computer, and remaining limitations are described honestly.

## If the mandatory path is complete and extra budget remains

Do this order; stop whenever the budget or deadline runs out.

### Extra tier A — Make the slice safer and feel cooperative

1. Add deterministic death/heart handling and regression tests (`NET-05`, `LIFE-01`, `LIFE-02`, `QA-006`).
2. Add solo-safe fallback paths and checkpoint recovery (`LIFE-03` to `LIFE-06`).
3. Add teammate carry/throw or a rescue interaction; test it with two clients (`COOP-01`, `COOP-05`). Choose one satisfying mechanic before attempting every mechanic.
4. Add one recognizable enemy behavior with clear tells (`ENEMY-01`).

### Extra tier B — Add a small amount of authored campaign content

1. Make Levels 1–3 genuinely distinct and fun.
2. Build the Level 5 forest transition, then Level 10 covered walkway/factory reveal.
3. Add remaining unique levels only after the slice and multiplayer tests are stable (`LVL-01` through `LVL-05`).

### Extra tier C — Story and pixel-art polish

1. Improve opening invasion and the three signature story moments (`ART-03` to `ART-06`).
2. Add sprite-sheet poses and animation improvements (`ART-01`, `ART-02`).
3. Add sound, captions/accessibility, and mobile tuning (`ART-07`, `ART-08`, `CORE-04`).

### Extra tier D — Broader QA and advanced multiplayer

Add reconnect restoration, latency smoothing, anti-abuse/rate-limits, larger party testing, performance profiling, and broader browser/device tests (`NET-06`, `NET-07`, `NET-09`, `QA-007` to `QA-009`).

## Stop / defer list while a required gate is open

Do **not** prioritize these before `MVP-01` through `MVP-04` pass:

- Fully hand-authoring all 15 levels.
- Implementing all enemy types at once.
- Building every carry/throw/stack/rescue variation before one shared co-op interaction works.
- Perfecting all four cutscenes, audio, menus, and mobile/gamepad controls.
- Migrating to Godot or changing the tech stack.
- Rewriting files that already work simply to improve code style.

## Status reporting template for Codex

At the end of each working session, report only:

- **Task IDs attempted:**
- **Verified:** include exact test evidence and QA log reference.
- **Still unverified/blocked:** say why; never overclaim.
- **Next single task:** the highest-priority unfinished item from this roadmap.

The intended smallest submission is one polished, short level with one meaningful shared co-op interaction, random room codes, a publicly reachable server, and a verified public playtest. The full 15-level vision remains the long-term target, not the first release gate.
