> HISTORICAL DESIGN: The October 30 owner revision supersedes the shelter, indestructible-robot, short/fallback bridge and old boss rules below. Current behavior is documented in ../README.md and PRACTICE_GUIDE.md; current verification is in ../QA_LOG.md. This file preserves the earlier release design and must not be used as current acceptance criteria.
# Campaign build 0.3

The owner authorized campaign development while the separate-device acceptance test is deferred. No automated result is a claim of a physical-device playtest or contest submission.

## Routes and encounters

Level 1 stays the short tutorial/reference. Levels 2–4, 6–9, 11–14 are 2880 units (about three reference widths). Levels 5/10/15 are 5280/5760/6240 units (5.5/6/6.5 reference widths). Authored pit, ledge and relay coordinates differ per stage. Regular maps have one midpoint shelter; giant maps have two near one-third and two-thirds. Shelters have left/right ground exits and steps to an overhead roof route.

The pursuer advances at a fixed speed calibrated to cross a normal map in 120 simulated seconds, after an eight-second stage-entry warning. Giant milestone maps use the same walking speed, giving nominal crossings of about 216/235/255 seconds before the boss boundary. It does not teleport to the slowest player. It instantly kills on contact and can breach a shelter; ordinary rescue immunity does not protect against it or a pit. It stops outside every boss blast door, even after the arena is solved. Party-wipe retry rewinds it to the segment restart, spends no extra hearts and restores no hearts.

Level 5: bait the Gate Warden's marked slam. During its exposed cooling window, activate relay 2, then 1, then 3. Each activation briefly stuns it. Escape the opened gate; the robot is not killed.

Level 10: the low-roof passage has approximately 100 decorative overhead watchers; ordinary enemies cannot enter the human route. In the gauntlet, activate three beacons and survive 45 seconds. Marked ground strikes can be jumped; overhead platforms also provide cover. The pursuer cannot cross the blast door.

Level 15: a separate background Colossus marks targeted strikes. Move away from the striped warning or shelter under an arena platform. Charge all three relays to stun it, then activate the central core terminal with E. Repeat for three circuits, disable production, and escape while it reboots. The original celebration/robot-attack/cut-to-black ending remains the default.

## Shared rules and controls

Every required route uses reachable E relays and then the exit. The following fallback plan also works when teammates disconnect: take the fixed stepping stones across widened gaps, jump raised ledges rather than pushing against them, and use the midpoint shelter's central E ladder or side steps. Ordinary robots cannot attack inside an intact shelter, but the giant can breach it. Optional memories, salvage and pressure bridges never consume a required key or remove the fallback stones.

| Stages | Route and fallback |
| --- | --- |
| 1 | Jump the teaching gap, reach the shelter, jump the exit step, use the relay and cross the second gap. |
| 2-4 | Follow each transit/roof/searchlight route relay in order; use the stones and shelter roof to pass patrol lanes. Salvage in 3 can be stomped or bypassed. |
| 5 | Complete the route relays before the arena; use the 2-1-3 cooling-window sequence above. |
| 6-9 | Water slows movement, so jump from firm ledges. Optional plates in 6/8 hold bridges for eight seconds; stones remain usable after expiry. Memory in 9 is optional. |
| 10 | Stay below the covered roof; charge all three beacons and evade ground marks until the survival timer ends. |
| 11-14 | Watch conveyor arrows; wait to land on each narrow stone before the next jump. Plates in 12/13 are optional. Salvage in 11/14 can be bypassed or broken. |
| 15 | Charge three pylons, use the visibly lit central core, repeat three times and exit. Shelter beneath arena platforms or leave the marked strike zone. |

Automated last-survivor audit: scripts/last-survivor-test.mjs creates each original 2/3/4-player map, disconnects everyone except the last slot, and completes all 45 routes using input/actions only. Original gap sizes, enemies, pursuer and heart cap remain unchanged. This supplements full browser campaigns; it does not replace human difficulty review.

Solo and Socket.IO rooms use simulation.js. E uses a relay/memory terminal or picks up a nearby crate; use E again to throw. F prioritizes a nearby teammate, then crates; F again throws. Q safely drops. A carried teammate can jump free. Living teammates are standable top surfaces for stacking. Jumping on a robot stuns it only while it is actually grabbing a teammate. Alternating A/D or tapping Jump during capture buys a limited extension (four increments shared across both inputs).

The optional memory archive holds fourteen distinct original fragments, one for each stage 2-15. A shared terminal read adds the fragment to every current teammate's local archive. Local storage failure keeps it for the session and shows an honest save-status message. No fragment is required for a relay, boss, exit or ending.

Sentinels mark an impending strike; creepers count down to a radius blast and recover; scanners mark a vertical scan target; grabbers patrol and capture. All machines are indestructible. Solo grabbers use a telegraphed crush window because no teammate can rescue a solo player. Shallow water slows ground movement; conveyors push. Optional machine memory terminals never gate completion.

N / Continue advances a completed stage; R replays the current stage. Online only the host may advance/replay or skip a shared story. Story scenes after 5/10/15 are server-timed, with native HTML captions. In the lobby the host may select any practice stage. Join before start; leaving/disconnecting clears identity and releases carry/grab relationships.

## Evidence scope

Levels 6/8/12/13 have pressure-plate bridges. A grounded survivor or uncarried crate holds a bridge open. After release it remains solid for eight seconds with a visible countdown. Leaving a crate supports the whole team; a solo survivor can trigger it and run across. The existing jumps and stepping stones remain as fallback routes. These bridges are optional route aids and never consume an irreplaceable object or disable a relay bridge.

campaign-test.mjs completes all fifteen routes with 1, 2, 3 and 4 simulated participants using input intentions, plus deterministic geometry, pursuer, life and carry checks. These are not human balance tests. The browser workflow checks title/story/pause, every stage load/movement, two independent browser contexts playing the tutorial to shared victory and continuing into Level 2, and touch cancellation. Separate physical-device/network acceptance remains pending.


## Hardening and sound

Missed route relays do not trap players in an arena: the encounter waits until every relay and all living players are inside. A party wipe with hearts left retries inside the arena with a short recovery window, resets encounter progress, and preserves the remaining heart count. Shelters remove their physical roofs/steps when breached. Side exits have full headroom, and water/conveyor motion respects solid collision.

Original synthesized cues and saved mute/volume controls are implemented. Browser gesture-unlocked audio-context and saved-settings tests pass; physical listening review is pending. All warning shapes/countdowns remain visible with audio off.


Selected stages include cracked salvage: jump down onto it or throw a crate to break it. Debris is temporary; the barriers never gate an irreplaceable route and robots remain indestructible. Optional memory terminals now have visible E markers and grounded placement. Stage themes have distinct original background set pieces; these are decorative and do not hide collision rules. Covered Way has an actual overhead platform with enough clearance for the required jump.
