## 1. Refactor Client Action Submission

- [ ] 1.1 Remove `queuedActions` array and `actionsSentThisTick` flag from `main.ts`
- [ ] 1.2 Remove the "Execute Actions" button creation and click handler in `createUI()`
- [ ] 1.3 Remove the `updateActionPreview()` function and its calls
- [ ] 1.4 In the pointerdown handler, replace pushing to `queuedActions` with immediate submission when connected, or append to a local pending-actions buffer when connectivity is unavailable
- [ ] 1.5 Flush pending actions in order when the WebSocket connection returns to `connected`

## 2. Update HUD

- [ ] 2.1 Remove the "Queued: N action(s)" display and queued action list from `updateHUD()`
- [ ] 2.2 Remove the "Actions queued for next tick" message
- [ ] 2.3 Remove HUD copy that claims an action was submitted or queued successfully
- [ ] 2.4 Remove the queued actions count from the HUD

## 3. Cleanup

- [ ] 3.1 Remove the `controls` div and execute button HTML from `createUI()`
- [ ] 3.2 Remove the `execute-btn` element reference and related code from `updateActionPreview()`
- [ ] 3.3 Verify all references to `queuedActions` and `actionsSentThisTick` are removed
