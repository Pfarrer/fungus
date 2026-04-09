import { describe, it, expect } from "vitest";
import { computePresenceSnapshot } from "./presence.js";

describe("computePresenceSnapshot", () => {
  it("tracks active to self-reconnecting to active transitions", () => {
    const active = computePresenceSnapshot({
      isSinglePlayer: false,
      hasRemotePlayer: true,
      connectionStatus: "connected",
      opponentConnected: true,
      reconnectState: null,
      reconnectFailed: false,
      now: 5_000,
    });

    expect(active?.state).toBe("active");
    expect(active?.selfConnected).toBe(true);
    expect(active?.opponentConnected).toBe(true);

    const reconnecting = computePresenceSnapshot({
      isSinglePlayer: false,
      hasRemotePlayer: true,
      connectionStatus: "reconnecting",
      opponentConnected: true,
      reconnectState: {
        attempt: 1,
        nextAttemptAt: 6_000,
        retryWindowEndsAt: 35_000,
        exhausted: false,
      },
      reconnectFailed: false,
      now: 5_000,
    });

    expect(reconnecting?.state).toBe("self-reconnecting");
    expect(reconnecting?.retryAttempt).toBe(1);
    expect(reconnecting?.nextRetryInSeconds).toBe(1);

    const recovered = computePresenceSnapshot({
      isSinglePlayer: false,
      hasRemotePlayer: true,
      connectionStatus: "connected",
      opponentConnected: true,
      reconnectState: null,
      reconnectFailed: false,
      now: 5_500,
    });

    expect(recovered?.state).toBe("active");
    expect(recovered?.message).toBeNull();
  });

  it("distinguishes opponent-disconnected and abandoned states", () => {
    const opponentLeft = computePresenceSnapshot({
      isSinglePlayer: false,
      hasRemotePlayer: true,
      connectionStatus: "connected",
      opponentConnected: false,
      reconnectState: null,
      reconnectFailed: false,
      now: 2_000,
    });

    expect(opponentLeft?.state).toBe("opponent-disconnected");
    expect(opponentLeft?.opponentConnected).toBe(false);

    const abandoned = computePresenceSnapshot({
      isSinglePlayer: false,
      hasRemotePlayer: true,
      connectionStatus: "disconnected",
      opponentConnected: true,
      reconnectState: null,
      reconnectFailed: true,
      now: 9_000,
    });

    expect(abandoned?.state).toBe("abandoned");
    expect(abandoned?.selfConnected).toBe(false);
  });

  it("updates retry countdown values as time advances", () => {
    const early = computePresenceSnapshot({
      isSinglePlayer: false,
      hasRemotePlayer: true,
      connectionStatus: "reconnecting",
      opponentConnected: true,
      reconnectState: {
        attempt: 2,
        nextAttemptAt: 8_000,
        retryWindowEndsAt: 12_000,
        exhausted: false,
      },
      reconnectFailed: false,
      now: 7_000,
    });

    const late = computePresenceSnapshot({
      isSinglePlayer: false,
      hasRemotePlayer: true,
      connectionStatus: "reconnecting",
      opponentConnected: true,
      reconnectState: {
        attempt: 2,
        nextAttemptAt: 8_000,
        retryWindowEndsAt: 12_000,
        exhausted: false,
      },
      reconnectFailed: false,
      now: 7_600,
    });

    expect(early?.nextRetryInSeconds).toBe(1);
    expect(late?.nextRetryInSeconds).toBeCloseTo(0.4, 5);
    expect(late?.retryWindowRemainingSeconds).toBeCloseTo(4.4, 5);
  });

  it("bypasses presence UI in single-player mode", () => {
    expect(computePresenceSnapshot({
      isSinglePlayer: true,
      hasRemotePlayer: false,
      connectionStatus: "connected",
      opponentConnected: null,
      reconnectState: null,
      reconnectFailed: false,
      now: 1_000,
    })).toBeNull();
  });
});
