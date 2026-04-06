## Why

Single-player currently behaves like a sandbox and is useful for testing, but it does not feel like a complete game mode. Adding a real bot opponent gives solo play a clear goal and makes the mode useful for practice, replayability, and onboarding.

## What Changes

- Add a local bot-controlled opponent that can play full matches against the human player.
- Generate opponent actions automatically each tick so the player is responding to an active adversary, not a static scenario.
- Keep sandbox/scenario play available alongside the new opponent mode.
- Introduce a foundation for tuning bot behavior later without changing the player-facing contract.

## Capabilities

### New Capabilities
- `bot-opponent-mode`: local single-player matches where an AI controls the opposing side and produces valid actions during simulation.

### Modified Capabilities

## Impact

- Game loop and simulation flow for bot action generation.
- Client mode selection and match setup.
- AI decision logic and any supporting data used to choose actions.
- Test coverage for deterministic behavior and match outcomes.
