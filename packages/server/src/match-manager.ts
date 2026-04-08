import { Match } from "./match.js";
import type { ClientConnection } from "./protocol.js";
import type { GameAction, GameConfig } from "@fungus/game";
import { generateGameCode } from "./game-code.js";

const HOST_RESERVATION_TIMEOUT_MS = 60_000;

export class MatchManager {
  private matches: Map<string, Match> = new Map();
  private codeToMatchId: Map<string, string> = new Map();
  private matchIdToCode: Map<string, string> = new Map();
  private reservationTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();

  handleConnect(client: ClientConnection, config?: GameConfig): void {
    let match = this.matches.get(client.matchId);

    if (!match) {
      match = new Match(client.matchId, config);
      this.matches.set(client.matchId, match);
    }

    const playerName = client.playerName || client.playerId;
    match.setPlayerName(client.playerId, playerName);

    match.addPlayer(client);
    match.tryStart();

    this.clearReservationTimer(client.matchId);
  }

  handleDisconnect(matchId: string, playerId: string): void {
    const match = this.matches.get(matchId);
    if (!match) return;

    match.removePlayer(playerId);

    if (match.playerCount() === 0) {
      match.destroy();
      this.removeCodeMapping(matchId);
      this.matches.delete(matchId);
    }
  }

  queueActions(matchId: string, playerId: string, actions: GameAction[]): void {
    const match = this.matches.get(matchId);
    if (!match) return;
    match.queueActions(playerId, actions);
  }

  getMatch(matchId: string): Match | undefined {
    return this.matches.get(matchId);
  }

  createMatchWithCode(config?: GameConfig): { code: string; matchId: string } {
    let code: string;
    do {
      code = generateGameCode();
    } while (this.codeToMatchId.has(code));

    const match = new Match(code, config);
    this.matches.set(code, match);
    this.codeToMatchId.set(code, code);
    this.matchIdToCode.set(code, code);

    const timer = setTimeout(() => {
      const mappedMatchId = this.codeToMatchId.get(code);
      if (!mappedMatchId) return;
      const reservedMatch = this.matches.get(mappedMatchId);
      if (reservedMatch && reservedMatch.playerCount() === 0) {
        reservedMatch.destroy();
        this.removeCodeMapping(mappedMatchId);
        this.matches.delete(mappedMatchId);
      }
      this.reservationTimers.delete(code);
    }, HOST_RESERVATION_TIMEOUT_MS);
    this.reservationTimers.set(code, timer);

    return { code, matchId: code };
  }

  lookupCode(code: string): { valid: boolean; matchId?: string } {
    const matchId = this.codeToMatchId.get(code.toUpperCase());
    if (!matchId) return { valid: false };
    return { valid: true, matchId };
  }

  private removeCodeMapping(matchId: string): void {
    const code = this.matchIdToCode.get(matchId);
    if (code) {
      this.codeToMatchId.delete(code);
      this.matchIdToCode.delete(matchId);
    }
    this.clearReservationTimer(matchId);
  }

  private clearReservationTimer(matchId: string): void {
    const timer = this.reservationTimers.get(matchId);
    if (timer) {
      clearTimeout(timer);
      this.reservationTimers.delete(matchId);
    }
  }
}
