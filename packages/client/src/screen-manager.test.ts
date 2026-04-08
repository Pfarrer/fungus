import { describe, it, expect } from "vitest";
import { ScreenManager } from "./screen-manager.js";

describe("ScreenManager", () => {
  it("starts with state menu", () => {
    const sm = new ScreenManager();
    expect(sm.state).toBe("menu");
  });

  describe("valid transitions", () => {
    function navigateTo(sm: ScreenManager, target: string): void {
      if (target === "menu") return;
      if (target === "multiplayer-select") {
        sm.transition("multiplayer-select");
      } else if (target === "playing") {
        sm.transition("playing");
      } else if (target === "hosting") {
        sm.transition("multiplayer-select");
        sm.transition("hosting");
      } else if (target === "joining") {
        sm.transition("multiplayer-select");
        sm.transition("joining");
      }
    }

    it.each([
      { from: "menu" as const, to: "multiplayer-select" as const },
      { from: "menu" as const, to: "playing" as const },
      { from: "multiplayer-select" as const, to: "menu" as const },
      { from: "multiplayer-select" as const, to: "hosting" as const },
      { from: "multiplayer-select" as const, to: "joining" as const },
      { from: "hosting" as const, to: "playing" as const },
      { from: "hosting" as const, to: "menu" as const },
      { from: "joining" as const, to: "playing" as const },
      { from: "joining" as const, to: "menu" as const },
      { from: "playing" as const, to: "menu" as const },
    ])("allows $from → $to", ({ from, to }) => {
      const sm = new ScreenManager();
      navigateTo(sm, from);
      expect(sm.state).toBe(from);
      expect(() => sm.transition(to)).not.toThrow();
      expect(sm.state).toBe(to);
    });
  });

  describe("invalid transitions", () => {
    it("throws on menu → joining", () => {
      const sm = new ScreenManager();
      expect(() => sm.transition("joining")).toThrow(
        "Invalid transition: menu → joining",
      );
    });

    it("throws on playing → hosting", () => {
      const sm = new ScreenManager();
      sm.transition("playing");
      expect(() => sm.transition("hosting")).toThrow(
        "Invalid transition: playing → hosting",
      );
    });

    it("throws on hosting → multiplayer-select", () => {
      const sm = new ScreenManager();
      sm.transition("multiplayer-select");
      sm.transition("hosting");
      expect(() => sm.transition("multiplayer-select")).toThrow(
        "Invalid transition: hosting → multiplayer-select",
      );
    });

    it("does not change state on invalid transition", () => {
      const sm = new ScreenManager();
      expect(() => sm.transition("joining")).toThrow();
      expect(sm.state).toBe("menu");
    });
  });

  describe("onChange", () => {
    it("fires with the new state on transition", () => {
      const sm = new ScreenManager();
      const received: string[] = [];
      sm.onChange((state) => received.push(state));

      sm.transition("multiplayer-select");
      expect(received).toEqual(["multiplayer-select"]);

      sm.transition("hosting");
      expect(received).toEqual(["multiplayer-select", "hosting"]);
    });

    it("unsubscribe stops further callbacks", () => {
      const sm = new ScreenManager();
      const received: string[] = [];
      const unsub = sm.onChange((state) => received.push(state));

      sm.transition("multiplayer-select");
      expect(received).toEqual(["multiplayer-select"]);

      unsub();

      sm.transition("menu");
      expect(received).toEqual(["multiplayer-select"]);
    });

    it("supports multiple subscribers", () => {
      const sm = new ScreenManager();
      const a: string[] = [];
      const b: string[] = [];
      sm.onChange((s) => a.push(s));
      sm.onChange((s) => b.push(s));

      sm.transition("playing");
      expect(a).toEqual(["playing"]);
      expect(b).toEqual(["playing"]);
    });

    it("unsubscribing one handler leaves others intact", () => {
      const sm = new ScreenManager();
      const a: string[] = [];
      const b: string[] = [];
      const unsubA = sm.onChange((s) => a.push(s));
      sm.onChange((s) => b.push(s));

      unsubA();
      sm.transition("playing");

      expect(a).toEqual([]);
      expect(b).toEqual(["playing"]);
    });
  });
});
