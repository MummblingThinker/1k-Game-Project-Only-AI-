# Asset provenance

The small PNG sprites were generated for this project by scripts/generate_sprites.py. Gameplay backgrounds, survivor poses, robot tells and effects are original JavaScript canvas artwork. Audio is synthesized with WebAudio; no recordings are bundled.

The survivor animation sheet is generated once at runtime from the original pixel drawing code in public/js/art.js and reused for rendering. It contains four palettes and sixteen poses with four frame slots each, including climbing, running and airborne carry/throw variants. Browser QA exports the exact sheet for inspection; no external sprite sheet is used.

The two original anime comic atlases were created for this project with the built-in imagegen tool. The companion atlas uses the first atlas only as its character/style reference. Files: public/assets/story/story-atlas.png and public/assets/story/story-details.png. Exact prompts and creation notes are in STORY_ART_PROMPT.md and STORY_DETAILS_PROMPT.md. Captions are native HTML, not text baked into images.

No ripped game sprites, third-party photographs, franchise characters, logos, fonts or soundtracks were intentionally incorporated. These provenance notes describe the creation workflow; they do not claim exclusive legal ownership of generated artwork.
