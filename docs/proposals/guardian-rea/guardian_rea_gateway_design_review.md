# Guardian × REA — External Gateway Design Review

**Date:** 2026-11-10
**Status:** NO-GO — design proposal only; not implemented
**Pinned source tip:** `b2f3dc81fa503c2b9ff0d8625336ed2e74d1e829`
**Authority:** Read-only review and proposal writing only. No REA install,
provider execution, live MCP connection, or host integration authorized.

## 1. Bottom line

REA’s documented security boundary is **not** an independent sandbox or
multi-tenant authorization service. CLI and MCP share application workflows and
run with the host process’s permissions (`SECURITY.md`, Security boundary /
Threat model).

**Architectural determination (source-derived, unexecuted):** integrate Agent 007 /
Guardian with REA only behind an **external** Guardian tool gateway plus
**OS-enforced** isolation. Until that gateway and isolation pass negative-path
tests, REA integration remains **NO-GO**.

This is an integration blocker / architectural risk statement. It is **not** a
claim that an exploitable REA vulnerability was reproduced. Priority labels from
the upstream Grok review are planning priorities, not CVSS scores.

## 2. Evidence classes

| Class    | Meaning                                        |
| -------- | ---------------------------------------------- |
| OBSERVED | Cited statement or code path at the pinned tip |
| DERIVED  | Direct consequence of OBSERVED facts           |
| INFERRED | Plausible from architecture; not executed here |
| UNKNOWN  | Not established from this review               |

## 3. Verified baseline (OBSERVED)

| Item                                                                       | Evidence                                                                                                         | Consequence                                            |
| -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| REA is not an authorization/sandbox boundary                               | `SECURITY.md` Security boundary, Threat model                                                                    | Enforce policy outside REA                             |
| Trusted authority is OS account + caller/agent host + configured providers | `SECURITY.md` Threat model                                                                                       | Gateway + host must own approvals                      |
| Target/provider text is untrusted data                                     | `SECURITY.md`; `toolEffects.ts` L951–978; `mcp-contracts.md` Untrusted target content                            | Never translate Evidence into command authority        |
| `REA_MCP_TOOL_FAMILIES` is exposure/advertisement scoping                  | `mcpToolFamilies.ts` L11–13; `toolFamilies.ts` `contractsForToolFamilies`; server `advertisesTool` / `disable()` | Never authorize by family                              |
| Tool annotations are hints                                                 | `mcp-contracts.md` L1561–1574; `annotationsFromEffects`                                                          | Do not enforce with `readOnlyHint` / `destructiveHint` |
| `inspect_artifact` can mutate session, write FS, launch processes          | `toolEffects.ts` L670–674; `artifactToolContracts.ts` (DMG mount / inventory)                                    | Not a zero-effect static whitelist                     |
| `open_binary` can launch providers and use network                         | `toolEffects.ts` L846–850                                                                                        | Deny in first phase                                    |
| HTTP MCP lacks TLS/client authentication                                   | `SECURITY.md`; streamable HTTP `/mcp`                                                                            | Do not expose; prefer stdio inside isolation           |
| Evidence can retain sensitive target data                                  | `SECURITY.md` Limits; artifact contracts                                                                         | Output protection / redaction / publication controls   |
| `get_evidence_bundle` empty effects ≠ target-content-free                  | `toolEffects.ts` L874 vs L963–971                                                                                | Deny initially                                         |
| `record_unknown` mutates session despite TCF                               | `toolEffects.ts` L900                                                                                            | Out of first allowlist                                 |

## 4. Invocation-route inventory (gateway must close)

A Guardian that only proxies one MCP stdio pipe does **not** cover REA’s
reachable surface.

| Route                                                       | How reached                                              | Bypass risk if gateway is stdio-only     | Class               |
| ----------------------------------------------------------- | -------------------------------------------------------- | ---------------------------------------- | ------------------- |
| `rea` / `rea-agents` CLI                                    | `package.json` bin → `scripts/rea.mjs`                   | High — same workflows without MCP        | OBSERVED            |
| `rea mcp` / `--mcp` stdio                                   | `dist/mcp/main.js` `runEntrypoint`                       | Medium — second server outside gateway   | OBSERVED            |
| `rea mcp --http` streamable HTTP `/mcp`                     | No TLS; Host/Origin allowlist only                       | High                                     | OBSERVED            |
| `rea environment-serve`                                     | HTTP MCP + `/.well-known/agent-env.json` + `/agentenv`   | High                                     | OBSERVED            |
| Plugin launchers / `npm start`                              | Spawn `rea.mjs mcp`                                      | High if agents can spawn outside gateway | OBSERVED            |
| Deep `dist/` imports (`createServer`, `run`, CLI analysis)  | Package ships `dist/`; no public `exports` lock observed | High if Node can import published files  | OBSERVED / INFERRED |
| `rea setup` / `install.sh` / `mcp add` / update / uninstall | Host + client config mutation                            | High                                     | OBSERVED            |
| Provider children (Hopper, Ghidra, GDB, Rizin, Frida, …)    | Spawned after admitted entry                             | Privilege/side-effect after admission    | OBSERVED            |
| Outbound IDA/JEB MCP, Cutter TCP, CDP inspector URLs        | REA as client                                            | Network reach from REA process           | OBSERVED            |

**DERIVED requirement:** rejections must occur **before** REA receives a request,
and non-gateway routes must be unavailable inside the isolation boundary (no CLI
binary on PATH for the agent identity, no HTTP MCP listen, no host credential
mount, no writable host secrets).

## 5. Proposed external gateway architecture (NOT implemented)

```text
Agent 007 / user request
      |
      v
Guardian tool gateway — EXACT tool-name allowlist + typed argument validation
      |                            |
      | DENY -> logged rejection    | allow -> audited admission
      v                            v
      X                 isolated OS identity / VM or container
                                     |
                         RO fixture inputs; dedicated scratch/output;
                         no host credentials; deny-all egress;
                         CPU, RAM, disk, wall-clock, PID hard limits
                                     |
                                 REA (stdio only)
                                     |
                         selected subprocesses/providers (later phases)
```

### 5.1 Enforcing party

- The **Guardian gateway** is the only authority that admits tool calls.
- Agent-generated text, MCP annotations, tool families, and REA config strings are
  **not** authority.
- Fail closed on: unlisted method, schema mismatch, path escape,
  symlink/special-file policy violation, unexpected tool registration, startup
  misconfiguration, isolation probe failure.

### 5.2 Exact-name allowlist (future lab trial — not approved)

After gateway + isolation are independently checked, candidate first methods:

| Method                  | Why candidate                       | Required pre-trial verification                    | Initial decision           |
| ----------------------- | ----------------------------------- | -------------------------------------------------- | -------------------------- |
| `search_guidance`       | Empty effects + target-content-free | Handler path, response content, ambient filesystem | Possible exact-name permit |
| `read_guidance_section` | Same                                | Same + bounded section id / length args            | Possible exact-name permit |

Other empty-effect + TCF methods (`guided_workflows`, `inspect_analysis_settings`)
are **intentionally deferred**: keep the first trial allowlist tiny and
guidance-query shaped; each still needs its own handler/ambient-FS review before
any later permit. TCF methods with side effects (`export_evidence_bundle`,
`update_analysis_settings`, `record_unknown`) are not candidates.

**Denied initially (non-exhaustive):** `get_evidence_bundle`, `record_unknown`,
`update_analysis_settings`, `export_evidence_bundle`, `inspect_artifact`,
`extract_artifact`, `open_binary`, `execute_rizin_command`, GDB/Rizin debug
commands, Frida script execution, browser/Electron/process scenarios, Android
device mutations, build computers, resets, exports, network operations, and every
other method unless individually reviewed and approved.

Do **not** allow by family (`application`, `session`, …).

### 5.3 Argument validation

- Exact JSON Schema / Zod-equivalent validation at the gateway for each allowed
  method.
- Reject unknown properties (fail closed).
- Paths: absolute paths only when explicitly required; confine to RO fixture root
  and dedicated scratch/output; reject `..`, symlink escapes, device nodes,
  FIFOs, and unexpected mount points (**INFERRED** OS policy details TBD).
- Size, string length, and nesting limits independent of REA’s own budgets.

### 5.4 Identity and isolation (OS-enforced)

| Control              | Requirement                                                         | Enforcer                          |
| -------------------- | ------------------------------------------------------------------- | --------------------------------- |
| Separate OS identity | Dedicated UID/GID or VM user; not the analyst/host agent account    | OS / orchestrator                 |
| Filesystem           | RO fixtures; RW only scratch + output; no host home/secrets/keys    | mount namespaces / ACL / VM disks |
| Network              | Deny-all egress by default; no HTTP MCP bind                        | netns / firewall / VM             |
| Process              | No host `rea` CLI on agent PATH; only gateway-spawned stdio child   | image contents + exec policy      |
| Resources            | CPU, memory, disk quota, PIDs, wall-clock on the **process tree**   | cgroups / ulimit / hypervisor     |
| Credentials          | No ambient cloud/Git tokens, no publisher keys, no host MCP secrets | empty env + no mounts             |

REA config strings (`REA_MCP_TOOL_FAMILIES`, etc.) may reduce advertisement but
**do not** replace these controls (`SECURITY.md` Host isolation / Resource
bounds).

### 5.5 Logging and audit

- Append-only admission log **outside** the agent-writable workspace.
- Record: decision (allow/deny), exact method, argument digest (not full sensitive
  args by default), approval id, isolation identity, timestamps,
  cancellation/timeout outcomes.
- Redact transport credentials and explicitly marked sensitive values; treat
  target-derived text in logs as untrusted and non-authoritative.
- Denials and incomplete Evidence must remain visible; absence of an error is not
  completeness.

### 5.6 Cancellation, truncation, Evidence semantics

- Incomplete, truncated, cancelled, or timed-out Evidence → mark
  **UNKNOWN / UNAVAILABLE**.
- Never imply “no security event” from missing fields or quiet cancellation.
- Preserve provenance markers (`untrusted_content`) when present; do not strip
  them for agent comfort.

### 5.7 Fail-closed startup

Gateway must refuse to start (or refuse all calls) if any of the following are
UNKNOWN/failed:

- Isolation probes (network deny, FS confinement, no host secret mounts)
- Allowlist/schema load integrity
- Unexpected REA tool registration / catalog drift vs pinned expected set for the
  trial
- Logging sink unavailable
- Resource limit application failure

## 6. Threat model (proposal)

| Threat                                    | Trusted?                   | Residual if gateway+isolation missing | Mitigation owner                                                      |
| ----------------------------------------- | -------------------------- | ------------------------------------- | --------------------------------------------------------------------- |
| Agent asks for denied tool                | Agent not authority        | Call reaches REA                      | Gateway exact-name deny                                               |
| Prompt injection via target/Evidence text | Untrusted data             | Agent escalates to CLI/shell          | Treat results as data; no command translation; deny high-effect tools |
| Family / annotation confusion             | Hints only                 | Over-permit                           | Exact names + typed args                                              |
| CLI / HTTP MCP / environment-serve bypass | Alternate routes           | Sidestep gateway                      | Remove routes from isolation image; block binds                       |
| Symlink / path traversal / special files  | Hostile fixtures           | Escape RO roots                       | OS + gateway path policy                                              |
| Provider subprocess effects               | Trusted once launched      | Network, FS, foreign code             | Deny those tools initially; later per-tool review + OS limits         |
| Output leakage / Evidence publication     | Sensitive retained data    | Host/agent exfil                      | Redaction, output quarantine, deny `get_evidence_bundle` initially    |
| Resource exhaustion                       | No universal REA hard caps | Host DoS                              | External cgroup/VM limits on process tree                             |
| Cancellation ambiguity                    | Partial results            | False “clean” conclusion              | Explicit UNKNOWN/UNAVAILABLE                                          |
| Catalog drift / new tool registration     | Evolving surface           | Silent new capability                 | Startup catalog pin + fail closed                                     |

**UNKNOWN without execution:** concrete handler ambient FS for guidance tools;
full symlink race windows against every provider helper; measured egress from
every child binary; Prometheus Super Engine interaction (explicitly out of scope /
must not be altered).

## 7. Relationship to REA product boundaries

- This proposal does **not** change REA source, installers, or Prometheus assets.
- It does **not** assert that REA should become a sandbox.
- Compatible with REA’s own docs: host must enforce permissions; HTTP MCP stays
  untrusted/local; Evidence remains potentially sensitive.

## 8. Next owner decision (see memo)

Approve or reject a **separate** implementation plan for a **mock-only** Guardian
gateway on a fresh branch, with evidence-led negative-path tests against a mocked
REA endpoint.

Approval of that plan does **not** approve REA installation, provider execution,
or any live allowlist expansion.

## 9. Companion artifacts

- `guardian_rea_tool_effect_matrix.md` — method-by-method inventory
- `guardian_rea_acceptance_plan.md` — unexecuted tests / acceptance criteria
- `guardian_rea_owner_decision_memo.md` — one-page decision gate
