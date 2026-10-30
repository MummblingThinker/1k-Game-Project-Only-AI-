# Art direction and provenance

## Target look

Original, high-contrast pixel-art arcade platformer with cinematic, readable character silhouettes. Cutscenes should evoke the theatrical framing and rhythmic pacing of classic TMNT-era pixel arcade story panels without copying those games' characters, sprite sheets, compositions, layouts, logos, or exact art.

- Internal canvas: 320 × 180; scaled to 16:9 with image-rendering pixelated/crisp-edges.
- Shape language: clear 1–3 pixel highlights, dark navy outlines, chunky equipment, bright face/eye pixels, expressive body posture.
- Story panels: short captions, letterbox bars, visual focal point, brief holds, limited palette, quick fade/cut transitions.
- City: navy/steel skyline, broken cables, muted amber windows, red warnings.
- Forest: layered trunks and canopies, teal shadow, green fireflies, warm trail lights.
- Factory: heavy steel geometry, conveyor belts, industrial teal/grey, furnace orange and warning red.
- Every enemy threat must have a readable silhouette and a clear gameplay telegraph.

## Current original assets

All PNG sprites under `public/assets/sprites/` are generated with simple shapes by `scripts/generate_sprites.py` for this project. They are original prototype assets and can be regenerated. Background scenery and cutscene props are drawn from code in `public/js/art.js`.

Sprites: `human_amber.png`, `human_cyan.png`, `human_rose.png`, `robot_sentinel.png`, `robot_flyer.png`, `robot_creeper.png`, `giant_pursuer.png`, `crate.png`, `checkpoint_shelter.png`.

The current sprite work is a placeholder-quality first pass; upgrade with custom sprite sheets, walk/jump/carry/throw/climb/captured/rescue animations, enemy telegraphs, environmental tiles, and proper frame timings. Keep assets original.


## October 2026 campaign presentation

The owner authorized 2D anime comic presentation for story scenes. Original story-atlas.png contains four regional illustrations, generated with the built-in imagegen tool; exact prompt and provenance are in STORY_ART_PROMPT.md. Native-text caption cards reveal with three focused, aspect-preserving crops per story beat. Gameplay remains crisp pixel art. Reduced-motion media preferences suppress panel motion. No external reference images were used.

Sound cues are original Web Audio oscillator synthesis in public/js/audio.js, with no sampled recordings. Saved sound/volume controls and gesture unlocking are implemented; physical speaker/headphone review remains pending.

## Original procedural motion, October 30

Gameplay survivors now use original procedural pixel poses in art.js: idle, four-phase run, jump/fall, carry, throw/release, captured struggle, hit/kneel and down. Four coat palettes and numbered online labels distinguish participants. The original PNGs remain used for title/story staging. Robot patrol legs, grab arms, recovery sensors, scanner columns and named attack countdowns are drawn from original code. Hit/throw timers are authoritative visual metadata and do not change collision or heart rules. This is procedural animation, not a claimed external sprite sheet.
