# Playing AI Take Over — October revision

Open https://tiny-teamwork-last-spark.onrender.com. The short illustrated opening can be skipped with Enter, Space, Escape or its button. Choose Single Player, then Start Story, Resume, or a practice stage. Multiplayer and Settings have their own title buttons. The free service can take time to wake. Solo reload resumes the last stage with full hearts; flag checkpoints apply during the current run.

## Controls

| Action | Keyboard |
| --- | --- |
| Move | A/D or Left/Right |
| Jump / wall-jump / escape teammate carry | Space |
| Use relay/console/memory, pick up or throw debris | E |
| Carry/throw teammate; throw held debris even at a ladder | F |
| Climb up / down; release to hold | W/S or Up/Down |
| Put carried object down | Q |
| Watch another living teammate | V |
| Continue / replay | N / R; host online |
| Pause solo / release online controls | Escape |

Move over a ladder and hold W/Up to climb, S/Down to descend. Release to hold still. Move sideways or jump to leave. You can carry supplies up ladders. A console takes priority over throwing with E. Touch controls appear on narrow screens; keyboard and touch are supported, with no native gamepad mapping.

## Flags, bridges and combat

Pass each flag to restore one heart up to the original party maximum and save your respawn position. Solo never exceeds three hearts. A flag awards once and can revive one downed co-op survivor. Solo death, or a co-op wipe, respawns at the latest flag if hearts remain. Flags are open checkpoints, not protective rooms.

Red relays open long bridges. For yellow pressure plates, pick up the yellow weight with E, carry it next to the plate and face toward it, then press Q. Wait for HELD before crossing. You can use other loose objects or have a teammate hold the plate, but the short release grace does not last for the entire gap. Yellow weights cannot break and return if lost in a pit.

Ground robots patrol and turn; their headlights show where they look. When they spot you, they prepare a charge. Jump past or throw debris at them. Small robots die from a hit, medium ones need several, and big armored robots only stun. Most thrown objects shatter after hitting something or landing. Flying scanners mark their target before firing; move out of the beam. Jumping onto smaller robots briefly stuns them.

Recessed building fronts and dark distant trees are background scenery: walk in front of them. Bright outlined walls and tree trunks are solid; highlighted roof edges and platforms support you. Climb city roofs and return to street level, cross forest canopies and water, and watch factory conveyor directions. Cracked barriers break under a downward stomp or thrown object, leaving useful debris. Optional blue MEMORY terminals collect story fragments in this browser.

## The three bosses

- Level 5: climb the randomized tower, dodge marked laser/claw attacks and pursuing scanner drones, and throw varied debris at the Warden. Its visible health bar takes eight hits; victory stops the climb and opens the final exit floor.
- Level 10: flee right through the tree maze. W/S climbs the ladders beside solid trunks; Space against a wall wall-jumps. Stay above or ahead of the chainsaw. Crossing beyond the final tree immediately triggers the finale: the boss rushes into the falling trunk. Clear its striped shadow; anyone still underneath is crushed. The falling trunk kills players as well as the boss; jump the fallen trunk to exit. In solo, a crushing death with hearts remaining respawns you atop the fallen trunk; zero hearts ends the run.
- Level 15: dodge three background Colossus arm attacks: jump above the low sweep, stay below the high sweep, then leave the marked fist column. Move away from the lethal falling head. During its eight-second exhausted opening, throw an object at the head or jump onto it. One hit closes each opening; three hits defeat it. Watch for scanner drones and follow the health bar.

The roaming giant cannot enter any boss arena. A wiped party with hearts remaining restarts the encounter with its approach relays preserved.

The protected overhead drone swarm is in Level 11: forest, covered human passage, then factory. Story chapters use different illustrations for every panel.

## Co-op

Choose Multiplayer on the title screen. The host creates a room and shares the six-character code or invite link. Up to three guests join and select Ready before the host starts. Bring every living survivor to the exit. The host continues or replays; story scenes advance together. Downed survivors can watch teammates until a flag revives them or the party respawns.

Join before starting. Disconnect removes the survivor's identity; reconnect requires a fresh lobby. If the host leaves, another survivor becomes host. Online Escape releases your inputs while the world continues. Rooms disappear when the server restarts.

## Options and reports

Settings includes zone music and sound volume, mute, visual options and Return to title (Leave room online). Opening Settings pauses solo; multiplayer keeps running. Sound starts after a gesture. City has an ambient pulse, forest has airy melody/bird accents, and factory has low machine hum and metallic rhythms. Mute, volume, reduced motion and fewer effects save locally. Reduced effects never removes attack warnings. Add `?debug=1` (or `&debug=1`) to download a stage report for bug reports. Include stage, party size, actions and expected/actual behavior. Reports are not uploaded automatically.

Local play: Node 22+, `npm ci`, `npm start`, then http://localhost:4173. `npm run offline` enables dependency-free solo. `npm test` runs current regression checks. Automated browser reachability is not a physical-device or human difficulty test; see QA_LOG.md for exact evidence.

## Factory power cells
Cyan cells with a lightning mark can be lifted and thrown with E/F. A thrown cell breaks on impact and briefly short-circuits nearby robots. Its direct hit can destroy a small robot, but the burst itself only stuns and does not deal extra boss damage. Heavy robots recover sooner. Q places a cell safely without discharging it. The pale cyan ring remains visible with reduced effects; the electrical cue follows saved sound settings.
