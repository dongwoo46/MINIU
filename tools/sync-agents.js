#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.dirname(__dirname);
const MODEL = { opus: "gpt-5.6-sol", sonnet: "gpt-5.3-codex" };

function parseAgent(file) {
  const source = fs.readFileSync(file, "utf8");
  const match = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(source);
  if (!match) throw new Error(`앞머리가 없습니다: ${file}`);
  const meta = {};
  for (const line of match[1].split("\n")) {
    const field = /^([a-z_]+):\s*(.*)$/i.exec(line);
    if (field) meta[field[1]] = field[2].trim();
  }
  for (const key of ["name", "description", "model", "sandbox"]) {
    if (!meta[key]) throw new Error(`${key}가 없습니다: ${file}`);
  }
  if (!MODEL[meta.model]) throw new Error(`지원하지 않는 Claude 모델 별칭입니다: ${meta.model}`);
  return { ...meta, instructions: match[2].trim() };
}

function tomlString(value) {
  return JSON.stringify(String(value));
}

function roleToml(agent) {
  return [
    `name = ${tomlString(agent.name)}`,
    `description = ${tomlString(agent.description)}`,
    `model = ${tomlString(MODEL[agent.model])}`,
    'model_reasoning_effort = "medium"',
    `sandbox_mode = ${tomlString(agent.sandbox)}`,
    `developer_instructions = ${tomlString(agent.instructions)}`,
    "",
  ].join("\n");
}

function configToml(agents) {
  const lines = [
    '# tools/sync-agents.js가 생성합니다.',
    'model = "gpt-5.3-codex"',
    'model_reasoning_effort = "medium"',
    "",
    "[features]",
    "plugins = false",
    "hooks = false",
    "multi_agent = true",
    "",
  ];
  for (const agent of agents) {
    lines.push(`[agents.${agent.name}]`);
    lines.push(`description = ${tomlString(agent.description)}`);
    lines.push(`config_file = ${tomlString(`agents/${agent.name}.toml`)}`);
    lines.push("");
  }
  return lines.join("\n");
}

function expected() {
  const dir = path.join(ROOT, "agents");
  const agents = fs.readdirSync(dir)
    .filter((name) => name.endsWith(".md"))
    .sort()
    .map((name) => parseAgent(path.join(dir, name)));
  const files = new Map([[path.join(ROOT, ".codex", "config.toml"), configToml(agents)]]);
  for (const agent of agents) files.set(path.join(ROOT, ".codex", "agents", `${agent.name}.toml`), roleToml(agent));
  return files;
}

function write(files) {
  for (const [file, content] of files) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
    console.log(`생성: ${path.relative(ROOT, file)}`);
  }
}

function check(files) {
  let failed = 0;
  for (const [file, content] of files) {
    if (!fs.existsSync(file) || fs.readFileSync(file, "utf8") !== content) {
      failed++;
      console.error(`불일치: ${path.relative(ROOT, file)}`);
    } else {
      console.log(`일치: ${path.relative(ROOT, file)}`);
    }
  }
  if (failed) process.exitCode = 1;
}

const mode = process.argv[2];
try {
  const files = expected();
  if (mode === "--write") write(files);
  else if (mode === "--check") check(files);
  else {
    console.error("사용법: node tools/sync-agents.js --write|--check");
    process.exitCode = 2;
  }
} catch (error) {
  console.error(error.message || String(error));
  process.exitCode = 1;
}
