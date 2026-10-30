# Implementation status

Updated October 30, 2026, 07:17 UTC.

GitHub connection MummblingThinker has repository write access. Render My Workspace (tea-dbhakd8u01pc73ap1ou0), service srv-dbhnfcm1egvs73817n4g. Public game: https://tiny-teamwork-last-spark.onrender.com.

## Live build and deployment hold

LIVE 1f92e6622c015a1421ab3992c2412b6a90627b76, Render dep-dbi3u8ks728c73c99oi0, finished 06:55:27 UTC. All five regression jobs 41016386596 PASS. Includes distinct cached robot frames, shelter ladder, 16-pose survivors and visible Colossus core terminal.

Do not redeploy while public campaign run 41017210764 has active rooms. Test source 6e1a7fbf, live 1f92e662; two-player job 123936155114 in progress, four-player job 123936155451 queued, sequential matrix. Public short browser runs 41015527881 and 41017210822 failed narrow ladder/relay positioning waits; HTTPS/assets and WSS tests passed. Settled alignment and diagnostics added, rerun still needed.

## Current main and pending work

Main 719ff205c2d36a8b31749fe2fff1faa7c44810e2 fixes online Escape retaining held touch. CI 41017800136 all five jobs PASS. Pending local additions: renderer benchmark/workflow, stronger below-roof ladder-start assertion, evidence index and this handoff. Publish after checks. No gameplay rules changed by benchmark/harness.

Full browser matrix 41017210744 on 6e1a7fbf PASS at 1/2/3/4; earlier 41013264131 also PASS all 15/default stories without game-over replay. Exact job logs still need collecting for latest matrix. Extended random audit PASS 1200 cases/5,074,324 ticks. Single-survivor audit PASS all 45 unchanged 2/3/4-player maps. Abuse limits and isolation PASS; QA-009 verified. Board evidence audit covers 28 existing verified tasks; SYS-04 added after audit.

## Active and completed local checks

- ACTIVE 1244: two-hour eight-room/32-client soak on ladder source, started 06:07 UTC; artifacts/soak-ladder-8-7200.log. Expected about 08:08 UTC. Do not restart.
- COMPLETE 4272: extended seeded audit, artifacts/adversarial-1200-7200.log.
- COMPLETE 17135: npm test after mixed-input fix, artifacts/mixed-input-test.log.
- COMPLETE 66167: clean source extraction PASS, 94 files, artifacts/release-verify-0708.log; archive will be refreshed at cutoff.
- Earlier one-hour soak PASS: 265080 checks/688 resets, peak RSS 195.04 MiB, cleanup zero rooms. Local stability, not Render capacity.

## Features and limits

15 authored stages; normal maps 3x reference, milestone maps 5.5/6/6.5x. Pursuer crosses normal maps in 120 seconds after an eight-second warning and cannot enter boss zones. Distinct Level 5 relay sequence, Level 10 covered survival encounter and Level 15 background Colossus/core cycles. Water, conveyors, breakable salvage, pressure bridges, optional memories, carry/throw/stack/rescue, shared hearts/revival and spectator controls. Original anime comic atlases, cached pixel characters/machines, native captions, saved sound/visual options, touch controls and stage reports.

Physical-device/network acceptance, human difficulty/onboarding and speaker/headphone review remain deferred. MVP-03/MVP-04 are not falsely marked verified. No contest submission. One Node process, rooms 1-4, join before start; disconnect clears identity/new lobby, no persistent reconnect/cloud save.

Continue until 06:00 America/New_York October 30 (10:00 UTC). Before cutoff refresh final cover/archive, run appropriate checks, publish tested changes and save exact handoff. TASK_LIST.md is canonical; QA_LOG.md preserves passes and failures.
