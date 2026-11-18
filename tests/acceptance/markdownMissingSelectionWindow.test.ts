import { writeFile } from "node:fs/promises";

import { estimateTokenCount } from "tokenx";
import { expect } from "vitest";

import { workspaceCliTest } from "../support/cli/workspaceCliFixture.js";

workspaceCliTest.for([
  { command: "inspect-byte-entropy", file: "target.bin", data: "fixture" },
  {
    command: "inspect-apple-ips",
    file: "report.ips",
    data:
      '{"bug_type":"309","app_name":"fixture"}\n' +
      '{"procName":"fixture","threads":[],"usedImages":[]}',
  },
])(
  "keeps the missing-selection Markdown document across $command token windows",
  async ({ command, file, data }, { cli, workspace }) => {
    const path = workspace.path(file);
    await writeFile(path, data);
    const run = async (...flags: string[]) => {
      const result = await cli.run({
        arguments: [
          command,
          path,
          "--format",
          "md",
          "--filter-output",
          "nope",
          ...flags,
        ],
      });
      expect(result.exitCode, result.stderr).toBe(0);
      expect(result.stderr).toBe("");
      return result.stdout;
    };

    const document = await run();
    expect(document).toBe("| Key | Value |\n|-----|-------|\n");
    // tokenx 2 prices a punctuation run at about six characters per token.
    // The old 13 was tokenx 1.3 charging this separator two characters per token.
    const visible = document.trimEnd();
    const total = estimateTokenCount(visible);
    expect(total).toBeGreaterThan(5);
    expect(await run("--token-count")).toBe(`${total}\n`);
    expect(await run("--token-offset", "0")).toBe(document);
    expect(await run("--token-limit", "1000")).toBe(document);

    const first = await run("--token-limit", "5");
    const rest = await run("--token-offset", "5");
    const firstMarker = `\n[truncated: showing tokens 0–5 of ${total}]\n`;
    const restMarker = `\n[truncated: showing tokens 5–${total} of ${total}]\n`;
    expect(first.endsWith(firstMarker)).toBe(true);
    expect(rest.endsWith(restMarker)).toBe(true);
    expect(
      first.slice(0, -firstMarker.length) + rest.slice(0, -restMarker.length),
    ).toBe(visible);
    expect(await run("--token-offset", "1000")).toBe(
      `\n[truncated: showing tokens ${total}–${total} of ${total}]\n`,
    );
  },
);
