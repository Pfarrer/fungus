import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

function createMockLocation(href: string) {
  const url = new URL(href);
  return {
    get href() { return url.href; },
    get search() { return url.search; },
    get origin() { return url.origin; },
    get pathname() { return url.pathname; },
  };
}

function setupWindow(locationHref: string, replaceStateCalls: string[]) {
  vi.stubGlobal("window", {
    location: createMockLocation(locationHref),
    history: {
      replaceState(_: any, __: string, url: string | URL | null) {
        replaceStateCalls.push(String(url));
      },
    },
  });
}

describe("writeSessionToUrl", () => {
  let replaceStateCalls: string[];

  beforeEach(() => {
    replaceStateCalls = [];
    setupWindow("http://localhost/", replaceStateCalls);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("writes both matchId and playerId to URL query string", async () => {
    const { writeSessionToUrl } = await import("./urlState.js");
    writeSessionToUrl("match-123", "player-456");
    expect(replaceStateCalls).toHaveLength(1);
    const url = new URL(replaceStateCalls[0]);
    expect(url.searchParams.get("matchId")).toBe("match-123");
    expect(url.searchParams.get("playerId")).toBe("player-456");
  });

  it("uses replaceState and does not create history entries", async () => {
    const { writeSessionToUrl } = await import("./urlState.js");
    writeSessionToUrl("match-abc", "player-xyz");
    expect(replaceStateCalls).toHaveLength(1);
  });

  it("overwrites existing params when called again", async () => {
    const { writeSessionToUrl } = await import("./urlState.js");
    writeSessionToUrl("old-match", "old-player");
    const firstUrl = new URL(replaceStateCalls[0]);
    setupWindow(firstUrl.href, replaceStateCalls);
    writeSessionToUrl("new-match", "new-player");
    const secondUrl = new URL(replaceStateCalls[1]);
    expect(secondUrl.searchParams.get("matchId")).toBe("new-match");
    expect(secondUrl.searchParams.get("playerId")).toBe("new-player");
  });
});

describe("clearSessionFromUrl", () => {
  let replaceStateCalls: string[];

  beforeEach(() => {
    replaceStateCalls = [];
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("removes matchId and playerId from URL", async () => {
    setupWindow("http://localhost/?matchId=m1&playerId=p1", replaceStateCalls);
    const { clearSessionFromUrl } = await import("./urlState.js");
    clearSessionFromUrl();
    const url = new URL(replaceStateCalls[0]);
    expect(url.searchParams.get("matchId")).toBeNull();
    expect(url.searchParams.get("playerId")).toBeNull();
  });

  it("preserves other query params", async () => {
    setupWindow("http://localhost/?matchId=m1&playerId=p1&other=keep", replaceStateCalls);
    const { clearSessionFromUrl } = await import("./urlState.js");
    clearSessionFromUrl();
    const url = new URL(replaceStateCalls[0]);
    expect(url.searchParams.get("other")).toBe("keep");
  });
});

describe("readSessionFromUrl", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns both params when present", async () => {
    vi.stubGlobal("window", { location: createMockLocation("http://localhost/?matchId=match-1&playerId=player-1") });
    const { readSessionFromUrl } = await import("./urlState.js");
    expect(readSessionFromUrl()).toEqual({ matchId: "match-1", playerId: "player-1" });
  });

  it("returns nulls when no params present", async () => {
    vi.stubGlobal("window", { location: createMockLocation("http://localhost/") });
    const { readSessionFromUrl } = await import("./urlState.js");
    expect(readSessionFromUrl()).toEqual({ matchId: null, playerId: null });
  });

  it("returns null for missing matchId only", async () => {
    vi.stubGlobal("window", { location: createMockLocation("http://localhost/?playerId=player-1") });
    const { readSessionFromUrl } = await import("./urlState.js");
    expect(readSessionFromUrl()).toEqual({ matchId: null, playerId: "player-1" });
  });

  it("returns null for missing playerId only", async () => {
    vi.stubGlobal("window", { location: createMockLocation("http://localhost/?matchId=match-1") });
    const { readSessionFromUrl } = await import("./urlState.js");
    expect(readSessionFromUrl()).toEqual({ matchId: "match-1", playerId: null });
  });

  it("returns empty string for empty params", async () => {
    vi.stubGlobal("window", { location: createMockLocation("http://localhost/?matchId=&playerId=") });
    const { readSessionFromUrl } = await import("./urlState.js");
    expect(readSessionFromUrl()).toEqual({ matchId: "", playerId: "" });
  });
});
