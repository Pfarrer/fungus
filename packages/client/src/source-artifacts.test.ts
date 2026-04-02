import { describe, it, expect } from "vitest";
import { readdirSync } from "node:fs";
import { join } from "node:path";

const SRC_DIR = new URL(".", import.meta.url);

function listGeneratedSourceArtifacts(): string[] {
  return readdirSync(SRC_DIR, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => {
      if (name.endsWith(".js") || name.endsWith(".js.map")) {
        return true;
      }

      if (name.endsWith(".d.ts") || name.endsWith(".d.ts.map")) {
        return true;
      }

      return false;
    })
    .map((name) => join("packages/client/src", name))
    .sort();
}

describe("client source tree", () => {
  it("does not contain generated js or declaration artifacts", () => {
    expect(listGeneratedSourceArtifacts()).toEqual([]);
  });
});
