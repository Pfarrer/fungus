## Context

The current solo flow is useful for loading scenarios and exercising the game, but it does not provide an active opponent. This change adds a true local opponent mode so single-player matches feel like a game, not just a sandbox.

The design must stay compatible with the existing deterministic tick-based simulation and the current action-validation pipeline.

## Goals / Non-Goals

**Goals:**
- Add a local bot opponent for solo matches.
- Generate only legal opponent actions.
- Keep bot decisions deterministic for identical state and configuration.
- Reuse existing game rules instead of introducing a parallel rules engine.

**Non-Goals:**
- Train or ship an ML model.
- Add multiplayer AI assistance.
- Redesign the combat or resource systems.
- Add difficulty progression beyond a single baseline bot.

## Decisions

1. Use a deterministic heuristic bot instead of ML or random choice.
   - Rationale: A heuristic bot is easier to test, cheaper to run, and stable across environments.
   - Alternatives considered: ML-driven opponent, random scripted opponent. Both were rejected because they are harder to validate and less predictable.

2. Feed bot decisions through the same action validation and tick flow as human input.
   - Rationale: This keeps rule enforcement centralized and prevents the bot from bypassing normal gameplay constraints.
   - Alternatives considered: Direct state mutation from bot logic. Rejected because it would duplicate rule logic and increase bug risk.

3. Keep bot behavior local to the client/game runtime.
   - Rationale: The feature is for solo play and should not introduce a server dependency or network round-trip.
   - Alternatives considered: Remote inference or server-side bot control. Rejected because they add latency and operational complexity without a clear benefit.

4. Make bot action choice order stable and deterministic.
   - Rationale: The game already depends on deterministic simulation; bot logic must follow the same rule so repeated states produce repeated outcomes.
   - Alternatives considered: Time-based randomness or unordered iteration. Rejected because they undermine reproducibility.

5. Keep the bot's first version simple and extensible.
   - Rationale: A small, understandable decision pipeline can be tuned later without changing the player-facing contract.
   - Alternatives considered: A highly optimized multi-layer strategy engine. Rejected as unnecessary for the initial release.

## Risks / Trade-offs

- [Bot feels too weak or too predictable] -> Start with a clear heuristic baseline and leave tuning hooks for later.
- [Determinism breaks due to unstable iteration order] -> Sort candidate actions and traverse game entities in a fixed order.
- [Bot logic slows ticks] -> Keep the decision pass linear or near-linear in entity count and avoid expensive search.
- [Mode selection may need UI changes outside the game loop] -> Keep the mode entry point isolated so the UI can evolve independently.

## Migration Plan

1. Add the bot decision module and wire it into solo match setup.
2. Route bot-generated actions through the existing validation path.
3. Expose the mode in the client without changing sandbox/scenario behavior.
4. Verify deterministic outcomes with repeatable tests.

Rollback is straightforward: disable the bot mode entry point and leave the existing sandbox flow unchanged.

## Open Questions

- Should the first bot version prioritize expansion, aggression, or survival when trade-offs conflict?
- Do we want one baseline bot or a small set of difficulty presets in the initial release?
