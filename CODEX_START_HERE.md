# Start here in Codex

## Current owner authorization (October 29-30, 2026)

The owner explicitly deferred physical-device testing and authorized completing the campaign, remaining implementation, bug testing and optional art/features until 06:00 America/New_York October 30 (10:00 UTC). This supersedes the older gate-only restrictions below for that session. At the cutoff save a handoff and stop autonomous work. Never fabricate physical acceptance or submit the contest entry. The 15-stage game is deployed; consult docs/PROJECT_STATUS.md for the current source/live revisions and pending checks. Preserve the completed work rather than reverting to a single-level prototype.

You are continuing the existing project **Tiny Teamwork: The Last Spark**. It is an early prototype, not a finished game. The user has limited ChatGPT/Codex budget, so **prioritize getting one real multiplayer slice hosted and playable before expanding the campaign or polishing art**.

## Mandatory order

1. First read the three root-level planning files: `PRIORITY_ROADMAP.md`, `TASK_LIST.md`, and `QA_LOG.md`. Then read `docs/PROJECT_STATUS.md` and `AGENTS.md`. These root-level files are canonical; do not edit the small navigation stubs under `docs/`.
2. Run `npm test` before editing. If it fails, diagnose the failure before adding a feature.
3. Work in this order only: `MVP-01` → `MVP-02` → `MVP-03` → `MVP-04`. Do not jump to optional art, advanced enemies, or all 15 levels while a release gate is open.
4. For each task, inspect only the related files, use the smallest viable change, and avoid broad refactors or new dependencies unless truly needed. Preserve working features.
5. Add/update relevant tests. Run `npm test` after changes. For real-browser behavior, perform browser testing; for multiplayer, test separate browser sessions; for deployment, test from a separate device/network.
6. Record exact commands/manual steps, expected and actual result, date/environment, and limitations in `QA_LOG.md`. Update `TASK_LIST.md` and `docs/PROJECT_STATUS.md`.
7. **Never mark a task verified or tell the user it is complete until every acceptance criterion passes and evidence is logged.** If testing can't happen, use `IMPLEMENTED_UNVERIFIED` or `BLOCKED`.
8. At the end of the session, report task IDs attempted, evidence-backed verified results, blockers, and the next single task. Do not spend the final message re-describing the entire project.

## Smallest target worth submitting

One polished Level 1 loop (start, movement, obstacle, goal, win/restart), two players who join with a random room code, server-synchronized movement, one meaningful shared interaction, room isolation, a public HTTPS URL, and a passing playtest from another device/network. This is a real minimal multiplayer slice. The 15-level story remains the vision, but every level does not need to be bespoke before the first public entry is ready.

## Do not spend time on yet

Until `MVP-01` through `MVP-04` pass, defer: full 15-level authorship, every enemy variant, all carry/throw/rescue variants, full cutscene polish, sound, mobile/gamepad extras, and engine migration. If the core deployment is blocked, focus on diagnosing that blocker—not adding features that can't be shown to judges.

## Non-negotiable design reminders

- Campaign plan: Levels 1–5 city, 6–10 forest, 11–15 robot factory.
- Level 10 includes the human-only covered walkway with about 100 flying robots overhead, followed by the factory-manufacturing reveal and pursuers behind the survivors.
- After Level 15, humans celebrate the factory destruction, then robots attack and the scene cuts to black.
- Art remains original while using the broad pacing/contrast/readability of classic arcade pixel-art cutscenes; never copy or trace TMNT artwork, sprites, or layouts.
- Robots are indestructible. Players evade, escape, distract, or rescue. A teammate may briefly stun a robot only when it is actively grabbing a teammate, forcing release.
- Shared hearts, deaths, checkpoints, carry/throw state, enemy timers, and level completion eventually need server-authoritative validation and event deduplication.
- Teamwork pits must not permanently softlock the remaining survivor. The giant pursuer adds urgency and can destroy temporary checkpoint rooms.
- Preserve the HTML Canvas + JavaScript + Node.js + Express + Socket.IO stack unless the user explicitly requests a migration or a specific blocker requires it.
