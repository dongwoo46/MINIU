"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const projectRoot = path.dirname(__dirname);
const cli = path.join(projectRoot, "tools", "docs.js");

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "god-docs-"));
  fs.cpSync(path.join(projectRoot, "templates"), path.join(root, "templates"), { recursive: true });
  return root;
}

function run(root, ...args) {
  return spawnSync(process.execPath, [cli, ...args], {
    cwd: root,
    env: { ...process.env, DOCS_ROOT: root },
    encoding: "utf8",
  });
}

test("상위기획, PRD, 기능명세, 기술설계를 만들고 검사한다", () => {
  const root = fixture();
  for (const type of ["planning", "prd", "spec", "tech"]) {
    const result = run(root, "init", type, "login", "로그인");
    assert.equal(result.status, 0, result.stderr);
  }
  const checked = run(root, "check");
  assert.equal(checked.status, 0, checked.stderr);
  assert.match(checked.stdout, /문서 4개 · 위반 0건/);
});

test("상위기획에서 파생된 PRD의 작성 상태를 추적한다", () => {
  const root = fixture();
  run(root, "init", "planning", "account", "계정 경험");
  run(root, "init", "prd", "login", "로그인");
  const planning = path.join(root, "docs", "planning", "account.md");
  const source = fs.readFileSync(planning, "utf8").replace(
    "|---|---|---|---|",
    "|---|---|---|---|\n| login | 로그인 진입 | 필수 | 작성 |\n| signup | 신규 가입 | 필수 | 미작성 |",
  );
  fs.writeFileSync(planning, source);
  const traced = run(root, "trace-plan", "account");
  assert.equal(traced.status, 0, traced.stderr);
  assert.match(traced.stdout, /작성: login/);
  assert.match(traced.stdout, /미작성: signup/);
});

test("PRD 요구사항이 기능명세에서 빠지면 추적이 실패한다", () => {
  const root = fixture();
  run(root, "init", "prd", "login", "로그인");
  run(root, "init", "spec", "login", "로그인");
  const prd = path.join(root, "docs", "features", "login", "prd.md");
  fs.appendFileSync(prd, "\n| R-2 | 소셜 로그인 | 연결된다 | 선택 |\n");
  const traced = run(root, "trace", "login");
  assert.equal(traced.status, 1);
  assert.match(traced.stdout, /누락: R-2 -> 기능명세/);
});

test("Markdown을 반응형 HTML로 출력한다", () => {
  const root = fixture();
  run(root, "init", "prd", "login", "로그인");
  const source = path.join("docs", "features", "login", "prd.md");
  const rendered = run(root, "html", source);
  assert.equal(rendered.status, 0, rendered.stderr);
  const html = fs.readFileSync(path.join(root, "dist", "docs", "features", "login", "prd.html"), "utf8");
  assert.match(html, /name="viewport"/);
  assert.match(html, /class="table-wrap"/);
  assert.match(html, /로그인 PRD/);
});
