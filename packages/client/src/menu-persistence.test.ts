import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { getSavedPlayerName, savePlayerName } from "./menu.js";

const storage = new Map<string, string>();

beforeEach(() => {
  storage.clear();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
    clear: () => storage.clear(),
  });
});

afterEach(() => {
  storage.clear();
});

describe("player name persistence", () => {
  it("returns empty string when nothing stored", () => {
    expect(getSavedPlayerName()).toBe("");
  });

  it("round-trips a saved name", () => {
    savePlayerName("Alice");
    expect(getSavedPlayerName()).toBe("Alice");
  });

  it("overwrites previous value", () => {
    savePlayerName("Alice");
    expect(getSavedPlayerName()).toBe("Alice");

    savePlayerName("Bob");
    expect(getSavedPlayerName()).toBe("Bob");
  });
});
