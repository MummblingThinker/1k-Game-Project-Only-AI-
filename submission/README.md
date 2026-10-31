# Submission package - personal review and submission remain

Title: AI Take Over

Description (463/500 characters):

Tiny survivors. Giant machines. Escape together. A solo or 2-4-player browser adventure through 15 city, forest and factory stages. Share a room code, carry friends over danger, throw debris at robots and race a relentless giant. Three distinct bosses and 33 original anime comic panels tell a story of freedom versus control. Built with OpenAI; the hardest challenge was keeping shared physics, hearts and boss encounters synchronized across independent players.

Play: https://tiny-teamwork-last-spark.onrender.com

The game includes all 15 stages, solo/up to four-player co-op, shared hearts and flags, three redesigned bosses, throwable debris/animals, power-cell stun bursts and original anime comic chapters. Runtime 9f2e2f60 passed complete automated browser campaigns at 1/2/3/4 players (41195415210); solo needed one Level 11 replay. Public bosses/features passed in 41195488509, whose Level 11 follow-on failed; the focused retest 41196912000 passed Level 10 with two replays and Level 11 first attempt. Boss audio, timing HUD and detailed Colossus art passed all three browser engines. See QA_LOG.md for exact failures and successes. Physical-device/network testing and human difficulty review remain unperformed; high-latency stress still has combat-controller losses.

The requested concept cover is submission/cover-concept.png (1536 by 1024, 3:2), an original anime/comic chase illustration also used in the short game opening. It is concept art, not a gameplay screenshot.

An alternative actual public solo Warden fight (source 4c032443, run 41152105724/job 124391143773) is saved at submission/cover.jpg (1440 by 960, 3:2). The source archive is generated at release/AI-Take-Over-source.zip with a SHA256 manifest. No contest entry has been submitted.

The owner explicitly waived physical multiplayer testing as a preparation requirement. It remains unperformed, not a required task for the owner. Run npm run check:submission to validate preparation assets and automated evidence. Review the description/link/cover and your personal eligibility, then submit through your own Handshake account. Do not set humanReviewed, humanSubmitted or physical-playtest fields based on automated tests.

Submission form: https://app.joinhandshake.com/learn/create-a-multiplayer-game-8d7d59b5/submit

Start Story introduces the city escape. Multiplayer creates a six-character room or invite link; guests select Ready, then the host starts. Stage select offers direct access to the climbing Warden (5), chainsaw forest chase (10) and background Colossus showdown (15). Move A/D or arrows; Space jumps; W/S climbs; E interacts or picks up debris; F carries/throws; Q drops. Settings includes saved volume, reduced motion and fewer effects. No install or game account is required.

The free host may need time to wake. Rooms are lost on server restart; a disconnected player needs a new lobby. Solo progress resumes at the stage, while flags apply within the current run. Automated testing does not prove human difficulty balance or every physical device.

The official rules rechecked October 30 specify October 30, 2026 at 11:59 PM Pacific (October 31 at 2:59 AM Eastern). The earlier mission page showed October 31; use the earlier official deadline. Source links remain in entry.json. Required entry fields are title, cover, description and URL; judges give equal weight to execution, creativity, value and polish.

Continue from docs/PROJECT_STATUS.md and AGENTS.md. The owner authorized campaign/art/testing expansion while waiving owner physical testing; the older single-level-only scope is superseded for this session.

Final overnight test-controller CI 41196911990 cleared all 15 stages and the default ending first attempt at every party size. Final 40-minute soak PASS: three concurrent four-player boss rooms, 68 clears, 2 recorded gameovers, 149553 matching snapshot checks, no state disagreement, peak server RSS 147.64 MiB, and all rooms cleaned up. The deployed source remains 9f2e2f60; later commits contain testing/documentation only.
