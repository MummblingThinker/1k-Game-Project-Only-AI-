# How to Practice Playing the Current Prototype

The current project is an early browser prototype. The fastest way to try it is **offline single-player**; that mode needs Node.js but does not need `npm install`. Online co-op supports the verified local Level 1 relay/bridge/shelter slice; the public service is deployed at https://tiny-teamwork-last-spark.onrender.com, with physical-device/network acceptance still pending.

## 1. Start the single-player version

1. Download and extract `Tiny_Teamwork_The_Last_Spark_Codex_Starter.zip`.
2. Open a terminal in the extracted `Tiny_Teamwork_The_Last_Spark` folder.
3. Check that Node.js is available with `node --version` (Node 20+ recommended).
4. Run the automated checks first:

   ```bash
   npm test
   ```

5. Start the offline server:

   ```bash
   npm run offline
   ```

6. Open **http://localhost:4173** in your browser. Keep the terminal window open while playing. To stop the server, return to the terminal and press **Ctrl+C**.

The offline mode is local to your computer. It does not publish the game to the internet or enable multiplayer.

## 2. Controls

- **A / D** or **Left / Right arrows:** move.
- **Space** or **Up arrow:** jump; also advances a cutscene panel.
- **E:** interact with nearby objects (such as crates or switches); the exact behavior depends on the current situation.
- **Esc:** pause/resume.
- **R:** restart from game-over or paused state where supported.
- **Touch buttons:** appear on narrow screens; test with a physical device before relying on them.

The first goal is simply to learn the jump arc, approach gaps carefully, interact with objects, and observe patrol timing. Robots are not enemies to defeat; the intended design is to evade them and escape.

## 3. Practice a specific level

Use the **Test a level** dropdown and click **Load Selected Level**. Alternatively, while the server is running, open a level directly:

- `http://localhost:4173/?level=1` — city introduction to the level layout
- `http://localhost:4173/?level=5` — City Gate / city-to-forest transition setup
- `http://localhost:4173/?level=6` — forest region
- `http://localhost:4173/?level=10` — covered walkway / factory reveal setup
- `http://localhost:4173/?level=11` — factory region
- `http://localhost:4173/?level=15` — final factory level / ending setup

Valid level numbers are 1–15. Direct test-level loading skips the opening cinematic so you can test that stage. The current starter mostly reuses a procedural layout, so treat each level selector as a theme/story prototype rather than a finished, unique level.

## 4. A useful 10-minute practice session

1. Start Level 1 and run left/right to feel acceleration and stopping distance.
2. Jump over a pit or onto a ledge; repeat until you can land without rushing.
3. Walk toward a crate or switch, press **E**, and observe how nearby interactions behave.
4. Watch a patrol robot rather than trying to fight it. Learn its spacing and avoid contact.
5. Try a level with the pursuer/checkpoint scenery and note whether the routes feel fair or confusing.
6. Load Level 5, then Level 10, then Level 15 to inspect the current story panels and regional visual styles.
7. Write down bugs with the level URL, the action that triggered the issue, and what you expected to happen. Share those notes with Codex and ask it to turn each bug into a reproducible test before fixing it.

Because this is a prototype, an obstacle, animation, or co-op mechanic may not yet behave as the design document specifies. Report those as unfinished tasks rather than assuming you missed a control.

## 5. Practice multiplayer locally

Only after you are ready to install project dependencies:

```bash
npm install
npm start
```

Then:

1. Open **http://localhost:4173** in a browser and click **Create Room**.
2. Copy the six-character room code.
3. Open a second browser session (a private/incognito window is helpful) on the same computer, or open the address on another device on the same network.
4. Enter the room code in the second session and click **Join Room**.
5. The host clicks Start co-op run once everyone joins. Jump the first pit; use E near the relay to open the shared bridge/gate. Get every living survivor to the shelter; host can replay after victory.

Local Level 1 play has been verified with independent clients: server movement, shared relay/bridge/gate, victory/replay and room isolation. Online ESC releases input without pausing. Join before start; create a new lobby to add players. Disconnect clears membership. Advanced co-op and later online campaign remain incomplete. Public HTTPS and physical-device/network tests are unverified. See QA_LOG.md.

## 6. How to report a bug so Codex can fix it

Record:

- **Level URL:** e.g. `http://localhost:4173/?level=10`
- **Party size:** solo or number of clients
- **Steps:** exact actions, in order
- **Expected:** what the rule/design says should happen
- **Actual:** what happened instead
- **Evidence:** screenshot, short recording, terminal/browser-console error, if available

Ask Codex to reproduce the issue, add a test for it, fix it, rerun `npm test`, perform the relevant manual browser test, then update `TASK_LIST.md` and `QA_LOG.md`. It must not mark the task verified if it cannot reproduce or validate the fix.
