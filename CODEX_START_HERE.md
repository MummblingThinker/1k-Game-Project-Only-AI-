# Start here in Codex

## Current project

Tiny Teamwork: The Last Spark is an implemented fifteen-stage solo/co-op browser game, release 0.3.0. Preserve the completed campaign; do not reset it to the original single-level prototype.

Play: https://tiny-teamwork-last-spark.onrender.com
Source: https://github.com/MummblingThinker/1k-Game-Project-Only-AI-

Use Render My Workspace. GitHub connection is MummblingThinker with admin/push access. Exact live/source revisions, deployment IDs, current checks and archive status are in docs/PROJECT_STATUS.md.

## Owner authorization and cutoff

The owner deferred physical-device testing and authorized campaign implementation, remaining tasks, bug testing and optional art/features until 06:00 America/New_York October 30, 2026 (10:00 UTC). This overrides the older gate-only budget restriction in planning files for this session. At the cutoff save the handoff and stop autonomous work. Further work requires a new owner request; do not interpret the historical deadline as permission for another overnight run.

Physical-device acceptance and contest submission must never be invented. The game can be developed and tested while those human gates remain unchecked.

## Resume procedure

1. Read root TASK_LIST.md and QA_LOG.md, then docs/PROJECT_STATUS.md, AGENTS.md, PRIORITY_ROADMAP.md and docs/PRACTICE_GUIDE.md. Root planning files are canonical; docs navigation stubs are not duplicate task boards.
2. Check the actual live/source state before editing. Runtime is intentionally stable while public campaigns run; do not redeploy into their temporary rooms.
3. Run npm test before code edits. Select a coherent task and preserve working mechanics. Avoid broad rewrites or dependency changes without a concrete need.
4. Test the relevant behavior. Use separate contexts/actual clients for multiplayer. Automated browsers are not physical devices, and headless WebKit is not a physical Safari test.
5. Record exact revision, command/workflow/job, result and limitation in QA_LOG.md. A failed test remains in the history even after repair. Update the task board only when its full acceptance criteria are met.
6. Update docs/PROJECT_STATUS.md and README/help when behavior changes. Build release/TinyTeamwork-source.zip with python scripts/package-release.py --verify after final documentation changes.
7. Report what actually passed and what remains. Do not claim every task is verified merely because the game is implemented.

## Remaining acceptance

MVP-03's missing step is a real two-device/separate-network session at the public URL. Public HTTPS/WSS and independent automated browser campaigns are already covered; consult current evidence before repeating them.

MVP-04 materials exist in submission/. The owner must review eligibility, description/link/cover, the recorded official deadline discrepancy and submission preview, then submit personally. npm run check:submission intentionally remains nonzero while human/device fields are false. Do not change those fields based on automated tests.

Human onboarding, difficulty balance, physical mobile/display performance and headphone/speaker review remain separate. The task board specifies each remaining gap; unchecked does not necessarily mean unimplemented.

## Design constraints to preserve

- Fifteen authored stages: city 1-5, forest 6-10, factory 11-15.
- Level 1 is the short reference; normal later maps are about 3x, milestones 5/10/15 are 5-7x.
- Fixed roughly 120-second normal pursuer after its entry warning, no catch-up teleportation. It can destroy shelters but cannot enter boss arenas.
- Level 5 ordered Warden relays, Level 10 covered swarm/survival passage, Level 15 separate background Colossus and three production-core cycles.
- Robots remain indestructible. Teammate rescue stuns only an actively grabbing robot; boss overloads create escape windows.
- Shared hearts charge once per fatal transition. Checkpoints revive one longest-dead survivor OR restore one heart; full-stage transitions reset the original party pool.
- Carry/throw/stack, crates and fallback stepping stones cannot permanently trap the last survivor.
- Original pixel gameplay art and original anime comic chapters with native captions. Default ending: factory shutdown, celebration, robot attack, blackout.
- Server-authoritative HTML Canvas/JavaScript/Node/Express/Socket.IO architecture. Supported party size 1-4, join before start; disconnect requires a fresh lobby. Keyboard/touch supported; no native gamepad mapping or persistent identity restore.
