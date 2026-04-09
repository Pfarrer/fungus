import { describe, it, expect } from "vitest";
import { parseClientMessage, serializeServerMessage } from "./protocol.js";
import type { ClientMessage, ServerMessage } from "./protocol.js";

describe("Protocol", () => {
  describe("parseClientMessage", () => {
    it("parses queue-actions message", () => {
      const raw = JSON.stringify({
        type: "queue-actions",
        actions: [{ type: "PlaceNode", nodeType: "generator", position: { x: 100, y: 200 } }],
      });

      const msg = parseClientMessage(raw);
      expect(msg).toEqual({
        type: "queue-actions",
        actions: [{ type: "PlaceNode", nodeType: "generator", position: { x: 100, y: 200 } }],
      });
    });

    it("parses join-match message", () => {
      const raw = JSON.stringify({ type: "join-match" });
      const msg = parseClientMessage(raw);
      expect(msg).toEqual({ type: "join-match" });
    });

    it("returns null for invalid JSON", () => {
      expect(parseClientMessage("not json")).toBeNull();
    });

    it("returns null for unknown message type", () => {
      const raw = JSON.stringify({ type: "unknown" });
      expect(parseClientMessage(raw)).toBeNull();
    });

    it("returns null for queue-actions without actions array", () => {
      const raw = JSON.stringify({ type: "queue-actions" });
      expect(parseClientMessage(raw)).toBeNull();
    });
  });

  describe("serializeServerMessage", () => {
    it("serializes tick-result", () => {
      const msg: ServerMessage = {
        type: "tick-result",
        gameState: {
          nodes: [],
          edges: [],
          players: [],
          tick: 1,
          winner: null,
        },
      };

      const serialized = serializeServerMessage(msg);
      const parsed = JSON.parse(serialized);
      expect(parsed.type).toBe("tick-result");
      expect(parsed.gameState.tick).toBe(1);
    });

    it("serializes tick-countdown", () => {
      const msg: ServerMessage = { type: "tick-countdown", secondsRemaining: 5 };
      const serialized = serializeServerMessage(msg);
      const parsed = JSON.parse(serialized);
      expect(parsed).toEqual({ type: "tick-countdown", secondsRemaining: 5 });
    });

    it("serializes waiting", () => {
      const msg: ServerMessage = { type: "waiting" };
      const serialized = serializeServerMessage(msg);
      expect(JSON.parse(serialized)).toEqual({ type: "waiting" });
    });

    it("serializes player presence notifications", () => {
      const msg: ServerMessage = {
        type: "presence",
        playerId: "player-2",
        connected: false,
      };
      const serialized = serializeServerMessage(msg);
      expect(JSON.parse(serialized)).toEqual({
        type: "presence",
        playerId: "player-2",
        connected: false,
      });
    });

    it("serializes error", () => {
      const msg: ServerMessage = { type: "error", message: "Something went wrong" };
      const serialized = serializeServerMessage(msg);
      const parsed = JSON.parse(serialized);
      expect(parsed).toEqual({ type: "error", message: "Something went wrong" });
    });

    it("roundtrip: parse then serialize preserves data", () => {
      const original = {
        type: "queue-actions",
        actions: [
          { type: "PlaceNode", nodeType: "turret", position: { x: 50, y: 75 } },
        ],
      };
      const raw = JSON.stringify(original);
      const parsed = parseClientMessage(raw) as ClientMessage;
      expect(parsed).toEqual(original);
    });
  });
});
