#!/usr/bin/env node

const { execFileSync } = require("node:child_process");
const path = require("node:path");

const trackedFiles = execFileSync("git", ["ls-files", "-z"], {
  encoding: "utf8",
})
  .split("\0")
  .filter(Boolean);

const forbiddenFiles = trackedFiles.filter((file) => {
  const filename = path.basename(file);
  return filename === ".env" || (filename.startsWith(".env.") && filename !== ".env.example");
});

if (forbiddenFiles.length > 0) {
  console.error("금지된 환경변수 파일이 Git에 추적되고 있습니다:");
  for (const file of forbiddenFiles) {
    console.error(`- ${file}`);
  }
  process.exit(1);
}

console.log("통과: Git이 추적하는 .env 비밀 파일이 없습니다.");
