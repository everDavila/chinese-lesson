import assert from "node:assert/strict";
import test from "node:test";
import { noteTermCandidates } from "../../src/lib/note-terms.ts";

test("detecta términos chinos aislados y elimina duplicados", () => {
  assert.deepEqual(
    noteTermCandidates([
      "Para gustos cotidianos suele ser más natural 喜欢.",
      "喜欢 is more natural for everyday likes; 爱 is stronger.",
      null,
    ]),
    ["喜欢", "爱"],
  );
});
