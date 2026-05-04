import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import ts from "typescript";
import vm from "node:vm";

const require = createRequire(import.meta.url);

function loadTypeScriptModule(relativePath) {
  const filePath = path.resolve(relativePath);
  const source = readFileSync(filePath, "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;
  const module = { exports: {} };

  vm.runInNewContext(transpiled, {
    exports: module.exports,
    module,
    require,
  });

  return module.exports;
}

const { parseSSEBuffer } = loadTypeScriptModule("lib/sse.ts");

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

test("parseSSEBuffer emits complete JSON events and keeps a partial remainder", () => {
  const firstChunk = [
    'data: {"type":"round_start","round":1}',
    "",
    'data: {"type":"arg',
  ].join("\n");

  const firstResult = parseSSEBuffer(firstChunk);

  assert.deepEqual(plain(firstResult.events), [{ type: "round_start", round: 1 }]);
  assert.equal(firstResult.remainder, 'data: {"type":"arg');

  const secondResult = parseSSEBuffer(
    `${firstResult.remainder}ument","data":{"content":"Hi"}}\n\n`
  );

  assert.deepEqual(plain(secondResult.events), [
    {
      type: "argument",
      data: {
        content: "Hi",
      },
    },
  ]);
  assert.equal(secondResult.remainder, "");
});

test("parseSSEBuffer accepts thinking events", () => {
  const result = parseSSEBuffer(
    'data: {"type":"thinking","agent_name":"optimist_1","round":1,"phase":"evidence","message":"Grounding the claim in a relevant precedent."}\n\n'
  );

  assert.deepEqual(plain(result.events), [
    {
      type: "thinking",
      agent_name: "optimist_1",
      round: 1,
      phase: "evidence",
      message: "Grounding the claim in a relevant precedent.",
    },
  ]);
  assert.equal(result.remainder, "");
});

test("useStreamDebate buffers safe thinking steps per pending argument", () => {
  const source = readFileSync(path.resolve("hooks/useStreamDebate.ts"), "utf8");

  assert.match(source, /thinkingBufferRef/);
  assert.match(source, /pendingArgument/);
  assert.match(source, /case "thinking":/);
  assert.match(source, /thinking_steps/);
  assert.match(source, /thinking_active/);
  assert.match(source, /thinkingBufferRef\.current/);
  assert.match(source, /setPendingArgument/);
  assert.doesNotMatch(source, /activeThinkingStep/);
  assert.doesNotMatch(source, /thinkingSteps/);
});

test("ArgumentCard includes collapsible per-argument thinking UI", () => {
  const source = readFileSync(
    path.resolve("components/debate/ArgumentCard.tsx"),
    "utf8"
  );

  assert.match(source, /thinking_steps/);
  assert.match(source, /thinking_active/);
  assert.match(source, /Thinking process/);
  assert.match(source, /ChevronDown/);
  assert.match(source, /thinkingOpen/);
});

test("StreamDebateClient allows React Strict Mode remounts to restart the stream", () => {
  const source = readFileSync(
    path.resolve("app/debate/stream/[id]/StreamDebateClient.tsx"),
    "utf8"
  );

  assert.doesNotMatch(source, /startedRef/);
  assert.doesNotMatch(source, /useRef/);
  assert.match(source, /void startStreamDebate\(topic, \{ debateId: streamId \}\);/);
  assert.match(source, /pendingArgument/);
  assert.doesNotMatch(source, /ThinkingProcessPanel/);
});
