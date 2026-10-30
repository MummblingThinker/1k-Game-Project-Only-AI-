# Asset provenance

The small PNG sprites were generated for this project by scripts/generate_sprites.py. Gameplay backgrounds, survivor poses, robot tells and effects are original JavaScript canvas artwork. Audio is synthesized with WebAudio; no recordings are bundled.

The survivor animation sheet is generated once at runtime from the original pixel drawing code in public/js/art.js and reused for rendering. It contains four palettes and sixteen poses with four frame slots each, including climbing, running and airborne carry/throw variants. Browser QA exports the exact sheet for inspection; no external sprite sheet is used.

The robot sheet is generated from original pixel code in public/js/robot-art.js: four machine silhouettes, six state poses and four frame slots each. Hooked grabber hands, sentinel shields, scanner nacelles and bomber tracks/vents distinguish hazards without relying only on color. No external robot sheet is used.

The two original anime comic atlases were created for this project with the built-in imagegen tool. The companion atlas uses the first atlas only as its character/style reference. Files: public/assets/story/story-atlas.png and public/assets/story/story-details.png. Exact prompts and creation notes are in STORY_ART_PROMPT.md and STORY_DETAILS_PROMPT.md. Captions are native HTML, not text baked into images.

No ripped game sprites, third-party photographs, franchise characters, logos, fonts or soundtracks were intentionally incorporated. These provenance notes describe the creation workflow; they do not claim exclusive legal ownership of generated artwork.

October 30 revision: eleven new original triptychs in public/assets/story/revision/ provide 33 distinct illustrations. They replace the older atlas crops in the active story. Built-in image-generation prompts and provenance are recorded in OCTOBER_REVISION_ART.md; JPEG encoding changed format only. Revised scenery, themed debris, directional ground robots, boss chassis and pixel death cards are original Canvas code in public/js/revision-art.js. The old robot sheet and atlas files remain historical assets.

submission/cover.jpg is an unedited 1440×960 screenshot from actual public solo gameplay in Chromium, captured during the Level 5 Warden fight (0606bcb7, workflow 41067528871/job 124102766580). It is not a detached render fixture.