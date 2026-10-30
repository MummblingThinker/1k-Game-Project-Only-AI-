# October 30 gameplay revision handoff

Owner cutoff: October 30, 2026 at 11:00 America/New_York (15:00 UTC). Stop autonomous work at that cutoff. The requested replacement is implemented and deployed; the remaining acceptance is human/device testing, not more unattended feature work.

Play: https://tiny-teamwork-last-spark.onrender.com

GitHub connection is MummblingThinker with admin/push access to MummblingThinker/1k-Game-Project-Only-AI-. Render uses My Workspace (tea-dbhakd8u01pc73ap1ou0), service srv-dbhnfcm1egvs73817n4g. Live runtime is **913a4342c04552849b6fe696c18ea26cc2ba0017**, deploy **dep-dbiada1srm7s73dmsht0**, live since 14:16:47 UTC. Subsequent source commits change tests, cover and documentation only; do not redeploy for them.

## Implemented gameplay

Flags replace save rooms, grant one heart once, and save solo/party-wipe respawn points. Crossing a flag while jumping also saves. Long relay and pressure bridges require their mechanisms; reusable yellow weights reset after pit loss. Most debris shatters after throwing. Small robots die, medium robots take several hits, and big normal robots only stun. Ground robots face, patrol and charge with visible lights; flying scans remain.

Fifteen authored district sequences combine street/rooftop/subway, canopy/cabin/water, and factory towers/conveyors, with biome props, wildlife and more enemies. Level 1 is 960 units; normal maps 2880; milestones 5280/5760/6240. Giant traversal is about 120 seconds per normal map after waking; it cannot enter boss arenas or the leftward factory escape.

Level 5 climbs an extending tower, damages the Warden with thrown debris, then reaches a final exit floor. Level 10 is a chainsaw tree maze with ladders/wall-jumps and a falling tree lethal to both boss and players. Level 15 escalates lava/lasers/platform breaks through three consoles, then a robot leap and leftward machinery escape. Optional platforms break after a warning; all essential ladder routes remain. Boss retry resets encounter geometry and preserves approach relays. Each boss has a distinct pixel death animation/card that continues after victory freezes simulation time.

Level 11 has the protected overhead swarm and forest-to-building-to-factory transition. Eleven original triptychs provide 33 different anime illustrations, with chapters after 5/10/11/15. Provenance: [OCTOBER_REVISION_ART.md](OCTOBER_REVISION_ART.md). The draft cover is an unedited public solo Warden screenshot, 1440x960.

## Verification and limits

Runtime 913a4342 passed all eight CI jobs in run 41069764037: current rules/network/disconnect checks, all 60 ordinary-input routes, Chromium/Firefox/WebKit browser checks, and full 15-stage browser campaigns at one/two/three/four players. Local last-survivor checks passed all 45 original-party worlds. Final local npm test includes an explicit pursuer-exclusion regression for the leftward factory corridor.

Public runtime-matched two-player full campaign passed run 41070578466/job 124113263592, all 15 stages/default chapters/ending, with one recorded Level 14 replay. Solo/four-player jobs in that run exhausted the test's two-replay allowance on patrol encounters and failed; these are retained in QA_LOG.md. An improved ordinary-input test controller recognizes adjacent/behind robots; no game difficulty or state was changed to pass. Follow-up run 41071836457 passed public browser/assets/comics and focused two/four-player Level 15 encounters (two-player required one replay); its complete solo campaign also passed all 15/default chapters/ending first attempt (job 124117705634). Latest test-source 2ffcfc04 CI 41071836462 passed all eight jobs again: two/three/four campaigns first attempts, solo with one Level 4 replay. Earlier 0606bcb7 public solo/four full campaigns also passed. Do not confuse focused boss tests with full campaigns.

Final-runtime local soak passed: 901.614 seconds, four rooms/16 actual Socket.IO clients, 80956 audits, 20 resets, 302172 messages, peak server RSS 144.49 MiB and zero rooms after cleanup. An earlier 1801.588-second revision soak also passed. These are local stability results, not Render load-capacity claims.

Current tests use scripts/revision-*.mjs. Gameplay drivers send ordinary inputs and observe state; they do not mutate live gameplay. Detached rendering scenes are explicitly visual fixtures. Older tests/design documents retain superseded contracts and are historical. Exact failures, replays, source hashes and final follow-up results are in [QA_LOG.md](../QA_LOG.md).

Physical mobile/separate-network acceptance, first-time human onboarding, difficulty balance, human animation playback and physical audio review remain deferred. Keyboard/touch supported; no native gamepad mapping. Rooms are in one process; disconnect clears identity, server restart clears rooms, no cloud save. Solo stage storage does not retain flag progress after reload. Free Render cold starts remain possible.

## Release artifacts and next steps

Current source archive: release/TinyTeamwork-source.zip; definitive checksum and file hashes: release/source-manifest.json. The 130-file package passed python scripts/package-release.py --verify: ZIP integrity and npm test in a fresh dependency-free extraction. The final copy is regenerated with the saved handoff, and the manifest is definitive. Installed-dependency and public checks are separate evidence above. The original downloaded archive is preserved.

MVP-03 remains IMPLEMENTED_UNVERIFIED solely for the explicitly required separate physical device/network session. MVP-04 remains a draft pending human review/submission; no contest submission was performed. Next owner session: play the public URL, review difficulty/readability and test another device/network. Do not restart the obsolete shelter/indestructible-boss implementation or infer unfinished coding from historical unchecked requirements.
