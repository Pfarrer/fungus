import { test, expect, type Page, type BrowserContext } from "@playwright/test";

const CLIENT_URL = "http://localhost:3000/fungus/";

test.describe("Two-browser multiplayer", () => {
  let player1Context: BrowserContext;
  let player2Context: BrowserContext;
  let player1: Page;
  let player2: Page;

  test.beforeAll(async ({ browser }) => {
    player1Context = await browser.newContext();
    player2Context = await browser.newContext();
    player1 = await player1Context.newPage();
    player2 = await player2Context.newPage();
  });

  test.afterAll(async () => {
    await player1Context.close();
    await player2Context.close();
  });

  test("two players can connect and play a match", async ({}, testInfo) => {
    const matchId = `match-${testInfo.project.name}-${Math.random().toString(36).slice(2)}`;
    const player1Url = `${CLIENT_URL}?matchId=${matchId}&playerId=player-1`;
    const player2Url = `${CLIENT_URL}?matchId=${matchId}&playerId=player-2`;

    await player1.goto(player1Url);
    console.log("Player 1 loaded");

    await player1.waitForSelector("#hud", { timeout: 10000 });

    await expect(player1.locator("#hud")).toContainText("Waiting for opponent", {
      timeout: 5000,
    });
    console.log("Player 1 is waiting for opponent");

    await player2.goto(player2Url);
    console.log("Player 2 loaded");

    await player2.waitForSelector("#hud", { timeout: 10000 });

    await expect(player1.locator("#hud")).toContainText("connected", {
      timeout: 5000,
    });
    await expect(player2.locator("#hud")).toContainText("connected", {
      timeout: 5000,
    });
    console.log("Both players connected");

    await expect(player1.locator("#hud")).toContainText("Tick:", {
      timeout: 10000,
    });
    await expect(player2.locator("#hud")).toContainText("Tick:", {
      timeout: 10000,
    });
    console.log("Game is ticking for both players");

    await expect(player1.locator("#hud")).toContainText("Resources:", {
      timeout: 5000,
    });
    await expect(player2.locator("#hud")).toContainText("Resources:", {
      timeout: 5000,
    });
    console.log("Both players have resources displayed");

    const player1Tick = await player1.locator("#hud").textContent();
    const player2Tick = await player2.locator("#hud").textContent();
    expect(player1Tick).toContain("Tick:");
    expect(player2Tick).toContain("Tick:");
    console.log("Player 1 HUD:", player1Tick?.replace(/\n/g, " | "));
    console.log("Player 2 HUD:", player2Tick?.replace(/\n/g, " | "));

    const genBtn1 = player1.locator("#palette button", { hasText: "generator" });
    await expect(genBtn1).toBeVisible({ timeout: 5000 });
    await genBtn1.click();
    console.log("Player 1 selected generator");

    await player1.waitForTimeout(1000);

    const executeBtn1 = player1.locator("#execute-btn");
    if (await executeBtn1.isVisible()) {
      await executeBtn1.click();
      console.log("Player 1 executed actions");
    } else {
      console.log("Player 1: no actions queued yet (expected - need to click on canvas)");
    }

    await player1.waitForTimeout(3000);

    const p1After = await player1.locator("#hud").textContent();
    const p2After = await player2.locator("#hud").textContent();
    console.log("After waiting 3s - Player 1:", p1After?.replace(/\n/g, " | "));
    console.log("After waiting 3s - Player 2:", p2After?.replace(/\n/g, " | "));

    expect(p1After).toBeTruthy();
    expect(p2After).toBeTruthy();

    console.log("SUCCESS: Both browsers connected and received game state!");
  });
});
