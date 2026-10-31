# Networking notes

Express serves the client and Socket.IO owns separate in-memory rooms. Random six-character codes, four-player cap, no login. Join in the lobby; every guest marks Ready before the host starts. Host controls practice-stage selection, replay, Continue and shared story skip. Host transfers on departure. Empty rooms are removed; a server restart clears rooms. There is no persistent reconnect identity: a disconnected player joins a new lobby.

## Authority and shared state

Continue after victory and Skip story are separate host-only intents. nextLevel is accepted only in victory; skipStory only during a cutscene. Duplicate Continue packets cannot skip the chapter they just opened. Stage/run changes, disconnect and focus loss clear pending and held input before another run starts.

One simulation owns movement, collision, carried players/debris, enemy patrol/scan/throw damage, flags, ladders, pressure bridges, relays, boss phases, hearts, revival and completion. Clients send left/right/jump/up/down intentions and interaction actions only. W/S ladder input is authoritative and synchronized. Running geometry retains original party size when somebody leaves. A new flag restores one heart once up to the original party cap, saves the checkpoint and may revive the oldest downed co-op player. Stage transitions revive everyone and restore the original starting heart pool. Solo and all-down recovery use the latest flag; flags are not safe rooms.

Physics advances at 60 fixed steps per second; snapshots normally arrive at 20Hz. Input heartbeat is independent of drawing. Release/blur clears movement; stale input expires after 90 simulation ticks. Escape releases online input and does not pause the shared world. Remote visual interpolation is bounded; death, teleports, run changes and long stalls reset it. It never changes authoritative collision.

Public game: https://tiny-teamwork-last-spark.onrender.com. Render My Workspace, one free Node instance, HTTPS/WSS, assigned PORT, manual deploys. /health reports readiness and room count. No database, cloud save or multi-instance room routing is configured. Solo stage progress and sound/visual preferences are local browser storage.

## Bounds and diagnostics

Each socket is limited to 120 input packets and 20 other actions per second. Creating rooms is limited to eight per minute per socket and 200 active rooms globally. Packets over 4096 bytes are rejected by Socket.IO. Boolean/range/ownership validation ignores forged authoritative fields. These bounds are basic protection, not a claim of resistance to distributed attacks.

Optional ?debug=1 reports contain a bounded stage-event history and no participant/session identifiers. Own-room report requests have a separate 900ms limit. Reports stay local unless a player chooses to share a download.

## Current revision verification

- npm test: current construction/timing/storage/rules, network-client cleanup/interpolation and HTTP/assets.
- node scripts/revision-route-test.mjs with TEST_PARTY=1/2/3/4: all 60 ordinary-input routes. node scripts/revision-survivor-test.mjs: all 45 original-party worlds with only the last survivor remaining.
- node scripts/revision-network-test.mjs: actual independent WebSocket authority/shared-flag/bridge/victory/host-migration checks; TEST_BASE_URL selects the hosted origin.
- node scripts/revision-disconnect-test.mjs: airborne host, teammate carrier, durable-weight carrier and boss-climbing departures; remaining survivor completes the bridge/boss, fresh identity is rejected in running rooms and cleanup completes.
- Revision browser workflows exercise independent Chromium contexts, Firefox/WebKit rendering, unique comics and full 1/2/3/4 campaigns. Public workflows verify served source and only remove their own rooms.
- Current runtime passed four rooms/16 clients for 15 minutes; an earlier revision passed 30 minutes. No finite-state/heart/carry/isolation failures; zero rooms after cleanup. Local stability results are not Render capacity claims.

Older jitter/abuse/rescue/large-room soak scripts and evidence are retained for historical transport behavior; they are not new acceptance of replaced shelter or enemy contracts. Exact source revisions, all failures/replays and final results are in QA_LOG.md; deployment is in PROJECT_STATUS.md. Physical-device/network and human balance/audio acceptance remain deferred.

Giant contact uses the living count at the start of the catch batch. At most two living survivors ends the run atomically with zero hearts; at least three spends one per caught survivor and returns them after 90 ticks if hearts remain. This avoids iteration-order-dependent team wipes. Ordinary flag/wipe recovery remains separate.


## Submission snapshot protocol

Current browser clients request `auth.sharedSnapshots: true`. The server sends one common authoritative roomState packet to those recipients through Socket.IO's normal broadcast adapter, encoding the world once. NetworkClient derives playerId/you using the identity received in roomJoined. Legacy clients without this opt-in continue receiving personalized roomState packets. Mixed old/new clients and new-only 16-client soak are tested. No gameplay state is predicted or trusted from clients; full per-client network bytes remain similar. Connect timeout is ten seconds; reconnect still requires a new lobby.
