#!/usr/bin/env node
import { existsSync, readFileSync, appendFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const LOG_PATH = join(dirname(fileURLToPath(import.meta.url)), "../.cursor/debug-df485c.log");
const SESSION = "df485c";
const RUN_ID = process.env.DEBUG_RUN_ID || "pre-fix";

function log(hypothesisId, location, message, data) {
  const entry = JSON.stringify({
    sessionId: SESSION,
    runId: RUN_ID,
    hypothesisId,
    location,
    message,
    data,
    timestamp: Date.now(),
  });
  appendFileSync(LOG_PATH, entry + "\n");
}

const nodeVersion = process.version;
const nodeMajor = Number(nodeVersion.slice(1).split(".")[0]);
const nodeMinor = Number(nodeVersion.slice(1).split(".")[1]);
const meetsNext = nodeMajor > 20 || (nodeMajor === 20 && nodeMinor >= 9);

let npmVersion = "unknown";
try {
  npmVersion = execSync("npm -v", { encoding: "utf8" }).trim();
} catch {
  npmVersion = "error";
}

const nextBin = join(process.cwd(), "node_modules/.bin/next");
const nextExists = existsSync(nextBin);

let nextVersionOutput = "";
let nextVersionError = "";
try {
  nextVersionOutput = execSync("node node_modules/next/dist/bin/next --version 2>&1", {
    encoding: "utf8",
    cwd: process.cwd(),
  }).trim();
} catch (err) {
  nextVersionError = (err.stdout || err.stderr || err.message || "").toString().trim();
}

let lockfileMissingVersions = 0;
const lockPath = join(process.cwd(), "package-lock.json");
if (existsSync(lockPath)) {
  const lock = readFileSync(lockPath, "utf8");
  const matches = lock.matchAll(/"node_modules\/[^"]+": \{\n      "dev": true,\n      "optional": true\n    \}/g);
  for (const _ of matches) lockfileMissingVersions++;
}

// #region agent log
log("H1", "diagnose.mjs:node", "Node version check", {
  nodeVersion,
  meetsNextRequirement: meetsNext,
  required: ">=20.9.0",
});
log("H2", "diagnose.mjs:next-bin", "Next binary presence", {
  nextExists,
  nextBin,
});
log("H3", "diagnose.mjs:lockfile", "Lockfile optional entries missing version", {
  lockfileExists: existsSync(lockPath),
  lockfileMissingVersions,
});
log("H4", "diagnose.mjs:npm", "npm version", { npmVersion });
log("H1", "diagnose.mjs:next-run", "Next CLI version attempt", {
  nextVersionOutput,
  nextVersionError,
  exitBlocked: !meetsNext,
});
// #endregion

console.log("Diagnosis complete. Results:");
console.log(`  Node: ${nodeVersion} (meets Next.js 16 requirement: ${meetsNext})`);
console.log(`  npm: ${npmVersion}`);
console.log(`  next binary exists: ${nextExists}`);
console.log(`  lockfile entries missing version: ${lockfileMissingVersions}`);
if (nextVersionError) console.log(`  next error: ${nextVersionError}`);
if (nextVersionOutput) console.log(`  next output: ${nextVersionOutput}`);
