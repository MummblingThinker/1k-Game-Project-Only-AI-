# AI Take Over release handoff

Play: https://tiny-teamwork-last-spark.onrender.com

## Owner direction

The owner resumed after the historical 1 PM cutoff, requested a submittable game and full campaign checks, and explicitly declined physical multiplayer testing. Finish automated validation and submission materials without requesting owner playtesting. Physical-device/human-balance tests remain unperformed; do not fabricate them. No contest submission or personal eligibility attestation has been performed.

## Source and service

GitHub: MummblingThinker, admin/push access to MummblingThinker/1k-Game-Project-Only-AI-. Render: My Workspace (tea-dbhakd8u01pc73ap1ou0), service srv-dbhnfcm1egvs73817n4g, one free Node instance in Virginia with manual deploys.

Live runtime **4c0324439632370d5912157926ae1093ef7cc55f**, deploy **dep-dbijkjnlk1mc73etds10**, LIVE October 31 00:46:39 UTC (October 30 evening Eastern). Final test source **11e7e487b74f2769a357113c62705e990bb1189c** uses identical production code; subsequent handoff commits need no deployment. Never redeploy into active acceptance rooms.

This release adds one shared snapshot encoding per current-client group, compatible personalized packets for older tabs, client identity normalization, a ten-second connection timeout, and separated Pause/Settings controls. Gameplay difficulty, hearts, enemies and boss rules are unchanged. The campaign harness now obtains identity from the browser because roomJoined can arrive during HTTP polling before its WebSocket observer starts; earlier harness failures are retained in QA_LOG.md.

## Completed submission validation

- CI 41152714415 ALL EIGHT PASS: all 15 stages at 1/2/3/4 players, every default chapter/ending, first attempts without game-over replays; Chrome/Firefox/WebKit and rules/network/disconnect checks pass.
- Public workflow 41152714553: browser/controls and solo Warden pass. Full hosted two-player job 124392967808 passes all 15/default ending first attempts, shared state and own-room cleanup. Full hosted four-player job 124392967823 also passes all 15/default ending and cleanup, with one recorded Level 10 chainsaw replay and 21025 matching snapshots. Public workflow ALL FOUR PASS.
- Local npm test, 45 last-survivor routes, mixed legacy/current WSS ladder/victory/host transfer, disconnect recovery and malformed-input/rate-limit isolation pass.
- Ten-minute current-client soak passes: four rooms/16 clients, 52096 audits, eight resets, peak RSS 107.82 MiB, no failures and zero rooms after cleanup.
- Current public title, toolbar, forest/factory routes, all comic layouts, boss death animations and detailed bridges visually reviewed. Chromium/WebKit audio contexts run; no physical listening claim.

## Implemented game

Fifteen stages across city, forest and factory; 33 original comic illustrations; solo plus 2-4 player authoritative co-op. Title menu provides single player/story/resume/stage select, multiplayer room create/join/invite/ready/start and Settings. Saved zone audio, volume, reduced motion and reduced effects are available.

Flags heal once to the original cap and save in-run respawn points; solo maximum is three hearts. W/S deliberately climbs and holds ladders; roofs support characters while recessed building facades are walkable. All Level 10 ladders sit outside solid trunks. Long relay/weight bridges, themed throwable/breakable debris, facing patrol/charge robots, flying scans and distinct biome routes remain implemented.

Level 5 is climb/throw Warden combat; Level 10 is the chainsaw tree maze with prompt lethal falling-tree finale; Level 15 is lava/consoles/platform collapse followed by leftward machinery escape. The roaming giant cannot enter boss arenas. Giant contact ends one/two-survivor runs; with at least three alive a caught survivor spends one heart and returns if hearts remain. Normal-map crossing is about two minutes.

## Submission assets and limits

submission/README.md contains the title, 463-character description, game URL, controls and form link. submission/cover.jpg is an unedited 1440x960 actual public solo Warden screenshot from 41152105724/job 124391143773, Git blob cc72c0b5386e4c4e0c02ce1cf2c87acdc8f6f594. Source archive and manifest are in release/. Final source/submission ZIPs are regenerated and reconciled; release/source-manifest.json is the definitive checksum/file list.

The owner waived physical testing as a preparation gate. Eligibility review and actual submission remain personal actions, not automated test results. Official rules rechecked October 30 specify October 30 at 11:59 PM Pacific (October 31 at 2:59 AM Eastern); use this earlier deadline despite the old mission-page discrepancy.

Free hosting can take time to wake. Rooms are in one process and vanish on restart; disconnect needs a new lobby. Solo storage resumes a stage, not a saved flag after reload. Physical mobile/audio experience and human difficulty balance are unverified. No native gamepad support or cloud save. Historical evidence and failures remain in QA_LOG.md; do not restore superseded shelters or indestructible boss rules.

## AI Take Over branding and concept opening

Owner requested a fresh concept chase illustration and separate short opening, then renamed the game AI Take Over. Runtime 84dd904b is live via deploy dep-dbiktb4s728c73fjmrqg. New concept cover is submission/cover-concept.png; opening uses public/assets/key-art.jpg, captions, slow camera drift, keyboard/button skip and reduced-motion support. Three browser engines passed. Existing game URL and storage keys remain intact. Source/submission archives use AI-Take-Over filenames. See QA_LOG.md for public validation and network-test timing correction.

Final public art/branding acceptance: 41159249101 / 124412880251 PASS. Entry validated; renamed source/submission archives regenerated. No contest entry submitted.

Title-background update: dedicated original city/giant robot environment and readable menu styling. Current runtime 61c74bd1 LIVE via dep-dbil61flk1mc73f1koe0. Public acceptance 41160227831 / 124415960089 PASS; final cross-browser rerun 41160397782 follows the hover-stability correction. The prior campaign physics/network evidence remains unchanged.

Final title UI verification: all three browser engines PASS in 41160397782. TITLE-ART-01 complete.
