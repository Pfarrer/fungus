export interface SessionParams {
  matchId: string | null;
  playerId: string | null;
}

export function writeSessionToUrl(matchId: string, playerId: string): void {
  const url = new URL(window.location.href);
  url.searchParams.set("matchId", matchId);
  url.searchParams.set("playerId", playerId);
  window.history.replaceState({}, "", url.toString());
}

export function clearSessionFromUrl(): void {
  const url = new URL(window.location.href);
  url.searchParams.delete("matchId");
  url.searchParams.delete("playerId");
  window.history.replaceState({}, "", url.toString());
}

export function readSessionFromUrl(): SessionParams {
  const params = new URLSearchParams(window.location.search);
  return {
    matchId: params.get("matchId"),
    playerId: params.get("playerId"),
  };
}
