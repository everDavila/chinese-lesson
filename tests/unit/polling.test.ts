import assert from "node:assert/strict";
import { test } from "node:test";
import { CONNECTION_WARNING_AFTER, nextConnectionFailures } from "../../src/lib/polling.ts";

test("avisa después de dos sondeos fallidos y se recupera al conectar", () => {
  let failures = nextConnectionFailures(0, false);
  assert.ok(failures < CONNECTION_WARNING_AFTER);

  failures = nextConnectionFailures(failures, false);
  assert.ok(failures >= CONNECTION_WARNING_AFTER);

  assert.equal(nextConnectionFailures(failures, true), 0);
});
