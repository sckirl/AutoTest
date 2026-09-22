// Prove-It: A0.6.2 (missing file silently "succeeds", exit 0), A0.6.4 (a blank/merged-cell
// label vanishes from the blueprint with no warning), A0.6.5 (two rows with the same
// Scenario_ID collide into one results folder and the UI can never see the second one).
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { generateBlueprintFromExcel } = require('../core/scenario_parser');

const TMP = path.join(__dirname, '_tmp_scenario_parser');
fs.mkdirSync(TMP, { recursive: true });

// generateBlueprintFromExcel always writes core/blueprint.json as a side effect (relative to
// cwd, for the real server.js caller) regardless of the input path — back it up like
// mobile_compile_test.js does, so this test doesn't clobber the developer's real blueprint.
const blueprintPath = path.join(__dirname, '..', 'core', 'blueprint.json');
const blueprintBackup = fs.existsSync(blueprintPath) ? fs.readFileSync(blueprintPath, 'utf8') : null;

function writeSheet(name, rows) {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws);
  const p = path.join(TMP, name);
  XLSX.writeFile(wb, p);
  return p;
}

try {
  // A0.6.2: a missing file must throw, not console.error-and-return-successfully.
  assert.throws(() => generateBlueprintFromExcel(path.join(TMP, 'does_not_exist.xlsx')),
    /not found/i, 'FAIL: missing file must throw, not silently return');

  const HEADER = ['Scenario Number', 'Scenario Name', 'Test Data'];

  // A0.6.4: merged-cell gap — a step row with no label but real Test Data must not vanish silently.
  {
    const p = writeSheet('merged_gap.xlsx', [
      HEADER,
      ['A.1', 'Login Flow', ''],
      ['1', 'Enter Username', 'username=alice'],
      ['2', '', 'password=secret123'], // merged-cell artifact: blank label, real data
    ]);
    const { blueprint, warnings } = generateBlueprintFromExcel(p);
    assert.strictEqual(blueprint[0].Flow.length, 1, 'FAIL: only the labeled step should be in Flow');
    assert.ok(warnings.some(w => /blank|empty|missing/i.test(w)), 'FAIL: dropped row must produce a warning, not silence');
  }

  // A0.6.5: duplicate Scenario_ID must not collide into one results folder.
  {
    const p = writeSheet('dup_id.xlsx', [
      HEADER,
      ['A.1', 'First Login Flow', ''],
      ['1', 'Step One', ''],
      ['A.1', 'Second Login Flow (accidental dup)', ''],
      ['1', 'Step Two', ''],
    ]);
    const { blueprint, warnings } = generateBlueprintFromExcel(p);
    const ids = blueprint.map(s => s.Scenario_ID);
    assert.strictEqual(new Set(ids).size, ids.length, 'FAIL: two scenarios ended up sharing one Scenario_ID');
    assert.ok(warnings.some(w => /duplicate/i.test(w)), 'FAIL: a renamed duplicate ID must be warned about, not silent');
  }

  // A0.6.6: a repeated step label within ONE scenario must be flagged (replay under-shoots
  // on the second occurrence) — but the label itself is untouched, reuse can be intentional.
  {
    const p = writeSheet('dup_label.xlsx', [
      HEADER,
      ['A.1', 'Login Flow', ''],
      ['1', 'Click Submit', ''],
      ['2', 'Click Submit', ''],
    ]);
    const { blueprint, warnings } = generateBlueprintFromExcel(p);
    assert.strictEqual(blueprint[0].Flow.length, 2, 'FAIL: both occurrences must still be kept in Flow');
    assert.strictEqual(blueprint[0].Flow[1].Mapping_Key, 'Click Submit', 'FAIL: the label itself must not be renamed');
    assert.ok(warnings.some(w => /repeat/i.test(w) && w.includes('Click Submit')), 'FAIL: repeated label must be warned about, not silent');
  }

  // A0.8.2: Excel sheet with a 1-cell title banner on row 1 and table headers on row 2
  // must not fail with "expected scenario matrix with at least 3 columns".
  {
    const p = writeSheet('banner_row0.xlsx', [
      ['UAT Test Suite Title Banner'], // 1 column on row 0
      HEADER,                          // headers on row 1
      ['A.1', 'Login Flow', ''],
      ['1', 'Enter Username', 'username=alice'],
    ]);
    const { blueprint } = generateBlueprintFromExcel(p);
    assert.strictEqual(blueprint.length, 1, 'FAIL: dynamic header detection should find headers on row 1');
    assert.strictEqual(blueprint[0].Scenario_ID, 'A.1');
  }
  console.log('PASS: scenario_parser throws on missing file, warns on dropped rows, dedupes IDs, flags repeated labels');
} finally {
  fs.rmSync(TMP, { recursive: true, force: true });
  if (blueprintBackup === null) { try { fs.unlinkSync(blueprintPath); } catch (e) {} }
  else fs.writeFileSync(blueprintPath, blueprintBackup);
}
