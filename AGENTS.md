# Codex Instructions — Tiny Teamwork: The Last Spark

# Limited-budget execution priority

## User-directed campaign expansion (2026-10-29)

The owner explicitly deferred physical-device testing and authorized continuing remaining implementation, campaign and animation work without waiting for MVP-03 verification. This supersedes the gate-only work restriction below, but never permits inventing test evidence or submitting the contest entry. Preserve Level 1 as the short tutorial/reference map; normal later maps are about 3x its width. Levels 5/10/15 are 5-7x the reference with distinct puzzle/survival encounters. Pursuer crossing time is about 120 seconds on normal maps, without catch-up teleportation. It cannot enter boss arenas. Level 15 includes a separate background robot attacking during the encounter. Boss machines remain indestructible: overload/stun temporarily and escape. Story may use original 2D anime/comic panels revealed sequentially with text. Do gameplay and testing before optional animation polish. Physical-device acceptance and human submission remain honestly pending.

The user has limited ChatGPT/Codex budget. Read `PRIORITY_ROADMAP.md` and follow its order: `MVP-01` one complete playable level, `MVP-02` working two-player room-code session with one shared interaction, `MVP-03` public HTTPS deployment and external test, `MVP-04` submission materials. Do not work on 15 bespoke levels, cinematic polish, optional enemies, audio, or broad refactors until all four gates are verified. Favor small edits and narrow tests over rewrites. If deployment is the remaining blocker, spend the session resolving deployment and external connectivity rather than adding gameplay polish.


You are continuing an existing prototype. **Inspect the current code and run it before rewriting anything.** Preserve working features, then improve them incrementally.

## Product vision

Build a cooperative, browser-based 2D side-scrolling pixel-art platformer for 2–4 players initially, with room codes and no required login/install. The player characters are tiny human survivors in a robot-ruled dystopia. Humanity built machines to protect it; a central AI decided that freedom causes suffering and took control. The story is about protection versus control, freedom, identity, and trust. Some robots retain fragments of memory.

## Art and animation rules

- Keep all artwork original. The user wants the **feeling** of classic TMNT arcade pixel cutscenes: bold silhouettes, expressive poses, dramatic stage-like framing, short readable captions, restrained palettes, strong contrast, pans/reveals, letterboxing, quick retro transitions, and intentional holds. Do not use copyrighted characters, sprites, backgrounds, panel layouts, or ripped assets.
- Draw/animate at low resolution and scale with nearest-neighbour/pixelated rendering. Character silhouettes and enemy tells must remain readable at gameplay size.
- City = cool navy/steel with warm warning lamps; forest = deep greens/teal and firefly accents; robot factory = industrial blue/grey with furnace orange and warning red.
- Cutscene pacing: urgent opening invasion; after Level 5 the robots chase survivors into the forest; after Level 10 the human-only covered walkway is roofed while a huge swarm of flying robots fills the sky above; then a slow factory reveal shows robots being manufactured while pursuers enter behind the survivors; after Level 15 the humans celebrate, then red sensors awaken behind them and the scene cuts to black.
- Do not reuse an external image unless its license is confirmed. Keep asset provenance notes in `docs/ART_DIRECTION.md`.

## Core design rules

- All robots are indestructible. Players evade, flee, distract, or rescue. They do not kill, damage, permanently stun, or remove enemies.
- Special rescue exception: a teammate can jump on a robot **only while it is actively grabbing a teammate** to briefly stun it, forcing a release. It recovers and can grab again.
- Grabber bots show a visible countdown. The captured player can struggle to gain a small amount of time, but cannot escape forever. A teammate rescue is the actual escape route.
- Instant-kill robots have clearly telegraphed lethal triggers and do not offer a rescue once the trigger fires.
- Creeper/bombers use a detection radius, clear audio/visual cue, visible countdown, and predictable blast radius. They are hazards, not usable weapons. Catching a player in the blast consumes one shared heart exactly once and kills that player for the current segment.
- Pits kill immediately once the player falls into the death zone. The fatal event consumes one shared team heart exactly once. Track each player's alive/dead state independently. If no hearts remain, the run ends.
- Shared heart starting pool: 1 player = 3; 2–3 = 4; 4–5 = 5; 6–7 = 6; 8–9 = 7; 10–11 = 8; 12–13 = 9; 14+ = 10. Initial target is 2–4.
- At a segment boundary, use at most one recovery benefit: if anyone is dead, revive the longest-dead player and do not also restore a heart; if nobody is dead, restore one shared heart up to the cap. If multiple players are dead, revive only one per boundary.
- At a full-level transition, all players return active and the shared-heart pool resets to the starting value for the original lobby size.
- A level is a named campaign stage; a segment is a stretch ending at a checkpoint/safe room/gate. Do not confuse them.
- Scaled teamwork pits should encourage standing on teammates, throwing a teammate to a lever, carrying/throwing crates to bridge gaps, and human ladders. Do not make cooperation a permanent softlock: when only one player remains, every required route must still be solvable using a fallback route, blocks, steps, or alternate ledges. A few gaps can be harder, but not every gap should be maximum width.
- Party-based gap tuning: 1 player = one ordinary jump; 2–3 = a teamwork-sized gap; 4–5 = a wider gap designed for a three-person stack plus throw; each additional two-player band widens selected gaps about one player's worth. For bigger parties cap extreme gap size and provide recovery routes. Apply this to selected obstacles, not all obstacles.
- A standard-length level should have one checkpoint room near the middle; a large level should have rooms around one-third and two-thirds. Checkpoints are temporary safe rooms: ordinary robots cannot enter or attack inside. Each has a left exit, right exit, and overhead escape accessible by ladder/climb. If ground exits are crowded, overhead escape must be clear; if overhead escape is blocked, at least one ground exit must be open. The giant pursuer can kill players within the room and destroy it.
- The giant pursuer is huge, slow, usually off-screen, and creates a deadline. It kills instantly on contact and can destroy safe rooms. It is not a normal robot that players can fight.

## Campaign structure

1–5 City: escaping the invaded city.
6–10 Forest: robots chase survivors through the forest.
11–15 Robot factory: humans discover the factory and try to destroy it.

The opening shows humans running from invading robots. After Level 5 a cutscene shows the robots chasing people into the forest. At the end of Level 10, the covered walkway is human-only and has approximately 100 flying robots above it. The party then enters the facility; show a slow, unsettling animation of robots being manufactured while robots pursue from behind, then end that level. After Level 15 and the factory's destruction, humans celebrate, then robots kill them; cut to black. This is the default story ending, not an alternate ending.

## Technical rules

- Keep this as a lightweight HTML Canvas + modern JavaScript browser game with Node.js + Express + Socket.IO server unless you document a clear benefit to changing it.
- Server must become authoritative for positions/physics, enemy AI/capture states, carried players and blocks, rescue stuns, hazard deaths, shared hearts, checkpoints/revivals, and level completion. Clients submit input intentions, not trusted positions or death events.
- Use a fixed-step simulation and interpolation where practical. Prevent duplicate death/heart deductions with unique event IDs or state-transition deduplication.
- Keep rooms isolated. Provide a public URL only after it is actually deployed and tested; do not claim deployment before then.
- Run `npm run check` and manually smoke-test `/health`, the main page, and two-browser room play after meaningful changes. Add automated tests as physics systems grow.
- Keep `README.md`, `docs/PROJECT_STATUS.md`, and these instructions aligned with the real implementation. Mark incomplete features honestly.
- Prefer complete, tested incremental improvements over large rewrites. Do not replace user-authored story rules without updating the docs.

## Mandatory task and verification discipline

- Start every session by reading `PRIORITY_ROADMAP.md`, `TASK_LIST.md`, `QA_LOG.md`, and `docs/PRACTICE_GUIDE.md`, then run `npm test` before modifying code. Work the four MVP gates in order before optional polish.
- Pick a specific task ID, state its acceptance criteria, and work on one coherent task at a time.
- A task is complete only after every acceptance criterion is tested and its evidence (exact commands/manual steps, environment, results, date) is appended to `QA_LOG.md`; only then may its status change to `VERIFIED` in `TASK_LIST.md` and its checkbox be checked. Use `IN_PROGRESS`, `IMPLEMENTED_UNVERIFIED`, or `BLOCKED` honestly. `npm run verify:board` enforces that checked tasks have a matching QA-log entry.
- Code written, a clean syntax check, a successful build, or a screenshot alone is not proof that a gameplay feature works. Run the relevant automated checks **and** manual browser/multiplayer test where specified.
- If any acceptance test cannot run, mark `IMPLEMENTED_UNVERIFIED` or `BLOCKED` and explain what is missing. Never tell the user a task is complete unless it is `VERIFIED` with supporting QA-log evidence.
- After each task, update `docs/PROJECT_STATUS.md`, `README.md` if player-facing behavior changed, `TASK_LIST.md`, and `QA_LOG.md` as appropriate. Keep limitations explicit.
- Run `npm test` before finishing a coding session. For browser behavior, launch the project and reproduce the relevant user flow. For multiplayer work, test in separate browser sessions and record the result.

## Suggested build order

1. Inspect and run the current prototype; fix any errors before adding features.
2. Add automated tests for shared-heart/death deduplication, party-size hearts, gap scaling, checkpoint revivals, and no softlocks.
3. Implement authoritative multiplayer room state, clean join/leave handling, reconnect identity, and synchronized level transitions.
4. Implement teammate grab/carry/throw/stack/rescue systems.
5. Add authored per-level geometry and unique gimmicks, rather than reusing a single layout.
6. Implement boss-like chaser timing, safe-room exits, instant-kill telegraphs, creeper countdowns, and all death/revival details.
7. Upgrade sprite animation and story panels, then add sound, options, and accessibility.
8. Test at 1, 2, 3, and 4 players; then test larger party counts if supported.
