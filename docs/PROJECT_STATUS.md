# Implementation status

Last updated: 2026-10-29

## Verified release gates

- MVP-01: two fresh-load solo Level 1 win/replay flows and title regression passed in Chrome.
- MVP-02: independent local Chrome clients joined room 62MUAX, showed matching server positions, shared one relay/bridge, reached victory with four hearts and replayed. Invalid codes were readable. Rooms 62MUAX and 7L2CAB kept player/relay states isolated. Both consoles had zero errors. These were separate origins/pages and Socket.IO sessions, not physical devices or browser profiles.
- npm test passes: physics/clock/gaps, HTTP/assets, evidence guard, client session regression and actual Socket.IO WebSocket integration. Live tests explicitly skip if dependencies are absent; offline checks still run. Node 22+ required for WebSocket tests.

## Current blocker and next task

MVP-03 remains BLOCKED after the 2026-10-29 connection recheck. Render plugin discovery confirms installed/enabled and tool definitions are exposed, but all three read-only calls (selected workspace, list workspaces, list services) return MCP -32001 Unknown tool. No account/workspace was verified. Browser inventory is empty and the in-app browser is unavailable. No Render CLI or RENDER_API_KEY environment fallback exists. Restore/reconnect the existing Render connection; do not reinstall it. No repository/service was created and no public URL or external-device test exists. Full baseline npm test passed including live WebSocket multiplayer.

Prepared render.yaml, explicit all-interface PORT binding, deployment instructions and a source ZIP with integrity/hash manifest. Fresh extraction passed offline checks without borrowing installed dependencies. Provider validation, public deployment and external two-device play remain unverified.

MVP-04 has a draft entry (416-character description) and readiness checker; actual cover, public URL, external evidence and human review/submission are missing. Official rules deadline is October 30 at 11:59pm Pacific, while mission UI says October 31; use the earlier planning target pending clarification.

UI-001: blurry raster text replaced by native HTML overlays and larger interface fonts. Desktop title/story/pause and phone-emulated title/pause were observed. Latest full browser/co-op and physical-device verification is incomplete; automatic checks pass. No extra levels or optional art overhaul added.

## Implementation

Canvas/JavaScript with Node/Express/Socket.IO; original temporary sprites and scenery. Solo Level 1 is complete; Levels 2-15 and regional story panels remain prototypes.

Online Level 1: host-started lobby, four-player cap, fixed-step 60Hz authoritative physics, snapshots, shared relay proximity/cooldown/one-time activation, bridge/gate, shared hearts, pit deaths, first-pass checkpoint recovery, server giant/contact/breach, team victory and host replay. Original running geometry survives departures. Host transfers and empty rooms are removed. Forged/null inputs, stale movement and duplicate death charge are tested. Inputs release on blur/key-up; late/foreign snapshots cannot restore departed membership.

## Limits

Online Level 1 only. Join before start; create a new lobby to add players. Disconnect clears identity; explicitly join a new lobby. ESC releases input, not a shared pause. Rooms are memory-only and require one Node instance; process restart loses them. No public deployment, account system, cloud saves, audio or verified mobile support.

Carry/throw/rescue, movable online crates, advanced robots, later online campaign/story, broad heart/checkpoint/anti-softlock and physical-device tests remain incomplete/unverified. Broader NET/COOP tasks stay open. Temporary art and optional UI polish are deferred behind MVP-03/04.

Canonical statuses: TASK_LIST.md. Exact commands, failed checks, browser steps/positions and limitations: QA_LOG.md. Local pages do not prove public internet play.
