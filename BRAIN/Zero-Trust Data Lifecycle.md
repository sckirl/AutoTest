# Zero-Trust Data Lifecycle

AutoTest ensures the execution data always perfectly matches the physical Excel blueprint uploaded by the user, applying strict garbage collection and ephemeral file storage to prevent test flakiness.

## The Accordion Data Matrix (Override Layer)
Users can generate multiple iterations of a test via the UI without touching the Excel blueprint. 
- The data is stored in a flat `core/runtime_data.json`.
- **Ponytail Simplicity**: No bloated database (PostgreSQL/Mongo). No ORM. Just native Node `fs` writing a JSON file. The minimum that works.

## Strict Lifecycle Hooks
Because scenario IDs (e.g., "A.1") are derived sequentially from Excel, a new upload invalidates the old IDs. 
- The `/upload` and `/restart` endpoints immediately and unconditionally run `fs.unlinkSync(RUNTIME_DATA_PATH)`.
- If a user uploads a new UAT document, all previous data matrix permutations are wiped instantly. 

## Safe Interpolation (Anti-Injection)
During compilation, `compiler.js` merges the flat `runtime_data.json` parameters. 
To prevent generating syntactically invalid TypeScript (e.g., a user inserting `"O'Brien"` or a malicious payload breaking the string literal), the compiler uses native `JSON.stringify(value)` to perfectly escape the input. 

To understand how parameters map into the generated tests, see [[Data-Driven Parameterization]].
