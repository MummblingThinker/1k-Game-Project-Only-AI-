# Tiny Teamwork: The Last Spark

A solo or 2–4-player browser platformer across 15 stages: escape the city, cross the forest, and infiltrate the factory. Gameplay uses original pixel sprites; story scenes reveal original anime illustrations in sequential comic panels.

Play: https://tiny-teamwork-last-spark.onrender.com

## Run locally

Node.js 22+ required (tested with 24.20.0). Run `npm ci`, then `npm start`, and open http://localhost:4173. For solo without dependencies, use `npm run offline`.

## Play together

Create a room, share its six-character code, and join before the host starts. The host can choose any starting stage. Activate route relays and get every living survivor to the gate. After victory the host selects Continue (N) or restarts (R). Story transitions after stages 5, 10 and 15 are shared.

## Controls

| Action | Keyboard |
| --- | --- |
| Move | A/D or Left/Right |
| Jump / captured struggle | Space or Up |
| Relay, pylon, terminal, crate | E |
| Carry / throw teammate or crate | F |
| Drop | Q |
| Continue after victory | N (host online) |
| Restart after defeat/victory | R (host online) |
| Pause solo / release online input | Esc |
| Advance solo story | Space |

Touch controls stay at the screen bottom during play on narrow screens. Pause/resume and story advance have touch-accessible buttons. Online Esc releases input while the world continues. Practice a stage or `?level=15` starts a selected stage directly.

## Campaign

Level 1 is the 960-unit tutorial. Normal later maps are 3x as wide; Levels 5/10/15 are 5.5x/6x/6.5x. Routes have authored pits, ledges, shelters, relays, enemy mixes, water, conveyors and cracked salvage that breaks under a stomp or thrown crate. The giant crosses a normal map in about two minutes without catch-up teleportation. Boss boundaries exclude it.

- Level 5: evade the Warden slam, then use relays 2–1–3 during its exposed window.
- Level 10: activate three beacons and survive 45 seconds. A covered route shelters the team beneath a drone swarm.
- Level 15: evade the background Colossus, charge three pylons and use the exposed central terminal. Complete three overload cycles to escape.

Robots are indestructible. Jump onto a grabber only while it holds a teammate to force a temporary rescue stun. Struggling buys limited time. Solo grabbers use a telegraphed strike instead.

Shared hearts start at three solo, four for two/three players and five for four. Each fatal transition charges once. A checkpoint revives the longest-dead survivor OR restores one heart if everyone is alive. Full stage transitions reset the original party's life pool. Carry/throw, stacking and fallback stepping stones support teamwork. See [campaign rules](docs/CAMPAIGN_BUILD.md).

## Verification and limits

`npm test` covers shared systems, 60 deterministic stage traversals (15 stages at 1–4 players), HTTP/assets, board evidence, client sessions and real Socket.IO integration. `npm run test:live-campaign` drives two socket clients through Level 15 and its shared ending. CI installs Playwright temporarily for `npm run test:browser`.

Chromium 156 passed all stage loads, story/pause, two isolated browser contexts through tutorial victory and Continue, and emulated touch cancellation. Render deployed commit 9b3097d on October 30 UTC. Exact evidence and subsequent local changes are in [QA_LOG.md](QA_LOG.md).

Physical-device and separate-network acceptance remains pending at the owner's request. Automated traversal proves reachability, not human difficulty balance. Mobile emulation is not physical mobile testing. Original synthesized sound cues have saved mute/volume controls; cloud saves are not implemented. Rooms require joining before start; disconnect clears identity and requires a new lobby. Rooms disappear on server restart. One free Render instance can have cold starts.

Submission materials remain drafts. A real 1800×1200 browser screenshot is included. Physical-device evidence, eligibility and submission preview need human review. Nothing has been submitted.

## Handoff

Read [PRIORITY_ROADMAP.md](PRIORITY_ROADMAP.md), [TASK_LIST.md](TASK_LIST.md), [QA_LOG.md](QA_LOG.md), and [AGENTS.md](AGENTS.md). The owner authorized campaign expansion while deferring physical testing. Unverified acceptance criteria remain unchecked.

`public/` contains client/shared simulation/art; `server/` the authoritative service; `scripts/` tests and source packaging; `submission/` draft materials; `docs/` design and implementation notes. Original story-art provenance and exact prompt: [STORY_ART_PROMPT.md](docs/STORY_ART_PROMPT.md).

`npm run test:adversarial` checks stack stability and seeded carry/capture/disconnect invariants. `node scripts/live-sequence-test.mjs` runs the entire campaign with real socket clients and unskipped synchronized story timing; TEST_PARTY chooses 2?4 players. These remain automated tests, not physical devices.
