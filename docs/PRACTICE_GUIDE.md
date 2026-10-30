# Playing Tiny Teamwork — October revision

Open https://tiny-teamwork-last-spark.onrender.com. Start the story for solo or choose a practice stage. The free service can take time to wake. Solo reload resumes the last stage with full hearts; flag checkpoints apply during the current run.

## Controls

| Action | Keyboard |
| --- | --- |
| Move | A/D or Left/Right |
| Jump / wall-jump / escape teammate carry | Space or Up |
| Climb ladder, use relay/console/memory, pick up or throw debris | E |
| Carry/throw teammate; throw held debris even at a ladder | F |
| Put carried object down | Q |
| Watch another living teammate | V |
| Continue / replay | N / R; host online |
| Pause solo / release online controls | Escape |

E starts automatic climbing. Move sideways to step off. You can carry supplies up ladders. A console takes priority over throwing with E. Touch controls appear on narrow screens; keyboard and touch are supported, with no native gamepad mapping.

## Flags, bridges and combat

Pass each flag to gain one heart and save your respawn position. A flag awards once and can revive one downed co-op survivor. Solo death, or a co-op wipe, respawns at the latest flag if hearts remain. Flags are open checkpoints, not protective rooms.

Red relays open long bridges. For yellow pressure plates, pick up the yellow weight with E, carry it next to the plate and face toward it, then press Q. Wait for HELD before crossing. You can use other loose objects or have a teammate hold the plate, but the short release grace does not last for the entire gap. Yellow weights cannot break and return if lost in a pit.

Ground robots patrol and turn; their headlights show where they look. When they spot you, they prepare a charge. Jump past or throw debris at them. Small robots die from a hit, medium ones need several, and big armored robots only stun. Most thrown objects shatter after hitting something or landing. Flying scanners mark their target before firing; move out of the beam. Jumping onto smaller robots briefly stuns them.

Climb city roofs and return to street level, cross forest canopies and water, and watch factory conveyor directions. Cracked barriers break under a downward stomp or thrown object, leaving useful debris. Optional blue MEMORY terminals collect story fragments in this browser.

## The three bosses

- Level 5: keep climbing above the Warden claws. E picks up debris, F throws toward the robot. Climb beyond the first floors to expose its body, then land eight hits. The endless tower stops growing after victory; take the final ladder to the door.
- Level 10: flee right through the tree maze. E climbs trunks; Space against a wall wall-jumps. Stay above or ahead of the chainsaw. At the final tree, clear the striped danger area when warned. The falling trunk kills players as well as the boss; jump the fallen trunk to exit.
- Level 15: climb above rising lava and use the consoles in order. Lava speeds up each time. Dodge marked lasers; essential ladders remain when other platforms break. The third console raises the emergency lift as the robot leaps in. Run LEFT through the machinery maze to the door; the boss dies in the lava.

The roaming giant cannot enter any boss arena, including the factory's leftward escape. A wiped party with hearts remaining restarts the encounter with its approach relays preserved.

The protected overhead drone swarm is in Level 11: forest, covered human passage, then factory. Story chapters use different illustrations for every panel.

## Co-op

The host creates a room and shares the six-character code or invite link. Up to three guests join and select Ready before the host starts. Bring every living survivor to the exit. The host continues or replays; story scenes advance together. Downed survivors can watch teammates until a flag revives them or the party respawns.

Join before starting. Disconnect removes the survivor's identity; reconnect requires a fresh lobby. If the host leaves, another survivor becomes host. Online Escape releases your inputs while the world continues. Rooms disappear when the server restarts.

## Options and reports

Sound starts after a gesture. Mute, volume, reduced motion and fewer effects save locally. Reduced effects never removes attack warnings. Add `?debug=1` (or `&debug=1`) to download a stage report for bug reports. Include stage, party size, actions and expected/actual behavior. Reports are not uploaded automatically.

Local play: Node 22+, `npm ci`, `npm start`, then http://localhost:4173. `npm run offline` enables dependency-free solo. `npm test` runs current regression checks. Automated browser reachability is not a physical-device or human difficulty test; see QA_LOG.md for exact evidence.