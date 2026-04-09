import type { ConnectionStatus, ReconnectState } from "./connection.js";

export type MultiplayerPresenceState =
  | "active"
  | "self-reconnecting"
  | "opponent-disconnected"
  | "abandoned";

export interface PresenceSnapshot {
  state: MultiplayerPresenceState;
  selfConnected: boolean;
  opponentConnected: boolean | null;
  retryAttempt: number;
  nextRetryInSeconds: number | null;
  retryWindowRemainingSeconds: number | null;
  message: string | null;
}

export interface PresenceSnapshotInput {
  isSinglePlayer: boolean;
  hasRemotePlayer: boolean;
  connectionStatus: ConnectionStatus;
  opponentConnected: boolean | null;
  reconnectState: ReconnectState | null;
  reconnectFailed: boolean;
  now: number;
}

export function computePresenceSnapshot(
  input: PresenceSnapshotInput,
): PresenceSnapshot | null {
  if (input.isSinglePlayer || !input.hasRemotePlayer) {
    return null;
  }

  const normalizedOpponentConnected = input.opponentConnected ?? true;
  const nextRetryInSeconds = input.reconnectState?.nextAttemptAt === null || !input.reconnectState
    ? null
    : Math.max(0, (input.reconnectState.nextAttemptAt - input.now) / 1000);
  const retryWindowRemainingSeconds =
    input.reconnectState?.retryWindowEndsAt === null || !input.reconnectState
      ? null
      : Math.max(0, (input.reconnectState.retryWindowEndsAt - input.now) / 1000);

  let state: MultiplayerPresenceState = "active";
  if (input.reconnectFailed) {
    state = "abandoned";
  } else if (input.connectionStatus === "reconnecting") {
    state = "self-reconnecting";
  } else if (!normalizedOpponentConnected) {
    state = "opponent-disconnected";
  }

  let message: string | null = null;
  if (state === "self-reconnecting") {
    message = `Reconnecting to match (attempt ${input.reconnectState?.attempt ?? 0})`;
  } else if (state === "opponent-disconnected") {
    message = "Opponent disconnected. Waiting for return.";
  } else if (state === "abandoned") {
    message = "Match could not be recovered.";
  }

  return {
    state,
    selfConnected: input.connectionStatus === "connected",
    opponentConnected: normalizedOpponentConnected,
    retryAttempt: input.reconnectState?.attempt ?? 0,
    nextRetryInSeconds,
    retryWindowRemainingSeconds,
    message,
  };
}
