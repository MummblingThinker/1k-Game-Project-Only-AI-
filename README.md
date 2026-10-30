# Tiny Teamwork: The Last Spark

A solo or 2–4-player browser platformer across 15 stages: escape the city, cross the forest, and infiltrate the factory. Gameplay uses original pixel sprites; story scenes reveal original anime illustrations in sequential comic panels.

Campaign release 0.3.0. Physical-device and human balance acceptance remain pending; see verification notes below.

Play: https://tiny-teamwork-last-spark.onrender.com

## Run locally

Node.js 22+ required (tested with 24.20.0). Run `npm ci`, then `npm start`, and open http://localhost:4173. For solo without dependencies, use `npm run offline`.

## Play together

Create a room, share its six-character code, and join before the host starts. Guests choose Ready to escape; everyone sees the ready roster, and the host starts once everyone is ready. The host can choose any starting stage. Activate route relays and get every living survivor to the gate. After victory the host selects Continue (N) or restarts (R). Story transitions after stages 5, 10 and 15 are shared.

## Controls

| Action | Keyboard |
| --- | --- |
| Move | A/D or Left/Right |
| Jump / captured struggle | Space or Up |
| Relay, pylon, terminal, crate | E |
| Carry / throw teammate or crate | F |
| Drop | Q |
| Watch next living teammate while down | V |
| Continue after victory | N (host online) |
| Restart after defeat/victory | R (host online) |
| Pause solo / release online input | Esc |
| Advance solo story | Space |

Touch controls stay at the screen bottom during play on narrow screens. Pause/resume and story advance have touch-accessible buttons. Online Esc releases input while the world continues. Practice a stage or `?level=15` starts a selected stage directly.

## Campaign

Level 1 is the roughly 960-unit tutorial/reference. Normal later maps are 3x the reference width; Levels 5/10/15 are 5.5x/6x/6.5x. Routes have authored pits, ledges, shelters, relays, enemy mixes, water, conveyors and cracked salvage that breaks under a stomp or thrown crate. The giant crosses a normal map in about two minutes without catch-up teleportation. Boss boundaries exclude it.

- Level 5: evade the Warden slam, then use relays 2–1–3 during its exposed window.
- Level 10: activate three beacons and survive 45 seconds. A covered route shelters the team beneath a drone swarm.
- Level 15: evade the background Colossus, charge three pylons and use the exposed central terminal. Complete three overload cycles to escape.

Pressure plates in selected forest/factory stages open temporary bridges. Stand on one or leave a crate; after release, the bridge counts down eight seconds. Existing jumps and stones provide fallback routes. The pursuer gives an eight-second entry warning and keeps its normal walking speed on giant maps.

Robots are indestructible. Jump onto a grabber only while it holds a teammate to force a temporary rescue stun. Struggling buys limited time. Solo grabbers use a telegraphed strike instead.

Shared hearts start at three solo, four for two/three players and five for four. Each fatal transition charges once. A checkpoint revives the longest-dead survivor OR restores one heart if everyone is alive. Full stage transitions reset the original party's life pool. Carry/throw, stacking and fallback stepping stones support teamwork. See [campaign rules](docs/CAMPAIGN_BUILD.md).

Shelters have two ground exits and an overhead ladder. Stand at the central ladder and use E (Interact on touch) to climb to the roof; move sideways to step off. Put carried objects down first. The roaming giant can destroy the shelter and its ladder.

Find optional blue MEMORY / E terminals in stages 2-15 to discover fourteen original story fragments. Teammates share each discovery; the Memory archive below the game lets you reread it after replaying or reloading. The archive saves in this browser when available and does not change the required route or default ending.

## Verification and limits

`npm test` covers shared systems, 60 deterministic stage traversals (15 stages at 1–4 players), HTTP/assets, board evidence, client sessions and real Socket.IO integration. `npm run test:live-campaign` drives two socket clients through Level 15 and its shared ending. CI installs Playwright temporarily for `npm run test:browser`.

Chromium 156 passed all stage loads, story/pause, independent co-op contexts through tutorial victory and Continue, four-browser readiness, and emulated touch cancellation. Firefox 157 and WebKit 27.2 compatibility also pass. Exact source revisions, deployment state and subsequent changes are recorded in [PROJECT_STATUS.md](docs/PROJECT_STATUS.md) and [QA_LOG.md](QA_LOG.md).

Physical-device and separate-network acceptance remains pending at the owner's request. Automated traversal proves reachability, not human difficulty balance. Mobile emulation is not physical mobile testing. Original synthesized sound cues have saved mute/volume controls; cloud saves are not implemented. Rooms require joining before start; disconnect clears identity and requires a new lobby. Rooms disappear on server restart. One free Render instance can have cold starts.

Submission materials remain drafts. A real 1800×1200 browser screenshot is included. Physical-device evidence, eligibility and submission preview need human review. Nothing has been submitted.

## Handoff

Read [PRIORITY_ROADMAP.md](PRIORITY_ROADMAP.md), [TASK_LIST.md](TASK_LIST.md), [QA_LOG.md](QA_LOG.md), and [AGENTS.md](AGENTS.md). The owner authorized campaign expansion while deferring physical testing. Unverified acceptance criteria remain unchecked.

`public/` contains client/shared simulation/art; `server/` the authoritative service; `scripts/` tests and source packaging; `submission/` draft materials; `docs/` design and implementation notes. Original story-art provenance and exact prompt: [STORY_ART_PROMPT.md](docs/STORY_ART_PROMPT.md).

`npm run test:adversarial` checks stack stability and seeded carry/capture/disconnect invariants. `node scripts/live-sequence-test.mjs` runs the entire campaign with real socket clients and unskipped synchronized story timing; TEST_PARTY chooses 2-4 players. These remain automated tests, not physical devices.

Solo stage resume is saved in this browser and restarts the last begun solo/practice stage with full hearts. It does not save within-stage progress or multiplayer rooms. Storage being unavailable does not prevent play. Online survivor motion is smoothed visually between server snapshots; collisions, timers and actions always use the authoritative server state.

In a lobby, Copy invite link gives friends a URL with the room code filled in. They still choose Join and Ready before the host starts. The button is hidden once the run begins; if clipboard access is blocked, copy the selected code instead.

Walk against loose crates to push them together. A wall stops the whole chain. Boxes can be stacked and still support carry/throw. When down in co-op, the camera follows a living teammate; V or Watch next switches survivor. A shelter revives the longest-down teammate.

Comic scenes reveal three captioned panels in sequence, with original 2D anime artwork. The companion art adds distinct rescue, covered-walkway swarm, assembly and ambush compositions. Prompts/provenance: [original atlas](docs/STORY_ART_PROMPT.md), [companion atlas](docs/STORY_DETAILS_PROMPT.md).

For bug reports, open the game with ?debug=1 (or &debug=1 after an existing query). A Run report panel records the current stage's deaths, hearts, checkpoint times, route and living survivors. Download its JSON when reporting a failure. It is optional, stage-local, and not uploaded automatically; ordinary gameplay sends no diagnostic history. In co-op the report comes only from your own room.

Visual options below the game save locally. Motion follows your device preference by default; Reduced motion removes sliding comic panels, moving scenery and invulnerability blinking while preserving the ending's timing. Fewer effects reduces decorative drones/debris; gameplay and warnings are unchanged.

Selected gaps use the original party bands (two–three, four–five, and so on); the supported online cap remains four. The first tutorial jump stays short for every party. Solo fallback stones remain available in wider gaps.
