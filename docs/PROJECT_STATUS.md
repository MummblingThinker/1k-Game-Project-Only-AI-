# Implementation status

Last updated: 2026-10-29

## Verified release gates

- MVP-01: two fresh-load solo Level 1 win/replay flows and title regression passed in Chrome.
- MVP-02: independent local Chrome clients joined room 62MUAX, showed matching server positions, shared one relay/bridge, reached victory with four hearts and replayed. Invalid codes were readable. Rooms 62MUAX and 7L2CAB kept player/relay states isolated. Both consoles had zero errors. These were separate origins/pages and Socket.IO sessions, not physical devices or browser profiles.
- npm test passes: physics/clock/gaps, HTTP/assets, evidence guard, client session regression and actual Socket.IO WebSocket integration. Live tests explicitly skip if dependencies are absent; offline checks still run. Node 22+ required for WebSocket tests.

## Current blocker and next task

MVP-03 is IMPLEMENTED_UNVERIFIED. Deployed at https://tiny-teamwork-last-spark.onrender.com in Render My Workspace (tea-dbhakd8u01pc73ap1ou0), one free Node instance in Virginia, manual deploys. GitHub authenticated as MummblingThinker with admin/push access; source published to MummblingThinker/1k-Game-Project-Only-AI-. Render reports initial deploy dep-dbhnfde1egvs73817pj0 live; assigned PORT=10000. Hosted HTTPS/assets and full public WSS gameplay regression passed (Actions run 40915358003). Physical-device/network acceptance and current browser smoke remain outstanding. See QA_LOG.md, 2026-10-29 MVP-03 public deployment.

Next single task: complete physical-device/network acceptance in docs/DEPLOYMENT.md. Browser inventory is empty; iab is unavailable. Local outbound HTTPS fails EACCES, so GitHub Actions tests the public service. Default Render TCP readiness is active; the limited MCP tool cannot set the provider HTTP health path, although /health exists and the public smoke passes. No gameplay source changed.

MVP-04 has a draft entry (416-character description) and readiness checker; actual cover, external evidence and human review/submission are missing. Official rules deadline is October 30 at 11:59pm Pacific, while mission UI says October 31; use the earlier planning target pending clarification.

UI-001: blurry raster text replaced by native HTML overlays and larger interface fonts. Desktop title/story/pause and phone-emulated title/pause were observed. Latest full browser/co-op and physical-device verification is incomplete; automatic checks pass. No extra levels or optional art overhaul added.

## Implementation

Canvas/JavaScript with Node/Express/Socket.IO; original temporary sprites and scenery. Solo Level 1 is complete; Levels 2-15 and regional story panels remain prototypes.

Online Level 1: host-started lobby, four-player cap, fixed-step 60Hz authoritative physics, snapshots, shared relay proximity/cooldown/one-time activation, bridge/gate, shared hearts, pit deaths, first-pass checkpoint recovery, server giant/contact/breach, team victory and host replay. Original running geometry survives departures. Host transfers and empty rooms are removed. Forged/null inputs, stale movement and duplicate death charge are tested. Inputs release on blur/key-up; late/foreign snapshots cannot restore departed membership.

## Limits

Online Level 1 only. Join before start; create a new lobby to add players. Disconnect clears identity; explicitly join a new lobby. ESC releases input, not a shared pause. Rooms are memory-only and require one Node instance; process restart loses them. No account system, cloud saves, audio or verified mobile support.

Carry/throw/rescue, movable online crates, advanced robots, later online campaign/story, broad heart/checkpoint/anti-softlock and physical-device tests remain incomplete/unverified. Broader NET/COOP tasks stay open. Temporary art and optional UI polish are deferred behind MVP-03/04.

Canonical statuses: TASK_LIST.md. Exact commands, failed checks, browser steps/positions and limitations: QA_LOG.md. Local pages do not prove public internet play.
