# Start here in Codex

Tiny Teamwork: The Last Spark is a fifteen-stage solo/co-op browser game. The owner requested a major gameplay replacement on October 30, after the earlier overnight release. Preserve the new revision modules; do not restore old shelters or indestructible bosses.

Play: https://tiny-teamwork-last-spark.onrender.com
Source: https://github.com/MummblingThinker/1k-Game-Project-Only-AI-

Use Render My Workspace. GitHub connection: MummblingThinker, admin/push access. Exact live/source commits, deployment IDs, pending checks and archive state are in docs/PROJECT_STATUS.md.

## Authorization and cutoff

The owner authorized this revision until 13:00 America/New_York October 30, 2026 (17:00 UTC). The latest follow-up supersedes both earlier 06:00 and 11:00 cutoffs. Save the final handoff and stop at the current cutoff. A historical deadline is not authorization for another autonomous session.

Physical-device acceptance remains deferred. Never invent human testing or contest submission. No submission has been performed.

## Current design

- Flags replace save rooms, restore one heart once up to the original party cap (three solo) and record in-run respawn points. Solo death with hearts left respawns there. Flags can revive one downed co-op survivor.
- Relay and weight bridges must be used; gaps exceed ordinary jump reach. Pressure bridges require sustained weight, with only a short release grace. Yellow puzzle weights are durable and recover from pits.
- Ground robots patrol/turn/charge, with visible facing. Flying scan attacks remain. Thrown debris destroys small robots, damages medium robots, and only stuns big normal robots. Most debris breaks.
- Authored vertical city/forest/factory routes, biome props/enemies, breakable barriers, water, conveyors and wildlife. Level 1 is 960 units, normals 2880, milestones 5280/5760/6240. Giant normal crossing about 120 seconds; no boss-zone entry.
- Level 5: climb and throw at Warden, then final floor/exit. Level 10: chainsaw tree maze and lethal falling-tree finale. Level 15: rising lava/three console phases, lasers/platform break, left breach/leap and leftward machinery escape. Boss deaths use pixel animation.
- Level 11 contains forest-to-covered-building-to-factory with protected overhead swarm. Chapters occur after 5/10/11/15. Eleven original triptychs provide 33 different illustrations.

Latest follow-up: W/S deliberately climbs ladders and release holds position; facade fronts are walkable scenery, solid tree trunks block passage. Giant contact ends the run with at most two survivors; with 3+ it spends one heart and returns the caught teammate if hearts remain. Title menus, original zone music, detailed scenery and bridge art are implemented with automated browser acceptance. README.md and docs/PRACTICE_GUIDE.md describe the current controls; exact final public results are in PROJECT_STATUS and QA_LOG. docs/CAMPAIGN_BUILD.md and old test files preserve historical rules; they are not current acceptance criteria.

## Resume discipline

1. Read TASK_LIST.md, QA_LOG.md, docs/PROJECT_STATUS.md, AGENTS.md, PRIORITY_ROADMAP.md and the practice guide. Root task/QA files are canonical.
2. Inspect actual source/live state. Do not redeploy into active public acceptance rooms.
3. Run npm test. Work on a coherent task, then run relevant current tests. The revision-* scripts verify this replacement; old shelter/indestructible contracts are historical.
4. Record exact commit, command/workflow/job, pass/fail/replay and limitations. Browser tests use ordinary inputs; visual fixtures are not live gameplay evidence.
5. Reconcile the task board and handoff, and generate release/TinyTeamwork-source.zip with python scripts/package-release.py --verify at the end. Do not redeploy for documentation-only changes.

MVP-03 still requires the owner's two-device/separate-network acceptance. MVP-04 requires human eligibility/preview review and personal submission. Uninstructed onboarding, physical mobile/display performance, human balance and audio review remain separate. npm run check:submission should remain nonzero while those required fields are false.