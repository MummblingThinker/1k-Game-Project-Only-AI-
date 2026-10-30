# QA Log — Tiny Teamwork: The Last Spark

## 2026-10-28 — MVP-01 / baseline inspection and browser verification blocker

Environment: Windows PowerShell; Node.js v24.20.0; project extracted under `TinyTeamwork_Project_Download/Tiny_Teamwork_The_Last_Spark`. No gameplay code changed.

Commands and results:
- `npm test`: PASS (exit 0). Campaign/region/gap/world/movement checks, static HTTP smoke tests (health, HTML/CSS/JS, nine sprites, 404), and board evidence guard passed.
- `npm run offline`: server started at `http://localhost:4173`.
- `Invoke-RestMethod -Uri 'http://localhost:4173/health' | ConvertTo-Json -Compress`: PASS; returned `{"ok":true,"service":"tiny-teamwork-static","multiplayer":false}`.
- Read required instructions, canonical task board, prior QA log, practice guide, and project status; inspected index.html, game.js, world.js, physics.js, and package.json. Source inspection shows ordinary level completion advances directly to the next level; this does not verify a clear Level 1 win/replay flow.

Required acceptance: fresh load, start/menu, keyboard movement, readable obstacle, reachable goal, clear victory, and replay/restart twice in a real browser with browser/version and console observations.

Actual result: BLOCKED before gameplay edits. `cua.createBrowserTab("chrome", "http://localhost:4173", {sessionName:"🎮 Tiny Teamwork QA"})` returned `Browser is not available: chrome`; `cua.getState()` returned `{"apps":[],"browsers":[]}`. Native computer APIs are disabled in this session. No browser playthrough, screenshot, browser version, or console check could be obtained. HTTP and automated checks do not substitute for that evidence.

Follow-up: enable/connect a supported browser surface accessible to this session, then explicitly authorize resuming MVP-01. MVP-01 remains unchecked/BLOCKED; MVP-02 through MVP-04 were not started. No public deployment or submission is claimed. Work stopped at the user's blocker boundary.

This is the evidence record that supports claims in `TASK_LIST.md`. Update it whenever tests are run for a task, including failures. Do not erase failures; append a later pass entry with the fix noted.

## 2026-10-28 — Starter baseline in current working package

### Environment

- Node.js: `v22.16.0`
- Multiplayer dependencies: not installed in the working folder (`node_modules` absent at the time of the check).
- Browser-based visual/manual QA: not performed as part of this command-line run.

### PASS — `QA-001` / baseline project checks

Command: `npm run check`

Result: PASS. Existing assertions report `campaign, region mapping, gap scaling, level construction, and movement physics` passed.

Scope limitation: this is a small deterministic check set; it does not prove all in-game flows, multiplayer state, cutscene visuals, or all softlock routes.

### PASS — `QA-002` / offline static server smoke tests

Command: `npm run smoke`

Result: PASS. Automated smoke test starts `server/static-server.mjs` on a free local port and verifies:

- `/health` returns successful JSON and clearly reports multiplayer is disabled in static mode;
- `/` serves HTML;
- `/style.css` serves CSS;
- client JavaScript modules return HTTP 200 with JavaScript content types;
- all 9 PNG sprite assets return HTTP 200 with `image/png` content type and non-empty bodies;
- a nonexistent file returns HTTP 404.

Scope limitation: HTTP checks establish that files are served, not that every feature renders or behaves correctly in a browser.

### PASS — `QA-003` / JavaScript syntax checks

Command: `node --check` on `public/js/art.js`, `campaign.js`, `game.js`, `network.js`, `physics.js`, `world.js`, `server/server.js`, `server/static-server.mjs`, `scripts/check-project.mjs`, and `scripts/smoke-test.mjs`.

Result: PASS. No syntax errors reported.

### Overall assessment

`npm test` passes on the current starter. The offline server and static assets are available for local practice. The Socket.IO multiplayer server was not started or verified in this run because `node_modules` was absent. Full two-player play, complete campaign completion, visual cutscene timing, every pit fallback, and all enemy/checkpoint edge cases remain unverified; use the open tasks in `TASK_LIST.md` to drive the next work.

---

## Future run template

Append a new section for each QA session; do not overwrite the earlier record.

```text
## YYYY-MM-DD — TASK-ID / concise check name
Environment: OS, browser/version or Node version, party size, commit/hash if available
Command or steps: exact command(s) and manual procedure
Expected result: ...
Actual result: PASS / FAIL / PARTIAL, with observations
Artifacts: screenshots/log paths, if any
Follow-up: bug/task IDs created
```

### PASS — task-board evidence guard

Command: `npm run verify:board`

Result: PASS. The script confirms every checked task is labelled `Status: VERIFIED` and has a task-ID reference in this QA log. This is a lightweight evidence-presence guard; reviewers still need to inspect that the evidence truly covers the acceptance criteria.

### PASS — packaged handoff validation

Command/steps: created `Tiny_Teamwork_The_Last_Spark_Codex_Starter.zip`, ran `unzip -t`, extracted it into a fresh temporary directory without `node_modules`, and ran `npm test` inside the extracted project.

Result: PASS. Archive integrity reported no errors; `npm run check`, `npm run smoke`, and `npm run verify:board` all passed in the extracted copy.

Scope limitation: this validates archive integrity and repeatable command-line checks, not manual visual gameplay or online multiplayer.

## 2026-10-28 — Budget-conscious task prioritization update

### PASS — project regression checks after roadmap/documentation updates

Environment: Node.js in the current working package; multiplayer dependencies not required for this check; no browser session used.

Command: `npm test`

Result: PASS. `npm run check`, `npm run smoke`, and `npm run verify:board` all passed after adding `PRIORITY_ROADMAP.md` and updating the Codex instructions/task sequencing.

Scope limitation: this run verifies project checks and static serving only. It does not verify new gameplay behavior, a live Socket.IO session, public hosting, or contest submission readiness. The four MVP release gates remain unchecked until their full acceptance criteria are tested.

Final regression after recording the blocker in TASK_LIST.md and docs/PROJECT_STATUS.md: npm test PASS (exit 0; checks, HTTP smoke, and board guard). The temporary offline server was stopped during handoff cleanup.


## 2026-10-28 — MVP-01 / resumed implementation and regression checks
Environment: Windows, Node.js v24.20.0, connected Chrome extension browser 1. User explicitly resumed MVP-01. Earlier browser blocker is resolved: local game title and keyboard movement were observed in Chrome.
Changes: added a Level 1 victory state with replay/title buttons, keyboard replay/title actions, route progress and clear goal guidance. Kept existing campaign geometry and temporary sprites. No additional levels or optional art pass.
Commands: node --check public/js/game.js; npm test after victory/UI change; npm test after fixed-step timing change. All PASS (exit 0).
Browser observations: original simulation advanced very slowly during held keyboard inputs in this browser session; original frame loop discarded elapsed time above 40ms. Changed client simulation to fixed 60Hz steps with bounded 250ms catch-up. New automated regression compares movement and jumping at 5/30/60/120Hz for equal elapsed time and tests bounded recovery from a 60-second suspension. All pass. Static smoke includes the new timing.js module.
Acceptance status: IN_PROGRESS. Full fresh-load-to-victory/replay flow twice, browser version and final console evidence are still pending. No MVP milestone marked verified.

## 2026-10-28 - MVP-01 / VERIFIED browser acceptance

Environment: Windows; Node v24.20.0; Chrome extension browser 1, Person 1 profile. Installed Google Chrome version 156.0.8078.49 read from chrome.exe file metadata. URL http://localhost:4173/; offline server; one player. Real keyboard and click APIs used; no position injection or victory shortcut.

Final changes: short Level 1 with two pits, crate, switch, checkpoint, shelter and giant pursuer. Capture patrols remain in later prototypes. Switch chooses a pit ahead. Added victory/replay/title UI, R replay, Enter title, route progress, goal guidance and visible focus. Temporary art remains. Fixed 60Hz physics; catch-up initially 250ms, then raised to 1000ms to handle slow browser rendering, bounded to 60 ticks after suspension. Jump speed -5.2, no air-jumps. Read-only canvas data attributes provide position/state evidence. Repeated Escape does not toggle pause rapidly; Enter suppresses native button activation when returning to title.

Failed observations preserved: on the original layout a jump landed short and a later attempt was captured by the first patrol. On the shorter layout an early takeoff fell into the first pit and showed RUN OVER with two hearts. These were not counted as passes. Sub-second inputs were sometimes unsampled during slow rendering; final inspections waited for canvas data-state paused/playing. Performance and the full campaign remain unverified.

PASS - fresh-load run A:
1. Reload; title, controls and goal visible. Click Load Selected Level; pause: x=26, y=129, hearts=3.
2. Resume; Right about 2900ms; pause and wait for canvas[data-state="paused"]: x=256.40, y=129. Right+Space 1000ms, pause: x=333.20, y=129, alive=true, past first pit (280..314).
3. Right 2500ms, E 600ms, pause: x=563.60, hearts=3, checkpoint/breach messages. Left 300ms, E 350ms, Right 350ms, Right+Space 1100ms, pause: x=645.43, y=129, alive=true, SWITCH ACTIVATED message, past second pit (586..632).
4. Right 3400ms: heading You made it out. visible, progress=100%, state=victory, x=877.11, y=129, hearts=3. Click Replay Level 1 then pause: overlay hidden, x=26.00, y=129, hearts=3. Console error query returned [].

PASS - fresh-load run B:
1. Reload; click Start Story; Space advances three opening panels; pause at x=26.00. Right 2900ms: x=256.40, y=129. Right+Space 1000ms: x=347.28, y=129, alive=true.
2. Pass checkpoint. E outside switch range did not activate it. Advance with position inspections to x=579.88, y=129. Right+Space 1000ms: x=658.88, y=129, alive=true. This run used no switch bridge, verifying the fallback route.
3. Right 3300ms: victory heading visible, state=victory, x=877.39, hearts=3. R then pause: x=26.00, hearts=3. Console errors=[].

PASS - final regression after Enter fix: reload; Load Selected Level; real Right/Right+Space through both pits. Takeoff/landing x=256.04 -> 335.04 and x=569.83 -> 648.83. Continue to visible victory. Full-page victory screenshot emitted in browser transcript. Return then wait for canvas[data-state="title"]: title/READY visible, result hidden, console errors=[]. No accidental native button restart.

Automated commands: npm test after every coherent change (victory UI, timing, jump/tests, introductory layout, catch-up cap, evidence hooks, keyboard safeguards): all PASS. Includes campaign/region/gap/world/physics, equal physics at 1/5/30/60/120Hz, bounded catch-up, every solo Level 1 pit, rejected air-jump, static HTTP/assets/404 smoke including timing.js, and board guard. node --check public/js/game.js passed. Final pre-handoff npm test result follows below.

Scope: MVP-01 acceptance passes. Broader CORE-01/02/03 criteria, multiplayer, public hosting, external networks, mobile and submission remain unverified. No public URL exists.

## 2026-10-28 - MVP-02 / BLOCKED dependency installation

Command: npm install --no-audit --no-fund --cache .npm-cache --fetch-retries=0 --fetch-timeout=15000

FAIL (exit 1): fetching https://registry.npmjs.org/express failed with FetchError/EACCES. Npm reported an operating-system rejection. This session restricts network access; the output does not establish a need for administrator rights. No Express/Socket.IO installation or live multiplayer launch was verified.

Evidence: .npm-cache/_logs/2026-10-29T00_02_27_552Z-debug-0.log (UTC filename; local date October 28).

User action: run npm install in this project directory from a normal local terminal with registry access, then explicitly authorize resuming MVP-02. Work stops at this blocker; MVP-03 and MVP-04 stay open. Offline serving is not multiplayer.


Final handoff regression: npm test PASS (exit 0) after task/status/README updates; fixed-step and solo-gap assertions, HTTP/assets smoke, and evidence guard all passed. Guard now reports four checked tasks with VERIFIED status and matching QA references. No optional art tasks started. Local offline server and game tab are left available for the user; this URL is not public.


## 2026-10-28 - MVP-02 / resumed baseline and implementation
User installed dependencies and explicitly resumed. npm ls --depth=0 confirms express@5.3.0 and socket.io@4.8.4. Baseline npm test PASS; npm start with PORT=4174 launches the existing multiplayer server and Chrome opens the main page. Browser opening was unusually delayed; no gameplay claim is based on that load.
Acceptance target: random six-character room code, independent browser clients, authoritative movement, shared relay/bridge/gate, readable invalid-code error, and isolation of a second room. No optional art work.
Implementation: server owns lobby/start/replay, 60Hz movement, switch proximity/cooldown/one-time activation, bridge, shelter lock and shared victory; clients render snapshots and send intentions. Running party geometry does not reset on departure; host transfers. Client disconnect clears room identity; reconnect returns to a new lobby. Added input release/heartbeat independent of draw cadence.
Checks after server change: node --check server/server.js and npm test PASS. Checks after client change: node --check public/js/game.js, node --check public/js/network.js, npm test PASS. These checks were syntax/offline only; multiplayer regression and real-browser acceptance are pending. A misplaced keydown condition found during source review was removed before interactive testing.
Status IN_PROGRESS; no MVP-02 verification claim yet.


MVP-02 live regression follow-up: npm run test:multiplayer initially FAILed at stale input stop (x continued 123.00 -> 138.36 after the expected timeout). Earlier actual WebSocket assertions had passed shared start/movement/relay/bridge/gate/victory/replay and room isolation. Fixed server timer drift by using the existing elapsed-time fixed-step helper instead of assuming every setInterval callback equals one 60Hz tick. npm test then PASSed including the complete multiplayer regression: invalid/full rooms, forged/null input, concurrent one-time relay, shared victory/replay, isolation, stale input stop, death deduplication, host handoff, and empty-room cleanup. No new dependency was added for the tests; they use Node WebSocket to exercise actual Socket.IO wire frames. npm test explicitly skips live checks when multiplayer dependencies are absent so offline practice remains dependency-free.
Client focus follows a shared start so typing a room code does not retain keyboard focus during play. Reconnect is explicit and returns to a new lobby; no automatic restoration is claimed. Real browser acceptance still pending.

## 2026-10-28 - MVP-02 / VERIFIED local browser acceptance

Environment: Windows; Node v24.20.0; Express 5.3.0; Socket.IO 4.8.4; connected Chrome (installed version previously recorded as 156.0.8078.49). Client A http://localhost:4174/ and B http://127.0.0.1:4174/ are separate origins/pages with independent Socket.IO sessions. They are not separate physical devices or browser profiles; this is not public internet verification.

PASS - automated checks: npm test after timing correction, then again after client focus/reconnect and late/foreign snapshot protection. Includes physics/clock/gaps, static HTTP/assets, board guard, network-client-test.mjs and actual WebSocket integration in multiplayer-test.mjs. Live assertions cover random codes, invalid/full rooms, host-only start/replay, authoritative movement, forged coordinates/hearts/distant activation, null messages, concurrent relay exactly once, one bridge, shared gate/victory/replay, isolation, stale input, one death charge, host transfer and cleanup. No new dependency added for test clients. When dependencies are absent live tests explicitly skip, preserving offline checks. node --check passed server/server.js, public/js/game.js and public/js/network.js during implementation. Earlier failed timing check is recorded above.

PASS - real browser steps and observations:
1. A clicks Create Room: server generated 62MUAX. B enters XXXXXX and clicks Join Room: readable error "That room code was not found. Ask the host to create a room again." B enters 62MUAX and joins. Both rosters show two distinct survivors and correct YOU/host labels.
2. Host clicks Start co-op run; both enter playing with four hearts. Real Right inputs (A 2900ms, B 2700ms) give matching snapshots: A x=250.64, B x=251.36, y=129, alive=true. IDs A=hhBTJPVlqF9ZN9NHAAAA and B=rskPPqsc4kzjv_JmAAAB.
3. Right+Space 1000ms separately in each client crosses the first pit: A x=330.92, B x=330.36, both alive. Screenshot captured both avatars in the same world.
4. A holds Right 2600ms then E 250ms near relay. Both show "Relay ON / Bridge open. All living survivors must reach the shelter gate." Both report relay=true and objective-version=1; A x=532.79, B x=333.84. B did not press E; one server-owned interaction affected both clients.
5. A Right 5000ms then B Right 8000ms across the shared bridge: both show You made it out., state=victory, hearts=4, A x=920.27 and B x=877.84, y=129, alive=true. Victory screenshot captured in browser transcript. No state injection or shortcut used.
6. Host clicks Replay room / R: both return to playing with relay off, A=27, B=44 and four hearts in the same room.
7. B leaves, creates room 7L2CAB, starts alone, crosses first pit (Right 2900ms, Right+Space 1000ms), approaches relay (Right 2600ms), E 250ms. Simultaneous comparison: A/62MUAX has only A at x=27, relay=false, version=0; B/7L2CAB has only B at x=534.35, relay=true, version=1. No player or relay-state leakage. This supplements automated packet-isolation assertions.
8. Console error queries return [] for both sessions. Both click Leave and return to title. Invoke-RestMethod http://localhost:4174/health returns {"ok":true,"service":"tiny-teamwork-server","rooms":0}; Invoke-WebRequest -UseBasicParsing http://localhost:4174/ returns 200. Assigned PORT=4174 is honored.

Scope: MVP-02 is VERIFIED locally. Online slice is Level 1 only. ESC releases input without pausing the shared world. Started rooms reject new joins; create a new lobby. Host transfers on departure; disconnect clears identity. Rooms are memory-only in one Node process; restart loses rooms. Later online campaign/story, carry/throw/rescue, movable crates, mobile and broad checkpoint/heart cases remain unverified. No broader NET/COOP task is inferred complete. Temporary art unchanged. Final regression after task/docs updates follows below.

## 2026-10-28 - MVP-03 / BLOCKED hosting connection

Read-only discovery found no installed Node-hosting CLI or configured project Git repository. Sites runs Cloudflare Workers, so deploying this persistent Node/Express/Socket.IO server there would require a runtime/networking migration; none attempted. Plugin search found Railway and Render available but not installed. Railway was suggested; that does not install/connect it. No confirmed hosting account/destination is accessible in this session. No public deployment or URL exists.

User action: install Railway and complete its account connection, then explicitly authorize resuming MVP-03. A real HTTPS deployment and separate-device/network playtest are still required. Work stops at this connection blocker; no optional work or MVP-04 work started.

Final handoff: npm test PASS (exit 0) after task/docs/runtime metadata updates. Board guard reports five checked tasks with matching evidence. Client session and full live WebSocket integration PASS. Final fresh-browser create/join/leave test used room WW2TPK: correct two-player roster, both returned to title, errors=[] on both. Final /health reports ok=true and rooms=0. Local co-op server remains available on port 4174; no public URL exists. Work stopped at MVP-03 hosting connection.


## 2026-10-28 - UI-001 / text readability implementation
User explicitly requested all blurry game text fixed. Baseline npm test PASS including live WebSocket tests. Source inspection found 5-8px Canvas text enlarged with the 320x180 bitmap plus 8-11px HTML labels. Migrated title/HUD/story/capture/lobby/pause/game-over/ending text to native HTML overlays and increased surrounding controls/help typography. Canvas is now artwork only (no fillText calls remain). Added text-ui.js to static HTTP smoke checks.
Commands: node --check public/js/game.js, art.js, text-ui.js PASS; npm test after implementation PASS including client and actual multiplayer regression. Initial browser title and opening-story screenshots show native text and full captions. Pause check timed out and one browser click hit a CDP input timeout; UI state was stale while synchronous keyboard notices updated. No game-source exception was found; one retained console error came from the previously visited Handshake page. Cached text overlay updates to avoid repeating identical DOM mutations; full interactive verification is still pending. No UI-001 completion claim yet.

## 2026-10-28 - MVP-03/MVP-04 / workaround and official requirements research
Railway official status (https://status.railway.com/, October 28 15:27 UTC update) confirms new signups paused during recovery. Render official docs confirm Node/Express web services with public HTTPS and WebSockets; Free service sleeps after 15 minutes without traffic and may take about one minute to resume. Render plugin was found available but not installed; suggested it, without creating an account/service. Sources: https://render.com/docs/web-services, /docs/websocket, /docs/free, /docs/blueprint-spec.
User authorized independent release preparation while hosting is blocked and supplied the Handshake mission URL. Read Start, Build, publishing instructions and Submit form in the authenticated browser without changing checkboxes, filling fields or publishing. Requirements: two players on separate devices; understandable rules; reachable public link. Actual form requires title, game URL, cover screenshot (3:2 recommended, at least 1200px wide), description capped at 500 characters; Share to Showcase must be enabled for challenge entry.
Mission page says October 31 at 11:59pm PT. Linked official rules PDF page 1 says October 30, 2026 at 11:59pm PT. Treat earlier deadline as planning target until organizer clarifies. Rules source: https://go.joinhandshake.com/rs/390-ZTF-353/images/%5BAI_Skills_Studio_Challenge%5D_Contest_Official_Rules.pdf?version=0. Mission source: https://app.joinhandshake.com/learn/create-a-multiplayer-game-8d7d59b5/mission_step_cmssgy0di000y1ztkbjrpbt5r. Submit source: same mission /submit. No entry submitted; human review/submission remains required.


## 2026-10-29 - Overnight handoff / release preparation and limits
Latest user instruction: work for eight hours, starting 2026-10-29 02:08:50 UTC, cutoff 10:08:50 UTC (06:08:50 America/New_York). This superseded the approximate 6 AM cutoff.

UI-001 implemented: all title/HUD/story/capture/lobby/pause/game-over/ending text moved out of the 320x180 bitmap to native HTML; larger controls/help/labels, higher contrast and phone-width layout. Canvas now renders only original pixel artwork. Text/UI panel updates are cached; native state feedback also updates immediately on input/snapshots instead of waiting for drawing. Real screenshots verified title, opening caption and pause at desktop; title and pause were also observed at 390px phone-emulated width. Physical-device testing and a complete browser co-op recheck of this last text revision remain unverified. UI-001 stays IMPLEMENTED_UNVERIFIED, not checked.

Automated verification: repeated npm test PASS through the text and deployment changes, including actual WebSocket relay/victory/room isolation tests. Morning final npm test PASS (exit 0). node --check PASS for game.js, text-ui.js, art.js, server.js and check-submission.mjs. Manual local HTTP check after wake returned /health ok=true, rooms=0 and main page HTTP 200 on port 4174.

Release preparation: render.yaml targets a free single-instance Node Web Service, npm ci && npm test, npm start, /health, Node 24.20.0 and manual redeploys. Server explicitly binds 0.0.0.0 and assigned PORT. Platform-side Blueprint validation and real deployment are not verified. docs/DEPLOYMENT.md records setup, cold-start/room-loss limits and external two-device acceptance steps.

python scripts/package-release.py --verify PASS: ZIP integrity and explicit file allowlist; fresh sibling extraction has no node_modules and require.resolve('socket.io') fails, proving it did not borrow this checkout's installed dependencies. npm test in that clean extraction PASSes offline/client checks and explicitly skips live tests. Full live checks pass in the installed working copy. release/source-manifest.json records per-file hashes and the ZIP SHA256. Rebuilt final source package after this handoff update; final artifact hash is in that manifest.

MVP-04 partial: submission/entry.json contains title, 416-character description, controls, source URLs and actual form requirements. npm run check:submission intentionally reports DRAFT / NOT SUBMISSION-READY (exit 1): public URL, actual cover screenshot, public health/assets, separate-device/network test, QA evidence and human review still missing. No contest form fields/checkboxes were changed; no entry submitted. Earlier deadline discrepancy remains: official rules October 30 11:59pm Pacific versus mission page October 31; plan for the earlier date pending organizer clarification.

Deployment blocker update: user confirmed Render setup; plugin discovery confirms installed=true. Render MCP tools still are not exposed to this chat. Read Render deployment/access skills; no host creation attempted. A browser request to bind the existing Render Dashboard tab remained blocked for 28372 seconds (about 7h53m), then returned 'native pipe is closed'. No independent coding could occur while that tool call was pending. This consumed most of the overnight window; it must not be represented as productive coding time. Browser account/workspace access was never verified. A GitHub new-repository form was inspected, but no repository was created or source uploaded. No Render service, public URL or external playtest exists.

Next concrete task: restore browser access or start a fresh project chat with Render attached so its tools are available, then deploy the tested Node service from a source repository and perform the external two-device test. Render is already installed; do not ask the user to install it again. MVP-01/02 retain their previously scoped verification; MVP-03 remains BLOCKED; MVP-04 and UI-001 remain unverified.

Final release verification at handoff: python scripts/package-release.py --verify PASS with 54 allowlisted files, ZIP CRC integrity, isolated extraction and offline/client checks; live integration explicitly skipped in extraction and PASSed in the installed working copy. Final ZIP SHA256: 6c59e4f30596d359e0487f6f35f75a4311bf45c4a0951662b2bc34979d7411d1. Archive includes all original design/support docs. Current code and deliverables saved; no public deployment or contest submission occurred. Work stops at the user-requested eight-hour cutoff; objective is incomplete and remains paused pending restored Render/browser access and external verification.


## 2026-10-29 - MVP-03 connection recheck / BLOCKED

User requested: check Render connection, then resume MVP-03. Read AGENTS.md, PRIORITY_ROADMAP.md, TASK_LIST.md, QA_LOG.md, docs/PRACTICE_GUIDE.md and deployment/access guidance. Acceptance remains public HTTPS Node/Socket.IO service, assigned PORT, healthy /health, no ChatGPT login, and successful multiplayer play from separate devices/networks.

Environment: Windows PowerShell, installed working copy. Baseline `npm test` PASS (exit 0): project physics/clock/gaps, static health/assets/404, five verified board entries, client membership regression, actual WebSocket create/join/invalid code/capacity/start/movement/relay/bridge/gate/victory/replay/room isolation/death deduplication/host handoff/cleanup. No gameplay changes made.

Render plugin discovery: installed=true, status=ENABLED. Tool definitions are listed, but get_selected_workspace, list_workspaces and list_services each return MCP error -32001 Unknown tool for render.<operation>. This is a connector dispatch failure, not evidence of a valid account or an empty workspace. Official current reference https://render.com/docs/mcp-server read via HTML after Markdown fetch was rejected by the fetching tool.

Fallbacks: `cua.getState()` returned apps=[], browsers=[]; creating an in-app Render Dashboard tab returned Browser is not available: iab. `Get-Command render,gh -ErrorAction SilentlyContinue` found neither CLI; RENDER_API_KEY environment presence check=false (no credential values read or logged). No browser/account access, repository upload, Render service creation, deployment or external playtest occurred.

MVP-03 remains BLOCKED. Next single task: restore/reconnect existing Render integration, verify a read-only workspace/service call, deploy the prepared free single-instance Node service from an owned source repository, and perform the external two-device/network acceptance procedure. No reinstall request; no optional gameplay or MVP-04 work.

Final session regression: npm test PASS (exit 0) after status/documentation updates, including actual WebSocket multiplayer. Source ZIP refreshed with the current handoff; archive integrity/hash manifest regenerated.

## 2026-10-29 - MVP-03 public deployment / IMPLEMENTED_UNVERIFIED

Acceptance: public HTTPS Node/Express/Socket.IO service and client, provider PORT, healthy /health, no ChatGPT login, separate physical devices/networks completing room/relay/shelter/replay. Read handoff/planning/practice/deployment files; baseline npm test PASS including actual local WebSocket gameplay. No gameplay source changes.

GitHub get_user_login returned MummblingThinker (113700934); get_repo returned push=true/admin=true; collaborator permission returned admin. Destination: https://github.com/MummblingThinker/1k-Game-Project-Only-AI-. Repository was empty. Published 54 allowlisted handoff files through the connector, excluding dependencies/caches/environment files. Runtime source commit: 269fc0e4384ebd9cf44bdd6cb6caaa81dcc0c776. Subsequent commits add tests/docs only. Local folder has no Git checkout; repository operations used the connector.

Render list_workspaces succeeded: My Workspace, tea-dbhakd8u01pc73ap1ou0. Passed workspace ID explicitly on every resource call; initial list_services returned no services. Created one Free Node service srv-dbhnfcm1egvs73817n4g in Virginia, one instance, autoDeploy=no, build npm ci && npm test, start npm start, NODE_ENV=production, NODE_VERSION=24.20.0. No database, paid plan, secret or autoscaling. Dashboard: https://dashboard.render.com/web/srv-dbhnfcm1egvs73817n4g. Deploy dep-dbhnfde1egvs73817pj0 became live 2026-10-29 16:44:26 UTC. Render build log includes full npm test PASS; runtime log confirms assigned PORT=10000. URL: https://tiny-teamwork-last-spark.onrender.com. Limited direct MCP creation cannot set HTTP health path; default Render TCP readiness is active. Existing Blueprint requests /health; HTTP endpoint is checked independently.

Verification limits: cua.getState() returned apps=[], browsers=[]; creating an iab tab failed Browser is not available: iab. Local TEST_BASE_URL remote smoke failed fetch/connect EACCES on outbound HTTPS. Web fetching tool could not access the new onrender URL. Public checks instead use GitHub Actions Ubuntu 24.04.5 / Node 24.22.1 over real HTTPS/WSS, without login/cookies. This is not browser visual or physical-device verification.

Test changes: smoke-test.mjs and multiplayer-test.mjs accept TEST_BASE_URL as an HTTPS origin; default local behavior preserved. HTTP cold-start allowance added. Public multiplayer smoke workflow has contents:read permission and serial execution. Source ZIP allowlist includes workflow.

First hosted run https://github.com/MummblingThinker/1k-Game-Project-Only-AI-/actions/runs/40914786624: /health, main page, CSS/modules, nine PNG sprites and 404 smoke PASS. Actual WSS gameplay reached shared victory/replay and later assertions; final global empty-room assertion FAIL (rooms=1). Corrected public cleanup to inspect only test-created room codes. Second run 40915091775 again passed HTTP/assets and gameplay, but cleanup probe found its full lobby after transport close. Test peers now send the Socket.IO disconnect packet before WebSocket close, allowing reverse-proxy cleanup without transport timeout. Host-departure test retains abrupt close. No server change or gameplay bug fix claimed.

Local npm test PASS after remote support, room-scoped cleanup and graceful test-peer shutdown. Covers physics/clock/gaps, local HTTP/assets, five-entry board guard, membership regression and actual independent WebSocket clients: invalid/full rooms, host-only start/replay, forged/null input, relay once, bridge/gate/victory, isolation, stale input, one death charge, abrupt host transfer, cleanup.

Physical-device/separate-network playtest requested from user with URL and exact steps. Pending: device/browser/network details, create/join, movement/jump, relay/bridge, shelter victory, replay, current browser visual/console smoke. MVP-03 remains unchecked / IMPLEMENTED_UNVERIFIED. No optional gameplay work or contest submission.

PASS - final hosted public regression: https://github.com/MummblingThinker/1k-Game-Project-Only-AI-/actions/runs/40915358003 (job 123594012862, test commit c8b1b5da2d56f8b867271a5e9c7c3b7d13cb6833). Commands: npm ci; TEST_BASE_URL=https://tiny-teamwork-last-spark.onrender.com npm run smoke; same environment npm run test:multiplayer. All steps concluded success. Logs show HTTP/assets PASS, both test room codes removed, unrelated rooms preserved, and full Multiplayer PASS including shared victory/replay, isolation, stale-input/death checks, abrupt host transfer and cleanup. Runtime source remains 269fc0e4384ebd9cf44bdd6cb6caaa81dcc0c776; later commits change tests/docs only. This proves deployed HTTPS/WSS behavior from an external hosted runner; it does not substitute for physical devices or browser visual/console checks.

Final local regression after handoff updates: npm test PASS (exit 0, including actual WebSocket integration). python scripts/package-release.py --verify PASS: 55 allowlisted files, ZIP integrity, fresh sibling extraction/dependency isolation, offline/client tests PASS; live checks explicitly skipped only in the extraction without dependencies. Repacked after this evidence entry; release/source-manifest.json holds the current archive SHA256. README/status/task board/deployment/network/practice notes and draft URL metadata updated; MVP-03 remains IMPLEMENTED_UNVERIFIED pending physical-device acceptance. Service remains on the verified original gameplay runtime; manual deploy prevents documentation commits from interrupting rooms.

## 2026-10-29 evening - CAMP-01 / expanded campaign implementation IN_PROGRESS

Owner explicitly defers physical-device playtest, requests remaining MVP/tasks, larger campaign and encounters, then anime/comic art; authorizes autonomous work until 2026-10-30 06:00 America/New_York (10:00 UTC). Updated AGENTS.md/roadmap exception; never infer physical-device verification or contest submission.

Baseline npm test PASS. Added authored route data for 15 stages, normal later maps 2880 units, milestone maps 5280/5760/6240 units against 960-unit tutorial reference; Level 1 preserved. Pursuer is fixed speed (120-second map traversal), cannot enter boss arena, no player-position catch-up. Level 5 has slam/exposed ordered relay puzzle; Level 10 45-second survival/three beacons with covered-way swarm; Level 15 background Colossus, targeted strikes/cover and three core-stun cycles. Bosses are temporarily disabled, never killed.

Shared simulation.js now runs both solo and authoritative server: relays, crate/player pickup/drop/throw, dynamic teammate supports, rescue-only jump stuns, capture/limited struggle, sentinel/scanner/blast telegraphs, heart/death deduplication, longest-dead checkpoint revival without extra heart, full-level reset, party-wipe retry using remaining hearts. Water slows; conveyors push. Host can select a practice stage in lobby; Continue advances levels and shared story after 5/10/15. Client controls F carry/throw, Q drop, E use, N continue.

Commands: node --check server/server.js, game.js, art.js, simulation.js, network.js PASS. npm test PASS after shared-engine integration (including original actual Socket.IO regression). Regression initially caught gate locked in immediate relay broadcast; fixed atomic gate update. Input-only route runner found relay/ledge overlaps; moved authored relays onto clear floor. Added real bot jumps/rescue/evasion and staggered co-op formation (no injected positions during traversal).

node scripts/campaign-test.mjs PASS: 60 input-only stage completions (every level at party sizes 1,2,3,4), geometry/grounded relays/shelters, solo fallback stones, 120-second fixed-speed pursuit and boss exclusion, heart pool boundaries/deduplication/oldest revival/full reset, carry/throw/disconnect. Some bot formations lose hearts/retry; this is route-solvability evidence, not human balance verification. Added to npm test. Browser/CI test harness written for all stage loads, two independent contexts and shared next-level flow, screenshots and mobile cancellation; execution still pending. No new production dependency. Current scope stays IN_PROGRESS until browser/live campaign checks and review.

## 2026-10-30 CAMP-01 campaign browser and live encounter evidence

Status: IN_PROGRESS; automated evidence does not substitute for full human campaign balance or physical-device acceptance.

- GitHub campaign commit 54a83a0d8ee5b27f6305336ba8b03927d9c95a90: Actions 40984883655 passed npm test and Playwright browser regression.
- Anime comic commit 9b3097d4db6e71241da785d6b5a95d2b4726134e: Actions 40985355657 passed again. Chromium 156.0.8078.4 loaded/moved in all 15 stages, tested story/pause, two independent browser contexts completed tutorial relay/victory/shared Continue into Level 2, emulated touch cancellation; zero console/page errors.
- Actual 1800×1200 JPEG browser screenshot recovered from public-game-only CI evidence and visually inspected; saved submission/cover.jpg. Story atlas visually inspected separately. Full rendered sequential-story screenshot is queued for next browser pass.
- Render My Workspace deployment dep-dbhvpbajnfac73cgdc4g reported live at 02:11:42 UTC, commit 9b3097d. Public smoke from the earlier campaign source push failed because that test expected simulation.js before the old live service had been updated. Refresh hosted evidence after deployment; do not count that failure as a gameplay pass.
- Local `npm test` passed with additional systems tests: actual capture rescue, ordinary jump does not stun, bounded struggle, disconnect cleanup, giant shelter breach despite invulnerability, multi-victim blast one-charge-per-player, oldest-dead recovery, boss ordering/window/survival/core rules. Campaign traversal passed 60 input-only routes across all 15 stages at party sizes 1–4.
- Local `node scripts/live-campaign-test.mjs` exited 0 at 02:17 UTC: real two-client room, host-only stage selection, full Level 15 input-only route, three background-boss core cycles, pursuer exclusion, shared victory/story/ending, guest authority rejection. Output saved artifacts/live-campaign.log. Added standalone npm command and CI step; not added to Render's fast build check.
- Local server now limits message bursts and room creation; shared action notices update HUD. These changes await published CI/deployment.
- Submission draft now describes the campaign and references the real cover. Physical-device/network evidence, eligibility and human preview/submission remain pending; no contest submission attempted.

## 2026-10-30 CAMP-01 shelter and action corrections

Status: IN_PROGRESS. New source fixes, supported by focused shared-engine tests and complete local npm test PASS.

- Drop with empty hands no longer picks up a crate; carry/drop no longer activate boss pylons. Use cannot start a boss before all living players enter. Jump input now gives bounded edge-triggered capture struggle, sharing the existing four-extension cap with direction changes.
- The stricter boss-entry rule exposed players previously trapped by shelter geometry. Removed overlapping nearby ledges and left a full player-width gap between roof and side steps. Giant breach now removes the shelter's physical roof/steps.
- Conveyor motion previously applied after collision and could embed players inside a step. Water/conveyor motion now runs through player collision resolution. Upward head collision now checks the previous head position, avoiding downward ejection when already overlapping a side edge.
- Added direct movement checks for both exits and roof access at every expanded shelter. All pass. Added conveyor wall and head-crossing regressions; all pass.
- Updated route bots to retain dodge movement through the attack and choose direction from the marked impact location (previous direction reversed near the right arena edge). No world positions are injected during campaign traversal. All 60 routes pass again; Level 15 party-three completes with four hearts in this deterministic formation.
- `npm test` PASS including shared systems, campaign, HTTP/assets, board, network-client and real WebSocket integration. Real-client finale rerun pending completion before publication.
- Published previous hardening/materials commit 5add33b892afd8fce4b7d7956229441b9df3a874; Actions 40991256223 passed all npm tests, live finale and Chromium browser checks.
- Hosted campaign HTTP/WSS regression rerun 40984883623 (job 123854312747) completed success against live 9b3097d, including assets and full multiplayer regression. Physical devices remain untested.
- Rendered story screenshot from job 123853949710 inspected: text is sharp and panels reveal, but repeated full-frame atlas crops distort illustration proportions. Next visual refinement will preserve aspect ratio and use focused crops with captions inside each panel.

Follow-up: real-client Level 15 rerun PASS after shelter/input/terrain fixes (npm run test:live-campaign, local Node 24.20.0, two actual WebSocket clients). Comic art now preserves its 3:2 quadrant proportions inside cropped cells and includes native-text captions per cell. End card aligned with the established tragic ending. Browser visual recheck queued for the new source.

## 2026-10-30 CAMP-01 arena-entry and retry hardening

- A party that bypasses a route relay can return from the arena; the encounter cannot start until every route relay is active. New direct regression passes.
- A full party wipe with hearts remaining now retries inside the encounter entrance with 120 ticks of recovery/invulnerability; relay, cycle and survival timer progress reset. It no longer respawns at a distant shelter and then clamps/teleports into a live attack. Shared hearts are not restored. New retry assertions pass.
- The route driver now reacts to the full visible warning and chooses the nearest safe direction rather than crossing the marked impact while returning to its objective. It jumps ground strikes where appropriate. This is a test-driver correction, not reduced hazard damage/timing.
- `npm test` and `npm run test:live-campaign` both PASS after these changes. All 60 campaign routes still finish; the actual two-client finale reaches the shared ending.
- Previous shelter/comic source 5ea0b4222e157b4f6fa57fed09efe1cd3d111787 passed CI 40992225925 including live finale and browser. Its rendered story JPEG was visually inspected: aspect ratio preserved, distinct crops, readable in-panel captions. Fixed a stray encoding character in the region badge for the next commit.

## 2026-10-30 LIFE-02 VERIFIED starting-heart ranges

Acceptance is automated range-boundary verification. `npm run test:campaign` asserts counts 1 through 16 against the documented pool, covering every transition: 1=3, 2–3=4, 4–5=5, 6–7=6, 8–9=7, 10–11=8, 12–13=9, 14+=10. PASS in local Node 24.20.0 and campaign CI. Runtime supports lobbies up to four; larger counts are design-function tests, not claims of larger online lobbies. Task LIFE-02 checked; broader manual co-op/life tasks remain IMPLEMENTED_UNVERIFIED.

## 2026-10-30 ART-07 sound implementation IN_PROGRESS

Original oscillator cues added for jump, relay/checkpoint, capture/countdown/rescue, warning/blast, nearby giant footsteps, story transitions and victory/death. Sound starts only after a user gesture; mute/volume persist with guarded localStorage. Hidden tabs suspend audio; voice count is capped. No audio assets or new dependencies. Visual tells remain authoritative. Browser test now checks mute and volume after reload and gesture-unlocked AudioContext; execution pending. Physical headphone/speaker quality review is not claimed.

Deployment/packaging follow-up: Render dep-dbi08ics728c73buufu0 for d56fc94 reported LIVE, finished 02:44:12 UTC. `python scripts/package-release.py --verify` PASS: 66 allowlisted source files, ZIP integrity, isolated fresh extraction and offline npm tests; live integration explicitly skipped only in the dependency-free extraction. Archive release/TinyTeamwork-source.zip; manifest records hash. Audio fe2e996 CI still pending. Public smoke on that source expects audio.js before its deployment, so the predeployment public job failed; rerun after the audio revision is live.

## 2026-10-30 co-op stress, salvage and stage scenery

- New `node scripts/adversarial-test.mjs` PASS: stable 2/3/4-player stacks and clean jump separation, then 120 seeded scenarios mixing movement, carry/drop/use, capture/death and one disconnect. Checked 169,223 simulation ticks for finite coordinates, symmetric carry/capture ownership, heart bounds, indestructible enemies and unique fatal-event IDs. These are scenario tests, not human playtests. Added standalone command and CI step.
- Cracked salvage barriers added to selected city/forest/factory stages. Stomps and moving/falling crates break them once, producing short debris effects; resting crates do not. Required routes remain jumpable. Shared systems and all 60 campaign routes pass; robots remain indestructible. Browser render inspection pending.
- Stage-specific original code scenery added: subway cars, rooftop tanks, dispatch searchlights, roots/canopy ropes, river ripples, ranger cabin, assembly machinery, furnace grilles, prototype pods and power coils. Scenery has no hidden collision/hazard rules.
- Optional memory terminals were previously invisible and could be placed over a pit. They now render with a clear interaction marker and are positioned on clear floor. Automated placement checks pass for all stages and party sizes 1–4.
- Covered Way now has a physical roof and its 100 decorative drones remain above it. Initial lower ceiling shortened the solo jump over its last gap; raised it to preserve the full jump arc. All 60 routes pass with the final roof height. Rendering fixtures added for ten themed states; these are art inspection, not gameplay evidence.
- Sound + native-button keyboard source 377f8a0832ae58c338b05fb7b5df118a9bc2020b passed CI 40993686881 and is LIVE on Render (dep-dbi0cp1srm7s73csh340, finished 02:53:10 UTC). Public audio-source smoke 40993335495 rerun requested after deployment.

## 2026-10-30 ART-01 / mobile usability / long-session testing

- Salvage/scenery source bbf65369bb613adfb39dd161e3e5f7a615f674d6 passed CI 40994918612 (job 123865694338): npm test, adversarial scenarios, actual-client finale and Chromium browser regression. Ten render fixtures were inspected; stage identities, grounded memory marker, physical covered roof/swarm and salvage are visible. Fixtures are art-only evidence, not gameplay completion.
- New input-only real Socket.IO sequence harness walks consecutive stages, checks full-level lives/revival and shared victories, and lets post-5/10/15 scenes run on their real default timers. Two-player and four-player full-campaign jobs are active; both have passed city/forest arcs and timed story transitions and reached the factory. Three-player job started. Final results pending; do not claim complete campaigns yet.
- Gameplay survivors now use original procedural pixel poses (idle/run/jump/fall/carry/captured/down), four distinct coat colors, and numbered co-op labels. The roaming giant is drawn much larger, with its visible front aligned to the existing lethal boundary. Pose/giant visual fixtures added; inspection pending. Static title/story sprites remain unchanged.
- Local UI changes add a truthful countdown to the pursuer reaching the current position, touch-accessible pause/resume and story advance, bottom-fixed touch controls sized to fit narrow screens, and a fuller rescue hint. Browser checks now include held touch movement/cancel, pause/resume, native button keyboard activation, no horizontal overflow and a phone story screenshot. Execution pending.
- Hosted sound-source HTTP/assets/WSS rerun 40993335495 (job 123865669861) PASS against live 377f8a0. Physical-device/headphone acceptance remains pending.

## 2026-10-30 long campaign results and input timing

- Two actual local socket clients completed consecutive stages 1–15 and default timed after5/after10/after15 scenes in 779 seconds on bbf6536. Shared victories, host authority and full-level life/revival assertions passed. Log: artifacts/live-sequence-2.log. This is automated evidence, not physical devices.
- Four-client sequence passed stages 1–13 and the first two scenes, then exhausted hearts at Level 14's narrow crossing. Failure retained in artifacts/live-sequence-4.log; not a full four-player pass.
- Added 5-tick coyote time and 6-tick landing buffer. Edge/early-landing presses are accepted once; repeated air jumps remain rejected. Carry release clears stale ground/buffer state. Focused tests, all 60 deterministic routes and full npm test PASS.
- Four actual clients passed focused stages 14–15 and timed ending after this change (156 seconds), with one heart left after the finale route. Log: artifacts/live-sequence-4-late.log. Further full/repeat checks remain useful; this is not human balance proof.
- Three-client full sequence on earlier bbf6536 remains active in session 87523. Do not restart on observation timeout.
- Roster signature now refreshes carrying status. New pose/giant/mobile browser inspection is pending.

## 2026-10-30 pacing and jump-repeat evidence

- Three-player old-source sequence also failed at Level 14 after passing 1–13. Its failure remains in artifacts/live-sequence-3.log; session 87523 is complete.
- With short jump buffering/coyote time, Level 14 passed three independent real-client trials at party size 3 and three at party size 4. All six finished with two hearts. Logs: artifacts/repeat-3-1.log through repeat-4-3.log. Fresh full 3/4-player sequences are now running on this improved local source.
- Normal-map pursuer walking speed remains calibrated to 120 seconds. Giant milestone maps now use that same walking speed instead of accelerating with map width (nominal full-width travel about 216/235/255 seconds, before the boss boundary). Every stage has an eight-second wake warning; contact is still lethal and boss exclusion unchanged. Shared timing tests and all 60 campaign routes pass. Countdown UI includes the warning delay.
- Motion/mobile CI 40997368197 passed npm tests, adversarial scenarios and live finale. Browser passed all stage loads/co-op, held touch movement/cancel, pause/resume and no-horizontal-overflow, but its immediate phone story-heading assertion failed before the next animation frame. Story button now calls syncTextUI immediately, and its test awaits the observable heading change. Full browser rerun pending. No deployment of this failed browser revision was attempted.
- Motion/giant/pose fixtures were inspected. Giant render fixture now disables image smoothing like the real game, and stage fixtures correctly mark standing survivors grounded; these fix the inspection fixture, not gameplay.

## 2026-10-30 pressure bridges, exit stack and mobile comic layout

- Pacing/mobile source b2f91fbf1437cb5d9a0523f4e179be0b5ce0c9b6 passed CI 40998443607 (job 123876960657): npm test, seeded adversarial scenarios, real-client finale and Chromium browser suite. Recovered mobile-story and motion fixtures were inspected. Deployment dep-dbi13tom7kps73bio7ng started at 03:41 UTC; live status pending.
- Phone screenshot revealed Next button overlapping comic art. New grid layout reserves separate heading, art, caption and navigation rows, with a larger two-row comic on phones. Added bounding-box assertions; rerun pending.
- Added optional weight/pressure bridges to stages 6/8/12/13. Grounded humans or loose crates hold them; releasing starts eight-second expiry. Unit regression checks holding, one bridge only, standing collision, expiry, carried-crate exclusion, fallback preservation and independent worlds. All 60 deterministic routes and npm test PASS.
- Full four-client run on b2f91f passed Level 6 only after losing upper stacked survivors to the pursuer at the exit. Root cause was an unnecessary lower vertical bound on completion. Exit now accepts jumps and human stacks within the safe exit column. Four-survivor regression passes with all alive and no heart loss. Focused actual four-client stages 6-8 rerun active (session 46605, artifacts/live-pressure-4.log).
- Fresh full 3/4-client sequences on b2f91f are still active (artifacts/live-sequence-3-buffered.log and live-sequence-4-buffered.log); they do not include the newer pressure/exit fixes. Preserve results without claiming latest-source coverage.
- Follow-up: four actual clients passed stages 6-8 with the exit/pressure changes in 116 seconds. Level 6 completed in 39 seconds with five hearts; Level 8 also retained five. Log artifacts/live-pressure-4.log, session 46605 complete. Deployment b2f91f confirmed LIVE at 03:42:33 UTC.

## 2026-10-30 full sequence outcome and solo-stage save

- Three real clients completed all 15 consecutive stages, all default timed scenes and ending on b2f91f in 787 seconds. Log artifacts/live-sequence-3-buffered.log. Four clients again passed 1-13 but failed 14: three clustered bots ignored a creeper warning, then exhausted the pool at the next pit. Log artifacts/live-sequence-4-buffered.log. Both processes are complete. Six earlier focused Level 14 passes were not sufficient to claim a robust full four-client pass.
- The real-client driver previously evaded boss warnings but ignored ordinary scanner/ground-strike warnings. It now moves out of scanner columns and jumps timed ground strikes using only broadcast state/input; no state injection. Focused 4-player 14-15 run active, artifacts/live-warning-4.log (session 23038).
- Added browser-local solo stage resume. It restarts the last begun solo/practice stage with full hearts, does not save within-stage progress, and does not overwrite solo progress when leaving a room. Version/range validation and malformed/blocked storage checks PASS; full npm test PASS. Browser reload/resume test added; execution pending.

## 2026-10-30 pressure release and render interpolation

- Pressure/exit/mobile source 35ab74c0abc6b972a9825d10fcb175bdac7342b6 passed CI 40999104374, job 123879080485. Phone comic and pressure/pose contact sheet inspected. Phone art is readable, navigation no longer overlaps captions; screenshot and bounding checks pass. Render dep-dbi1760m7kps73bj2jng confirmed LIVE, finished 03:49:31 UTC.
- Added rendering-only survivor interpolation across server snapshots, bounded to 30-100ms; stale connections freeze at the last authoritative position. Death, carry/capture changes, new runs/phases and large corrections snap immediately. Camera easing now uses elapsed time rather than draw count. Unit jitter/stall/reset checks and full npm test PASS. Broader real network delay/visual checks remain pending.
- Updated warning-aware real-client driver passed four-player stages 14-15 and timed ending in 153 seconds, finale one heart remaining. Log artifacts/live-warning-4.log, session 23038 complete. Full four-client rerun remains needed; do not extrapolate focused evidence.

## 2026-10-30 NET-02 / NET-07 readiness and delayed traffic

- Save/smoothing source 126ee3ca43ca4776f0343440ae7cdb4314602636 passed CI 40999781313, including actual Chromium reload/resume and two-browser gameplay. Render dep-dbi1ckmtlv9c738iieh0 LIVE, finished 04:01:35 UTC.
- Lobby guests now toggle ready; host is ready by default and may start only when every participant is ready. Readiness is broadcast and shown in the roster. Malformed flags, guest start, premature host start and repeated start are rejected. Local npm test and focused real four-client tests pass, including different ready orders and host transfer. Browser ready-button test added; pending CI.
- Test-only TCP delay proxy initially had independent timers that could reorder chunks. Replaced with one ordered queue per direction. Initial jitter test also left its guest stationary until the pursuer reached it; guest now walks into the safe test stretch using real input. Corrected test PASS: 60-140ms varying delay each direction, movement/release, forged input rejection, readiness, shared pressure bridge and eight-second expiry, state order, heart agreement, host departure and room cleanup. artifacts/jitter-test-4.log. Earlier failures retained.
- Full four-player warning-aware driver failed at Level 3 after passing 1-2 (artifacts/live-sequence-4-warnings.log); session 14025 is complete. Its scanner evasion can reverse the bot into route hazards, so it is not a human balance verdict. Existing deterministic 60-route suite and focused four-client finale still pass. Do not claim a complete four-client campaign.
- Started a 30-minute local soak: eight rooms, four actual clients each, randomized input/actions, repeated game-over resets, finite-state/heart/carry checks, process memory/event-loop telemetry and final cleanup. Session 53535, artifacts/soak-8-1800.log; final metrics artifacts/soak-8-1800.json when complete. This is local load evidence, not Render capacity evidence. Do not restart while running.

## 2026-10-30 pause, tutorial shelter and harness action budget

- Readiness CI 41000816390 passed npm test, adversarial and delayed traffic, then failed the final scene skip in the real-client finale harness. The driver was sending Interact at 25Hz, above the server's 20 action/sec limit, leaving no budget for a scene skip. It now sends use at most every 220ms, matching gameplay cooldown. Local real-client finale/skip PASS, artifacts/live-rate-finale.log, session 34000 complete. This is a test-driver correction; rate protection remains intact. No deployment of the failed readiness revision was attempted.
- Fixed paused Carry/Drop actions mutating solo state. Pause/resume also clears held keyboard/touch input. Added a browser check beside a real crate, including frozen movement/pursuer text and a successful pickup only after resume; CI pending.
- Small-screen story/practice/restart/online stage starts now scroll the game into view rather than leaving it above the start controls. Browser position assertion added.
- Tutorial shelter now has the same physical roof and side-step escape as later stages. All 15 shelter topology tests and deterministic route checks pass. A previous tutorial multiplayer walker assumed a flat route and stalled when stacked beneath the new roof; it now jumps actual blocking surfaces. Browser route includes the shelter jump. Current local multiplayer rerun pending, session 76573.
- Public smoke 41000816126 runs the new readiness protocol against older live 126ee3 and failed as expected before deployment; rerun after a passing readiness build is deployed.

## 2026-10-30 compatibility and animation refinement

- CI 41001685833 passed systems/adversarial/jitter/live finale and solo browser pause/pickup checks, then stopped at the new tutorial shelter's left step: the browser driver tried to walk to x420 before jumping but the step starts near x422. It now starts the jump at x400 and logs positions on future failures. No failing build deployed.
- Compatibility CI 41001927331: Firefox 157.0 PASS (job 123888071175), all stage inputs, pause, saved resume, separate co-op contexts/readiness, phone comic/reduced motion, no browser errors. Screenshot recovered and inspected. A 100-drone render fixture measured median/p95 draw 1/1ms and rAF 17/18ms on CI; not representative-device gameplay evidence.
- WebKit job 123888070896 failed a 150ms stage-input assertion after navigation. It now waits for actual playing state, explicitly focuses the canvas and waits up to three seconds for observed movement, with diagnostics on failure. This remains unresolved until rerun. Campaign job also retained the known x420 shelter-driver failure.
- Added original throw/hit poses, distinct falling hands, robot patrol feet/grab arms/recovery sensors, scanner beam columns and explicit SCAN/BLAST/STRIKE countdown labels. Nearby ordinary threats now explain the escape action in the native objective text. All npm tests PASS; expanded nine-pose visual fixture and updated browser suite await CI. No combat/health values changed.

## 2026-10-30 NET-01 / NET-03 / NET-05 / NET-08 VERIFIED

Evidence: full local npm test; source 235b36248854655a1905da83d1c4266c52dd5a19 CI 41002413091 (campaign job 123889620800); independent Chromium co-op contexts; public HTTPS/WSS smoke 41001685781 rerun, job 123891664012 PASS against live 235b362. Render dep-dbi1ogom7kps73bklim0 LIVE, finished 04:26:31 UTC.

- NET-01: actual clients create distinct random six-character rooms, reject invalid codes and a fifth participant, join/leave four-player rooms and transfer host authority on departure. Positive and negative assertions pass.
- NET-03: clients submit boolean intentions; forged coordinates/hearts, null fields, distant use and unauthorized host actions are rejected/ignored. Shared physics, captures, carry state and life rules execute on the server. Actual-client and browser regressions pass.
- NET-05: one fatal transition consumes one shared heart; duplicate client death messages and repeated fatal handling do not charge again. Unit boundary tests, real-client death test and seeded adversarial cases pass.
- NET-08: two simultaneous rooms receive no foreign snapshots/objectives; malformed/forged message cases do not crash the server; local empty rooms reach health count zero and public tests probe only their own removed room codes. These are bounded automated tests, not an exhaustive security audit or physical-device claim.

## 2026-10-30 cross-browser bundle and invitations

- Source 235b362 passed Chromium 156.0.8078.4, Firefox 157.0 and WebKit 27.2 in CI 41002413091. Phone layout/reduced-motion/save-resume/co-op readiness passed in Firefox and WebKit; full tutorial relay/victory/next-stage, pause/pickup, audio, touch and phone autoscroll passed in Chromium. New nine-pose contact sheet inspected.
- Firefox and WebKit headless 100-drone render fixtures measured p95 draw 1ms and p95 frame interval 18/19ms respectively. CI timers are coarse; a zero median means below timer resolution, not no rendering cost. Physical hardware/mobile performance remains pending.
- Added lobby-only Copy invite link. Link fills the room code but does not join automatically; clipboard failure selects the code for manual copying. Browser clipboard/deep-link and four-independent-context ready-order tests added; execution pending. In-game start button now says Co-op run in progress rather than asking for readiness during a running stage.
- Four-client full sequence with spaced departures and one boss-objective leader is active, session 54199, artifacts/live-sequence-4-spaced.log. This changes only bot strategy, not game physics or state. Soak session 53535 remains active, approaching its 30-minute completion.

## 2026-10-30 NET-02, completed soak and crate/spectator work

- NET-02 VERIFIED: e2c7896b6ca83b3f66932e8dc272ec7bf60a2f9e passed CI 41003469869, campaign job 123892953345. Independent two/four-browser contexts ready in different orders and start with the same party. Actual-client tests reject early/repeated start and malformed readiness. Clipboard/deep-link also passed. Firefox/WebKit compatibility passed; their co-op coverage uses two contexts.
- Four-client full 1-15 sequence/default timed stories PASS in 847 seconds on the pre-crate game, artifacts/live-sequence-4-spaced.log; session 54199 complete. Departure spacing and one boss-objective leader are bot strategy, not gameplay concessions. Earlier failed drivers remain recorded. Not human balance evidence.
- Thirty-minute local soak PASS: 8 rooms, 32 clients, 132560 invariant checks, 313 resets, 1169240 received messages, 5899442598 decoded payload bytes, peak RSS 133.01 MiB, elapsed 1802.848 seconds. All rooms removed. artifacts/soak-8-1800.json and .log; session 53535 complete. Local process behavior, not Render capacity evidence.
- Loose crates now push along the floor, stop against walls/other boxes and stack vertically. Added wall/push/stack checks. Route driver initially failed Level 3 because it did not jump newly solid crates; adding crates to obstacle perception restored all 60 routes. Full npm test and 120 seeded adversarial runs (188436 ticks) PASS locally. Logs crate-stack-test.log, crate-adversarial.log; initial driver failure retained.
- Downed co-op players follow living teammates and switch with V/button. Camera, progress, pursuer ETA and nearby threat audio follow the watched survivor; local life cues retain local identity. Browser death/switch/camera regression added, pending CI.
- Crate-version full campaigns active: two clients session 8146, three 40132, four 87489; artifacts/live-sequence-N-crates.log.

## 2026-10-30 crate chain collision follow-up

- CI 41004923651 for 1c465e54 passed npm/adversarial and Firefox/WebKit but failed delayed-network pressure bridge. Two floor crates jammed together under a low ledge; a new chain-push operation now validates the entire chain before applying any positions. Walls block all boxes atomically. Upward thrown-crate ceiling collision also fixed; targeted tests pass.
- Updated jitter driver recognizes solid props. With chain pushes, delayed pressure hold/release/expiry and room cleanup PASS, artifacts/jitter-chain.log. Full local npm test PASS, artifacts/chain-test.log. New browser spectator check still awaits a CI run that reaches Chromium.
- Full crate runs: two and four clients failed at Level 4 (sessions 8146/87489 complete); three-client run 40132 continues beyond Level 9. A focused Level 4 trace showed a revived bot jumping over the shelter exit step, then continuing into the pit while descending. Driver now waits to land on approach geometry; focused two-client Level 4 PASS, artifacts/level4-settle.log. No physical gameplay difficulty claim.

## 2026-10-30 companion anime comic art

- Built-in imagegen produced an original 1536x1024 companion atlas using our earlier atlas as character/style reference. Saved public/assets/story/story-details.png; exact prompt docs/STORY_DETAILS_PROMPT.md. Inspected all four quadrants: teamwork rescue, covered passage separated from drone swarm, mechanical assembly close-up, non-graphic ambush. No text baked into art.
- Native story UI maps survivors/swarm/assemblyReveal/darkTwist to these new scenes. Original stage/story timing is unchanged. Added a real UI four-scene screenshot fixture and HTTP asset checks; browser rendering awaits CI. Updated stale asset provenance.
- Chain-version full two/four-client runs active, sessions 34841/29013, artifacts/live-sequence-N-chain-settle.log. They use the improved approach-landing driver. Three-client pre-chain run 40132 has reached Level 15.

## 2026-10-30 LIFE-08 run diagnostics implementation

- Bounded 60-event stage log records stage start, unique deaths, checkpoint heart/revive outcomes, segment retries and clear. Report includes stage/route, seconds to each checkpoint, survivor positions, last living survivor and shared-heart values. No transport IDs or room codes in the downloadable report.
- Add ?debug=1 to opt into a readable run-report panel/download. Solo reads the local authoritative run; co-op requests its own server report at most once per second. Regular snapshots do not carry event history. Server ignores requested room identifiers, rate-limits reports and sends only to the requesting socket. Client rejects foreign-room, stale-run and post-leave replies.
- Local npm test PASS, artifacts/diagnostics-test.log, including death/revival timing/reset/bounds, actual-client death report/isolation/rate limit and stale response rejection. Browser pit-death/report download check added; pending CI. LIFE-08 remains IN_PROGRESS.
- Companion-art b8f39c88 passed CI 41005901150 in Chromium/Firefox/WebKit. Four-scene UI contact sheet recovered and inspected: readable native captions, distinct crops, intact scene separation. Deployment dep-dbi2aedg1s2s73dph3h0 started 05:03:54 UTC, pending live confirmation. Public smoke 41005901206 failed before new asset deployment; rerun after live.
- Three-client pre-chain full campaign/default ending PASS, 831 seconds, artifacts/live-sequence-3-crates.log, session 40132 complete. Latest chain two/four runs continue. One-hour local soak session 78169 active, eight rooms/32 clients, artifacts/soak-chain-8-3600.log.

## 2026-10-30 visual options, jitter weight and browser campaign harness

- LIVE b8f39c88 Render dep-dbi2aedg1s2s73dph3h0 finished 05:04:52 UTC. Public smoke 41005901206 rerun PASS, job 123902529902.
- Diagnostics CI c1879f8b / 41006497341 passed npm/adversarial/Firefox/WebKit, then failed jitter release because the test moved the survivor left but left a real crate on the plate. Driver now pushes all weights past the plate before measuring expiry. Three local repeats PASS, artifacts/jitter-weight-release-1/2/3.log. Failed revision not deployed.
- ART-08: saved motion (device/reduced/full) and decorative effects options. Reduced motion removes sliding panels/background motion and blinking invulnerability; critical actors/warnings/timers remain. Fewer effects draws 25 decorative drones instead of 100 and omits debris. Fixed blanket reduced-motion CSS prematurely completing the tragic blackout; ending timeline stays eight seconds. Local npm/option validation PASS, artifacts/visual-options-test.log. Browser persistence/timeline checks pending; physical high-contrast review pending.
- QA-005: added full Chromium 2/3/4-context campaign workflow using actual UI/keyboard and passive WebSocket observation. No state injection. Screenshots and partial state retained on failure. Execution pending.
- Latest two-client chain run PASS all 15/default stories, 787 seconds (34841 complete). Four-client chain run passed 1-13 then failed 14 after stepping-stone/pit losses and blast (29013 complete). Controller now presses jump shortly before landing on narrow stones, exercising the ordinary six-tick buffer; focused Level 14 test active (61726). Test-controller change, not altered game difficulty.

## 2026-10-30 SYS-02 rule tables and gap-band correction

- New explicit table tests exposed a design mismatch: gap scaling grouped 1-2 players instead of the documented 2-3 / 4-5 bands. Changed the band calculation to ceiling division. First tutorial jump deliberately remains 34 units for all supported parties; later selected gaps scale. Initial 60-route check with a widened teaching jump failed the four-player tutorial, so preserving the intended short teaching jump was necessary.
- Full npm test PASS after correction, including all 60 routes and actual-client tutorial. artifacts/gap-band-test-2.log. Seeded adversarial PASS 120 scenarios/197442 ticks, artifacts/gap-band-adversarial.log. Original failure logs retained.
- SYS-02 tables cover every heart range boundary, gap bands/cap, region edges, zero/one/multiple-dead checkpoint recovery, oldest-dead-first and original-party full-level reset after departure. Mutation test intentionally changes solo hearts to four in an isolated artifacts copy and confirms a nonzero assertion at heart boundary 1; production source remains unchanged by the mutation script.
- SYS-01 package check PASS: fresh source extraction without node_modules executes npm test; multiplayer explicitly skipped without dependencies. artifacts/release-verify-0516.log, 82 allowlisted files, ZIP SHA256 f15f6b73bd5d62da188e7dbaec2603b994f8cb7aeea4527492de12f4f9c4a48b. This archive predates the gap correction and will be refreshed.
- 25bb00cf CI 41007426323: Chromium campaign/report-download/visual-option checks PASS (job 123905381786); Firefox PASS. WebKit failed an initial fixed 250ms movement assertion; changed it to focus/click and wait for observed movement, as already done for the other stages. No deployment of this failed bundle.
- QA-004 full solo browser campaign added via a debug-only detached snapshot reader. Inputs remain real keyboard/UI; snapshot mutations cannot affect the game. Browser matrix now includes 1/2/3/4. Prior co-op browser jobs on 25bb00cf remain active, run 41007426199.

## 2026-10-30 SYS audit and scoped verified tasks

Evidence: local npm test artifacts/gap-band-test-2.log; clean extraction artifacts/release-verify-0516.log; isolated mutation script; b8f39c88 CI 41005901150/public smoke 41005901206 job 123902529902; 25bb00cf Chromium job 123905381786 and previous successful three-engine runs. No physical-device claim.

- SYS-01 VERIFIED: npm core/rules/systems/routes/HTTP/board/client checks run in fresh extraction without dependencies. Multiplayer explicitly skips there; installed-dependency CI runs real server checks. Deliberately wrong assertions return nonzero.
- SYS-02 VERIFIED: explicit tables/mutation evidence above covers hearts, gap bands, region boundaries, recovery order and reset.
- SYS-03 VERIFIED: clean Chromium 156.0.8078.4, Firefox 157.0 and WebKit 27.2 sessions validate menu/canvas, selected stages/inputs, versions and no console/page errors. Current WebKit fixed-delay issue is logged separately; this task verifies repeatable automation exists and has run.
- COOP-04 VERIFIED: multiplayer-test concurrent E activation changes objective once; distant/unowned requests cannot activate. Both clients agree on bridge, relay, exit and victory. Local/CI/public passes.
- LIFE-03 VERIFIED: rules/system tables exercise zero/one/three dead, oldest-first revival, one benefit only, no duplicate checkpoint benefit and full-cap protection.
- LIFE-04 VERIFIED: table resets after departure preserve original-party cap and revive remaining players. Full actual-client sequences assert full hearts/all alive after stage transitions with multiple deaths.
- EXTRA-02 VERIFIED: storage version/range/corruption/blocked-storage tests pass; Chromium/Firefox/WebKit reload/resume starts at entry with full hearts. Save remains local and stage-only.
- UI-001 VERIFIED: native HTML text for HUD/title/story/pause/results/controls. Desktop and 390px screenshots inspected, including comic-review.jpg; co-op victory/next-stage/no-error checks pass. Physical mobile rendering is a separate pending gate.

## 2026-10-30 full browser results and survivor frames

- Full browser run 41007426199: two isolated Chromium contexts completed all 15 stages and timed stories (job 123905381468). Three contexts completed stages 1-8 then lost all hearts to capture in 9; four completed 1-13 then lost all hearts in 14. These are recorded controller losses, not evidence of a softlock or full three/four-player clearance. New matrix on 408dfc84 includes solo and ordinary struggle inputs.
- 408dfc84 CI 41008565964: npm/adversarial/jitter/live campaign and Firefox/WebKit PASS. Chromium short tutorial stopped at x509, the relocated shelter exit step at x521. Test now explicitly jumps that step; gameplay geometry unchanged.
- ART-01: cached original 2080x160 survivor sheet, 13 poses, four frames and four palettes. Added breathing, throw follow-through, airborne carry/throw and slower invulnerability flash. Local syntax/systems PASS; browser tile containment/frame differences and visual inspection pending.
- Practice guide refreshed for deployed service, invitations/readiness, spectator controls, preferences and optional stage reports.

## 2026-10-30 full co-op browser clear and touch recovery

- 408dfc84 full browser run 41008565895 PASS at 2/3/4 independent Chromium 156.0.8078.4 contexts: jobs 123908986326 / 123908986624 / 123908986592. Each completed all 15 stages, shared hearts/victories, fresh-stage revival and timed after5/after10/after15 default story. Actual keyboard/UI only, passive snapshots; no state injection. Solo job remains active.
- 7e8d4c0a browser job 123912128884 passed cached-sheet tile containment and frame variation checks. Export artifacts/sheet-review.png inspected: crisp separate four-palette frames, no tile bleed. The short tutorial driver then walked into a raised stepping stone on the widened second pit; added an ordinary jump. Full campaign drivers already passed this route.
- CORE-01 review found game-over recovery depended on keyboard R/Enter. Added visible Retry stage and Return to title controls for game-over/pause, and title return at ending. Guest retry stays disabled until host acts. npm test PASS, artifacts/flow-controls-test.log. New separate browser-flow job repeats opening, three pit deaths, retry, two tutorial victories/replay and title return twice without reload, including 390px layout. Browser execution pending.

## 2026-10-30 QA-004 verified full solo browser campaign

- Command: TEST_PARTY=1 node scripts/browser-campaign-test.mjs in GitHub Actions Ubuntu/Chromium 156.0.8078.4, 408dfc84, run 41008565895, job 123908986500. PASS opening at default timing, all 15 stages, after5/after10/after15 and default ending; zero console/page errors. Started 05:28:12, ending 05:43:36 UTC. Level 6 used a normal heart/retry and completed; no softlock. Inputs were real keyboard/UI with read-only detached debug snapshots, no authority mutation. QA-004 VERIFIED. All four matrix jobs now PASS.
- Targeted browser rescue test added to distinguish capture, teammate jump release, unchanged hearts and robot recovery in two independent contexts. Execution pending.

## 2026-10-30 CORE-01 / LIFE-08 verified

- CORE-01: node scripts/browser-flow-test.mjs, Ubuntu/Chromium 156.0.8078.4, 506d80bf run 41010015167 job 123913551627 PASS two opening/game-over/retry/victory/replay/title cycles, one navigation total, zero console/page errors. Second cycle 390px; controls fit frame. Repeat 15d45dee job 123914456680 PASS; artifacts/flow-mobile.jpg inspected with readable retry/title buttons. CORE-01 VERIFIED.
- LIFE-08: npm test stage-report tests and 506d80bf main Chromium job 123913551383 PASS actual pit death, own-room report download, detached snapshot immutability, shelter revival event, camera/spectator return. All three browser engines PASS run 41010015167. LIFE-08 VERIFIED. Reports remain optional, bounded and never auto-uploaded.
- Targeted rescue first attempt failed its test observer at lobby join: initial packets can use HTTP polling before WebSocket upgrade, though both clients joined on server. Wait for native lobby UI before observing periodic gameplay WebSocket states. No game change for this correction.
- Art follow-up: added carry-run/throw-run to preserve moving legs, 15-pose cached sheet; separated overlapping player-number labels; water ripples and conveyor treads/arrows respect reduced decorative motion. Syntax PASS; updated browser fixtures pending.

## 2026-10-30 LIFE-06 functional shelter ladder

- Replaced decorative-only ladder with an authoritative E/Interact climb at the shelter center. Sideways movement cancels safely below the hatch; roof arrival restores standing. Carried/grabbed/dead actors cannot initiate it, climbing survivors cannot be picked up, disconnect/death clears climbing, and giant breach removes the route. A crate blocking the hatch rejects ascent without embedding the survivor and leaves ground exits available. Added original climb frames and clear native/visual cues.
- node scripts/systems-test.mjs PASS: every authored shelter roof reached, both roof exits, cancellation, invalid entry, blocked crate hatch, ownership release and giant breach. artifacts/ladder-all-shelters.log. npm test PASS initial ladder bundle, artifacts/ladder-test.log; final CI pending. Browser scenario now climbs after actual checkpoint revival and checks peer-visible roof position. Full browser matrix triggers for physics/simulation/world changes.

## 2026-10-30 QA-005 verified and one-hour soak

- QA-005 VERIFIED: full 2/3/4 independent-context campaigns on 408dfc84, run 41008565895 jobs 123908986326/123908986624/123908986592; all 15/default stories. Targeted node scripts/browser-rescue-test.mjs on aaf05175, Chromium 156.0.8078.4, job 123916811942 PASS capture, jump rescue, unchanged shared hearts and recovered robot. Main browser job 123916812273 PASS pit death, checkpoint revival, spectator recovery and shared stage transition. Separate contexts, no state injection. Run 41011064436 all five jobs PASS (campaign, flow, rescue, Firefox, WebKit).
- One-hour local soak PASS: SOAK_SECONDS=3600 SOAK_ROOMS=8 node scripts/soak-test.mjs, 32 clients, 265080 checks, 688 resets, 2340500 messages and 12242836663 decoded payload bytes, elapsed 3602.892 seconds, all rooms removed. Peak server RSS 195.04 MiB; final heap used 34.58 MiB. artifacts/soak-8-3600.json. Source predates latest ladder and gap/options changes; this is local stability evidence, not Render capacity.
- Render deployment aaf05175 started 06:00:10 UTC, dep-dbi34qm1egvs73ep4cvg, My Workspace. Live/public confirmation pending. Ladder changes remain a separate next bundle.

## 2026-10-30 NET-06 / COOP-05 verified

- NET-06: node scripts/disconnect-test.mjs PASS on local Windows/Node 24.20.0, artifacts/disconnect-test.log, actual Socket.IO clients without authority mutation. Host disconnect during jump transfers host; guest disconnect while dead, at checkpoint, during Level 1-to-2 transition and during actual capture clears membership/ownership without extra heart cost. Original two-player cap remains four. A fresh connection has no prior identity, cannot join a started room, and creates an isolated new lobby. All rooms clean up. Existing network-client-test.mjs verifies client-side disconnect/late-packet cleanup. NET-06 VERIFIED; CI command added.
- COOP-05: npm run test:systems covers capture expiry once, real jump rescue, capped struggle, ordinary jump cannot stun, robot recovery/recapture and disconnect clearing grab ownership. Chromium 156 targeted rescue job 123916811942 PASS with two independent contexts and unchanged hearts. The actual capture-disconnect case above passes. COOP-05 VERIFIED. No robot health/damage/farming path added.
- Public smoke rerun 41007426371 job 123918806525 PASS against LIVE aaf05175, deployed 06:01:20 UTC by dep-dbi34qm1egvs73ep4cvg. Test source was 25bb00cf; checks are compatible with current live assets/protocol.
- 6d3e72f9 ladder regression 41011665456 all five jobs PASS (main Chromium 123918687695, flow 123918687537, rescue 123918687794, Firefox 123918687764, WebKit 123918687732). Ladder peer-visible roof position and 16-pose tile checks pass. artifacts/ladder-review.jpg inspected; full campaign matrix 41011665464 remains active.
- Submission README now matches 427-character 15-stage description and existing cover; corrected literal 2?4 typo. check:submission intentionally reports only deferred external playtest/evidence and human review. No submission performed.

## 2026-10-30 ladder campaign follow-up

- 6d3e72f9 full matrix 41011665464: two-client job 123918687445 and four-client job 123918687712 PASS all 15/default stories. Three-client job 123918687706 passed 1-13, then lost remaining hearts in Level 14 pit at x1930-1984; last fallen player x1981.38, y178.32, no climbing state. This is a recorded controller loss, not a demonstrated ladder regression or softlock. Solo still active.
- Full browser harness now records game-over snapshots/screenshots and can use the real host Retry stage button at most twice across the entire campaign. Every retry validates shared full hearts/all survivors. No retries for timeouts, unknown phases or console errors; failures remain in result/partial reports. This exercises supported recovery instead of requiring a deathless campaign. No gameplay difficulty or physics change. New run pending.

## 2026-10-30 movement cadence and accessible presentation checks

- Added browser-cadence-test.mjs: real keyboard movement/jump path with emulated requestAnimationFrame callback rates 30/60/120; checks elapsed movement, jump apex, held-jump landing without auto-repeat and second press. Explicitly not physical refresh-rate certification. CI execution pending. Existing pure fixed-step tests cover 1/5/30/60/120 Hz exactly.
- Added sound-off, reduced-motion and forced-colors Chromium scenario at 390px. Native Enter activates story buttons; captions remain at least 14px, comic reveal motion is disabled and no horizontal overflow. Screenshot review pending.
- Shelter crowding unit scenarios PASS for ground sentinels and overhead scanner, both left/right roof escapes, no heart loss and sheltered teammate remains protected. artifacts/shelter-crowding-test.log. Gameplay source unchanged by these new checks.

## 2026-10-30 accessibility review and wait correction

- bdb3860d main Chromium job 123925308319 PASS forced-colors/reduced-motion/sound-off/native-keyboard story checks. artifacts/access-review.jpg inspected: clear black/white native captions, visible focus outline, original images and no horizontal overflow at 390px. This is emulated forced-color rendering, not a physical-display certification.
- Cadence job 123925308227 failed immediately with only six units of movement: its asynchronous wait predicate returned a Promise instead of polling the tick condition. Replaced it with an imported read-only snapshot function and synchronous predicate. The same pattern existed in the ladder peer wait; earlier own-client roof assertion was valid, but peer-position waiting was not yet proven. Corrected and rerun pending; do not treat earlier peer wait as verified evidence.
- Added solo pause mid-jump assertions for frozen tick, height and giant/wake timer; online Escape during capture must keep the shared countdown running. Online input release is deliberately not a global pause.
- Level 15 now draws the actual central core interaction location as a locked/available terminal with three progress lights. Colossus warning/attack/stunned poses are distinct; pylons stay in front of background machinery. Encounter timing/collision/rules unchanged. Browser visual fixture pending.

## 2026-10-30 CORE-02 / LIFE-06 verification and current release

- CORE-02 VERIFIED: npm test physics/system checks plus node scripts/browser-cadence-test.mjs on Ubuntu/Chromium 156.0.8078.4, 8e54252c run 41014693950 flow job 123928251384 PASS. Emulated 30/60/120 callback rates each moved 78.99786138 units over 60 simulation ticks; apex 75.40/75.32/75.40. Held jump lands without repeating; fresh press jumps. This is browser callback emulation, not physical monitor certification.
- LIFE-06 VERIFIED: node scripts/systems-test.mjs all authored shelter ladders, roof/ground exits, both-direction sentinel/scanner crowding, blocked hatch, cancellation and breach PASS. Main Chromium job 123928251198 PASS own roof arrival and corrected synchronous peer-position wait. artifacts/ladder-latest.jpg captured. Earlier asynchronous-wait limitation is superseded by this result.
- 8e54252c regression 41014693950 all five jobs PASS: main 123928251198, flow/cadence 123928251384, rescue 123928251006, Firefox 123928251268, WebKit 123928251199. Solo jump pause freezes tick/height/pursuer timer; online Escape during capture leaves shared countdown running. Disconnect/jitter/adversarial and live Level 15 checks pass.
- 6b9816bb full browser matrix 41013264131 all four jobs PASS: solo 123923702930, two 123923703110, three 123923703119, four 123923703104. All 15 levels/default stories; no game-over replay in any run. Solo Level 6 used a heart and took 151 seconds; normal recovery remains part of the evidence. Previous failed run retained above.
- Inspected artifacts/core-latest.jpg and sheet-latest.png: floor core location/CORE E and progress are visible; crisp separate 16-pose/four-palette survivor frames. Screenshot fixture is visual evidence only; live Level 15 test covers actual three-cycle objective.
- LIVE 8e54252c2360960206d89bdb1b9d9cbbdef8538f, Render My Workspace dep-dbi3mrifngtc73c731o0, finished 06:39:31 UTC. Added public-browser workflow to run HTTP, actual WSS and independent-browser regression against deployed service; execution pending. Physical-device/network acceptance still deferred.

## 2026-10-30 ART-01 robot frame upgrade

- Added an original cached robot sheet with four machine silhouettes and six state poses/four frame slots. Read-only pose selection preserves every attack/capture/stun timer and collision. Warning geometry and countdown text remain visible; reduced decorative motion freezes frame cycling while state changes still show distinct poses.
- npm test PASS locally, artifacts/robot-frames-test.log; node --check public/js/robot-art.js PASS. Browser frame containment, patrol animation and phase distinction checks added; exported contact-sheet review pending. ART-01 remains IN_PROGRESS.

## 2026-10-30 last-survivor route audit and public ladder follow-up

- node scripts/last-survivor-test.mjs PASS on local Windows/Node 24: all 15 unchanged maps at original party sizes 2/3/4, only the last slot connected. 45 full routes, no teleport, removed hazard, gap shrink or heart refill. Original geometry/cap assertions pass. artifacts/last-survivor-test.log. Added npm test:survivor to the regular suite and documented fallback route solutions in docs/CAMPAIGN_BUILD.md. This covers LIFE-05/LVL-07 automated single-survivor evidence; human balance review remains separate.
- Public browser run 41015527881 on test source 670e1c4b/live 8e54252c: HTTPS/assets and actual WSS regression PASS, including cleanup of only its own rooms. Browser reached shelter scenario but timed out waiting for roof at line 301. Added short alignment pulses and a settled-position assertion for the narrow E hatch under remote input latency; failure now prints observed room state. Cause is not yet proven; public browser remains unverified pending rerun. No production rules changed.

## 2026-10-30 QA-009 verified and robot review

- QA-009 VERIFIED: node scripts/abuse-test.mjs on local Windows/Node 24 PASS (artifacts/abuse-test.log). Separate ephemeral server: ninth create rejected after eight replacements, one current lobby/no leaks; 100 ready actions bounded to at most 20 callbacks; 121st input rejected after 120 neutral inputs; next-window legal input works. A 5KB packet disconnects only its sender, preserves host hearts and another room. Malformed/null/type-confused input and invented death/setState events cannot set position/hearts/phase. Cleanup leaves zero rooms. Existing multiplayer suite independently covers invalid codes, capacity and forged values. No production abuse traffic.
- 5b0bb60f robot-frame CI 41015898693 all five jobs PASS. Main Chromium job 123932037768 passes cached-sheet boundaries, patrol variation and distinct warning/attack/stunned/recovery checks for all four silhouettes. artifacts/robot-review.png inspected: hooked arms, shields, hanging scan lens and low tracked bomber are separate and crisp. Three engines render without errors; actual capture/rescue and tutorial loops still pass. Gameplay rules unchanged. ART-01 playback review remains open.

## 2026-10-30 CORE-05 mixed-input release correction

- Code review found online Escape cleared keyboard state but left a held touch direction active; the next heartbeat could resume movement after the INPUT RELEASED message. Escape now clears touch movement/jump and queued key presses, matching the on-screen release button. Added an actual CDP touch held while pressing Escape in an online room; verifies movement stops and shared play continues. Browser execution pending. Physical touchscreen hardware is not claimed.
- Added bounded ADVERSARIAL_SEEDS/ADVERSARIAL_TICKS overrides for longer seeded fuzz runs; default CI remains 120 scenarios. Extended 1200-scenario/7200-tick run active locally, artifacts/adversarial-1200-7200.log.

- Extended run completed PASS: 1200 seeded cases / 5,074,324 simulation ticks, valid carry/capture ownership, finite positions, bounded hearts and unique fatal events. npm test also PASS after mixed-input correction, artifacts/mixed-input-test.log.
- Public browser rerun 41017210822 job 123936155668 failed earlier at the short driver's relay wait (line 270), so it did not verify the ladder alignment correction. Added settled alignment at the relay and failure position diagnostics. Full public campaigns 41017210764 are running on live 1f92e662; hold deployment until those rooms finish.

## 2026-10-30 SYS-04 evidence audit

Audited all 28 previously checked tasks against their dated PASS records. The index below names the command/procedure and supporting result; it does not upgrade deferred physical/human acceptance. Failed runs remain preserved. SYS-04 VERIFIED after this audit and npm run verify:board. Future verified tasks must add dated evidence.

| Task | Date | Procedure and PASS evidence |
| --- | --- | --- |
| MVP-01 | 2026-10-28 | Two fresh-load Chrome 156.0.8078.49 keyboard/click victories, replay/title and console inspection; detailed MVP-01 browser acceptance above. |
| MVP-02 | 2026-10-28 | Two independent Chrome sessions, shared relay/bridge/victory/replay, invalid code and second-room isolation; detailed MVP-02 acceptance above. |
| UI-001 | 2026-10-30 | node scripts/browser-test.mjs; desktop/narrow native captions/HUD inspected, 8e54252c job 123928251198. |
| QA-001 | 2026-10-30 | npm run check in npm test, artifacts/mixed-input-test.log. |
| QA-002 | 2026-10-30 | npm run smoke in npm test; HTTP/modules/11 bundled image assets/404 PASS, same log. |
| QA-003 | 2026-10-30 | node --check on all 45 JS/MJS files under public/js, server and scripts; exit 0. |
| SYS-01 | 2026-10-30 | python scripts/package-release.py --verify; 94-file clean extraction without node_modules PASS, artifacts/release-verify-0708.log. Multiplayer explicitly skipped without dependencies. |
| SYS-02 | 2026-10-30 | npm run test:rules and isolated rules-mutation-test.mjs; explicit boundaries PASS and intentionally wrong solo heart value fails. |
| SYS-03 | 2026-10-30 | Browser harness/compatibility scripts on clean Chromium 156, Firefox 157 and WebKit 27.2; 8e54252c run 41014693950 all five jobs PASS. |
| CORE-01 | 2026-10-30 | browser-flow-test.mjs two opening/death/retry/victory/replay/title loops; jobs 123913551627 and 123928251384 PASS. |
| CORE-02 | 2026-10-30 | npm test collision/fixed-step checks plus browser-cadence-test.mjs; job 123928251384 emulated 30/60/120 callback rates PASS. |
| NET-01 | 2026-10-30 | multiplayer-test.mjs four clients/fifth rejection, invalid code, room isolation and host transfer; local/current public WSS PASS. |
| NET-02 | 2026-10-30 | multiplayer-test.mjs ready/start-once plus browser-test.mjs two/four-context ready flow; run 41014693950 PASS. |
| NET-03 | 2026-10-30 | multiplayer-test.mjs forged/null intentions and abuse-test.mjs state injection; artifacts/mixed-input-test.log and abuse-test.log PASS. |
| NET-05 | 2026-10-30 | multiplayer-test.mjs one actual death charge despite invented reports; rules/system deduplication PASS in npm test. |
| NET-06 | 2026-10-30 | disconnect-test.mjs jump/capture/death/checkpoint/transition, cleanup/new identity; artifacts/disconnect-test.log and job 123928251198 PASS. |
| NET-08 | 2026-10-30 | multiplayer-test.mjs separate rooms/cleanup plus abuse-test.mjs isolated oversized sender; local/public WSS PASS. |
| COOP-04 | 2026-10-30 | multiplayer-test.mjs simultaneous E, range rejection and one shared bridge transition; local/public PASS. |
| COOP-05 | 2026-10-30 | systems-test.mjs expiry/cap/no-free-stun, disconnect-test.mjs and browser-rescue-test.mjs; jobs 123916811942 / 123928251006 PASS. |
| LIFE-02 | 2026-10-30 | rules-test.mjs explicit every-range heart table and campaign-test.mjs counts 1-16 PASS. |
| LIFE-03 | 2026-10-30 | rules-test.mjs and systems-test.mjs zero/one/multiple dead, oldest-first, one benefit and cap PASS. |
| LIFE-04 | 2026-10-30 | rules-test.mjs original-party reset plus full browser matrix 41013264131 stage revival/hearts PASS. |
| LIFE-06 | 2026-10-30 | systems-test.mjs every ladder/crowded exits/blocked hatch/breach; browser own/peer roof assertion job 123928251198 PASS. Public short-driver timing failures remain separate and unresolved. |
| LIFE-08 | 2026-10-30 | systems-test.mjs report isolation and browser-test.mjs actual pit death/download/revival/spectator return; job 123913551383 PASS. |
| QA-004 | 2026-10-30 | TEST_PARTY=1 browser-campaign-test.mjs opening/all 15/default ending; jobs 123908986500 and 123923702930 PASS. |
| QA-005 | 2026-10-30 | TEST_PARTY=2/3/4 browser-campaign-test.mjs all 15/default stories plus targeted actual rescue/revival; run 41013264131 PASS. |
| QA-009 | 2026-10-30 | abuse-test.mjs rate/size/creation limits and malformed isolation; artifacts/abuse-test.log PASS, exact cases above. |
| EXTRA-02 | 2026-10-30 | check-project.mjs invalid/blocked storage, browser/compatibility reload-resume full hearts; run 41014693950 PASS. |

Fresh archive SHA256 e3f8a38c0d756800972ef7a829582e0f0cc73453116cb33310271d69b451d334. This snapshot predates later handoff/test updates and will be refreshed before cutoff.

## 2026-10-30 QA-008 renderer profiling started

Added browser-performance-test.mjs: 240 measured native-canvas frames after warmup for Levels 10/12/14/15, four survivors, full/reduced effects, forced raster readback, renderer median/p95 and actual requestAnimationFrame intervals. Working target is a 60fps desktop presentation; CI rejects a renderer p95 over the 30fps CPU floor (33.34ms). This measures a headless CI runner, not representative physical hardware or full GPU presentation. Profile execution pending; QA-008 remains IN_PROGRESS.

## 2026-10-30 public campaign, renderer and same-tick enemy results

- Public two-player campaign PASS: test source 6e1a7fbf, live 1f92e662, run 41017210764 job 123936155114, Chromium 156.0.8078.4, 06:58:55-07:12:17 UTC. Actual UI/keyboard over HTTPS/WSS, all 15/default stories, no game-over replay, some ordinary heart losses. Own room removal confirmed without asserting other rooms are empty. Four-player job still running. This is external CI, not physical-device acceptance.
- Local full matrix 41017210744 on 6e1a7fbf PASS: solo 123936154754, two 123936155123, three 123936155090, four 123936155011. Current mixed-touch fix CI 41017800136 all five jobs PASS; main 123937976842 verifies held CDP touch plus online Escape stops movement without pausing.
- 3db30242 regression 41019299273 all five jobs PASS. Main 123942713208 also proves ladder starts below roof after the revived teammate clears the hatch, then own/peer roof arrival. Flow/performance 123942712830: eight profiles at 240 measured frames each, native renderer median 0.3-0.4ms, p95 0.4-0.6ms; RAF median 16.7ms/p95 16.7-16.8ms. Post-GC JS heap 1,827,115 bytes in the isolated renderer fixture. Not whole-browser memory or physical hardware certification.
- Focused ENEMY-01/COOP-05 edge case reproduced before fix: first sentinel kills a teammate; later grabber incorrectly uses the stale two-alive list and captures the last survivor. artifacts/same-tick-enemy-before.log FAIL. Recompute the living/non-carried list per robot so later machines see earlier deaths. Also prevents an overlapping test robot from assigning a grab to a dead body. First post-fix assertion distinguished undefined from null for an absent capture; corrected that assertion without altering behavior.
- npm test PASS after fix (artifacts/same-tick-enemy-fixed.log), including 60 normal routes and 45 last-survivor routes. Extended 1200/7200 seeded run PASS, 5,074,324 ticks, artifacts/adversarial-same-tick-1200.log. Browser/full-matrix rerun pending before deployment.
- Added browser-giant-test.mjs: actual approach, pause under pursuer pressure, one-heart contact and shelter roof/step breach, using keyboard plus detached observations. No state injection. Execution and screenshot review pending; LIFE-07 remains unverified.

## 2026-10-30 public four-player clear and optional archive

- Public four-player job 123936155451 PASS all 15/default stories and own-room cleanup at 07:28:11 UTC, run 41017210764, test 6e1a7fbf/live 1f92e662. No game-over replay logged. Both public matrix jobs passed; deployment hold for those test rooms is lifted.
- 83ad57c5 regression 41020124562 main/flow/Firefox/WebKit PASS. Rescue interaction passed, but the new giant test timed out before shelter breach. Its 35-second wait incorrectly assumed the normal-map walking speed; the tutorial is intentionally calibrated to its own 120-second crossing. Replaced fixed breach timeout with actual remaining distance/speed/wake time plus margin. First approach/pause/one-heart contact assertions already passed. No game timing changed. Full matrix 41020124535 still active.
- EXTRA-03: fourteen unique original memory fragments and a local native-text archive implemented. Shared world read adds the fragment for each current teammate; archive survives replay/reload when storage works, remains session-only with an explicit save failure message otherwise. No required objective or ending changes. npm test PASS, artifacts/memory-archive-test.log; corruption/type/range/deduplication/blocked-storage tests pass. Actual two-context terminal discovery/reload/isolation harness added; browser execution pending.

## 2026-10-30 giant, archive and pause verification (07:50 UTC)

- b724817d regression 41021033996 all five jobs PASS: main 123948158583, flow 123948158339, Firefox 123948158358, WebKit 123948158390 and rescue/giant/memory 123948158430. Chromium 156.0.8078.4. Preceding full gameplay matrix 41020124535 on 83ad57c5 PASS at 1/2/3/4 (jobs 123945295058/123945295132/123945295111/123945294817).
- LIFE-07 VERIFIED: node scripts/browser-giant-test.mjs in job 123948158430 PASS actual keyboard approach, pause freezing tick/position, instant contact spending exactly one heart, actual shelter approach and destruction of roof/steps, and one fatal event inside the shelter. Detached observations only, no state mutation. systems-test.mjs passes contact despite invulnerability and boss exclusion. artifacts/giant-review.jpg and breach-review.jpg inspected: giant readable, shelter roof gone, survivor in camera.
- EXTRA-03 VERIFIED: node scripts/browser-memory-test.mjs in that job PASS two independent contexts reaching Level 2 terminal via inputs, shared discovery, archive count/text, reload persistence and unrelated fresh-browser isolation. check-project.mjs validates fourteen distinct fragments, corrupt/type/range/duplicate saves and blocked storage; npm test PASS artifacts/memory-archive-test.log. artifacts/memory-review.jpg inspected: native text readable, save status explicit. Full campaigns pass without optional terminals; ending/objectives unchanged.
- CORE-05 VERIFIED: repeated retry/title transitions and listener/state safeguards PASS browser flow; main browser solo mid-jump pause freezes height/tick/pursuer wake, resume clears input. Giant test above pauses under actual pressure. Online capture check intentionally keeps shared countdown running after Escape; actual held-touch Escape stops local input (123948158583 and 123937976842). No global online pause is promised.
- LIFE-05 / LVL-07 VERIFIED: node scripts/last-survivor-test.mjs PASS 45 original 2/3/4-player maps with last slot connected, preserving gaps/cap; ordinary inputs, no teleport/hazard removal/heart refill. npm test PASS 60 full party-size routes and systems stacking/throw/block checks. Fallback solutions per stage in docs/CAMPAIGN_BUILD.md. Full 1/2/3/4 browser matrix above PASS. Human difficulty/onboarding remains open.
- Current 1800x1200 cover from main job 123948158583 inspected: two survivors, clear HUD/relay/bridge and archive. Replaces older cover without image manipulation. Physical-device review and human submission remain deferred.

- b724817d full browser matrix 41021034139 PASS all four: solo 123948158860, two 123948159018, three 123948159009, four 123948158941. Three-player run had recorded game overs/replays on Levels 3 and 15 (pit deaths), then completed. Other runs used one attempt per stage. No loss omitted or state repaired by harness. Render dep-dbi4pejbc2fs73a425rg LIVE b724817d at 07:53:21 UTC.
- Added exact default caption-order and final visible-blackout assertions to full campaigns. New snapshot-audit.mjs compares complete shared payload hashes across peers, excluding only recipient-specific you/playerId, distinguishing ordered broadcasts within the same tick. Self-check PASS recipient difference accepted and injected shared-world difference detected. Require over 100 matching snapshots per stage; full local/public executions pending. No production protocol changes.

## 2026-10-30 public browser and reduced-motion correction (08:01 UTC)

- Public browser run 41022949675/job 123954301255 PASS, test 116ade47/live b724817d, 07:54-07:56 UTC. HTTPS/assets and actual WSS multiplayer PASS; Chromium browser saved audio, all 15 stage loads/movement, independent co-op relay/victory/next-stage, settled shelter ladder, actual touch and clean console PASS. Own test rooms removed; unrelated rooms preserved. Earlier public relay/ladder positioning failures are superseded by this result. Physical mobile/device acceptance remains pending.
- 116ade47 regression 41022949850 all five PASS. npm test after caption/snapshot changes PASS, artifacts/caption-snapshot-test.log. Snapshot/caption full matrices remain active; public campaign 41022949874 owns active rooms, do not deploy during them.
- Source inspection found reduced motion stopped scenery/comic movement but still cycled robot/survivor/giant decorative frames. Pass a frozen decorative clock, retain semantic pose changes and stop salvage particles under reduced motion. Added renderer pixel comparison: unchanged state is identical across clocks in reduced mode, full mode differs, and warning-state changes still differ. npm test PASS artifacts/reduced-sprite-test.log; browser pixel check pending. No simulation/timing/collision change.
- Added actual-input sentinel/scanner/bomber browser approach/warning/death checks, scripts/browser-hazards-test.mjs. Harness execution pending. It must observe a visible native warning before lethal phase and exactly one heart/death event; no production state injection.

- First hazard run 41023271657/job 123955348912 failed its native-text wait: the harness read the online-only objective-status element during solo practice. Corrected to tactical-status, the actual solo/shared warning below the canvas, with a short timeout. No game warning changed. Rescue, giant and memory checks preceding it passed.
- Focus-loss audit found keys cleared but justPressed retained an E queued before the next frame. Blur now clears both; online Release input clears the queue consistently. Browser check dispatches E and blur in one event-loop task beside an actual reachable crate, verifies no pickup, then normal F still works. npm test PASS artifacts/blur-queue-test.log; browser regression pending.
- npm run test:systems PASS artifacts/enemy-patrol-tells-test.log. All authored enemy patrols observed for 1200 ticks each, within solid-floor bounds and outside shelter/covered/boss zones; identities retained. Sentinel/scanner/bomber each complete 90/90/120 warning ticks before lethal attack, spend one heart, do not create capture states and recover without dying. Isolated unit fixtures, not browser evidence.

## 2026-10-30 campaign acceptance 08:15

- CAMP-01, LVL-01, LVL-03, LVL-05 and ART-06 VERIFIED. Chromium 156.0.8078.4 full matrix 41022949707 on 116ade47 PASS: solo 123954301163, two 123954301232, three 123954300899, four 123954301245. All 15 stages/default stories; co-op runs needed no game-over replay. Individual stage loads/movement pass main regression. npm test verifies authored layouts, width ratios, 120-second normal pursuit, boss exclusion, party-scaled gaps, 60 routes and 45 one-survivor routes. Real-client live-campaign checks complete Level 15 and three background core cycles. Physical-device/onboarding/difficulty acceptance remains distinct and unverified.
- Exact caption order PASS at chapters 5/10/15 for every context; solo opening order also PASS. Default final celebration/ambush visibly reaches brightness(0) before ending. Shared full snapshots matched 14,776/15,315/16,994 broadcasts at 2/3/4 (minimum 265/294/327 in any stage). This compares world, platforms, switches, checkpoints, enemies, hearts and participants, excluding only recipient identity/self fields.
- Public two-player current run 41022949874/job 123954302501 PASS test 116ade47/live b724817d: 14,968 matching broadcasts, all 15 and exact caption/blackout order, no replay, own-room cleanup. Four-player still active; deployment hold remains.
- Hazard browser job 123957096032 on 6121f420 PASS sentinel Level 4, scanner Level 7, bomber Level 12: observed warning 90/90/119 remaining ticks, lethal phase after 91/90/119 ticks, one heart/death each. Native warnings visible before attack, no post-hit capture. artifacts/sentinel-review.jpg, scanner-review.jpg and creeper-review.jpg inspected: strike strip, outlined scan column and blast-radius strip legible. Same run 41023816496 all five jobs PASS. d6810106 run 41024367049 all five PASS, including reduced-motion pixels and queued-blur regression.
- Two-hour local soak PASS, session 1244, artifacts/soak-8-7200.json: 7202.87 seconds, eight rooms/32 clients, 530048 checks, 383 resets, 4686804 messages, 26027104374 decoded bytes, peak RSS 190.80 MiB, final heap 16,727,000 bytes, zero remaining rooms. Ladder-source stability, not Render capacity. New one-hour soak session 67695 started about 08:08 UTC on d6810106 server/simulation; artifacts/soak-latest-8-3600.log, expected 09:08 UTC.
- Further input reset now covers stage loads, title, network run/phase changes and disconnect, preventing prior held keys/touch from carrying into a fresh run. Actual browser server-restart harness added: stop only its own local child, clear two clients, reject old room, recreate with fresh identities and cleanup. npm test PASS artifacts/input-boundaries-test.log; browser execution pending.
- Duplicate Continue inspection found nextLevel accepted in both victory and cutscene, allowing two queued messages to collapse a chapter. Split host-only nextLevel (victory) and skipStory (cutscene); guard the victory button path locally. Real-client Level 15 duplicate-Continue/guest-Skip/duplicate-Skip checks and network-client intent checks added; results pending.

- Duplicate-Continue fix local PASS: npm run test:live-campaign, artifacts/duplicate-continue-test.log, actual two-client Level 15 route/core cycles, duplicate Continue leaves chapter active, guest Skip rejected, explicit host Skip completes once. npm test PASS artifacts/transition-intents-test.log. Full browser workflow now also triggers for server, game/network/story code and snapshot-audit changes.

## 2026-10-30 public arena corner regression (08:26 UTC)

- Current public four-player run 41022949874/job 123954302192 FAILED at Level 5 after the 260-second stage limit, live b724817d/test 116ade47. First four stages passed complete snapshot comparisons; no mismatch/console error. Two players died and the surviving relay leader stayed at x4764 under adjacent cover. Prior public four-player full clear remains recorded but does not erase this failure. No public campaign rooms remain active after job cleanup.
- Inspected saved artifact 12963500883 via read-only Actions job 123964128202/run 41025995844. State: Warden exposed, relay 2 active, next relay 1; survivor 3 x4764/y129, desired left+jump, no capture or held object. The authored ledge ends at x4764 with bottom y130 (only 21px above floor), while cover begins x4770. This blocks the 22px survivor by one pixel and interrupts the jump underneath nearby cover.
- Reproduced exact corner with stepPlayer and ordinary left/jump: npm run test:systems FAIL before fix, artifacts/arena-corner-before.log. Raised only low arena ledges to leave player height plus two pixels of ground clearance. Pits, boss timers, arena barrier and map widths unchanged. npm test PASS artifacts/arena-corner-fixed.log; all 45 one-survivor routes PASS artifacts/arena-corner-survivors.log. Full local/public reruns required before release; failure diagnostics now include boss state directly.
- 425dcefa regression 41025609480 all five PASS, including new input reset, local browser server-restart recovery and duplicate-Continue live-client checks. Full 41025609549 still active. Current deployment remains b724817d while the arena fix is validated.

## 2026-10-30 shared-object acceptance 08:46

- Arena source 73053d6b regression 41026569183 all five PASS and full 41026569209 all four PASS: solo 123965990857, two 123965990906, three 123965990799, four 123965990469. Extended audit PASS 1200 scenarios/5055052 ticks, artifacts/adversarial-arena-1200.log. Public rerun after deployment still required; CAMP-01 remains reopened until then.
- 20bc2c7f regression 41027621528 all five PASS. Carry/salvage job 123969389386, Chromium 156.0.8078.4: four contexts form two carry pairs, passenger jumps free, drop/throw teammates, hand a crate to another player and throw it; all ownership observations agree, five hearts retained and cleanup zero. New two-client Level 9 route/stomp removes the same salvage with four hearts retained. artifacts/carry-review.jpg and salvage-review.jpg inspected. Earlier 7b09f746 job 123967642399 failed a zero-duration Space tap between server ticks; harness now holds the ordinary jump for 100ms. No game state was injected or repaired.
- NET-04 VERIFIED: full shared-world snapshot hashes in 116ade47 and 73053d6b matrices agree at 2/3/4 across all 15 stages. Specific object transitions also exercised by actual-client pressure/expiry in jitter-test.mjs; memory browser read; carry/crate/salvage above; relay/bridge/victory and pit/checkpoint in main browser; rescue/robot recovery in rescue browser. Values include level, platforms, switches, checkpoints, enemies, boss/objective state and hearts.
- COOP-02 VERIFIED: npm run test:adversarial PASS artifacts/stack-ledge-test.log, stable 2/3/4 stacks, top survivor separates and lands on a raised ledge for each size. npm test:survivor PASS 45 original co-op maps with one connected survivor, no gap shrink or heart refill. Actual four-context carry pairs also remain consistent; human difficulty review is separate.
- LIFE-01 VERIFIED: systems/campaign/rules checks cover unique fatal state, repeat callbacks, pit, expiry, telegraphed strike, multi-victim blast and unavoidable giant contact. Actual Chromium hazard and giant tests each observe one death/one heart, main browser actual pit/revival and WSS forged/duplicate reports pass. No negative hearts or repeated cost while already down.
- LVL-08 VERIFIED: actual WSS concurrent relay activates once; full snapshot audits agree on exits/victory; npm run test:live-campaign on 425dcefa and CI 123962893600 PASS duplicate Continue, rejected guest Skip, host Skip and duplicate Skip. Full 41025609549 also all four PASS. Separate intents prevent chapter collapse without changing default story duration.
- Four-player carry screenshot showed carrier labels behind passengers. Shift labels beside survivors with a person directly overhead; add measured text/body non-overlap fixtures for two carrying pairs and a four-person stack. npm test PASS artifacts/stack-labels-test.log; browser pixel/updated screenshot review pending. Package metadata aligned to visible campaign build 0.3.0; dependency versions unchanged.
