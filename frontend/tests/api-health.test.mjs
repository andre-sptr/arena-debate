import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import ts from "typescript";
import vm from "node:vm";

const require = createRequire(import.meta.url);

function loadApiModule(fetchImpl) {
  const filePath = path.resolve("lib/api.ts");
  const source = readFileSync(filePath, "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;
  const module = { exports: {} };

  function localRequire(specifier) {
    if (specifier === "@/lib/sse") {
      return { parseSSEBuffer: () => ({ events: [], remainder: "" }) };
    }
    return require(specifier);
  }

  vm.runInNewContext(transpiled, {
    exports: module.exports,
    module,
    require: localRequire,
    process: { env: {} },
    URL,
    fetch: fetchImpl,
  });

  return module.exports;
}

test("healthCheck returns false for HTTP error responses", async () => {
  const { createAPIClient } = loadApiModule(async () => ({ ok: false }));
  const api = createAPIClient("http://localhost:8000");

  assert.equal(await api.healthCheck(), false);
});

test("healthCheck returns true for successful responses", async () => {
  const { createAPIClient } = loadApiModule(async () => ({ ok: true }));
  const api = createAPIClient("http://localhost:8000");

  assert.equal(await api.healthCheck(), true);
});
