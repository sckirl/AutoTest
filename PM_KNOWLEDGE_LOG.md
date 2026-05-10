# AUTOTEST PROJECT — PM AGENT KNOWLEDGE LOG
Updated continuously. PM agent must reference NEVER-REPEAT before proposing any solution.

## POSITIVES — PATTERNS THAT WORKED
P-001 | Root cause analysis framed in two clear questions (why does it crash, why is QA blind) gave the team immediate shared understanding with no ambiguity. Repeat this framing structure in every new problem statement.
P-002 | Identifying the Chrome Extension as a long-term decoupling strategy was architecturally sound. Decoupling browser lifecycle from the server process is the right direction for any browser-automation backend.
P-003 | Assigning parallel tracks (Dev backend, Dev spike, QA rewrite, Architect validation) correctly reduced idle time across teams. Always map tasks to tracks before sequencing phases.
P-004 | Structuring fallback paths explicitly inside spikes guarantees momentum even on failure. Always define the exact next step if a spike returns a "no-go".
P-005 | Defining explicit error contracts before implementation unblocks QA automation. Always specify the error response schema for new endpoints.

## NEVER-REPEAT — CONFIRMED ANTI-PATTERNS
NR-001 | NEVER include a phase in an execution plan described as "theoretical." If a mechanism cannot be confirmed working before the plan is written, it must be a time-boxed spike task with a go/no-go output, not a delivery phase. Theoretical phases waste sprint capacity and erode team trust in the roadmap.
NR-002 | NEVER propose capturing stdout from an interactive CLI tool as a data pipeline without first confirming the tool actually emits structured stdout. npx playwright codegen is interactive and GUI-driven. Assuming CLI tools behave like Unix pipes without validation caused a full phase to be technically invalid before a single line of code was written.
NR-003 | NEVER propose file-based log tailing as a QA assertion mechanism. It is non-deterministic, race-condition prone, and produces no structured pass/fail signal. All QA assertions must target a versioned HTTP endpoint returning a typed JSON response.
NR-004 | NEVER propose a solution to a process stability problem (zombie processes, memory leaks) without explicitly naming the process lifecycle management mechanism in the same plan. Fixing the symptom (crash logging) while leaving the cause (unmanaged child processes) untouched is not a fix, it is deferred failure.
NR-005 | NEVER spawn a secondary browser process from the server when an existing browser instance can be attached to via CDP or a WebSocket server endpoint. Spawning creates a parallel OS process that is invisible to any external controller, guarantees the inception/blind-spot problem, and is the direct source of memory leaks from rapid context cycling.
NR-006 | NEVER write a phase without a definition of done. A phase with no exit criterion cannot be signed off by QA, cannot be marked complete by dev, and cannot be used as a dependency gate for the next phase. Every phase must end with a measurable, testable condition.
NR-007 | NEVER approve an architecture rollout for execution before its critical dependency spikes have validated feasibility. Status must reflect the pending validation.
NR-008 | NEVER hardcode ports for external processes without a dynamic allocation fallback and startup check. Hardcoded ports lead to silent connection failures on concurrent sessions or in shared environments.
NR-009 | NEVER propose an undocumented internal API without explicitly flagging the permanent maintenance risk and version-bump fragility it carries.
NR-010 | NEVER propose a long-running external process (like a Firefox server) without explicitly defining its health check, automatic restart policy, and state propagation to clients.
NR-011 | NEVER define a Definition of Done using unmeasurable qualifiers like "runs green". Always quantify the exact metric (e.g., zero flaky retries across three runs).