# Gameplay rules reference

## Movement and teamwork

Running, jumping, gravity/collision, grabbing/carrying/throwing a teammate, standing on teammates, human-ladder stacking, grabbing/throwing crates, using blocks as steps or bridges, switches, moving platforms, stealth and timing hazards. Teamwork can make routes safer or faster, but cannot be the only possible route when one player remains.

## Pit widths

Tune selected pits based on lobby size: solo = ordinary jump; 2–3 players = teammate throw/climb scale; 4–5 = wider teamwork pit designed around a three-person stack plus throw; each additional pair widens selected teamwork gaps around one player-width. Only some gaps should approach the maximum. Include fallback stones, blocks, ladders or alternate routes. User-facing game code should show why the gap is wider and what the teamwork solution is.

Prototype values are in `public/js/world.js` (`gapWidthForParty`). They are not final balance values.

## Shared hearts

Starting pool: 3 solo; then +1 for each additional pair, rounding up partial pairs; maximum 10. Each fatal event spends exactly one shared heart. A player death is persistent for the segment unless a teammate rescues them before death finalization. Keep per-player alive/dead and death timestamp; do not allow multiple clients to deduct the same fatal event twice.

## Grabbers, instant-kill machines, bombers

- Grabber: visible countdown, struggle extends it slightly, teammates can jump on the robot only while it actively holds someone to force release. It recovers afterward.
- Instant-kill machine: clearly telegraphed approach or attack. Once the instant trigger fires, no struggle or rescue window.
- Creeper/bomber: detection radius, clear audio/visual cue, visible countdown, fixed explosion radius. Evade, jump, hide behind solid cover, or lure it away. Players cannot pick up, throw, or weaponize the bomb. Anyone caught is killed for the segment and costs one shared heart exactly once.
- Robots are never killable/damageable by players. No farming permanent stuns.

## Checkpoints and chaser

Standard map: one midpoint checkpoint. Big map: two at about 1/3 and 2/3. Safe rooms are temporary: ordinary robots cannot enter or attack into them. Side-left, side-right, and overhead exits each need a route; crowd-aware logic must always keep a ground or overhead exit clear. Include a ladder to overhead exit. Giant off-screen pursuer advances while players stall, kills instantly on contact, and can destroy checkpoint rooms and kill players inside.

At a segment boundary, if any players are dead, revive one longest-dead player and do not also restore a heart; otherwise restore one heart, up to max. Never bank recoveries above max. At a full level transition, make all players active and reset the shared pool to the starting amount for original party size.
