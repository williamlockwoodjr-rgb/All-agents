import { mkdir, open as fsOpen, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

import { afterEach, beforeEach, expect, it, onTestFinished, vi } from "vitest";

import { ArtifactResourceScope } from "../../../src/artifacts/ArtifactResourceScope.js";
import { importReferenceSource } from "../../../src/application/ReferenceSourceImport.js";
import { readReferenceSourceVcs } from "../../../src/application/ReferenceSourceVcsAdapter.js";
import { execFileOutput } from "../../../src/process/ExecFileOutput.js";
import { createTestTempDirectory } from "../../fixtures/temporaryDirectory.js";

vi.mock("node:fs/promises", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs/promises")>();
  return { ...actual, open: vi.fn(actual.open) };
});

const openMock = vi.mocked(fsOpen);
let actual: typeof import("node:fs/promises");

beforeEach(async () => {
  actual =
    await vi.importActual<typeof import("node:fs/promises")>(
      "node:fs/promises",
    );
  openMock.mockImplementation((...args) => actual.open(...args));
});

afterEach(() => openMock.mockReset());

const failCloseUntilAllowed = (
  target: string,
): { readonly allow: () => void; readonly calls: () => number } => {
  const closeFailure = new Error("injected metadata close failure");
  let allowClose = false;
  let closeCalls = 0;
  openMock.mockImplementation(async (...args) => {
    const handle = await actual.open(...args);
    if (resolve(String(args[0])) !== resolve(target)) return handle;
    const close = handle.close.bind(handle);
    vi.spyOn(handle, "close").mockImplementation(async () => {
      closeCalls += 1;
      if (!allowClose) throw closeFailure;
      await close();
    });
    return handle;
  });
  return {
    allow: () => {
      allowClose = true;
    },
    calls: () => closeCalls,
  };
};

const createPackedRefRepository = async () => {
  const root = await createTestTempDirectory("rea-reference-packed-owner-");
  await execFileOutput("git", ["init", "--initial-branch=main"], { cwd: root });
  await writeFile(join(root, "main.ts"), "export const value = 1;\n");
  await execFileOutput(
    "git",
    [
      "-c",
      "user.name=REA fixture",
      "-c",
      "user.email=fixture@example.invalid",
      "-c",
      "commit.gpgsign=false",
      "commit",
      "--allow-empty",
      "-m",
      "fixture",
    ],
    { cwd: root },
  );
  const head = (
    await execFileOutput("git", ["rev-parse", "HEAD"], { cwd: root })
  ).stdout.trim();
  await execFileOutput("git", ["pack-refs", "--all", "--prune"], {
    cwd: root,
  });
  const looseRef = join(root, ".git", "refs", "heads", "main");
  const packedRefs = join(root, ".git", "packed-refs");
  await actual.mkdir(join(root, ".git", "refs", "heads"), {
    recursive: true,
  });
  await writeFile(looseRef, `${head}\n`);
  return { root, looseRef, packedRefs };
};

it.each([".", "nested"])(
  "retains failed %s/.gitignore cleanup under the caller's scope",
  async (directory) => {
    const root = await createTestTempDirectory("rea-reference-ignore-owner-");
    await mkdir(join(root, directory), { recursive: true });
    const path = join(root, directory, ".gitignore");
    await writeFile(path, "generated/\n");
    const resources = new ArtifactResourceScope();
    const close = failCloseUntilAllowed(path);
    onTestFinished(async () => {
      close.allow();
      await resources.close().catch(() => undefined);
    });

    const result = await importReferenceSource(
      {
        root,
        caller: "reference-source-metadata-cleanup-test",
        policy: { secretPatterns: [] },
      },
      resources,
    );
    expect(result).toMatchObject({
      ok: false,
      error: {
        code: "io",
        cleanup: {
          resources: [path],
          reason: expect.stringContaining("injected metadata close failure"),
        },
      },
    });
    expect(close.calls()).toBe(2);

    close.allow();
    await resources.close();
    expect(close.calls()).toBe(3);
  },
);

it("retains local Git configuration cleanup before trusting ignore policy", async () => {
  const root = await createTestTempDirectory("rea-reference-config-owner-");
  await execFileOutput("git", ["init", "--initial-branch=main"], { cwd: root });
  const path = join(root, ".git", "config");
  const resources = new ArtifactResourceScope();
  const close = failCloseUntilAllowed(path);
  onTestFinished(async () => {
    close.allow();
    await resources.close().catch(() => undefined);
  });
  const result = await importReferenceSource(
    {
      root,
      caller: "reference-source-config-cleanup-test",
      policy: { secretPatterns: [] },
    },
    resources,
  );
  expect(result).toMatchObject({
    ok: false,
    error: { code: "io", cleanup: { resources: [path] } },
  });
  expect(close.calls()).toBe(2);
  close.allow();
  await resources.close();
  expect(close.calls()).toBe(3);
});

it("preserves Git metadata cleanup failure and the completed source read", async () => {
  const root = await createTestTempDirectory("rea-reference-head-owner-");
  const repository = join(root, "repository");
  const sourceRoot = join(root, "source");
  await Promise.all([mkdir(repository), mkdir(sourceRoot)]);
  await execFileOutput("git", ["init", "--initial-branch=main"], {
    cwd: repository,
  });
  const source = join(sourceRoot, "main.ts");
  const bytes = "export const value = 1;\n";
  await writeFile(source, bytes);
  await writeFile(join(sourceRoot, ".git"), "gitdir: ../repository/.git\n");
  const head = join(repository, ".git", "HEAD");
  const resources = new ArtifactResourceScope();
  const close = failCloseUntilAllowed(head);
  onTestFinished(async () => {
    close.allow();
    await resources.close().catch(() => undefined);
  });

  const result = await importReferenceSource(
    {
      root: sourceRoot,
      excludePaths: [".git"],
      caller: "reference-source-metadata-cleanup-test",
      policy: { secretPatterns: [] },
    },
    resources,
  );
  expect(result).toMatchObject({
    ok: false,
    error: {
      code: "io",
      cleanup: {
        resources: [head],
        reason: expect.stringContaining("injected metadata close failure"),
      },
      partial: {
        entries: [
          {
            kind: "file",
            path: "main.ts",
            bytes: Buffer.from(bytes),
          },
        ],
      },
    },
  });
  expect(close.calls()).toBe(2);

  close.allow();
  await resources.close();
  expect(close.calls()).toBe(3);
});

it("retains packed-refs cleanup when that file is read before loose refs", async () => {
  const { root, packedRefs } = await createPackedRefRepository();

  const resources = new ArtifactResourceScope();
  let allowClose = false;
  const packedCloseCalls = new Map<object, number>();
  openMock.mockImplementation(async (...args) => {
    const handle = await actual.open(...args);
    const path = resolve(String(args[0]));
    if (path === resolve(packedRefs)) {
      const close = handle.close.bind(handle);
      vi.spyOn(handle, "close").mockImplementation(async () => {
        packedCloseCalls.set(handle, (packedCloseCalls.get(handle) ?? 0) + 1);
        if (!allowClose) throw new Error("injected packed-refs close failure");
        await close();
      });
    }
    return handle;
  });
  onTestFinished(async () => {
    allowClose = true;
    await resources.close().catch(() => undefined);
  });

  const result = await readReferenceSourceVcs(root, resources);
  expect(result).toMatchObject({
    ok: false,
    error: {
      code: "io",
      cleanup: {
        resources: [packedRefs],
        reason: expect.stringContaining("injected packed-refs close failure"),
      },
    },
  });
  expect([...packedCloseCalls.values()]).toEqual(
    Array.from({ length: packedCloseCalls.size }, () => 2),
  );

  allowClose = true;
  await resources.close();
  expect([...packedCloseCalls.values()]).toEqual(
    Array.from({ length: packedCloseCalls.size }, () => 3),
  );
});

it("does not open loose refs when packed-refs cannot be read", async () => {
  const { root, looseRef, packedRefs } = await createPackedRefRepository();
  const resources = new ArtifactResourceScope();
  let looseOpened = false;
  openMock.mockImplementation(async (...args) => {
    const handle = await actual.open(...args);
    const path = resolve(String(args[0]));
    if (path === resolve(looseRef)) looseOpened = true;
    if (path === resolve(packedRefs))
      vi.spyOn(handle, "read").mockImplementation(async () => {
        throw Object.assign(new Error("injected packed-refs EIO"), {
          code: "EIO",
        });
      });
    return handle;
  });

  const result = await readReferenceSourceVcs(root, resources);
  expect(looseOpened).toBe(false);
  // A packed-refs read error is not an artifact-cleanup failure, so VCS stays
  // unknown instead of reporting a loose ref that this library order never opens.
  expect(result).toEqual({
    ok: true,
    value: { kind: "unknown", head: null, dirty: null },
  });
});
