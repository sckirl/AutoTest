# Engineering Audit

CONFIDENCE: EXTRACTED
RELATIONS:
- validates::[[Engineering Plan]]
- contradicts::[[Next Direction]]
- depends_on::[[Recording Acceptance]]
GOD_NODES: [[[Engineering Plan]], [[Module Contracts]]]
SURPRISING_CONNECTIONS: False-green results and stale agent guidance are both failures to preserve evidence provenance.

### KEY FINDINGS:
- Sixteen ranked findings, with concrete trigger, consequence, smallest fix and verification limits, are in [defect.md](../defect.md).
- Source inspection established upload/replay/parser/lifecycle/resource defects; real tester/codegen and installed release acceptance were not run.
- Baseline commit e01c5f4 plus existing dirty changes; no production/data changes made by this audit.

### PRIMARY SOURCES:
- [AutoTest source repository](https://github.com/sckirl/AutoTest) — repository identity verified from local package.json; current dirty-tree claims are anchored to local files in defect.md, not asserted to exist in remote HEAD.
- [Playwright codegen](https://playwright.dev/docs/codegen) — VERIFIED accessible 2026-10-16; source for expected real Inspector/browser workflow.
- Local primary evidence: studio/server.js, core/compiler.js, core/action_db.js, package.json, tests/run_all.js and tests named in defect.md; inspected 2026-10-16, finalized 2026-10-17.

### SIGNIFICANCE:
The audit is the repair input. It does not authorize a broad rewrite or label the current application accepted.

### GAPS/CONSTRAINTS IDENTIFIED:
See the Not checked line in defect.md. Parser probe outputs are reported as bounded code probes from the audit agent, not live application evidence.

## Evidence and plan mapping

| Findings | Plan tasks | Required check |
|---|---|---|
| 1 | G2 | Valid/invalid isolated upload, real UI |
| 2–3 | G3/G4 | Real first and intermediate recording transfer |
| 4–5, 7–8 | G5/G6/G8 | Strict genuine-source import, full scenario count and data validation |
| 6 | G7a | Cancel A/start B/delayed callback |
| 9 | G11 | Artifact inventory plus native offline install/replay |
| 10 | G7c | Loopback and actual rejected unauthorized mutation |
| 11–12 | G0/G1 + all acceptance gates | Test isolation and truthful evidence level |
| 13–15 | G6c/G8c/G9 | Persistent traffic, ownership, shared action semantics |
| 16 | Current documentation change | Reconciliation, graph/link checks and independent review |
