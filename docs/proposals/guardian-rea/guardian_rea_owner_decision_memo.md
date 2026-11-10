# Owner Decision Memo — Guardian × REA Integration Gate

**Date:** 2026-11-10  
**Prepared for:** Repository / Guardian owner  
**Pinned tip reviewed:** `b2f3dc81fa503c2b9ff0d8625336ed2e74d1e829`  
**This memo authorizes nothing by itself.**

## Decision needed

Choose one:

1. **Defer** — keep NO-GO; no gateway implementation.
2. **Approve mock-only plan** — authorize a *separate* implementation plan/PR for a Guardian gateway that talks to a **mocked** REA endpoint, with Stage 1 negative-path tests from `guardian_rea_acceptance_plan.md`.
3. **Reject proposal framing** — require revision of the design artifacts before any further work.

**Not on the table yet:** REA installation, live MCP to real REA, provider execution, allowlist expansion beyond guidance tools, Prometheus Super Engine changes, or host credential use.

## Why NO-GO now (source-derived)

REA runs with host authority and is not a sandbox (`SECURITY.md`). Tool families and MCP annotations are exposure/hints, not authorization. Several “static” tools can launch helpers, write files, or return sensitive Evidence. Alternate routes (CLI, HTTP MCP, environment-serve, deep imports) bypass a stdio-only proxy. Therefore Agent 007 must not call REA until an **external** gateway and **OS-enforced** isolation exist and pass denial tests.

## What this review delivered

| Artifact | Role |
| --- | --- |
| `guardian_rea_gateway_design_review.md` | External gateway design + threat model |
| `guardian_rea_tool_effect_matrix.md` | 253-tool effect/content inventory with citations |
| `guardian_rea_acceptance_plan.md` | Unexecuted acceptance criteria and staged tests |
| This memo | Decision gate |

**Not delivered / not claimed:** implemented gateway, executed security tests, CVSS scores, exploit PoCs, or live REA behavior measurements.

## If you approve option 2

Scope lock for the next PR:

- Fresh branch; mock REA only.
- Exact-name allowlist scaffolding; default deny.
- Fail-closed startup and audit logging design.
- No `npx rea-agents setup`, no provider binaries, no real targets.
- Further approval required before any isolated real-REA trial.

## Owner response (fill in)

- Decision: ☐ Defer ☐ Approve mock-only plan ☐ Reject / revise  
- Name / date:  
- Notes / constraints:  
