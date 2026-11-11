# Guardian × REA — Acceptance Plan (Unexecuted)

**Date:** 2026-11-10
**Status:** Proposed tests only — **none of these tests were executed** in this
review pass
**Pinned source tip:** `b2f3dc81fa503c2b9ff0d8625336ed2e74d1e829`
**Authorization:** Mock-only gateway testing requires a separate owner approval.
Live REA / provider trials require yet another explicit approval after mock gates
pass.

## 1. Purpose

Define fail-closed acceptance criteria and a staged test plan for an **external**
Guardian gateway wrapping REA. This document does not authorize implementation or
execution.

## 2. Acceptance criteria (proposed)

Every criterion below must be demonstrated with recorded evidence (command output,
packet capture, audit log excerpt, or equivalent). Untested items remain
**UNKNOWN**, not pass.

| ID  | Criterion                                                                                                                          | Pass evidence                                        | Fail mode                                |
| --- | ---------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | ---------------------------------------- |
| A1  | Every unlisted MCP method is rejected **before** reaching REA                                                                      | Gateway deny log + mocked REA receives zero request  | Request appears on mock/REA              |
| A2  | Malformed / extra / typed-invalid arguments fail closed before REA                                                                 | Same                                                 | Partial forward / schema coercion at REA |
| A3  | Path traversal, symlink escape, and special-file inputs fail closed                                                                | Deny + no FS side effect outside allowed roots       | Write/read outside roots                 |
| A4  | Unexpected tool registration / catalog drift vs pinned trial set fails closed at startup or first call                             | Gateway refuses start or denies all                  | Silent new method available              |
| A5  | Denied request cannot be reissued via CLI, second stdio, HTTP MCP, environment-serve, or deep import inside the isolation identity | Attempt matrix shows deny/absent binary/refused bind | Any successful alternate route           |
| A6  | No host secrets, original engine source in writable locations, or uncontrolled target-derived text reaches the isolated process    | Mount/env inventory + redaction checks               | Secret or uncontrolled Evidence present  |
| A7  | Fixture inputs are read-only; scratch/output confined, quota-bound; cleanup verified or reported unverified                        | FS probes + cleanup report                           | Silent “cleaned” without verification    |
| A8  | Network capture shows **zero unauthorized egress**, including children                                                             | pcap / nft / netns logs                              | Any unexpected connection                |
| A9  | Resource limits apply to the **process tree**: CPU, memory, disk, PIDs, wall-clock; cancellation terminates descendants            | Limit breach tests                                   | Orphan children / unbounded use          |
| A10 | Incomplete / truncated / cancelled Evidence marked UNKNOWN / UNAVAILABLE                                                           | Result schema asserts markers                        | Quiet success / implied completeness     |
| A11 | Approvals and denials are auditable; logs redact secrets and do not treat target text as instructions                              | Log samples + redaction tests                        | Missing deny records / secret leakage    |
| A12 | Startup fails closed if isolation probes, allowlist integrity, logging sink, or limit application fail                             | Negative startup cases                               | Degraded “best effort” serve             |

## 3. Test stages

### Stage 0 — Document and pin (this PR)

| Test                                                   | Status                                                  |
| ------------------------------------------------------ | ------------------------------------------------------- |
| Source inventory of effects, families, routes          | Done in companion docs (source-derived)                 |
| Pin expected tool catalog hash/count for future trials | Proposed (253 tools OBSERVED at tip; pin procedure TBD) |

### Stage 1 — Mock-only gateway (requires owner approval of implementation plan)

**Fixture:** harmless markdown/docs queries; **mocked REA** that records every
received JSON-RPC/MCP request and never launches providers.

| ID  | Case                                                                | Expected                                                     |
| --- | ------------------------------------------------------------------- | ------------------------------------------------------------ |
| M1  | Call `search_guidance` with valid bounded args when listed          | Allow → exactly one mock receipt                             |
| M2  | Call `read_guidance_section` with valid bounded args when listed    | Allow → exactly one mock receipt                             |
| M3  | Call any other exact method name                                    | Deny; mock receipts = 0                                      |
| M4  | Call allowed name with wrong types / extra keys / oversized strings | Deny; mock receipts = 0                                      |
| M5  | Case-variant / Unicode lookalike method names                       | Deny                                                         |
| M6  | Batch/parallel flood of denied methods                              | All denied; resource limits hold; mock receipts = 0          |
| M7  | Cancellation mid-flight of allowed call                             | Client sees UNAVAILABLE/UNKNOWN; no partial “complete” claim |
| M8  | Startup with missing allowlist file / bad schema digest             | Refuse start                                                 |
| M9  | Startup with logging sink unavailable                               | Refuse start                                                 |
| M10 | Audit log contains allow+deny with redacted sensitive fields        | Pass review of samples                                       |

### Stage 2 — Isolation probes without REA product install (separate approval)

Use an empty or stub stdio server if needed — **not** a full REA install unless
explicitly approved.

| ID  | Case                                                                      | Expected                           |
| --- | ------------------------------------------------------------------------- | ---------------------------------- |
| I1  | From isolated identity, `rea` / `npx rea-agents` absent or non-executable | Fail closed                        |
| I2  | Attempt HTTP listen on `/mcp` from inside identity                        | Bind refused / filtered            |
| I3  | Write outside scratch/output                                              | Denied by FS policy                |
| I4  | Read host secret paths                                                    | Denied / not mounted               |
| I5  | Egress to public IP / DNS                                                 | Denied; capture clean              |
| I6  | Fork bomb / memory spike / disk fill                                      | Cgroup/VM limits fire; host stable |
| I7  | Symlink from fixture root to host path                                    | Rejected at gateway and/or mount   |

### Stage 3 — Isolated REA trial (explicit later approval; out of current auth)

Only after Stage 1–2 pass. Still RO fixtures; deny-all egress; guidance-only
allowlist unless further approved.

| ID  | Case                                                                            | Expected                                                |
| --- | ------------------------------------------------------------------------------- | ------------------------------------------------------- |
| R1  | Allowed guidance tools only                                                     | Success with TCF-compatible results; no provider launch |
| R2  | Denied tools including `get_evidence_bundle`, `open_binary`, `inspect_artifact` | Gateway deny; REA never invoked                         |
| R3  | Catalog drift if REA version changes tool set                                   | Startup fail or deny-all until pin updated              |
| R4  | Process-tree teardown on wall-clock                                             | No leftover provider/helper processes                   |

**Not in Stage 3 without further review:** any provider binary analysis, Frida,
GDB/Rizin, browser, ADB, build computer, Evidence export, or network-using
tools.

## 4. Negative-path emphasis

Priority is **denial correctness**, not happy-path demos:

1. Bypass routes (CLI/HTTP/import)
2. Argument/path abuse
3. Catalog drift
4. Egress and secret leakage
5. Cancellation/truncation honesty
6. Cleanup verification honesty

## 5. Evidence packaging rules

- Prefer harmless public fixtures only.
- Never attach real credentials, private binaries, Hopper docs, Ghidra projects,
  or Prometheus Super Engine materials.
- Distinguish in every report: executed result vs source-derived expectation vs
  UNKNOWN.
- Do not claim runtime reproduction that was not performed.

## 6. Exit criteria for “mock gateway plan approved”

Owner may approve implementation of Stage 1 only when:

- Design review companions are accepted as the baseline, and
- Scope is limited to mock REA + gateway code on a fresh branch, and
- No REA install / provider execution is implied.

Exit criteria for any later live REA trial are **out of scope** until Stage 1–2
evidence exists.
