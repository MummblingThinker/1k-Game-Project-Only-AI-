# Networking notes

Express serves the client and Socket.IO owns separate in-memory rooms. Random six-character codes, four-player cap, no login. Join in the lobby; every guest marks Ready before the host starts. Host controls practice-stage selection, replay, Continue and shared story skip. Host transfers on departure. Empty rooms are removed; a server restart clears rooms. There is no persistent reconnect identity: a disconnected player joins a new lobby.

## Authority and shared state

Continue after victory and Skip story are separate host-only intents. nextLevel is accepted only in victory; skipStory only during a cutscene. Duplicate Continue packets cannot skip the chapter they just opened. Stage/run changes, disconnect and focus loss clear pending and held input before another run starts.

One simulation owns movement, collision, carried players/crates, rescue, enemies, shelters, ladders, pressure bridges, route relays, boss phases, hearts, revival and completion. Clients send intentions only. Running geometry and heart cap retain the original lobby size when somebody leaves. A full stage transition revives everyone and restores that cap; a checkpoint grants one oldest-dead revival OR one heart, once.

Physics advances at 60 fixed steps per second; snapshots normally arrive at 20Hz. Input heartbeat is independent of drawing. Release/blur clears movement; stale input expires after 90 simulation ticks. Escape releases online input and does not pause the shared world. Remote visual interpolation is bounded; death, teleports, run changes and long stalls reset it. It never changes authoritative collision.

Public game: https://tiny-teamwork-last-spark.onrender.com. Render My Workspace, one free Node instance, HTTPS/WSS, assigned PORT, manual deploys. /health reports readiness and room count. No database, cloud save or multi-instance room routing is configured. Solo stage progress and sound/visual preferences are local browser storage.

## Bounds and diagnostics

Each socket is limited to 120 input packets and 20 other actions per second. Creating rooms is limited to eight per minute per socket and 200 active rooms globally. Packets over 4096 bytes are rejected by Socket.IO. Boolean/range/ownership validation ignores forged authoritative fields. These bounds are basic protection, not a claim of resistance to distributed attacks.

Optional ?debug=1 reports contain a bounded stage-event history and no participant/session identifiers. Own-room report requests have a separate 900ms limit. Reports stay local unless a player chooses to share a download.

## Verification

- npm test: physics/rules, 60 routes, 45 unchanged co-op routes with one remaining survivor, HTTP/assets, network-client cleanup/interpolation, and actual independent WebSocket lifecycle/relay/victory/room isolation.
- npm run test:disconnect: jump, capture, death, checkpoint and stage-transition departures; fresh identity and cleanup.
- npm run test:jitter: real TCP delays of 60-140ms each direction, input release/shared state/host handoff.
- npm run test:abuse: isolated local server creation/action/input budgets, oversized sender isolation, malformed/forged fields and cleanup. Never aims abuse traffic at production.
- Browser workflows exercise isolated Chromium sessions, Firefox/WebKit compatibility, actual rescue/revival/ladder, repeated retry/title flows and full campaigns. Public workflows use the deployed origin and check only their own room cleanup.
- Long local soaks passed eight rooms/32 clients for one and two hours; the released simulation also passed 12 rooms/48 clients for 40 minutes, with zero remaining rooms. These are local stability measurements, not Render capacity guarantees.

Exact source revisions, results and failed runs are in QA_LOG.md; current deployment is in PROJECT_STATUS.md. Physical-device/network acceptance and human balance/audio review remain deferred. An external CI browser is not a physical phone test.
