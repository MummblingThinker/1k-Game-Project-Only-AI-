# Publish the multiplayer slice

Status: prepared for deployment, not publicly deployed or externally verified.

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
- Host starts. Both move/jump; compare player positions, relay/bridge state and shared hearts.
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
