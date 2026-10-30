# Tiny Teamwork: The Last Spark

A solo or 2â€“4-player browser platformer across 15 stages: escape the city, cross the forest, and destroy the factory. Original pixel gameplay and 33 distinct anime comic illustrations.

Play: https://tiny-teamwork-last-spark.onrender.com

The October 30 gameplay revision replaces the old shelters and boss rules. See [current status](docs/PROJECT_STATUS.md) for the exact deployed commit and acceptance evidence. Physical-device and human difficulty testing remain deferred by the owner.

## Run locally

Node.js 22+ (tested with 24.20.0): run `npm ci`, then `npm start`, and open http://localhost:4173. `npm run offline` serves solo without installing dependencies.

## Controls and co-op

The title screen opens Single Player (story/resume/stage select), Multiplayer (create/join/ready/stage select) or Settings. Recessed facades are walkable scenery; bright outlined walls are solid. Highlighted roof/platform edges support players.

| Action | Keyboard |
| --- | --- |
| Move | A/D or Left/Right |
| Jump / wall-jump / leave teammate carry | Space |
| Use relay, console, memory; pick up / throw object | E |
| Pick up / throw teammate or held object | F |
| Climb up / down; release to hold | W/S or Up/Down |
| Put down | Q |
| Watch next living survivor | V |
| Continue / replay | N / R; host online |
| Pause solo / release online input | Escape |

Move over a ladder and hold W/Up to climb or S/Down to descend. Release both to hold still. Move sideways or jump to leave; F throws while climbing. W is not a jump key. Consoles take priority over throwing when using E. Touch controls appear on narrow screens. Keyboard and touch are supported; native gamepad mapping is not included.

Choose Multiplayer on the title screen, create a room and share its invite link or six-character code. Guests join and choose Ready before the host starts. Everyone sees the same authoritative game state. All living players must reach the exit. The host continues or replays; story scenes after Levels 5, 10, 11 and 15 are synchronized. Disconnecting removes identity; a remaining player becomes host. A fresh lobby is needed to add players after starting.

## Revised campaign

- Flags replace save rooms. Passing a new flag restores one shared heart up to the original party maximum and records the respawn point. A solo death with hearts left returns there. A flag also brings back one downed co-op survivor. Each flag awards once.
- Relay bridges and pressure bridges span gaps too long for an ordinary jump. E activates relays. Leave an object on a pressure plate with Q; its short release grace period is insufficient for the full crossing. Yellow puzzle weights survive throws and return if lost in a pit.
- Street-to-rooftop climbs, subway passages, canopies, cabins, water, conveyors and towers form fifteen different routes. Each biome has themed throwable debris, breakable barriers, scenery and enemies. Forest animals are decorative.
- Ground robots patrol, turn and charge when they see a survivor. Headlights show their facing direction. Flying robots retain their warned scan attack. Throws destroy small robots and damage medium ones; big armored robots can only be stunned. Ordinary debris breaks after impacts; yellow weights remain reusable.
- Level 5: climb above rising Warden claws, collect debris and throw it at the boss. Defeating it stops the endless climb and creates the final exit floor.
- Level 10: weave over trunks and branches through the chainsaw maze. Climb or wall-jump away from the blade. At the end, clear the striped falling-tree area: it kills the robot and any players underneath.
- Level 11: forest leads into a roofed human passage with a protected overhead swarm, then the robot factory.
- Level 15: climb above lava and break three consoles. Each accelerates lava; attacks escalate through lasers and platform destruction while essential ladders remain. The robot breaches from the left, leaps behind the survivors, and chases them LEFT through machinery to the emergency exit. Lava destroys it.

Level 1 is the 960-unit reference; normal maps are 2880 units, and Levels 5/10/15 are 5280/5760/6240 units. The pursuer takes about two minutes to cross a normal map after waking and cannot enter boss zones. Boss defeats have pixel death animations.

Hearts start at three solo, four for two/three players and five for four. Ordinary deaths cost one; flags heal only up to that original maximum. Giant contact ends the whole run when two or fewer survivors are alive. With three or more, each caught survivor costs one heart and returns to the group if hearts remain. Stage transitions restore the starting pool. Optional blue memory terminals reveal fourteen story fragments saved in this browser. Solo reload resumes the stage with full hearts; flag respawns persist within the current run, not across reloads. Rooms are not cloud saves.

## Verification

`npm test` runs current construction, movement/timing, storage, revised rules, client-session and HTTP/asset checks. `node scripts/revision-route-test.mjs` drives all stages with ordinary input; TEST_PARTY selects 1â€“4. `node scripts/revision-network-test.mjs` uses two actual WebSocket clients. CI installs Playwright for `revision-browser-test.mjs` and `revision-campaign-test.mjs`; public acceptance verifies deployed source before traversing the campaign.

Historical tests for shelters and indestructible bosses are retained as historical contracts, not evidence for the current rules. Exact passes, failures, replays and limitations are recorded in [QA_LOG.md](QA_LOG.md). Automated reachability does not establish human difficulty balance or physical mobile usability.

Title Settings contains sound/zone music, volume and visual options. In-game Settings pauses solo and offers Return to title; multiplayer continues and offers Leave room. City, forest and factory use different original synthesized music/ambient layers. Sound and visual options save locally. Reduced motion follows device preference by default; fewer effects reduces decorative drones and particles without removing warnings. Add `?debug=1` for a local downloadable stage report. Reports are not uploaded automatically.

The free Render service may need time to wake. One Node process hosts rooms; server restart clears them. Physical-device/network acceptance and contest review/submission remain pending. Nothing has been submitted.

## Handoff

Read [AGENTS.md](AGENTS.md), [TASK_LIST.md](TASK_LIST.md), [QA_LOG.md](QA_LOG.md), and [PROJECT_STATUS.md](docs/PROJECT_STATUS.md). [Practice guide](docs/PRACTICE_GUIDE.md) explains play. [Art provenance](docs/OCTOBER_REVISION_ART.md) records the original comic assets. Source packaging is under `release/` and submission drafts under `submission/`.