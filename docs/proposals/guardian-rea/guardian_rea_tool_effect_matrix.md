# Guardian REA tool effect matrix (source inventory)

**Status:** NO-GO design review artifact — source inventory only. No allowlist
approved. No REA installation, live MCP session, or provider execution was
performed for this matrix.

**Pinned tip:** `b2f3dc81fa503c2b9ff0d8625336ed2e74d1e829` (`b2f3dc81f`).

**Claim classes used below:** OBSERVED (cited source), DERIVED (direct consequence
of OBSERVED), INFERRED (reasonable but unexecuted), UNKNOWN (not established).

Primary sources: `src/contracts/toolEffects.ts`,
`src/contracts/artifactToolContracts.ts`, `src/contracts/toolFamilies.ts`,
`src/contracts/toolFamilyIds.ts`, `docs/reference/mcp-contracts.md` (annotations
L1561–1575; families L2177–2217; untrusted content L646–669), `SECURITY.md`.

## Guardian policy notes (not authorization)

| Finding | Class | Consequence for Guardian |
| --- | --- | --- |
| `REA_MCP_TOOL_FAMILIES` scopes advertisement / disables out-of-scope tools; it is not caller authorization | OBSERVED (`mcpToolFamilies.ts` L11–13; `EvidenceMcpServer.ts` advertisesTool) | Never authorize by family alone; use exact method names |
| MCP annotations (`readOnlyHint`, `destructiveHint`, …) are descriptive hints derived from effect audits | OBSERVED (`mcp-contracts.md` L1561–1562; `annotationsFromEffects`) | Do not enforce policy with annotations |
| Empty `effects()` means zero *tracked* side-effect flags in the audit model, not “safe to expose” | OBSERVED (`toolEffects.ts` L32–44, L78) | Still require separate content and ambient-access review |
| `get_evidence_bundle` has empty effects but is **not** target-content-free | OBSERVED (L874; TCF set L963–971) | Deny initially, or design a separate redacted review workflow |
| `record_unknown` is target-content-free but mutates session state | OBSERVED (L900; TCF) | Leave out of first allowlist |
| Candidate first-trial methods after independent gateway/isolation checks: `search_guidance`, `read_guidance_section` | OBSERVED empty effects + TCF (L834–835, L963–971) | Exact-name allowlist only; verify handlers/ambient FS before any trial |
| Initial deny includes (non-exhaustive): `get_evidence_bundle`, `record_unknown`, `inspect_artifact`, `extract_artifact`, `open_binary`, `execute_rizin_command`, GDB/Rizin debug, Frida, browser/Electron/process scenarios, ADB mutations, build computer, resets/exports/network ops | DERIVED from handoff + effect/content audits | Individual review required before any later permit |

## Effect model

| Flag | Definition (ToolEffects) | Source |
| --- | --- | --- |
| `mutatesTarget` | Changes analysis target / inferior | toolEffects.ts:3 |
| `mutatesSession` | Additive Evidence, navigation, unknowns, settings | toolEffects.ts:4–5 |
| `writesFilesystem` | Host filesystem writes (incl. temp work) | toolEffects.ts:6 |
| `launchesProcess` | Starts a process | toolEffects.ts:7 |
| `accessesNetwork` | Network I/O | toolEffects.ts:8 |
| `changesUiState` | UI navigation / display | toolEffects.ts:9 |
| `mayDiscardData` | Overwrite/clear/drop unrecoverable state | toolEffects.ts:10–11 |
| `executesForeignCode` | Runs/drives code REA does not own | toolEffects.ts:12–18 |
| `mutatesDevice` | Changes attached Android device | toolEffects.ts:19–20 |
| `idempotent` | Safe to repeat with same inputs | toolEffects.ts:21 |

Defaults for `effects()` / missing overrides (`toolEffects.ts:32–44`): all
side-effect flags `false`, `idempotent: true`.

Derived MCP annotations (`annotationsFromEffects`, L927–949; docs L1561–1569):

| Annotation | Rule |
| --- | --- |
| `readOnlyHint` | true iff no side-effect flag is true |
| `destructiveHint` | `mayDiscardData` ∨ `executesForeignCode` ∨ `mutatesDevice` |
| `idempotentHint` | `idempotent` |
| `openWorldHint` | `launchesProcess` ∨ `accessesNetwork` |

Advertised `TOOL_EFFECTS` (L909–917) is the **composed** audit: for
provider-composed entries, session base ∪ global provider possibilities.
`toolSessionEffects` (L920–925) returns the session base only. Tables below use
**composed** flags unless noted.

## Empty `effects()` means zero tracked effect (not incomplete docs)

| Claim | Evidence |
| --- | --- |
| Every public tool is audited exactly once | `toolEffects.test.ts` “audits every public tool exactly once”; 253 keys ↔ 253 `TOOL_CONTRACTS` |
| Bare `effects()` is explicit all-false + idempotent | L32–44, L78 “Explicit effect audit for every public tool” |
| Yields `readOnlyHint: true` | `annotationsFromEffects` L931–941 |
| Orthogonal to target-content | TCF set L963–971; unaudited names default to untrusted (L974–979) |

## TARGET_CONTENT_FREE_TOOLS (complete list)

Source: `toolEffects.ts:963–971`. Documented in `mcp-contracts.md:663–669`.

| # | Tool |
| ---: | --- |
| 1 | `export_evidence_bundle` |
| 2 | `guided_workflows` |
| 3 | `inspect_analysis_settings` |
| 4 | `read_guidance_section` |
| 5 | `record_unknown` |
| 6 | `search_guidance` |
| 7 | `update_analysis_settings` |

All other tools: `returnsTargetContent: true` / `toolReturnsTargetContent(name) === true`.

## REA_MCP_TOOL_FAMILIES mapping

`REA_MCP_TOOL_FAMILIES` = comma-separated subset of `TOOL_FAMILY_IDS`
(`toolFamilyIds.ts:8–27`). Ownership: `TOOL_FAMILY_DEFINITIONS`
(`toolFamilies.ts:120–251`). Unset ⇒ full catalog.

| Family id (`TOOL_FAMILY_IDS` order) | Surface | Count | Tools (canonical ownership) |
| --- | --- | ---: | --- |
| `direct` | `official-proxy` | 41 | ... |
| `enhanced` | `enhanced` | 15 | ... |
| `native` | `native-provider` | 37 | ... |
| `artifact` | `artifact-provider` | 24 | ... |
| `managed` | `managed` | 7 | ... |
| `firmware` | `firmware-provider` | 2 | ... |
| `android` | `android-provider` | 6 | ... |
| `pcap` | `pcap-provider` | 2 | ... |
| `flutter` | `flutter-provider` | 2 | ... |
| `frida` | `instrumentation-provider` | 9 | ... |
| `apktool` | `apktool-provider` | 2 | ... |
| `jeb` | `jeb-provider` | 4 | ... |
| `adb` | `adb-provider` | 24 | ... |
| `browser` | `browser-provider` | 12 | ... |
| `electron` | `electron-provider` | 6 | ... |
| `javascript-runtime` | `runtime-provider` | 2 | ... |
| `application` | `application-workflow` | 34 | ... |
| `session` | `session` | 24 | ... |

**Total: 253 tools** across 18 families.

## Special-attention tools

| Method | Family | Side-effect flags (true) | TCF | Empty `effects()`? | readOnly | destructive | idempotent | openWorld | Source lines | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `get_evidence_bundle` | `session` | *(none)* | false | true | True | False | True | False | toolEffects.ts:874 | Audited `effects()` → zero tracked side effects; NOT TCF (can surface retained Evidence / target text). Contract: sessionToolContracts ~L175. |
| `record_unknown` | `session` | mutatesSession | true | false | False | False | False | False | toolEffects.ts:900 | `mutatesSession` + non-idempotent; IS TCF (REA-authored unknown ledger). |
| `inspect_artifact` | `artifact` | mutatesSession, writesFilesystem, launchesProcess | false | false | False | False | True | True | toolEffects.ts:670 | SES+PROC+FS; inventory Evidence (target content). artifactToolContracts L111–115. |
| `extract_artifact` | `artifact` | mutatesSession, writesFilesystem, launchesProcess | false | false | False | False | False | True | toolEffects.ts:675 | SES+FS+PROC, non-idempotent; writes output_root/temp. artifactToolContracts L117–120. |
| `open_binary` | `session` | mutatesSession, launchesProcess, accessesNetwork | false | false | False | False | True | True | toolEffects.ts:846 | SES+PROC+NET; opens/binds provider. sessionToolContracts L70. |
| `search_guidance` | `application` | *(none)* | true | true | True | False | True | False | toolEffects.ts:834 | Empty effects; TCF; REA-authored docs only. applicationToolContracts L100. |
| `read_guidance_section` | `application` | *(none)* | true | true | True | False | True | False | toolEffects.ts:835 | Empty effects; TCF. applicationToolContracts L138. |
| `execute_rizin_command` | `native` | mutatesTarget, mutatesSession, writesFilesystem, launchesProcess, accessesNetwork, mayDiscardData, executesForeignCode | false | false | False | True | False | True | toolEffects.ts:147 | TGT+SES+FS+PROC+NET+DISC+FOREIGN; destructiveHint. reverseEngineeringToolContracts L38. |

## All tools with empty `effects()`

| Method | Family | TCF | readOnly | destructive | idempotent | openWorld | Source | Empty-means |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `inspect_analysis_settings` | `application` | true | True | False | True | False | toolEffects.ts:80 | **Zero tracked side effects** (complete audit) |
| `gdb_session_status` | `native` | false | True | False | True | False | toolEffects.ts:111 | **Zero tracked side effects** (complete audit) |
| `search_guidance` | `application` | true | True | False | True | False | toolEffects.ts:834 | **Zero tracked side effects** (complete audit) |
| `read_guidance_section` | `application` | true | True | False | True | False | toolEffects.ts:835 | **Zero tracked side effects** (complete audit) |
| `guided_workflows` | `application` | true | True | False | True | False | toolEffects.ts:836 | **Zero tracked side effects** (complete audit) |
| `evaluate_reconstruction_coverage` | `application` | false | True | False | True | False | toolEffects.ts:840 | **Zero tracked side effects** (complete audit) |
| `get_evidence_bundle` | `session` | false | True | False | True | False | toolEffects.ts:874 | **Zero tracked side effects** (complete audit) |
| `list_unknowns` | `session` | false | True | False | True | False | toolEffects.ts:899 | **Zero tracked side effects** (complete audit) |
| `verify_unknown_resolution` | `session` | false | True | False | True | False | toolEffects.ts:902 | **Zero tracked side effects** (complete audit) |

## Complete method-by-method inventory

Side-effect columns list **true** flags only. `TCF` = target-content-free. `Empty`
= bare `effects()`. `PC` = provider-composed audit. Annotation columns are
derived from composed effects. Source = line in `toolEffects.ts`.

### `direct`

| Method | Side-effect flags | TCF | Empty | PC | readOnly | destructive | idempotent | openWorld | Source |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `address_name` | mutatesSession | false | false | false | False | False | True | False | L548 |
| `address_to_file_offset` | mutatesSession | false | false | false | False | False | True | False | L574 |
| `annotate_native_function` | mutatesTarget, mutatesSession, writesFilesystem, launchesProcess, mayDiscardData | false | false | false | False | True | True | True | L537 |
| `comment` | mutatesSession | false | false | false | False | False | True | False | L549 |
| `current_address` | mutatesSession | false | false | false | False | False | True | False | L550 |
| `current_document` | mutatesSession | false | false | false | False | False | True | False | L552 |
| `current_procedure` | mutatesSession | false | false | false | False | False | True | False | L551 |
| `goto_address` | mutatesSession, changesUiState | false | false | false | False | False | True | False | L553 |
| `inline_comment` | mutatesSession | false | false | false | False | False | True | False | L554 |
| `inspect_native_data_type` | mutatesSession | false | false | false | False | False | True | False | L570 |
| `inspect_native_instruction` | mutatesSession | false | false | false | False | False | True | False | L569 |
| `inspect_native_load_image` | mutatesSession | false | false | false | False | False | True | False | L544 |
| `list_bookmarks` | mutatesSession | false | false | false | False | False | True | False | L555 |
| `list_documents` | mutatesSession, writesFilesystem, launchesProcess, accessesNetwork | false | false | true | False | False | True | True | L556 |
| `list_names` | mutatesSession | false | false | false | False | False | True | False | L557 |
| `list_procedures` | mutatesSession, writesFilesystem, launchesProcess, accessesNetwork | false | false | true | False | False | True | True | L558 |
| `list_segments` | mutatesSession | false | false | false | False | False | True | False | L559 |
| `list_strings` | mutatesSession, writesFilesystem, launchesProcess, accessesNetwork | false | false | true | False | False | True | True | L560 |
| `next_address` | mutatesSession | false | false | false | False | False | True | False | L561 |
| `prev_address` | mutatesSession | false | false | false | False | False | True | False | L562 |
| `procedure_address` | mutatesSession, writesFilesystem, launchesProcess, accessesNetwork | false | false | true | False | False | True | True | L563 |
| `procedure_assembly` | mutatesSession, writesFilesystem, launchesProcess, accessesNetwork, changesUiState | false | false | true | False | False | True | True | L564 |
| `procedure_callees` | mutatesSession, writesFilesystem, launchesProcess, accessesNetwork | false | false | true | False | False | True | True | L565 |
| `procedure_callers` | mutatesSession, writesFilesystem, launchesProcess, accessesNetwork | false | false | true | False | False | True | True | L566 |
| `procedure_info` | mutatesSession | false | false | false | False | False | True | False | L567 |
| `procedure_pseudo_code` | mutatesSession, writesFilesystem, launchesProcess, accessesNetwork, changesUiState | false | false | true | False | False | True | True | L576 |
| `procedure_references` | mutatesSession | false | false | false | False | False | True | False | L575 |
| `read_bytes` | mutatesSession | false | false | false | False | False | True | False | L572 |
| `read_function_instructions` | mutatesSession, writesFilesystem, launchesProcess, accessesNetwork, changesUiState | false | false | true | False | False | True | True | L568 |
| `resolve_containing_procedure` | mutatesSession, writesFilesystem, launchesProcess, accessesNetwork | false | false | true | False | False | True | True | L577 |
| `resolve_native_call_targets` | mutatesSession | false | false | false | False | False | True | False | L571 |
| `search_bytes` | mutatesSession | false | false | false | False | False | True | False | L573 |
| `search_procedures` | mutatesSession, writesFilesystem, launchesProcess, accessesNetwork | false | false | true | False | False | True | True | L578 |
| `search_strings` | mutatesSession, writesFilesystem, launchesProcess, accessesNetwork | false | false | true | False | False | True | True | L579 |
| `set_address_name` | mutatesTarget, mutatesSession, mayDiscardData | false | false | false | False | True | True | False | L580 |
| `set_addresses_names` | mutatesTarget, mutatesSession, mayDiscardData | false | false | false | False | True | True | False | L585 |
| `set_bookmark` | mutatesTarget, mutatesSession, mayDiscardData | false | false | false | False | True | True | False | L590 |
| `set_comment` | mutatesTarget, mutatesSession, mayDiscardData | false | false | false | False | True | True | False | L595 |
| `set_inline_comment` | mutatesTarget, mutatesSession, mayDiscardData | false | false | false | False | True | True | False | L600 |
| `unset_bookmark` | mutatesTarget, mutatesSession, mayDiscardData | false | false | false | False | True | True | False | L605 |
| `xrefs` | mutatesSession, writesFilesystem, launchesProcess, accessesNetwork | false | false | true | False | False | True | True | L610 |

### `enhanced`

| Method | Side-effect flags | TCF | Empty | PC | readOnly | destructive | idempotent | openWorld | Source |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `analyze_function` | mutatesSession, writesFilesystem, launchesProcess, accessesNetwork, changesUiState | false | false | true | False | False | True | True | L626 |
| `analyze_swift_types` | mutatesSession, writesFilesystem, launchesProcess, accessesNetwork | false | false | true | False | False | True | True | L623 |
| `batch_decompile` | mutatesSession, writesFilesystem, launchesProcess, accessesNetwork, changesUiState | false | false | true | False | False | True | True | L613 |
| `binary_overview` | mutatesSession, writesFilesystem, launchesProcess, accessesNetwork | false | false | true | False | False | True | True | L625 |
| `decompile_all` | mutatesSession, writesFilesystem, launchesProcess, accessesNetwork, changesUiState | false | false | true | False | False | False | True | L614 |
| `find_xrefs_to_name` | mutatesSession | false | false | false | False | False | True | False | L624 |
| `get_call_graph` | mutatesSession, writesFilesystem, launchesProcess, accessesNetwork | false | false | true | False | False | True | True | L622 |
| `get_objc_classes` | mutatesSession | false | false | false | False | False | True | False | L611 |
| `get_objc_protocols` | mutatesSession | false | false | false | False | False | True | False | L612 |
| `inspect_native_api` | mutatesSession, writesFilesystem, launchesProcess, accessesNetwork, changesUiState | false | false | true | False | False | False | True | L627 |
| `inspect_native_dispatch_metadata` | mutatesSession | false | false | false | False | False | True | False | L545 |
| `trace_call_path` | mutatesSession, writesFilesystem, launchesProcess, accessesNetwork | false | false | true | False | False | False | True | L635 |
| `trace_feature` | mutatesSession, writesFilesystem, launchesProcess, accessesNetwork | false | false | true | False | False | False | True | L631 |
| `trace_native_ui_action` | mutatesSession, writesFilesystem, launchesProcess, accessesNetwork | false | false | true | False | False | True | True | L546 |
| `trace_native_values` | mutatesSession, writesFilesystem, launchesProcess, accessesNetwork, changesUiState | false | false | true | False | False | True | True | L547 |

### `native`

| Method | Side-effect flags | TCF | Empty | PC | readOnly | destructive | idempotent | openWorld | Source |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `capture_native_ui_scenario` | mutatesTarget, mutatesSession, writesFilesystem, launchesProcess, accessesNetwork, changesUiState, mayDiscardData, executesForeignCode | false | false | false | False | True | False | True | L644 |
| `close_gdb_session` | mutatesTarget, mutatesSession, launchesProcess, accessesNetwork, executesForeignCode | false | false | false | False | True | False | True | L139 |
| `close_rizin_debug_session` | mutatesTarget, mutatesSession, launchesProcess, accessesNetwork, executesForeignCode | false | false | false | False | True | True | True | L132 |
| `cutter_command` | mutatesTarget, mutatesSession, writesFilesystem, launchesProcess, accessesNetwork, changesUiState, executesForeignCode | false | false | false | False | True | False | True | L83 |
| `demangle_swift` | mutatesSession, launchesProcess | false | false | false | False | False | True | True | L669 |
| `execute_rizin_command` | mutatesTarget, mutatesSession, writesFilesystem, launchesProcess, accessesNetwork, mayDiscardData, executesForeignCode | false | false | false | False | True | False | True | L147 |
| `gdb_console` | mutatesTarget, mutatesSession, writesFilesystem, launchesProcess, accessesNetwork, executesForeignCode | false | false | false | False | True | False | True | L102 |
| `gdb_session_status` | *(none)* | false | true | false | True | False | True | False | L111 |
| `inspect_apple_ips` | mutatesSession | false | false | false | False | False | True | False | L298 |
| `inspect_binary_hardening` | mutatesSession | false | false | false | False | False | True | False | L304 |
| `inspect_binary_layout` | mutatesSession, writesFilesystem, launchesProcess | false | false | false | False | False | True | True | L232 |
| `inspect_byte_entropy` | mutatesSession | false | false | false | False | False | True | False | L289 |
| `inspect_devicetree` | mutatesSession | false | false | false | False | False | True | False | L299 |
| `inspect_elf_notes` | mutatesSession | false | false | false | False | False | True | False | L295 |
| `inspect_elf_unwind_ranges` | mutatesSession | false | false | false | False | False | True | False | L297 |
| `inspect_kernel_build_config` | mutatesSession | false | false | false | False | False | True | False | L301 |
| `inspect_kernel_module` | mutatesSession | false | false | false | False | False | True | False | L300 |
| `inspect_macho` | mutatesSession, writesFilesystem, launchesProcess | false | false | false | False | False | True | True | L665 |
| `inspect_native_exports` | mutatesSession | false | false | false | False | False | True | False | L294 |
| `inspect_native_initializers` | mutatesSession | false | false | false | False | False | True | False | L296 |
| `inspect_pe_certificates` | mutatesSession | false | false | false | False | False | True | False | L291 |
| `inspect_pe_imports` | mutatesSession | false | false | false | False | False | True | False | L292 |
| `inspect_pe_load_config` | mutatesSession | false | false | false | False | False | True | False | L303 |
| `inspect_pe_resources` | mutatesSession | false | false | false | False | False | True | False | L290 |
| `inspect_plist` | mutatesSession, launchesProcess | false | false | false | False | False | True | True | L667 |
| `inspect_recorded_crash` | mutatesSession, writesFilesystem, launchesProcess | false | false | false | False | False | True | True | L227 |
| `inspect_signature` | mutatesSession, writesFilesystem, launchesProcess | false | false | false | False | False | True | True | L666 |
| `inspect_windows_shortcut` | mutatesSession | false | false | false | False | False | True | False | L293 |
| `inspect_with_objdump` | mutatesSession, launchesProcess | false | false | false | False | False | True | True | L93 |
| `list_architectures` | mutatesSession, launchesProcess | false | false | false | False | False | True | True | L668 |
| `list_cutter_sessions` | accessesNetwork | false | false | false | False | False | True | True | L82 |
| `observe_native_calls` | mutatesSession, writesFilesystem, launchesProcess, accessesNetwork, changesUiState, executesForeignCode | false | false | false | False | True | False | True | L656 |
| `observe_native_ui` | mutatesSession, writesFilesystem, launchesProcess | false | false | false | False | False | True | True | L639 |
| `rizin_debug_command` | mutatesTarget, mutatesSession, writesFilesystem, launchesProcess, accessesNetwork, changesUiState, mayDiscardData, executesForeignCode | false | false | false | False | True | False | True | L120 |
| `rizin_debug_session_status` | mutatesSession | false | false | false | False | False | True | False | L131 |
| `start_gdb_session` | mutatesSession, launchesProcess | false | false | false | False | False | False | True | L97 |
| `start_rizin_debug_session` | mutatesTarget, mutatesSession, launchesProcess, accessesNetwork, executesForeignCode | false | false | false | False | True | False | True | L112 |

### `artifact`

| Method | Side-effect flags | TCF | Empty | PC | readOnly | destructive | idempotent | openWorld | Source |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `compare_wasm_interfaces` | mutatesSession | false | false | false | False | False | True | False | L891 |
| `decode_interface_builder` | mutatesSession | false | false | false | False | False | True | False | L681 |
| `decode_signal_recording` | mutatesSession, writesFilesystem, launchesProcess | false | false | false | False | False | True | True | L188 |
| `extract_artifact` | mutatesSession, writesFilesystem, launchesProcess | false | false | false | False | False | False | True | L675 |
| `inspect_apk_signature` | mutatesSession | false | false | false | False | False | True | False | L165 |
| `inspect_artifact` | mutatesSession, writesFilesystem, launchesProcess | false | false | false | False | False | True | True | L670 |
| `inspect_asset_catalog` | mutatesSession, launchesProcess | false | false | false | False | False | True | True | L682 |
| `inspect_desktop_application` | mutatesSession | false | false | false | False | False | True | False | L157 |
| `inspect_erlang_beam` | mutatesSession | false | false | false | False | False | True | False | L167 |
| `inspect_evm_interface` | mutatesSession, writesFilesystem, launchesProcess | false | false | false | False | False | True | True | L198 |
| `inspect_go_binary` | mutatesSession | false | false | false | False | False | True | False | L158 |
| `inspect_gpu_code_objects` | mutatesSession | false | false | false | False | False | True | False | L163 |
| `inspect_il2cpp_metadata` | mutatesSession | false | false | false | False | False | True | False | L159 |
| `inspect_keyed_archive` | mutatesSession | false | false | false | False | False | True | False | L683 |
| `inspect_model_artifact` | mutatesSession | false | false | false | False | False | True | False | L160 |
| `inspect_packet_capture` | mutatesSession, writesFilesystem, launchesProcess | false | false | false | False | False | True | True | L178 |
| `inspect_packet_fields` | mutatesSession, writesFilesystem, launchesProcess | false | false | false | False | False | True | True | L173 |
| `inspect_python_pyc` | mutatesSession | false | false | false | False | False | True | False | L166 |
| `inspect_rust_binary` | mutatesSession | false | false | false | False | False | True | False | L164 |
| `inspect_signal_decoders` | mutatesSession, writesFilesystem, launchesProcess | false | false | false | False | False | True | True | L183 |
| `inspect_sqlite_database` | mutatesSession, writesFilesystem, launchesProcess | false | false | false | False | False | True | True | L168 |
| `inspect_v8_code_cache` | mutatesSession | false | false | false | False | False | True | False | L302 |
| `inspect_wasm_artifact` | mutatesSession, writesFilesystem, launchesProcess | false | false | false | False | False | True | True | L193 |
| `trace_dylib_resolution` | mutatesSession | false | false | false | False | False | True | False | L684 |

### `managed`

| Method | Side-effect flags | TCF | Empty | PC | readOnly | destructive | idempotent | openWorld | Source |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `compare_managed_members` | mutatesSession | false | false | false | False | False | True | False | L688 |
| `import_managed_reconstruction` | mutatesSession | false | false | false | False | False | True | False | L690 |
| `inspect_managed_artifact` | mutatesSession | false | false | false | False | False | True | False | L685 |
| `inspect_managed_members` | mutatesSession | false | false | false | False | False | True | False | L686 |
| `inspect_managed_native_boundaries` | mutatesSession | false | false | false | False | False | True | False | L687 |
| `project_managed_application_graph` | mutatesSession | false | false | false | False | False | True | False | L691 |
| `verify_managed_native_boundaries` | mutatesSession | false | false | false | False | False | True | False | L689 |

### `firmware`

| Method | Side-effect flags | TCF | Empty | PC | readOnly | destructive | idempotent | openWorld | Source |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `extract_firmware` | mutatesSession, writesFilesystem, launchesProcess | false | false | false | False | False | False | True | L311 |
| `inspect_firmware_regions` | mutatesSession, writesFilesystem, launchesProcess | false | false | false | False | False | True | True | L306 |

### `android`

| Method | Side-effect flags | TCF | Empty | PC | readOnly | destructive | idempotent | openWorld | Source |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `inspect_android_class` | mutatesSession, writesFilesystem, launchesProcess | false | false | false | False | False | True | True | L517 |
| `inspect_android_jni_bindings` | mutatesSession, writesFilesystem, launchesProcess | false | false | false | False | False | True | True | L527 |
| `inspect_android_method` | mutatesSession, writesFilesystem, launchesProcess | false | false | false | False | False | True | True | L522 |
| `inspect_android_package` | mutatesSession, writesFilesystem, launchesProcess | false | false | false | False | False | True | True | L317 |
| `search_android_classes` | mutatesSession, writesFilesystem, launchesProcess | false | false | false | False | False | True | True | L512 |
| `trace_android_references` | mutatesSession, writesFilesystem, launchesProcess | false | false | false | False | False | True | True | L532 |

### `pcap`

| Method | Side-effect flags | TCF | Empty | PC | readOnly | destructive | idempotent | openWorld | Source |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `inspect_pcap_capture` | mutatesSession, writesFilesystem, launchesProcess | false | false | false | False | False | True | True | L327 |
| `inspect_pcap_client` | mutatesSession, writesFilesystem, launchesProcess | false | false | false | False | False | True | True | L322 |

### `flutter`

| Method | Side-effect flags | TCF | Empty | PC | readOnly | destructive | idempotent | openWorld | Source |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `identify_flutter_build` | mutatesSession, writesFilesystem | false | false | false | False | False | True | False | L332 |
| `inspect_dart_aot` | mutatesSession, writesFilesystem | false | false | false | False | False | True | False | L336 |

### `frida`

| Method | Side-effect flags | TCF | Empty | PC | readOnly | destructive | idempotent | openWorld | Source |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `close_frida_session` | mutatesTarget, mutatesSession, launchesProcess, accessesNetwork, executesForeignCode | false | false | false | False | True | False | True | L273 |
| `frida_session_status` | mutatesSession | false | false | false | False | False | True | False | L272 |
| `instrument_with_frida` | mutatesTarget, mutatesSession, launchesProcess, accessesNetwork, executesForeignCode | false | false | false | False | True | False | True | L281 |
| `list_frida_devices` | launchesProcess, accessesNetwork | false | false | false | False | False | True | True | L237 |
| `list_frida_processes` | launchesProcess, accessesNetwork | false | false | false | False | False | True | True | L238 |
| `load_frida_script` | mutatesTarget, mutatesSession, launchesProcess, accessesNetwork, executesForeignCode | false | false | false | False | True | False | True | L249 |
| `resume_frida_session` | mutatesTarget, mutatesSession, launchesProcess, accessesNetwork, executesForeignCode | false | false | false | False | True | False | True | L257 |
| `start_frida_session` | mutatesTarget, mutatesSession, launchesProcess, accessesNetwork | false | false | false | False | False | False | True | L242 |
| `unload_frida_script` | mutatesTarget, mutatesSession, launchesProcess, accessesNetwork | false | false | false | False | False | False | True | L265 |

### `apktool`

| Method | Side-effect flags | TCF | Empty | PC | readOnly | destructive | idempotent | openWorld | Source |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `decode_android_resources` | mutatesSession, writesFilesystem, launchesProcess | false | false | false | False | False | True | True | L344 |
| `inspect_apktool_client` | mutatesSession, launchesProcess | false | false | false | False | False | True | True | L340 |

### `jeb`

| Method | Side-effect flags | TCF | Empty | PC | readOnly | destructive | idempotent | openWorld | Source |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `decompile_jeb_item` | mutatesSession, accessesNetwork | false | false | false | False | False | True | True | L362 |
| `inspect_jeb_client` | mutatesSession, accessesNetwork | false | false | false | False | False | True | True | L349 |
| `list_jeb_units` | mutatesSession, accessesNetwork | false | false | false | False | False | True | True | L358 |
| `open_jeb_project` | mutatesSession, accessesNetwork | false | false | false | False | False | False | True | L353 |

### `adb`

| Method | Side-effect flags | TCF | Empty | PC | readOnly | destructive | idempotent | openWorld | Source |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `capture_adb_screen` | mutatesSession, writesFilesystem, launchesProcess, accessesNetwork | false | false | false | False | False | False | True | L418 |
| `collect_adb_bugreport` | mutatesSession, writesFilesystem, launchesProcess, accessesNetwork | false | false | false | False | False | False | True | L460 |
| `inspect_adb_client` | mutatesSession, launchesProcess | false | false | false | False | False | True | True | L366 |
| `inspect_adb_device` | mutatesSession, launchesProcess, accessesNetwork | false | false | false | False | False | True | True | L375 |
| `inspect_adb_display` | mutatesSession, launchesProcess, accessesNetwork | false | false | false | False | False | True | True | L445 |
| `inspect_adb_package` | mutatesSession, launchesProcess, accessesNetwork | false | false | false | False | False | True | True | L397 |
| `inspect_adb_window` | mutatesSession, launchesProcess, accessesNetwork | false | false | false | False | False | True | True | L450 |
| `install_adb_package` | mutatesTarget, mutatesSession, launchesProcess, accessesNetwork, mutatesDevice | false | false | false | False | True | False | True | L472 |
| `list_adb_devices` | mutatesSession, launchesProcess, accessesNetwork | false | false | false | False | False | True | True | L370 |
| `list_adb_directory` | mutatesSession, launchesProcess, accessesNetwork | false | false | false | False | False | True | True | L430 |
| `list_adb_features` | mutatesSession, launchesProcess, accessesNetwork | false | false | false | False | False | True | True | L435 |
| `list_adb_packages` | mutatesSession, launchesProcess, accessesNetwork | false | false | false | False | False | True | True | L380 |
| `list_adb_processes` | mutatesSession, launchesProcess, accessesNetwork | false | false | false | False | False | True | True | L425 |
| `list_adb_services` | mutatesSession, launchesProcess, accessesNetwork | false | false | false | False | False | True | True | L440 |
| `pull_adb_file` | mutatesSession, writesFilesystem, launchesProcess, accessesNetwork | false | false | false | False | False | False | True | L402 |
| `pull_adb_package` | mutatesSession, writesFilesystem, launchesProcess, accessesNetwork | false | false | false | False | False | False | True | L385 |
| `push_adb_file` | mutatesTarget, mutatesSession, writesFilesystem, launchesProcess, accessesNetwork, mutatesDevice | false | false | false | False | True | False | True | L409 |
| `read_adb_logcat` | mutatesSession, launchesProcess, accessesNetwork | false | false | false | False | False | True | True | L392 |
| `read_adb_setting` | mutatesSession, launchesProcess, accessesNetwork | false | false | false | False | False | True | True | L455 |
| `resolve_adb_packages` | mutatesSession, launchesProcess, accessesNetwork | false | false | false | False | False | True | True | L467 |
| `start_adb_activity` | mutatesTarget, mutatesSession, launchesProcess, accessesNetwork, mutatesDevice | false | false | false | False | True | False | True | L496 |
| `start_adb_app` | mutatesTarget, mutatesSession, launchesProcess, accessesNetwork, mutatesDevice | false | false | false | False | True | False | True | L488 |
| `stop_adb_app` | mutatesTarget, mutatesSession, launchesProcess, accessesNetwork, mutatesDevice | false | false | false | False | True | False | True | L504 |
| `uninstall_adb_package` | mutatesTarget, mutatesSession, launchesProcess, accessesNetwork, mutatesDevice | false | false | false | False | True | False | True | L480 |

### `browser`

| Method | Side-effect flags | TCF | Empty | PC | readOnly | destructive | idempotent | openWorld | Source |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `analyze_web_bundle` | mutatesSession, writesFilesystem, launchesProcess, accessesNetwork | false | false | false | False | False | True | True | L694 |
| `capture_browser_scenario` | mutatesTarget, mutatesSession, writesFilesystem, launchesProcess, accessesNetwork, changesUiState, mayDiscardData, executesForeignCode | false | false | false | False | True | False | True | L704 |
| `capture_web_screenshot` | mutatesSession, accessesNetwork | false | false | false | False | False | True | True | L702 |
| `compare_web_captures` | mutatesSession | false | false | false | False | False | True | False | L701 |
| `compare_web_screenshots` | mutatesSession | false | false | false | False | False | True | False | L703 |
| `discover_webmcp_tools` | mutatesSession, accessesNetwork | false | false | false | False | False | True | True | L700 |
| `inspect_web_event_listeners` | mutatesSession, accessesNetwork | false | false | false | False | False | True | True | L215 |
| `inspect_web_network_capture` | mutatesSession, writesFilesystem, launchesProcess | false | false | false | False | False | True | True | L203 |
| `inspect_web_page` | mutatesSession, accessesNetwork | false | false | false | False | False | True | True | L693 |
| `list_browser_targets` | mutatesSession, accessesNetwork | false | false | false | False | False | True | True | L692 |
| `observe_web_execution` | mutatesTarget, mutatesSession, accessesNetwork, mayDiscardData | false | false | false | False | True | False | True | L208 |
| `observe_web_session` | mutatesSession, accessesNetwork | false | false | false | False | False | True | True | L699 |

### `electron`

| Method | Side-effect flags | TCF | Empty | PC | readOnly | destructive | idempotent | openWorld | Source |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `analyze_javascript_application` | mutatesSession, writesFilesystem, launchesProcess | false | false | false | False | False | True | True | L730 |
| `capture_electron_scenario` | mutatesTarget, mutatesSession, writesFilesystem, launchesProcess, accessesNetwork, changesUiState, mayDiscardData, executesForeignCode | false | false | false | False | True | False | True | L717 |
| `inspect_electron_fuses` | mutatesSession | false | false | false | False | False | True | False | L735 |
| `inspect_electron_page` | mutatesSession, accessesNetwork | false | false | false | False | False | True | True | L716 |
| `list_electron_targets` | mutatesSession, accessesNetwork | false | false | false | False | False | True | True | L715 |
| `reconcile_javascript_runtime` | mutatesSession | false | false | false | False | False | True | False | L823 |

### `javascript-runtime`

| Method | Side-effect flags | TCF | Empty | PC | readOnly | destructive | idempotent | openWorld | Source |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `list_javascript_runtime_targets` | mutatesSession, accessesNetwork | false | false | false | False | False | True | True | L728 |
| `observe_javascript_runtime` | mutatesSession, accessesNetwork | false | false | false | False | False | True | True | L729 |

### `application`

| Method | Side-effect flags | TCF | Empty | PC | readOnly | destructive | idempotent | openWorld | Source |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `act_on_build_computer` | mutatesSession, accessesNetwork, changesUiState, executesForeignCode | false | false | false | False | True | False | True | L755 |
| `build_reconstruction_obligation_ledger` | mutatesSession | false | false | false | False | False | True | False | L839 |
| `check_build_task` | mutatesSession, writesFilesystem, launchesProcess, accessesNetwork, executesForeignCode | false | false | false | False | True | False | True | L794 |
| `close_build_computer` | mutatesSession, launchesProcess, accessesNetwork, mayDiscardData | false | false | false | False | True | False | True | L816 |
| `compare_application_versions` | mutatesSession | false | false | false | False | False | True | False | L832 |
| `compare_javascript_export_shapes` | mutatesSession | false | false | false | False | False | True | False | L838 |
| `compare_source_to_bundle` | mutatesSession | false | false | false | False | False | True | False | L837 |
| `compare_static_and_observed_endpoints` | mutatesSession | false | false | false | False | False | True | False | L833 |
| `evaluate_reconstruction_coverage` | *(none)* | false | true | false | True | False | True | False | L840 |
| `export_build_environment` | mutatesSession, writesFilesystem, launchesProcess, accessesNetwork, executesForeignCode | false | false | false | False | True | False | True | L785 |
| `export_environment_bundle` | writesFilesystem | false | false | false | False | False | False | False | L741 |
| `export_web_scripts` | mutatesSession, writesFilesystem | false | false | false | False | False | False | False | L736 |
| `guided_workflows` | *(none)* | true | true | false | True | False | True | False | L836 |
| `inspect_analysis_settings` | *(none)* | true | true | false | True | False | True | False | L80 |
| `inspect_analysis_view` | mutatesSession | false | false | false | False | False | True | False | L305 |
| `inspect_api_contract` | mutatesSession | false | false | false | False | False | True | False | L161 |
| `inspect_playwright_trace` | mutatesSession | false | false | false | False | False | True | False | L162 |
| `mark_build_checkpoint` | mutatesSession, accessesNetwork | false | false | false | False | False | False | True | L771 |
| `measure_build_task` | writesFilesystem, launchesProcess, accessesNetwork, changesUiState, executesForeignCode | false | false | false | False | True | False | True | L808 |
| `project_android_application_graph` | mutatesSession | false | false | false | False | False | True | False | L841 |
| `project_apple_application_graph` | mutatesSession | false | false | false | False | False | True | False | L842 |
| `project_harmony_application_graph` | mutatesSession | false | false | false | False | False | True | False | L843 |
| `read_guidance_section` | *(none)* | true | true | false | True | False | True | False | L835 |
| `record_build_consent` | mutatesSession | false | false | false | False | False | False | False | L803 |
| `recover_javascript_sources` | mutatesSession, writesFilesystem, launchesProcess | false | false | false | False | False | False | True | L824 |
| `search_guidance` | *(none)* | true | true | false | True | False | True | False | L834 |
| `start_build_capture` | mutatesSession, launchesProcess, accessesNetwork, changesUiState, executesForeignCode | false | false | false | False | True | False | True | L763 |
| `start_build_computer` | mutatesSession, writesFilesystem, launchesProcess, accessesNetwork, executesForeignCode | false | false | false | False | True | False | True | L746 |
| `stop_build_capture` | mutatesSession, launchesProcess, accessesNetwork, changesUiState | false | false | false | False | False | False | True | L777 |
| `trace_application_feature` | mutatesSession | false | false | false | False | False | True | False | L830 |
| `trace_javascript_semantics` | mutatesSession | false | false | false | False | False | True | False | L831 |
| `trace_web_module_imports` | mutatesSession, writesFilesystem, launchesProcess, accessesNetwork | false | false | false | False | False | True | True | L221 |
| `trace_web_source_location` | mutatesSession, writesFilesystem, launchesProcess | false | false | false | False | False | True | True | L216 |
| `update_analysis_settings` | mutatesSession | true | false | false | False | False | True | False | L81 |

### `session`

| Method | Side-effect flags | TCF | Empty | PC | readOnly | destructive | idempotent | openWorld | Source |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `binary_session` | launchesProcess | false | false | false | False | False | True | True | L869 |
| `build_call_path` | mutatesSession | false | false | false | False | False | True | False | L896 |
| `capture_process_scenario` | mutatesSession, writesFilesystem, launchesProcess, accessesNetwork, executesForeignCode | false | false | false | False | True | False | True | L881 |
| `close_binary` | mutatesSession, writesFilesystem, accessesNetwork, mayDiscardData | false | false | false | False | True | False | True | L855 |
| `compare_artifacts` | mutatesSession | false | false | false | False | False | True | False | L890 |
| `compare_bundles` | mutatesSession | false | false | false | False | False | True | False | L894 |
| `compare_functions` | mutatesSession | false | false | false | False | False | True | False | L892 |
| `compare_process_captures` | mutatesSession | false | false | false | False | False | True | False | L889 |
| `correlate_static_and_runtime` | mutatesSession | false | false | false | False | False | True | False | L897 |
| `export_evidence_bundle` | writesFilesystem, mayDiscardData | true | false | false | False | True | True | False | L870 |
| `find_changed_behavior` | mutatesSession | false | false | false | False | False | True | False | L895 |
| `get_evidence_bundle` | *(none)* | false | true | false | True | False | True | False | L874 |
| `get_navigation_context` | mutatesSession | false | false | false | False | False | True | False | L875 |
| `import_evidence_bundle` | mutatesSession | false | false | false | False | False | True | False | L880 |
| `inspect_address_context` | mutatesSession, writesFilesystem, launchesProcess, accessesNetwork | false | false | true | False | False | True | True | L876 |
| `list_unknowns` | *(none)* | false | true | false | True | False | True | False | L899 |
| `match_native_functions` | mutatesSession | false | false | false | False | False | True | False | L893 |
| `open_binary` | mutatesSession, launchesProcess, accessesNetwork | false | false | false | False | False | True | True | L846 |
| `open_bundle_resources` | mutatesSession, accessesNetwork | false | false | false | False | False | True | True | L851 |
| `record_unknown` | mutatesSession | true | false | false | False | False | False | False | L900 |
| `reset_investigation` | mutatesSession, writesFilesystem, accessesNetwork, mayDiscardData | false | false | false | False | True | False | True | L862 |
| `update_unknown` | mutatesSession | false | false | false | False | False | False | False | L901 |
| `verify_reconstruction` | mutatesSession | false | false | false | False | False | True | False | L898 |
| `verify_unknown_resolution` | *(none)* | false | true | false | True | False | True | False | L902 |

## Provider-composed tools (session base vs advertised union)

| Method | Family | Session-only true flags | Composed (advertised) true flags | Source |
| --- | --- | --- | --- | --- |
| `analyze_function` | `enhanced` | mutatesSession | mutatesSession, writesFilesystem, launchesProcess, accessesNetwork, changesUiState | L626 |
| `analyze_swift_types` | `enhanced` | mutatesSession | mutatesSession, writesFilesystem, launchesProcess, accessesNetwork | L623 |
| `batch_decompile` | `enhanced` | mutatesSession | mutatesSession, writesFilesystem, launchesProcess, accessesNetwork, changesUiState | L613 |
| `binary_overview` | `enhanced` | mutatesSession | mutatesSession, writesFilesystem, launchesProcess, accessesNetwork | L625 |
| `decompile_all` | `enhanced` | mutatesSession, writesFilesystem | mutatesSession, writesFilesystem, launchesProcess, accessesNetwork, changesUiState | L614 |
| `get_call_graph` | `enhanced` | mutatesSession | mutatesSession, writesFilesystem, launchesProcess, accessesNetwork | L622 |
| `inspect_address_context` | `session` | mutatesSession | mutatesSession, writesFilesystem, launchesProcess, accessesNetwork | L876 |
| `inspect_native_api` | `enhanced` | mutatesSession | mutatesSession, writesFilesystem, launchesProcess, accessesNetwork, changesUiState | L627 |
| `list_documents` | `direct` | mutatesSession | mutatesSession, writesFilesystem, launchesProcess, accessesNetwork | L556 |
| `list_procedures` | `direct` | mutatesSession | mutatesSession, writesFilesystem, launchesProcess, accessesNetwork | L558 |
| `list_strings` | `direct` | mutatesSession | mutatesSession, writesFilesystem, launchesProcess, accessesNetwork | L560 |
| `procedure_address` | `direct` | mutatesSession | mutatesSession, writesFilesystem, launchesProcess, accessesNetwork | L563 |
| `procedure_assembly` | `direct` | mutatesSession | mutatesSession, writesFilesystem, launchesProcess, accessesNetwork, changesUiState | L564 |
| `procedure_callees` | `direct` | mutatesSession | mutatesSession, writesFilesystem, launchesProcess, accessesNetwork | L565 |
| `procedure_callers` | `direct` | mutatesSession | mutatesSession, writesFilesystem, launchesProcess, accessesNetwork | L566 |
| `procedure_pseudo_code` | `direct` | mutatesSession | mutatesSession, writesFilesystem, launchesProcess, accessesNetwork, changesUiState | L576 |
| `read_function_instructions` | `direct` | mutatesSession | mutatesSession, writesFilesystem, launchesProcess, accessesNetwork, changesUiState | L568 |
| `resolve_containing_procedure` | `direct` | mutatesSession | mutatesSession, writesFilesystem, launchesProcess, accessesNetwork | L577 |
| `search_procedures` | `direct` | mutatesSession | mutatesSession, writesFilesystem, launchesProcess, accessesNetwork | L578 |
| `search_strings` | `direct` | mutatesSession | mutatesSession, writesFilesystem, launchesProcess, accessesNetwork | L579 |
| `trace_call_path` | `enhanced` | mutatesSession | mutatesSession, writesFilesystem, launchesProcess, accessesNetwork | L635 |
| `trace_feature` | `enhanced` | mutatesSession | mutatesSession, writesFilesystem, launchesProcess, accessesNetwork | L631 |
| `trace_native_ui_action` | `enhanced` | mutatesSession | mutatesSession, writesFilesystem, launchesProcess, accessesNetwork | L546 |
| `trace_native_values` | `enhanced` | mutatesSession | mutatesSession, writesFilesystem, launchesProcess, accessesNetwork, changesUiState | L547 |
| `xrefs` | `direct` | mutatesSession | mutatesSession, writesFilesystem, launchesProcess, accessesNetwork | L610 |

## UNKNOWN gaps

| Item | Finding |
| --- | --- |
| Missing effect audits | **None** — 253/253 tools audited |
| Empty object = incomplete docs? | **No** — means zero tracked side effects |
| Why empty-but-not-TCF tools exist | Effects ≠ content provenance. `get_evidence_bundle`, `list_unknowns`, `verify_unknown_resolution`, `evaluate_reconstruction_coverage`, `gdb_session_status` are read-only w.r.t. side effects but may return retained/target/provider text; they are intentionally absent from `TARGET_CONTENT_FREE_TOOLS` |
| Per-error-path content audit beyond TCF set | **Not re-derived here**; TCF comment (L951–961) names examples that stay out (`close_binary`, `binary_session`, adb/apktool probes) |
| Whether a given call exercises every declared flag | **Unknown per call** — flags are possibilities across supported inputs/profiles (`mcp-contracts.md` L1572–1575) |
| CLI-only / non-MCP operations | Out of scope for this matrix; see `guardian_rea_gateway_design_review.md` route inventory (`inventory_artifact` is internal, not in effects audit) |
| Ambient filesystem access of `search_guidance` / `read_guidance_section` handlers | **UNKNOWN without execution** — contracts claim REA-authored docs; confirm exact paths and no host leakage before any trial |
| Measured child-process egress for every provider helper | **UNKNOWN** — deny-all egress must be OS-enforced and captured in acceptance tests |
| Symlink race windows against every helper | **UNKNOWN** — treat as fail-closed until probed |
| Runtime confirmation that HTTP MCP has no TLS/auth beyond Host/Origin allowlist | Source-OBSERVED; live bind not performed in this pass |
