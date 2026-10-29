# Networking notes

## Verified local slice

Express serves the client; Socket.IO owns independent rooms. Random six-character codes; four-player cap. Join while in the lobby. Host starts/replays Level 1. Host transfers on departure; empty rooms are removed. Running geometry/heart cap retain original party size.

Elapsed-time fixed steps advance physics at 60Hz, with snapshots near 20Hz. Clients send boolean movement/jump and interact/start/replay intentions, never trusted positions/hearts. Server validates relay proximity/cooldown/one-time activation, opens the bridge/gate, and completes only when every living survivor reaches the shelter. Snapshots include giant/checkpoint/platform/relay state. Death deducts on one alive-to-dead transition; broader recovery semantics remain unverified.

Input heartbeat is independent of drawing. Key-up/blur releases movement; server stops stale input after 90 ticks. ESC does not pause online. Disconnect clears identity; join a new lobby. Late/foreign room snapshots are ignored.

GET /health reports status and room count. Hosting needs one persistent Node instance with WebSockets and assigned PORT. Memory-only rooms disappear on restart. Public service: https://tiny-teamwork-last-spark.onrender.com. Hosted HTTPS/assets checks passed; physical-device/network acceptance remains MVP-03, IMPLEMENTED_UNVERIFIED.

## Evidence

npm test includes network-client-test.mjs and multiplayer-test.mjs. The latter starts a real server on a free port and tests actual independent WebSocket sessions: lifecycle/errors/capacity, forged/null inputs, shared relay/bridge/gate/victory/replay, isolation, stale movement, one death charge, host transfer and cleanup. Without TEST_BASE_URL it explicitly skips when Socket.IO is absent, preserving offline checks. Set TEST_BASE_URL to the public HTTPS origin to test actual WSS sessions without starting a local server. Remote cleanup probes only test-created room codes.

Chrome clients at localhost and 127.0.0.1 completed co-op victory/replay, then verified separate room states and clean consoles. These are local sessions, not public internet proof. See the MVP-02 entry in QA_LOG.md.

## Deferred

Later campaign/story synchronization, carry/throw/rescue, movable crates, advanced enemies, identity restoration, latency smoothing, broad checkpoint cases and physical-device/network tests.
