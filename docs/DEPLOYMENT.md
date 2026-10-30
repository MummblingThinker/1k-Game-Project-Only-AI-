# Deployment and multiplayer acceptance

Status: campaign release 0.3.0 deployed on Render; physical-device/network acceptance remains unverified. Exact subsequent source/test/archive status is maintained in PROJECT_STATUS.md.

## Current service

- Public URL: https://tiny-teamwork-last-spark.onrender.com
- Source: https://github.com/MummblingThinker/1k-Game-Project-Only-AI- (main).
- Workspace: My Workspace (`tea-dbhakd8u01pc73ap1ou0`).
- Service: `srv-dbhnfcm1egvs73817n4g`; https://dashboard.render.com/web/srv-dbhnfcm1egvs73817n4g
- Free Node service, Virginia, one instance, manual deploys. Build `npm ci && npm test`; start `npm start`; Node 24.20.0; NODE_ENV=production. No database or secrets.
- Initial live deploy: `dep-dbhnfde1egvs73817pj0`, runtime source `269fc0e4384ebd9cf44bdd6cb6caaa81dcc0c776`. Logs confirm assigned PORT=10000.
- Current gameplay-revision runtime: `913a4342c04552849b6fe696c18ea26cc2ba0017`, deploy `dep-dbiada1srm7s73dmsht0`, LIVE October 30 at 14:16:47 UTC. Later tests/cover/documentation commits do not require redeployment.
- Direct MCP creation uses Render's default TCP readiness checks; its limited tool cannot set `healthCheckPath`. The existing `/health` HTTP endpoint is independently tested below. To enable provider HTTP checks, set `/health` in Dashboard Settings; the supplied Blueprint already requests it.

The repository also contains a Public multiplayer smoke GitHub Actions workflow. It tests this deployed URL from an Ubuntu runner, without a ChatGPT login. It does not replace the physical-device test below.

Full public regression passed: https://github.com/MummblingThinker/1k-Game-Project-Only-AI-/actions/runs/40915358003. Includes HTTP assets/health and actual WSS gameplay through shared victory/replay, isolation and cleanup. See QA_LOG.md for the earlier failures and corrections.

Current replacement acceptance: public browser/assets/comics PASS 41070578466/job 124113263906; complete two-player campaign 124113263592 PASS all 15/default chapters/ending with one Level 14 replay. Focused final boss two/four-player follow-up 41071836457 also PASS. Full 1/2/3/4 CI campaigns passed on the exact runtime (41069764037). See QA_LOG.md for all failed patrol attempts, replays and final follow-up results. These are automated independent browsers, not physical-device testing.

Historical pre-revision quiet-interval smoke: 41036079502/job 123997121435, runtime 13744978, first health response 21404ms. Provider sleep is not inferred solely from the delay. This timing is historical, not a fresh cold-start measurement of the replacement.

To repeat from a terminal with internet access (PowerShell):

```powershell
$env:TEST_BASE_URL='https://tiny-teamwork-last-spark.onrender.com'
npm run smoke
node scripts/revision-network-test.mjs
Remove-Item Env:TEST_BASE_URL
```

These tests create temporary rooms and exercise gameplay. Remote cleanup checks only their own room codes, preserving unrelated players' rooms. Without TEST_BASE_URL, both scripts retain their local-server behavior. The HTTP test allows for a free-service cold start.

## Render fallback

Railway's October 28 status update says new signups remain paused. Render supports the existing Node/Express/Socket.IO server, public HTTPS and inbound WebSockets without changing the game stack.

1. Install/connect the Render plugin, or sign in at https://dashboard.render.com/.
2. Put the release source in a Git repository you own. The repository root must contain package.json, package-lock.json, render.yaml, public/, server/ and scripts/. Do not upload node_modules, local caches, .env files or secrets.
3. In Render, create a Blueprint from that repository using render.yaml. Alternatively create a **Web Service**, choose Node, build with `npm ci && npm test`, start with `npm start`, and set health path `/health`.
4. Choose the **Free** compute plan explicitly. The supplied manifest requests free, one instance and manual deployments. Do not enable paid resources or autoscaling without the owner's agreement. No database is needed.
5. Wait for a successful build, start and health check. Record the actual HTTPS URL Render returns; do not invent a hostname. The server uses the assigned PORT and binds to 0.0.0.0.
6. Open the URL in a signed-out/private browser. Verify the page/assets and `/health`, then run the external two-device procedure below before marking MVP-03 verified.

Render Free sleeps after 15 minutes without traffic and can take about a minute to wake. Rooms are in memory: sleeping, restarting or redeploying loses them. Use exactly one Node instance; separate replicas do not share room state. This is a small contest demo, not a persistence or scaling solution.

## External acceptance procedure

- Device A: use the public HTTPS link, create a room, and record the random code.
- Device B on a separate network (for example cellular): open the same link and join the code without a ChatGPT/hosting login or installation.
- Guest chooses Ready; host starts. Both move/jump; compare player positions, relay/bridge state and shared hearts.
- One player activates the relay with E. Both cross the bridge and reach the shelter; both must see victory. Host replay must reset both.
- Try an invalid code and a second isolated room; check browser errors, HTTPS assets, WebSocket traffic and `/health`.
- Log URL, date, devices, browsers, networks, exact steps and results in QA_LOG.md. Any untested part stays unverified.

## Before publishing

`npm test` runs local physics/static/client checks and actual WebSocket integration. `python scripts/package-release.py` creates a source ZIP from an explicit allowlist and verifies it can be read back. That ZIP contains no installed dependencies or local cache.

`npm run check:submission` reports missing public URL, cover or external acceptance; a draft is intentionally not ready. The human owner reviews and publishes the Handshake entry.

Sources checked October 28, 2026:
- https://status.railway.com/
- https://render.com/docs/web-services
- https://render.com/docs/websocket
- https://render.com/docs/free
- https://render.com/docs/blueprint-spec
