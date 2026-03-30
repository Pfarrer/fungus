import { Match } from "./match.js";
import type { ClientConnection } from "./protocol.js";
import type { GameAction, GameConfig } from "@fungus/game";

export class MatchManager {
  private matches: Map<string, Match> = new Map();

  handleConnect(client: ClientConnection, config?: GameConfig): void {
    let match = this.matches.get(client.matchId);

    if (!match) {
      match = new Match(client.matchId, config);
      this.matches.set(client.matchId, match);
    }

    match.addPlayer(client);
    match.tryStart();
  }

  handleDisconnect(matchId: string, playerId: string): void {
    const match = this.matches.get(matchId);
    if (!match) return;

    match.removePlayer(playerId);

    if (match.playerCount() === 0) {
      match.destroy();
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
}
