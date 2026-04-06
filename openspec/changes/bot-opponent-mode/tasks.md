## 1. Bot Match Setup

- [ ] 1.1 Add a solo bot match entry point that starts one human player against one AI-controlled opponent.
- [ ] 1.2 Wire the client mode selection or startup flow to launch the bot match configuration.

## 2. Bot Decision Logic

- [ ] 2.1 Implement deterministic opponent decision logic that evaluates the current game state and produces candidate actions.
- [ ] 2.2 Route bot-generated actions through the existing validation and action queue pipeline.
- [ ] 2.3 Ensure bot action selection uses stable ordering so identical states produce identical results.

## 3. Verification

- [ ] 3.1 Add tests covering bot match setup, legal action generation, and deterministic output.
- [ ] 3.2 Run the relevant test suite and fix any failures introduced by the bot mode.
