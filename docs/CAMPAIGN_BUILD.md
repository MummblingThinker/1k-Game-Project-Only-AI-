# Campaign build 0.3

The owner authorized campaign development while the separate-device acceptance test is deferred. No automated result is a claim of a physical-device playtest or contest submission.

## Routes and encounters

Level 1 stays the short tutorial/reference. Levels 2–4, 6–9, 11–14 are 2880 units (about three reference widths). Levels 5/10/15 are 5280/5760/6240 units (5.5/6/6.5 reference widths). Authored pit, ledge and relay coordinates differ per stage. Regular maps have one midpoint shelter; giant maps have two near one-third and two-thirds. Shelters have left/right ground exits and steps to an overhead roof route.

The pursuer advances at a fixed speed calibrated to cross the map in 120 simulated seconds. It does not teleport to the slowest player. It instantly kills on contact and can breach a shelter; ordinary rescue immunity does not protect against it or a pit. It stops outside every boss blast door, even after the arena is solved. Party-wipe retry rewinds it to the segment restart, spends no extra hearts and restores no hearts.

Level 5: bait the Gate Warden's marked slam. During its exposed cooling window, activate relay 2, then 1, then 3. Each activation briefly stuns it. Escape the opened gate; the robot is not killed.

Level 10: the low-roof passage has approximately 100 decorative overhead watchers; ordinary enemies cannot enter the human route. In the gauntlet, activate three beacons and survive 45 seconds. Marked ground strikes can be jumped; overhead platforms also provide cover. The pursuer cannot cross the blast door.

Level 15: a separate background Colossus marks targeted strikes. Move away from the striped warning or shelter under an arena platform. Charge all three relays to stun it, then activate the central core terminal with E. Repeat for three circuits, disable production, and escape while it reboots. The original celebration/robot-attack/cut-to-black ending remains the default.

## Shared rules and controls

Solo and Socket.IO rooms use simulation.js. E uses a relay/memory terminal or picks up a nearby crate; use E again to throw. F prioritizes a nearby teammate, then crates; F again throws. Q safely drops. A carried teammate can jump free. Living teammates are standable top surfaces for stacking. Jumping on a robot stuns it only while it is actually grabbing a teammate. Alternating A/D or tapping Jump during capture buys a limited extension (four increments shared across both inputs).

Sentinels mark an impending strike; creepers count down to a radius blast and recover; scanners mark a vertical scan target; grabbers patrol and capture. All machines are indestructible. Solo grabbers use a telegraphed crush window because no teammate can rescue a solo player. Shallow water slows ground movement; conveyors push. Optional machine memory terminals never gate completion.

N / Continue advances a completed stage; R replays the current stage. Online only the host may advance/replay or skip a shared story. Story scenes after 5/10/15 are server-timed, with native HTML captions. In the lobby the host may select any practice stage. Join before start; leaving/disconnecting clears identity and releases carry/grab relationships.

## Evidence scope

campaign-test.mjs completes all fifteen routes with 1, 2, 3 and 4 simulated participants using input intentions, plus deterministic geometry, pursuer, life and carry checks. These are not human balance tests. The browser workflow checks title/story/pause, every stage load/movement, two independent browser contexts playing the tutorial to shared victory and continuing into Level 2, and touch cancellation. Separate physical-device/network acceptance remains pending.


## Hardening and sound

Missed route relays do not trap players in an arena: the encounter waits until every relay and all living players are inside. A party wipe with hearts left retries inside the arena with a short recovery window, resets encounter progress, and preserves the remaining heart count. Shelters remove their physical roofs/steps when breached. Side exits have full headroom, and water/conveyor motion respects solid collision.

Original synthesized cues and saved mute/volume controls are implemented. Browser audio-context/settings tests are running; physical listening review is pending. All warning shapes/countdowns remain visible with audio off.
