#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = process.env.DOCS_ROOT ? path.resolve(process.env.DOCS_ROOT) : path.dirname(__dirname);
const TYPES = new Set(["planning", "prd", "spec", "tech"]);
const REQUIRED = {
  planning: ["배경과 문제", "목표", "방향과 대안", "MVP 범위", "파생 기능", "가정과 미결정"],
  prd: ["문제와 목표", "핵심 흐름", "범위", "요구사항", "예외와 제약", "미결정"],
  spec: ["기준과 범위", "기능 상세", "상태", "분기와 실패", "데이터와 권한", "미결정"],
  tech: ["타당성과 범위", "기존 코드 재사용", "구조", "데이터", "인터페이스", "처리와 복구", "구현 순서", "미결정"],
};

function fail(message, code = 2) {
  console.error(message);
  process.exitCode = code;
}

function featureSlug(value) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value || "")) {
    throw new Error("기능 slug는 소문자 영문·숫자·하이픈만 사용할 수 있습니다.");
  }
  return value;
}

function documentFile(type, slug) {
  if (!TYPES.has(type)) throw new Error(`문서 유형은 planning, prd, spec, tech 중 하나여야 합니다: ${type}`);
  if (type === "planning") return path.join(ROOT, "docs", "planning", `${featureSlug(slug)}.md`);
  return path.join(ROOT, "docs", "features", featureSlug(slug), `${type}.md`);
}

function localDate() {
  const d = new Date();
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function relative(file) {
  return path.relative(ROOT, file).split(path.sep).join("/");
}

function parseFrontmatter(source) {
  if (!source.startsWith("---\n")) return { meta: null, body: source };
  const end = source.indexOf("\n---\n", 4);
  if (end < 0) return { meta: null, body: source };
  const meta = {};
  for (const line of source.slice(4, end).split("\n")) {
    const match = /^([a-z_]+):\s*(.*)$/i.exec(line);
    if (match) meta[match[1]] = match[2].trim();
  }
  return { meta, body: source.slice(end + 5) };
}

function markdownFiles(dir) {
  let entries = [];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  return entries.flatMap((entry) => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? markdownFiles(file) : entry.name.endsWith(".md") ? [file] : [];
  });
}

function requirementIds(source, type) {
  const pattern = type === "prd" ? /^\|\s*(R-\d+)\s*\|/gm : /^###\s+(R-\d+)\b/gm;
  return [...source.matchAll(pattern)].map((match) => match[1]);
}

function plannedFeatureSlugs(source) {
  const section = source.split(/^##\s+/m).find((part) => part.startsWith("5. 파생 기능")) || "";
  return [...section.matchAll(/^\|\s*`?([a-z0-9]+(?:-[a-z0-9]+)*)`?\s*\|/gm)].map((match) => match[1]);
}

function checkFile(file) {
  const errors = [];
  let source;
  try {
    source = fs.readFileSync(file, "utf8");
  } catch (error) {
    return [`읽을 수 없습니다: ${error.message}`];
  }
  const { meta, body } = parseFrontmatter(source);
  if (!meta) return ["YAML 앞머리가 없습니다."];
  if (!TYPES.has(meta.type)) errors.push("type은 planning, prd, spec, tech 중 하나여야 합니다.");
  const slug = meta.type === "planning" ? meta.plan : meta.feature;
  const slugName = meta.type === "planning" ? "plan" : "feature";
  if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) errors.push(`${slugName} slug가 없거나 형식이 잘못됐습니다.`);
  if (!meta.title) errors.push("title이 없습니다.");
  if (!meta.status) errors.push("status가 없습니다.");
  if (!meta.updated || !/^\d{4}-\d{2}-\d{2}$/.test(meta.updated)) errors.push("updated는 YYYY-MM-DD여야 합니다.");
  if (!/^#\s+\S/m.test(body)) errors.push("문서 제목(H1)이 없습니다.");
  if (/<(?:plan|feature|title|date)>/.test(source)) errors.push("초안 자리표시자가 남아 있습니다.");

  for (const heading of REQUIRED[meta.type] || []) {
    const found = body.split("\n").some((line) => /^##\s+/.test(line) && line.includes(heading));
    if (!found) errors.push(`필수 절이 없습니다: ${heading}`);
  }

  if (meta.type === "prd") {
    const ids = requirementIds(body, "prd");
    if (!ids.length) errors.push("요구사항 표에 R-n ID가 없습니다.");
    if (new Set(ids).size !== ids.length) errors.push("중복된 요구사항 ID가 있습니다.");
  }
  if (meta.type === "spec") {
    const ids = requirementIds(body, "spec");
    if (!ids.length) errors.push("기능 상세에 R-n 제목이 없습니다.");
    if (new Set(ids).size !== ids.length) errors.push("중복된 기능 상세 ID가 있습니다.");
  }
  return errors;
}

function commandPlace(args) {
  const [type, slug] = args;
  const file = documentFile(type, slug);
  console.log(`${relative(file)}${fs.existsSync(file) ? " (기존 문서)" : " (새 문서)"}`);
}

function commandInit(args) {
  const [type, slug, ...titleParts] = args;
  const title = titleParts.join(" ").trim();
  if (!title) throw new Error("문서 제목이 필요합니다.");
  const file = documentFile(type, slug);
  if (fs.existsSync(file)) {
    fail(`이미 있습니다: ${relative(file)}`, 3);
    return;
  }
  const template = path.join(ROOT, "templates", `${type}.md`);
  let source = fs.readFileSync(template, "utf8");
  source = source.replaceAll("<plan>", slug).replaceAll("<feature>", slug).replaceAll("<title>", title).replaceAll("<date>", localDate());
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, source, { flag: "wx" });
  console.log(`생성: ${relative(file)}`);
}

function commandCheck(args) {
  const files = args.length
    ? args.map((file) => path.resolve(ROOT, file))
    : [
        ...markdownFiles(path.join(ROOT, "docs", "planning")),
        ...markdownFiles(path.join(ROOT, "docs", "features")),
      ];
  if (!files.length) {
    console.log("검사할 기획 문서가 없습니다.");
    return;
  }
  let count = 0;
  for (const file of files) {
    const errors = checkFile(file);
    if (!errors.length) {
      console.log(`통과: ${relative(file)}`);
      continue;
    }
    count += errors.length;
    console.error(`실패: ${relative(file)}`);
    for (const error of errors) console.error(`  - ${error}`);
  }
  if (count) process.exitCode = 1;
  else console.log(`문서 ${files.length}개 · 위반 0건`);
}

function commandTrace(args) {
  const feature = featureSlug(args[0]);
  const files = Object.fromEntries(["prd", "spec", "tech"].map((type) => [type, documentFile(type, feature)]));
  if (!fs.existsSync(files.prd)) {
    fail(`PRD가 없습니다: ${relative(files.prd)}`, 1);
    return;
  }
  const prd = fs.readFileSync(files.prd, "utf8");
  const wanted = requirementIds(parseFrontmatter(prd).body, "prd");
  const rows = [];

  if (fs.existsSync(files.spec)) {
    const spec = fs.readFileSync(files.spec, "utf8");
    const covered = new Set(requirementIds(parseFrontmatter(spec).body, "spec"));
    for (const id of wanted) rows.push({ id, stage: "기능명세", ok: covered.has(id) });
  } else {
    console.log(`기능명세 미작성: ${relative(files.spec)}`);
  }

  if (fs.existsSync(files.tech)) {
    const tech = parseFrontmatter(fs.readFileSync(files.tech, "utf8"));
    rows.push({ id: "spec", stage: "기술설계", ok: /\bspec\b/.test((tech.meta && tech.meta.depends_on) || "") });
  } else {
    console.log(`기술설계 미작성: ${relative(files.tech)}`);
  }

  if (!rows.length) {
    console.log(`PRD 요구사항 ${wanted.length}개 · 추적할 하위 문서 없음`);
    return;
  }
  for (const row of rows) console.log(`${row.ok ? "연결" : "누락"}: ${row.id} -> ${row.stage}`);
  const missing = rows.filter((row) => !row.ok).length;
  console.log(`추적 ${rows.length}건 · 누락 ${missing}건`);
  if (missing) process.exitCode = 1;
}

function commandTracePlan(args) {
  const plan = featureSlug(args[0]);
  const file = documentFile("planning", plan);
  if (!fs.existsSync(file)) {
    fail(`상위기획이 없습니다: ${relative(file)}`, 1);
    return;
  }
  const { body } = parseFrontmatter(fs.readFileSync(file, "utf8"));
  const features = plannedFeatureSlugs(body);
  if (!features.length) {
    console.log(`파생 기능 미작성: ${relative(file)}`);
    return;
  }
  for (const feature of features) {
    const prd = documentFile("prd", feature);
    console.log(`${fs.existsSync(prd) ? "작성" : "미작성"}: ${feature} -> ${relative(prd)}`);
  }
}

function escapeHtml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function inlineMarkdown(value) {
  const code = [];
  let text = String(value).replace(/`([^`]+)`/g, (_, part) => {
    code.push(part);
    return `\u0000${code.length - 1}\u0000`;
  });
  text = escapeHtml(text)
    .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, '<img src="$2" alt="$1" loading="lazy">')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, href) => `<a href="${href.replace(/\.md$/, ".html")}">${label}</a>`)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");
  return text.replace(/\u0000(\d+)\u0000/g, (_, index) => `<code>${escapeHtml(code[Number(index)])}</code>`);
}

function renderMarkdown(markdown) {
  const lines = markdown.split("\n");
  const output = [];
  let list = null;
  const closeList = () => {
    if (list) output.push(`</${list}>`);
    list = null;
  };

  for (let index = 0; index < lines.length;) {
    const line = lines[index];
    if (/^```/.test(line)) {
      closeList();
      const language = line.slice(3).trim();
      const buffer = [];
      index++;
      while (index < lines.length && !/^```/.test(lines[index])) buffer.push(lines[index++]);
      index++;
      output.push(`<pre><code${language ? ` class="language-${escapeHtml(language)}"` : ""}>${escapeHtml(buffer.join("\n"))}</code></pre>`);
      continue;
    }
    if (/^\s*\|/.test(line) && index + 1 < lines.length && /^\s*\|?[\s:|-]+\|\s*$/.test(lines[index + 1])) {
      closeList();
      const rows = [line];
      index += 2;
      while (index < lines.length && /^\s*\|/.test(lines[index])) rows.push(lines[index++]);
      const cells = (row) => row.trim().replace(/^\||\|$/g, "").split("|").map((cell) => inlineMarkdown(cell.trim()));
      output.push('<div class="table-wrap"><table>');
      output.push(`<thead><tr>${cells(rows[0]).map((cell) => `<th>${cell}</th>`).join("")}</tr></thead><tbody>`);
      for (const row of rows.slice(1)) output.push(`<tr>${cells(row).map((cell) => `<td>${cell}</td>`).join("")}</tr>`);
      output.push("</tbody></table></div>");
      continue;
    }
    const heading = /^(#{1,6})\s+(.+)$/.exec(line);
    if (heading) {
      closeList();
      const level = heading[1].length;
      output.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`);
      index++;
      continue;
    }
    const item = /^\s*([-*]|\d+\.)\s+(.+)$/.exec(line);
    if (item) {
      const wanted = /\d+\./.test(item[1]) ? "ol" : "ul";
      if (list !== wanted) {
        closeList();
        list = wanted;
        output.push(`<${list}>`);
      }
      output.push(`<li>${inlineMarkdown(item[2])}</li>`);
      index++;
      continue;
    }
    if (/^>\s?/.test(line)) {
      closeList();
      output.push(`<blockquote>${inlineMarkdown(line.replace(/^>\s?/, ""))}</blockquote>`);
      index++;
      continue;
    }
    if (/^---\s*$/.test(line)) {
      closeList();
      output.push("<hr>");
      index++;
      continue;
    }
    if (!line.trim()) {
      closeList();
      index++;
      continue;
    }
    closeList();
    output.push(`<p>${inlineMarkdown(line)}</p>`);
    index++;
  }
  closeList();
  return output.join("\n");
}

function htmlPage(file, source) {
  const { meta, body } = parseFrontmatter(source);
  const title = (meta && meta.title) || ((/^#\s+(.+)$/m.exec(body) || [])[1]) || path.basename(file, ".md");
  const status = (meta && meta.status) || "상태 없음";
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>
:root{color-scheme:light;--bg:#f4f6f8;--paper:#fff;--text:#17202a;--muted:#65717e;--line:#d9e0e7;--accent:#315efb}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:16px/1.68 system-ui,-apple-system,"Noto Sans KR",sans-serif}
.page{width:min(920px,calc(100% - 32px));margin:32px auto;background:var(--paper);padding:clamp(24px,5vw,64px);border:1px solid var(--line);border-radius:16px}
.meta{display:flex;gap:10px;align-items:center;color:var(--muted);font-size:14px}.badge{padding:3px 9px;border:1px solid var(--line);border-radius:999px}
h1{font-size:2rem;line-height:1.25;margin-top:20px}h2{margin-top:2.2em;border-bottom:1px solid var(--line);padding-bottom:.35em}h3{margin-top:1.6em}
a{color:var(--accent)}code{background:#eef1f5;padding:.15em .35em;border-radius:4px}pre{overflow-x:auto;background:#101820;color:#eef4f8;padding:18px;border-radius:10px}pre code{background:none;padding:0}
.table-wrap{overflow-x:auto;margin:1.2em 0}table{width:100%;border-collapse:collapse;min-width:560px}th,td{border:1px solid var(--line);padding:10px 12px;text-align:left;vertical-align:top}th{background:#f6f8fa}
blockquote{margin:1em 0;padding:.25em 1em;border-left:4px solid var(--accent);color:var(--muted)}img{max-width:100%;height:auto}
@media (max-width:640px){.page{width:100%;margin:0;border:0;border-radius:0;padding:22px 18px}h1{font-size:1.65rem}}
@media print{body{background:#fff}.page{width:100%;margin:0;border:0;padding:0}.meta{color:#444}a{color:inherit}}
</style>
</head>
<body><main class="page"><div class="meta"><span class="badge">${escapeHtml(status)}</span><span>${escapeHtml(relative(file))}</span></div>${renderMarkdown(body)}</main></body>
</html>`;
}

function commandHtml(args) {
  const outIndex = args.indexOf("--out");
  const outDir = path.resolve(ROOT, outIndex >= 0 ? args[outIndex + 1] : "dist/docs");
  if (outIndex >= 0) args.splice(outIndex, 2);
  if (!args.length) throw new Error("HTML로 내보낼 Markdown 파일이 필요합니다.");
  const generated = [];
  for (const input of args) {
    const file = path.resolve(ROOT, input);
    const source = fs.readFileSync(file, "utf8");
    const docsRoot = path.join(ROOT, "docs");
    const rel = file.startsWith(docsRoot + path.sep) ? path.relative(docsRoot, file) : path.basename(file);
    const output = path.join(outDir, rel.replace(/\.md$/i, ".html"));
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, htmlPage(file, source));
    generated.push(output);
    console.log(`생성: ${relative(output)}`);
  }
  const links = generated.map((file) => `<li><a href="${escapeHtml(path.relative(outDir, file).split(path.sep).join("/"))}">${escapeHtml(path.basename(file, ".html"))}</a></li>`).join("");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "index.html"), `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>문서</title></head><body><main><h1>문서</h1><ul>${links}</ul></main></body></html>`);
}

function usage() {
  console.log(`사용법:
  node tools/docs.js place <planning|prd|spec|tech> <slug>
  node tools/docs.js init <planning|prd|spec|tech> <slug> "<문서명>"
  node tools/docs.js check [파일.md ...]
  node tools/docs.js trace <기능-slug>
  node tools/docs.js trace-plan <기획-slug>
  node tools/docs.js html <파일.md ...> [--out <경로>]`);
}

function main() {
  const [command, ...args] = process.argv.slice(2);
  try {
    if (command === "place") commandPlace(args);
    else if (command === "init") commandInit(args);
    else if (command === "check") commandCheck(args);
    else if (command === "trace") commandTrace(args);
    else if (command === "trace-plan") commandTracePlan(args);
    else if (command === "html") commandHtml(args);
    else {
      usage();
      if (command) process.exitCode = 2;
    }
  } catch (error) {
    fail(error.message || String(error));
  }
}

if (require.main === module) main();

module.exports = { checkFile, parseFrontmatter, plannedFeatureSlugs, renderMarkdown, requirementIds };
