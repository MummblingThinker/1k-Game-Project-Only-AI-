# Tiny Teamwork: The Last Spark — Starter Project

> **Codex planning files (project root):** Read `PRIORITY_ROADMAP.md` first, use `TASK_LIST.md` as the master backlog, and append evidence to `QA_LOG.md`. These are the canonical files; `docs/` contains supporting design references.


This folder is a starter implementation for the browser game, not merely a design document. It contains an initial playable side-scrolling level, original pixel-art sprites, the 15-level campaign bible, animated story panels, shared physics code, and a Socket.IO room/movement prototype for Codex to continue building.

## Start here: prioritize the public multiplayer slice

- **`PRIORITY_ROADMAP.md`** gives the budget-conscious order: one complete level → two-player co-op → public deployment → submission materials. Follow it before working on optional features.
- **`TASK_LIST.md`** is the complete build backlog with priorities, acceptance criteria, and per-task status.
- **`QA_LOG.md`** records what has actually been tested. Only tasks with passing evidence there may be called verified.
- **`docs/PRACTICE_GUIDE.md`** explains how to play, test specific levels, try local co-op, and report reproducible bugs to Codex.

Codex must read those files first and must not mark a feature complete based only on writing code or passing a syntax check. Do not polish all 15 levels before a public two-player session is verified.

## Run it locally

Requirements: Node.js 22+ (tested with Node 24.20.0).

```bash
npm install
npm start
```

Open **http://localhost:4173**. This enables multiplayer room testing. If you want to test the single-player/browser prototype before installing dependencies, run `npm run offline` instead; it uses Node's built-in static server only and does not provide multiplayer. Use **Start Story** for the intro and Level 1. Level 1 is a short route: jump two pits, try the nearby switch with E, keep ahead of the giant, and reach the shelter gate. The victory screen offers Replay Level 1 or Return to title. Later prototypes remain available through the level selector. The level selector is useful for testing the city, forest, and factory art themes. The story automatically triggers the forest transition after Level 5, the covered-walkway/factory reveal after Level 10, and the tragic ending after Level 15. Levels 2-15 currently reuse the same procedural platform layout while changing the theme, title, and campaign objective; they are not fifteen individually hand-authored levels yet.

For a quick level test, open `http://localhost:4173/?level=10` (choose any number 1–15).

## Play Level 1 together

1. Run npm start (default http://localhost:4173).
2. Click **Create Room**; share the six-character code.
3. Other players enter the code and click **Join Room** before start.
4. Host clicks **Start co-op run**; everyone receives the same level/hearts.
5. Jump the first pit; press **E** near the red relay to open the shared bridge and gate for everyone.
6. Get every living survivor to the shelter. Everyone sees victory; host clicks **Replay room** or presses **R**.

Local two-client play is verified; public HTTPS and physical-device/network play are not. Online supports Level 1 only. Movement, relay/bridge/gate, hearts, giant, victory/replay and first-pass checkpoint recovery use server snapshots. Carry/throw/rescue, online movable crates, later campaign/story and broader recovery cases remain incomplete.

ESC releases your controls online while the world keeps running. A started room cannot accept joins; create a new lobby to add players. Host transfers on departure. Disconnect clears membership; explicitly join a new lobby. Rooms are memory-only in one server process and disappear on restart.

npm test runs physics, HTTP smoke, board evidence, client session regression and actual WebSocket integration. Live tests explicitly skip when dependencies are absent so offline checks remain usable.

For a complete hands-on walkthrough, see [`docs/PRACTICE_GUIDE.md`](docs/PRACTICE_GUIDE.md).

## Controls

- **A / D** or **Left / Right**: move
- **Space** or **Up**: jump
- **E**: relay online; crate/switch/checkpoint interactions in solo play
- **Esc**: pause/resume solo; release input online (the shared world continues)
- **R**: replay/restart after victory/game over (host only online), or restart from solo pause
- **Enter** after victory: return to title; leave the room if online
- **Space** during a cutscene: advance the panel
- Mobile displays simple touch buttons at narrow screen widths.

## What's currently implemented

- Responsive HTML5 Canvas rendering at a low internal resolution for a crisp, pixelated look.
- Original generated PNG sprites for three tiny survivors, a patrol robot, a flying drone, a bomber prototype, the giant pursuer, a crate, and a checkpoint shelter.
- City, forest, and robot-factory parallax scenery drawn from original geometry and palettes.
- The 15 named levels and story beats in `public/js/campaign.js`.
- Opening, post-Level-5, post-Level-10, and post-Level-15 cinematic panels.
- Horizontal movement, jumping, gravity, ledges, pit geometry, thrown/pick-up crates, switches, patrol robots, a capture timer with limited struggle, one checkpoint room per normal-sized generated level, hearts, and an advancing giant pursuer in offline mode.
- Verified local Socket.IO Level 1 with random codes, server movement and shared relay/bridge/gate, hearts, giant and victory/replay.

## Current handoff

The game text now renders as native HTML at display resolution while the world stays pixelated. Interface labels and controls use larger fonts. Desktop/phone-emulated previews were observed, but the latest complete browser/co-op verification was interrupted by a browser connection failure; see UI-001 in QA_LOG.md.

MVP-03 is IMPLEMENTED_UNVERIFIED. Deployed at https://tiny-teamwork-last-spark.onrender.com in Render My Workspace (tea-dbhakd8u01pc73ap1ou0), one free Node instance in Virginia, manual deploys. GitHub authenticated as MummblingThinker with admin/push access; source published to MummblingThinker/1k-Game-Project-Only-AI-. Render reports initial deploy dep-dbhnfde1egvs73817pj0 live; assigned PORT=10000. Hosted HTTPS/assets and full public WSS gameplay regression passed (Actions run 40915358003). Physical-device/network acceptance and current browser smoke remain outstanding. See QA_LOG.md, 2026-10-29 MVP-03 public deployment.

The source package is release/TinyTeamwork-source.zip, with hashes in release/source-manifest.json. Rebuild and verify it with `python scripts/package-release.py --verify`. It excludes installed dependencies, local caches and environment files. The fresh extraction check runs offline/client tests; actual live WebSocket integration runs in the installed working copy.

submission/entry.json and submission/README.md contain a 416-character description and the observed contest requirements. Run `npm run check:submission` for remaining items. The cover screenshot, separate-device/network test and human review/submission are still missing. The official rules give October 30, 2026 at 11:59pm Pacific, while the mission page says October 31; use the earlier date pending clarification.

## Known limitations / next tasks for Codex

The full acceptance checklist lives in [`TASK_LIST.md`](TASK_LIST.md), and evidence lives in [`QA_LOG.md`](QA_LOG.md). See `AGENTS.md` and the other files under `docs/`. Important known gaps:

- Level 1 is the verified short slice; Levels 2-15 still share a prototype layout. Create a bespoke layout/obstacle script for each level and save explicit set pieces at the city, forest, covered walkway, and factory transitions.
- The cutscenes use code-drawn pixel art plus sprites; replace or enhance them with hand-authored sprite-sheet animation while keeping all assets original.
- Online Level 1 has authoritative movement, relay/bridge/gate, hearts and giant. Carry/throw/rescue, movable crates, advanced robots, later campaign/story and broad checkpoint/recovery acceptance remain unfinished.
- Prevent any duplicate shared-heart deduction using server-issued event IDs or a single authoritative death transition.
- Implement teammate carry/throw/stacking, human ladders, rescue actions, instant-kill warning telegraphs, creeper/bomber countdowns, explosive radius death handling, and segment-boundary revival ordered by longest-dead-first.
- Add all player-count-scaled gap options and test the anti-softlock fallback route when several players are dead or disconnected.
- Implement safe-room exits and their crowd-aware routing: when ground exits are blocked, overhead escape must be usable; when overhead is blocked, keep at least one ground exit usable. Ordinary robots must never enter or attack into safe rooms; the giant can breach and destroy them.
- Add unit tests for collision, hearts, party size, checkpoint order, death deduplication, and room isolation. Add browser tests for two independent clients.
- Add sound and accessibility options, persistent settings, proper mobile tuning, and performance checks.

## Project contents

- `public/`: browser client, CSS, JavaScript modules, and original sprite PNGs
- `server/server.js`: Express + Socket.IO server
- `scripts/generate_sprites.py`: reproducible sprite-generation script
- `docs/Design_Document_v6.pdf`: current long-form design document
- `docs/`: implementation notes for campaign, visual direction, level rules, networking, and project status
- `AGENTS.md`: direct instructions for Codex working in this repo

The art direction is inspired by the staging, contrast, readable silhouettes, and dramatic pacing of classic pixel-art arcade cutscenes. All characters, backgrounds, sprites, and scenes in this project are original; do not copy or trace existing TMNT/game assets.
