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
