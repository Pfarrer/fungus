export interface PlayerPalette {
  root: number;
  generator: number;
  turret: number;
  shield: number;
  shieldAura: number;
  edge: number;
  edgeDamaged: number;
}

export const SELF: PlayerPalette = {
  root: 0xe94560,
  generator: 0x53d769,
  turret: 0xff8c00,
  shield: 0x00bfff,
  shieldAura: 0x00bfff,
  edge: 0x4a4e69,
  edgeDamaged: 0xe94560,
};

export const OPPONENT: PlayerPalette = {
  root: 0x9b59b6,
  generator: 0x1abc9c,
  turret: 0xe91e63,
  shield: 0x5c6bc0,
  shieldAura: 0x5c6bc0,
  edge: 0x546e7a,
  edgeDamaged: 0xe91e63,
};

export function getPalette(playerId: string, currentPlayerId: string): PlayerPalette {
  return playerId === currentPlayerId ? SELF : OPPONENT;
}
