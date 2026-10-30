# Playing Tiny Teamwork

Open https://tiny-teamwork-last-spark.onrender.com. The free service can take a moment to wake up. Start the story for solo, resume your saved solo stage, or use the practice-stage selector. Saves remember the stage on this browser and restart it with full hearts; they are not mid-stage or cloud saves.

## Play together

1. The host creates a room and copies its invitation link or six-character code.
2. Up to three guests open the link and click Join Room. An invitation fills the code; it never joins silently.
3. Each guest selects Ready. The host starts once everyone is ready.
4. Activate relays with E and bring every living survivor to the exit. The host continues after victory. Story scenes advance together.

Join before the run begins. To add someone later, leave and create a fresh lobby. Disconnecting removes that survivor; reconnecting does not reclaim the old identity. If the host leaves, a remaining player becomes host. Online Escape releases your controls while the shared world continues.

## Controls

| Action | Keyboard |
| --- | --- |
| Move | A/D or Left/Right |
| Jump / struggle while grabbed | Space or Up |
| Interact with relay, beacon, memory or shelter ladder | E |
| Pick up / throw teammate or crate | F |
| Drop carried teammate or crate | Q |
| Break free from being carried | Jump |
| Watch next living teammate while down | V or Watch next button |
| Continue after victory | N; host online |
| Pause solo / release online input | Escape |

Touch controls appear on narrow screens. Sound starts after a gesture; mute and volume are saved. Expand Visual options for reduced motion or fewer decorative effects. Gameplay warnings and story timing remain intact.

Keyboard and touch are the supported input methods. There is no native gamepad mapping in this release.

## Surviving the campaign

There are 15 stages. Normal maps are about three times the Level 1 reference; Levels 5, 10 and 15 are larger milestone encounters. The giant takes about two minutes to traverse a normal map after its entry warning. It does not speed up to catch you. Shelters can restore a shared heart or revive one downed survivor, but the giant eventually breaks them. It cannot enter boss arenas.

- Jump pits carefully and use stepping stones. Carry, throw and stack to help a teammate across.
- Robots are indestructible. Jump onto the robot holding a teammate to stun it and release them. Struggling buys a little time.
- Water slows movement; conveyors move you. Stomp marked salvage or throw a crate at it to break it.
- Level 5: bait the gate robot's slam, then use the exposed relay sequence.
- Level 10: reach three beacons and survive the encounter under the human passage roof.
- Level 15: evade the background Colossus, activate the pylons, then interact with its exposed core. Repeat for three cycles.

The game uses shared hearts. A fatal hit costs one; downed players watch a living teammate until revived. Completing a stage restores the original party's heart pool and all remaining survivors.

Optional blue MEMORY / E terminals in stages 2-15 reveal fourteen story fragments. Discoveries are shared with your current teammates and collected in the Memory archive below the game. The archive saves in this browser when storage is available. It never changes the required objectives or ending.

## Run locally

Use the current source checkout or extract `release/TinyTeamwork-source.zip`. Node 22 or newer is required. In the project folder:

```sh
npm ci
npm start
```

Open http://localhost:4173. For local solo without installing dependencies, use `npm run offline` instead. This does not enable multiplayer. Stop either server with Ctrl+C. `npm test` runs the automated regression suite.

For stage practice, use the selector or append `?level=5` (valid stages 1-15). Practice skips the opening story and starts solo at that stage.

## Report a bug

Record the stage, party size, exact actions, expected result and actual result. A screenshot or short recording helps. Optional `?debug=1` adds a local stage report and download button with death/checkpoint timing. Reports omit room codes and player IDs and are never uploaded automatically. Add `&debug=1` if the URL already has a level query.

Automated browser and socket tests cover the campaign, but physical-device/network acceptance and human difficulty review remain pending. See `QA_LOG.md` for specific tested revisions and known limits.
