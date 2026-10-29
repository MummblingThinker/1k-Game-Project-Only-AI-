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
