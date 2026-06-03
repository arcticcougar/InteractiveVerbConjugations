"use strict";

const fs = require("fs");
const path = require("path");
const { createHash, randomUUID } = require("crypto");

const TENSE_SELECTION_ALL_KEYS = [
  "gerund", "participle",
  "1", "2", "3", "4", "5", "6", "7",
  "8", "9", "10", "11", "12", "13", "14",
  "imperative"
];
const TENSE_SELECTION_SET = new Set(TENSE_SELECTION_ALL_KEYS);
const SCORE_VERSION = "practice-score-v1";
const MAX_VERBS = 3;
const MAX_INPUTS = 240;
const MAX_DURATION_MS = 4 * 60 * 60 * 1000;
const MAX_BLOB_ATTEMPTS_PER_BOARD = 1000;
const MAX_COMBINED_LEADERBOARD_ENTRIES = 50;
const MAX_COMBINED_ATTEMPTS_TO_SCAN = 5000;
const DIFFICULTY_ORDER = [
  "1", "gerund", "participle", "3", "4", "2", "imperative",
  "5", "6", "7", "8", "9", "10", "11", "12", "13", "14"
];
const DIFFICULTY_MULTIPLIERS = new Map(DIFFICULTY_ORDER.map((key, idx) => [key, 1 + idx * 0.1]));

let DATA_CACHE = null;
let POOL = null;
let SCHEMA_READY = false;

function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function cleanText(input) {
  return (input || "").replace(/\u00ad/g, "").replace(/\s+/g, " ").trim();
}

function normalizeForMatch(s) {
  return (s || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();
}

function normalize(s) {
  return (s || "").toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

function normalizeUserCellInput(s) {
  return (s || "").replace(/\s+/g, " ").trim();
}

function compareUserToExpected(userValue, expectedValue) {
  const u = normalizeForMatch(userValue);
  const e = normalizeForMatch(expectedValue);
  if (!u) return "empty";
  if (!e) return "incorrect";
  if (normalize(u) === normalize(e)) return u === e ? "correct" : "accent_warning";
  return "incorrect";
}

function extractTenseNumber(key) {
  const n = parseInt((key.match(/^\d+/) || ["0"])[0], 10);
  return Number.isFinite(n) ? n : 0;
}

function getOrderedTenseKeys(obj) {
  return Object.keys(obj || {}).sort((a, b) => extractTenseNumber(a) - extractTenseNumber(b));
}

function tenseCellKey(tenseNum, number, rowIndex) {
  return `s:${tenseNum}:${number}:${rowIndex}`;
}

function gerundCellKey() {
  return "h:gerund";
}

function participleCellKey() {
  return "h:participle";
}

function imperativeCellKey(slot) {
  return `i:${slot}`;
}

function difficultyKeyForCell(cellKey) {
  if (cellKey === gerundCellKey()) return "gerund";
  if (cellKey === participleCellKey()) return "participle";
  if (String(cellKey || "").startsWith("i:")) return "imperative";
  const tenseMatch = String(cellKey || "").match(/^s:(\d+):/);
  return tenseMatch ? tenseMatch[1] : "";
}

function difficultyMultiplierForKey(key) {
  return DIFFICULTY_MULTIPLIERS.get(String(key || "")) || 1;
}

function difficultyMultiplierForCell(cellKey) {
  return difficultyMultiplierForKey(difficultyKeyForCell(cellKey));
}

function roundScore(value) {
  return Math.round((Number(value) || 0) * 10) / 10;
}

function parseImperativeLines(lines) {
  const cleaned = (lines || []).map(line => cleanText(line)).filter(Boolean);
  const pairParts = cleaned[1]
    ? cleaned[1].split(/\s+(?=[^\s;]+;\s*no\s+)/).map(part => part.trim()).filter(Boolean)
    : [];
  const lowerMatch = cleaned[2] ? cleaned[2].match(/^(.*\S)\s+(\S+)$/) : null;
  return {
    nosotros: cleaned[0] ? cleaned[0].replace(/^[-\u2014]\s*/, "").trim() : "",
    tu: pairParts[0] || "",
    vosotros: pairParts[1] || "",
    usted: lowerMatch ? lowerMatch[1].trim() : (cleaned[2] || ""),
    ustedes: lowerMatch ? lowerMatch[2].trim() : ""
  };
}

function buildCanonicalCellMap(verb) {
  const out = {};
  out[gerundCellKey()] = cleanText(verb.gerund || "");
  out[participleCellKey()] = cleanText(verb.past_participle || "");
  getOrderedTenseKeys(verb.simple).forEach(k => {
    const num = extractTenseNumber(k);
    const tense = verb.simple[k] || { singular: [], plural: [] };
    [0, 1, 2].forEach(i => {
      out[tenseCellKey(num, "sg", i)] = cleanText(tense.singular?.[i] || "");
      out[tenseCellKey(num, "pl", i)] = cleanText(tense.plural?.[i] || "");
    });
  });
  getOrderedTenseKeys(verb.compound).forEach(k => {
    const num = extractTenseNumber(k);
    const tense = verb.compound[k] || { singular: [], plural: [] };
    [0, 1, 2].forEach(i => {
      out[tenseCellKey(num, "sg", i)] = cleanText(tense.singular?.[i] || "");
      out[tenseCellKey(num, "pl", i)] = cleanText(tense.plural?.[i] || "");
    });
  });
  const imp = parseImperativeLines(verb.imperative || []);
  out[imperativeCellKey("tu")] = imp.tu || "";
  out[imperativeCellKey("usted")] = imp.usted || "";
  out[imperativeCellKey("nosotros")] = imp.nosotros || "";
  out[imperativeCellKey("vosotros")] = imp.vosotros || "";
  out[imperativeCellKey("ustedes")] = imp.ustedes || "";
  return out;
}

function getPracticeCellKeys(verb, selectedKeys) {
  const selected = new Set(selectedKeys);
  const keys = [];
  if (selected.has("gerund")) keys.push(gerundCellKey());
  if (selected.has("participle")) keys.push(participleCellKey());
  getOrderedTenseKeys(verb.simple).forEach(k => {
    const num = extractTenseNumber(k);
    if (!selected.has(String(num))) return;
    [0, 1, 2].forEach(i => keys.push(tenseCellKey(num, "sg", i)));
    [0, 1, 2].forEach(i => keys.push(tenseCellKey(num, "pl", i)));
  });
  getOrderedTenseKeys(verb.compound).forEach(k => {
    const num = extractTenseNumber(k);
    if (!selected.has(String(num))) return;
    [0, 1, 2].forEach(i => keys.push(tenseCellKey(num, "sg", i)));
    [0, 1, 2].forEach(i => keys.push(tenseCellKey(num, "pl", i)));
  });
  if (selected.has("imperative")) {
    keys.push(imperativeCellKey("tu"));
    keys.push(imperativeCellKey("usted"));
    keys.push(imperativeCellKey("nosotros"));
    keys.push(imperativeCellKey("vosotros"));
    keys.push(imperativeCellKey("ustedes"));
  }
  const expected = buildCanonicalCellMap(verb);
  return keys.filter(cellKey => cleanText(expected[cellKey] || ""));
}

function getData() {
  if (!DATA_CACHE) {
    const dataPath = path.join(process.cwd(), "verbs-data.json");
    const rows = JSON.parse(fs.readFileSync(dataPath, "utf8"));
    DATA_CACHE = {
      byCoreKey: new Map(rows.map(verb => [`core:${Number(verb.id)}`, verb]))
    };
  }
  return DATA_CACHE;
}

function sanitizePlayerName(name) {
  return cleanText(String(name || ""))
    .replace(/[^\p{L}\p{N} ._'-]/gu, "")
    .replace(/\s+/g, " ")
    .slice(0, 24)
    .trim();
}

function sanitizeAttemptId(value) {
  const cleaned = String(value || "").replace(/[^\w:-]/g, "").slice(0, 80);
  return cleaned || randomUUID();
}

function normalizeVerbKeys(value) {
  const source = Array.isArray(value)
    ? value
    : String(value || "").split(",");
  const keys = source.map(key => String(key || "").trim()).filter(Boolean);
  if (!keys.length || keys.length > MAX_VERBS) throw new Error("Select one to three verbs.");
  if (new Set(keys).size !== keys.length) throw new Error("Duplicate verbs are not allowed.");
  keys.forEach(key => {
    if (!/^core:\d+$/.test(key)) {
      throw new Error("Online scoring currently supports core verbs only.");
    }
  });
  return keys;
}

function normalizeSelectedKeys(value) {
  const source = Array.isArray(value)
    ? value
    : String(value || "").split(",");
  const set = new Set(source.map(key => String(key || "").trim()).filter(key => TENSE_SELECTION_SET.has(key)));
  const keys = TENSE_SELECTION_ALL_KEYS.filter(key => set.has(key));
  if (!keys.length) throw new Error("Select at least one tense or form.");
  return keys;
}

function normalizeOptionalVerbKeys(value) {
  const source = Array.isArray(value)
    ? value
    : String(value || "").split(",");
  const keys = source.map(key => String(key || "").trim()).filter(Boolean);
  return keys.length ? normalizeVerbKeys(keys) : [];
}

function normalizeOptionalSelectedKeys(value) {
  const source = Array.isArray(value)
    ? value
    : String(value || "").split(",");
  const keys = source.map(key => String(key || "").trim()).filter(Boolean);
  return keys.length ? normalizeSelectedKeys(keys) : [];
}

function canonicalKeyList(keys) {
  return [...(keys || [])].map(key => String(key || "")).filter(Boolean).sort();
}

function sameKeySet(a, b) {
  const left = canonicalKeyList(a);
  const right = canonicalKeyList(b);
  return left.length === right.length && left.every((key, idx) => key === right[idx]);
}

function normalizePlayerFilter(value) {
  return normalize(sanitizePlayerName(value || ""));
}

function resolveVerbs(verbKeys) {
  const { byCoreKey } = getData();
  return verbKeys.map(key => {
    const verb = byCoreKey.get(key);
    if (!verb) throw new Error(`Could not find ${key}.`);
    return { key, verb };
  });
}

function buildLeaderboardKey(verbKeys, selectedKeys) {
  return [
    SCORE_VERSION,
    `verbs:${[...verbKeys].sort().join(",")}`,
    `tenses:${selectedKeys.join(",")}`
  ].join("|");
}

function summarizeAttempt(payload) {
  const verbKeys = normalizeVerbKeys(payload.verbKeys);
  const selectedKeys = normalizeSelectedKeys(payload.selectedKeys);
  const verbs = resolveVerbs(verbKeys);
  const inputs = payload.inputs && typeof payload.inputs === "object" ? payload.inputs : {};
  if (Object.keys(inputs).length > MAX_INPUTS) throw new Error("Too many answers submitted.");

  const summary = {
    correct: 0,
    accent_warning: 0,
    incorrect: 0,
    empty: 0,
    total: 0,
    points: 0,
    percent: 0,
    weightedPoints: 0,
    weightedTotal: 0,
    weightedPercent: 0
  };
  const perVerb = [];

  verbs.forEach(({ key, verb }) => {
    const expected = buildCanonicalCellMap(verb);
    const verbSummary = {
      correct: 0,
      accent_warning: 0,
      incorrect: 0,
      empty: 0,
      total: 0,
      points: 0,
      percent: 0,
      weightedPoints: 0,
      weightedTotal: 0,
      weightedPercent: 0
    };
    getPracticeCellKeys(verb, selectedKeys).forEach(cellKey => {
      const inputKey = `${key}::${cellKey}`;
      const status = compareUserToExpected(normalizeUserCellInput(inputs[inputKey] || ""), expected[cellKey] || "");
      const multiplier = difficultyMultiplierForCell(cellKey);
      summary[status] += 1;
      summary.total += 1;
      summary.weightedTotal += multiplier;
      verbSummary[status] += 1;
      verbSummary.total += 1;
      verbSummary.weightedTotal += multiplier;
      if (status === "correct" || status === "accent_warning") {
        summary.weightedPoints += multiplier;
        verbSummary.weightedPoints += multiplier;
      }
    });
    verbSummary.points = verbSummary.correct + verbSummary.accent_warning;
    verbSummary.percent = verbSummary.total ? Math.round((verbSummary.points / verbSummary.total) * 100) : 0;
    verbSummary.weightedPoints = roundScore(verbSummary.weightedPoints);
    verbSummary.weightedTotal = roundScore(verbSummary.weightedTotal);
    verbSummary.weightedPercent = verbSummary.weightedTotal
      ? Math.round((verbSummary.weightedPoints / verbSummary.weightedTotal) * 100)
      : 0;
    perVerb.push({
      verbKey: key,
      infinitive: cleanText(verb.infinitive || ""),
      displayNumber: String(Number(verb.id) || 0).padStart(4, "0"),
      summary: verbSummary
    });
  });

  summary.points = summary.correct + summary.accent_warning;
  summary.percent = summary.total ? Math.round((summary.points / summary.total) * 100) : 0;
  summary.weightedPoints = roundScore(summary.weightedPoints);
  summary.weightedTotal = roundScore(summary.weightedTotal);
  summary.weightedPercent = summary.weightedTotal
    ? Math.round((summary.weightedPoints / summary.weightedTotal) * 100)
    : 0;
  if (!summary.total) throw new Error("No scorable forms were submitted.");

  return {
    verbKeys,
    selectedKeys,
    leaderboardKey: buildLeaderboardKey(verbKeys, selectedKeys),
    summary,
    perVerb,
    verbLabels: perVerb.map(item => ({
      verbKey: item.verbKey,
      infinitive: item.infinitive,
      displayNumber: item.displayNumber
    }))
  };
}

function getConnectionString() {
  return process.env.POSTGRES_URL || process.env.DATABASE_URL || process.env.POSTGRES_URL_NON_POOLING || "";
}

function hasBlobStore() {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}

function getBlobPath(leaderboardKey) {
  const hash = createHash("sha256").update(leaderboardKey).digest("hex").slice(0, 48);
  return `practice-leaderboards/${hash}.json`;
}

async function streamToText(stream) {
  if (!stream) return "";
  return await new Response(stream).text();
}

function emptyBlobLeaderboard(leaderboardKey) {
  return {
    version: SCORE_VERSION,
    leaderboardKey,
    attempts: []
  };
}

function normalizeBlobLeaderboard(value, leaderboardKey) {
  const doc = value && typeof value === "object" ? value : {};
  const attempts = Array.isArray(doc.attempts) ? doc.attempts : [];
  return {
    version: SCORE_VERSION,
    leaderboardKey,
    attempts: attempts.filter(attempt => attempt && typeof attempt === "object")
  };
}

async function readBlobLeaderboard(leaderboardKey) {
  const { get } = require("@vercel/blob");
  const pathname = getBlobPath(leaderboardKey);
  try {
    const result = await get(pathname, { access: "private", useCache: false });
    if (!result || result.statusCode !== 200) {
      return { pathname, doc: emptyBlobLeaderboard(leaderboardKey) };
    }
    const text = await streamToText(result.stream);
    const parsed = text ? JSON.parse(text) : null;
    return {
      pathname,
      doc: normalizeBlobLeaderboard(parsed, leaderboardKey)
    };
  } catch (err) {
    if (/not.?found/i.test(err?.name || "") || /not.?found/i.test(err?.message || "")) {
      return { pathname, doc: emptyBlobLeaderboard(leaderboardKey) };
    }
    throw err;
  }
}

async function writeBlobLeaderboard(pathname, doc) {
  const { put } = require("@vercel/blob");
  const options = {
    access: "private",
    allowOverwrite: true,
    contentType: "application/json",
    cacheControlMaxAge: 60
  };
  return await put(pathname, JSON.stringify(doc), options);
}

function compareRankableAttempts(a, b) {
  const aPoints = Number(a.summary?.points) || 0;
  const bPoints = Number(b.summary?.points) || 0;
  if (aPoints !== bPoints) return bPoints - aPoints;
  const aDuration = Number(a.durationMs) || 0;
  const bDuration = Number(b.durationMs) || 0;
  if (aDuration !== bDuration) return aDuration - bDuration;
  const aSubmitted = Date.parse(a.submittedAt || "") || 0;
  const bSubmitted = Date.parse(b.submittedAt || "") || 0;
  if (aSubmitted !== bSubmitted) return aSubmitted - bSubmitted;
  return String(a.attemptId || "").localeCompare(String(b.attemptId || ""));
}

function weightedSummaryForAttempt(attempt) {
  const summary = attempt.summary || {};
  const rawPoints = Number(summary.points) || 0;
  const rawTotal = Number(summary.total) || 0;
  if (Number.isFinite(Number(summary.weightedPoints)) && Number.isFinite(Number(summary.weightedTotal)) && Number(summary.weightedTotal) > 0) {
    const weightedPoints = roundScore(summary.weightedPoints);
    const weightedTotal = roundScore(summary.weightedTotal);
    return {
      points: weightedPoints,
      total: weightedTotal,
      percent: weightedTotal ? Math.round((weightedPoints / weightedTotal) * 100) : 0
    };
  }

  let weightedTotal = 0;
  try {
    const selectedKeys = normalizeOptionalSelectedKeys(attempt.selectedKeys || []);
    const verbs = resolveVerbs(normalizeOptionalVerbKeys(attempt.verbKeys || []));
    verbs.forEach(({ verb }) => {
      getPracticeCellKeys(verb, selectedKeys).forEach(cellKey => {
        weightedTotal += difficultyMultiplierForCell(cellKey);
      });
    });
  } catch {
    const selectedKeys = normalizeOptionalSelectedKeys(attempt.selectedKeys || []);
    const averageMultiplier = selectedKeys.length
      ? selectedKeys.reduce((sum, key) => sum + difficultyMultiplierForKey(key), 0) / selectedKeys.length
      : 1;
    weightedTotal = rawTotal * averageMultiplier;
  }

  weightedTotal = roundScore(weightedTotal || rawTotal);
  const rawRatio = rawTotal ? rawPoints / rawTotal : 0;
  const weightedPoints = roundScore(weightedTotal * rawRatio);
  return {
    points: weightedPoints,
    total: weightedTotal,
    percent: weightedTotal ? Math.round((weightedPoints / weightedTotal) * 100) : 0
  };
}

function compareCombinedAttempts(a, b) {
  const aWeighted = weightedSummaryForAttempt(a);
  const bWeighted = weightedSummaryForAttempt(b);
  if (aWeighted.points !== bWeighted.points) return bWeighted.points - aWeighted.points;
  const aPoints = Number(a.summary?.points) || 0;
  const bPoints = Number(b.summary?.points) || 0;
  if (aPoints !== bPoints) return bPoints - aPoints;
  if (aWeighted.percent !== bWeighted.percent) return bWeighted.percent - aWeighted.percent;
  const aDuration = Number(a.durationMs) || 0;
  const bDuration = Number(b.durationMs) || 0;
  if (aDuration !== bDuration) return aDuration - bDuration;
  const aSubmitted = Date.parse(a.submittedAt || "") || 0;
  const bSubmitted = Date.parse(b.submittedAt || "") || 0;
  if (aSubmitted !== bSubmitted) return aSubmitted - bSubmitted;
  return String(a.attemptId || "").localeCompare(String(b.attemptId || ""));
}

function attemptMatchesCombinedFilters(attempt, filters) {
  if (filters.playerName) {
    const playerName = normalize(sanitizePlayerName(attempt.playerName || ""));
    if (!playerName.includes(filters.playerName)) return false;
  }
  if (filters.verbKeys?.length && !sameKeySet(attempt.verbKeys || [], filters.verbKeys)) return false;
  if (filters.selectedKeys?.length) {
    const selected = normalizeOptionalSelectedKeys(attempt.selectedKeys || []);
    if (selected.join(",") !== filters.selectedKeys.join(",")) return false;
  }
  return true;
}

function mapCombinedAttempt(attempt, rank) {
  const weighted = weightedSummaryForAttempt(attempt);
  return {
    rank,
    attemptId: attempt.attemptId || "",
    playerName: attempt.playerName || "",
    weightedPoints: weighted.points,
    weightedTotal: weighted.total,
    weightedPercent: weighted.percent,
    points: Number(attempt.summary?.points) || 0,
    total: Number(attempt.summary?.total) || 0,
    percent: Number(attempt.summary?.percent) || 0,
    durationMs: Number(attempt.durationMs) || 0,
    submittedAt: attempt.submittedAt || "",
    verbKeys: Array.isArray(attempt.verbKeys) ? attempt.verbKeys : [],
    verbLabels: Array.isArray(attempt.verbLabels) ? attempt.verbLabels : [],
    selectedKeys: normalizeOptionalSelectedKeys(attempt.selectedKeys || [])
  };
}

function rankedCombinedLeaderboard(attempts, filters) {
  const filtered = attempts.filter(attempt => attemptMatchesCombinedFilters(attempt, filters));
  const sorted = filtered.sort(compareCombinedAttempts);
  const entries = sorted
    .slice(0, MAX_COMBINED_LEADERBOARD_ENTRIES)
    .map((attempt, idx) => mapCombinedAttempt(attempt, idx + 1));
  return {
    leaderboardKey: `${SCORE_VERSION}|combined`,
    totalAttempts: sorted.length,
    entries,
    filters: {
      playerName: filters.playerName || "",
      verbKeys: filters.verbKeys || [],
      selectedKeys: filters.selectedKeys || []
    }
  };
}

function rankedBlobLeaderboard(doc, attemptId = "") {
  const sorted = [...(doc.attempts || [])].sort(compareRankableAttempts);
  let rank = 0;
  let lastKey = "";
  const ranked = sorted.map((attempt, idx) => {
    const key = [
      Number(attempt.summary?.points) || 0,
      Number(attempt.durationMs) || 0,
      Date.parse(attempt.submittedAt || "") || 0,
      String(attempt.attemptId || "")
    ].join("|");
    if (key !== lastKey) {
      rank = idx + 1;
      lastKey = key;
    }
    return { ...attempt, rank };
  });
  const entries = ranked
    .filter(attempt => attempt.rank <= 10 || attempt.attemptId === attemptId)
    .map(attempt => ({
      rank: attempt.rank,
      playerName: attempt.playerName,
      points: Number(attempt.summary?.points) || 0,
      total: Number(attempt.summary?.total) || 0,
      percent: Number(attempt.summary?.percent) || 0,
      durationMs: Number(attempt.durationMs) || 0,
      submittedAt: attempt.submittedAt,
      isCurrentAttempt: attempt.attemptId === attemptId
    }));
  const current = ranked.find(attempt => attempt.attemptId === attemptId) || null;
  return {
    leaderboardKey: doc.leaderboardKey,
    rank: current ? current.rank : null,
    totalAttempts: sorted.length,
    entries
  };
}

function buildStoredAttempt({ attemptId, playerName, scored, durationMs, startedAt, submittedAt }) {
  return {
    attemptId,
    playerName,
    verbKeys: scored.verbKeys,
    verbLabels: scored.verbLabels,
    selectedKeys: scored.selectedKeys,
    summary: scored.summary,
    durationMs,
    startedAt,
    submittedAt,
    appVersion: SCORE_VERSION
  };
}

async function getBlobLeaderboard(leaderboardKey, attemptId = "") {
  const { doc } = await readBlobLeaderboard(leaderboardKey);
  return rankedBlobLeaderboard(doc, attemptId);
}

async function readAllBlobAttempts() {
  const { get, list } = require("@vercel/blob");
  const attempts = [];
  let cursor = undefined;
  do {
    const page = await list({
      prefix: "practice-leaderboards/",
      cursor,
      limit: 1000
    });
    for (const blob of page.blobs || []) {
      if (attempts.length >= MAX_COMBINED_ATTEMPTS_TO_SCAN) break;
      try {
        const result = await get(blob.pathname, { access: "private", useCache: false });
        if (!result || result.statusCode !== 200) continue;
        const text = await streamToText(result.stream);
        const parsed = text ? JSON.parse(text) : null;
        const doc = normalizeBlobLeaderboard(parsed, parsed?.leaderboardKey || "");
        doc.attempts.forEach(attempt => attempts.push(attempt));
      } catch {
        // Ignore one malformed or deleted board rather than losing the combined leaderboard.
      }
    }
    cursor = page.cursor;
  } while (cursor && attempts.length < MAX_COMBINED_ATTEMPTS_TO_SCAN);
  return attempts.slice(0, MAX_COMBINED_ATTEMPTS_TO_SCAN);
}

async function getBlobCombinedLeaderboard(filters) {
  const attempts = await readAllBlobAttempts();
  return rankedCombinedLeaderboard(attempts, filters);
}

async function saveBlobScore(storedAttempt, leaderboardKey) {
  const { pathname, doc } = await readBlobLeaderboard(leaderboardKey);
  const existingIdx = doc.attempts.findIndex(item => item.attemptId === storedAttempt.attemptId);
  if (existingIdx >= 0) {
    doc.attempts[existingIdx] = storedAttempt;
  } else {
    doc.attempts.push(storedAttempt);
  }
  doc.attempts = doc.attempts
    .sort(compareRankableAttempts)
    .slice(0, MAX_BLOB_ATTEMPTS_PER_BOARD);
  await writeBlobLeaderboard(pathname, doc);
  return rankedBlobLeaderboard(doc, storedAttempt.attemptId);
}

function getPool() {
  const connectionString = getConnectionString();
  if (!connectionString) return null;
  if (!POOL) {
    const { Pool } = require("pg");
    const useSsl = !/localhost|127\.0\.0\.1/.test(connectionString);
    POOL = new Pool({
      connectionString,
      ssl: useSsl ? { rejectUnauthorized: false } : false
    });
  }
  return POOL;
}

async function ensureSchema(pool) {
  if (SCHEMA_READY) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS practice_scores (
      id BIGSERIAL PRIMARY KEY,
      attempt_id TEXT NOT NULL UNIQUE,
      leaderboard_key TEXT NOT NULL,
      player_name TEXT NOT NULL,
      verb_keys JSONB NOT NULL,
      verb_labels JSONB NOT NULL,
      selected_keys JSONB NOT NULL,
      score_points INTEGER NOT NULL,
      score_total INTEGER NOT NULL,
      score_percent INTEGER NOT NULL,
      score_weighted_points REAL,
      score_weighted_total REAL,
      score_weighted_percent INTEGER,
      correct INTEGER NOT NULL,
      accent_warning INTEGER NOT NULL,
      incorrect INTEGER NOT NULL,
      empty INTEGER NOT NULL,
      duration_ms INTEGER NOT NULL,
      started_at TIMESTAMPTZ,
      submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      app_version TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_practice_scores_leaderboard
      ON practice_scores (leaderboard_key, score_points DESC, duration_ms ASC, submitted_at ASC);
    ALTER TABLE practice_scores ADD COLUMN IF NOT EXISTS score_weighted_points REAL;
    ALTER TABLE practice_scores ADD COLUMN IF NOT EXISTS score_weighted_total REAL;
    ALTER TABLE practice_scores ADD COLUMN IF NOT EXISTS score_weighted_percent INTEGER;
  `);
  SCHEMA_READY = true;
}

function normalizeDurationMs(value) {
  const n = Math.round(Number(value) || 0);
  return Math.max(0, Math.min(n, MAX_DURATION_MS));
}

function normalizeTimestamp(value) {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

function mapLeaderboardRow(row, attemptId) {
  return {
    rank: Number(row.rank) || 0,
    playerName: row.player_name,
    points: Number(row.score_points) || 0,
    total: Number(row.score_total) || 0,
    percent: Number(row.score_percent) || 0,
    durationMs: Number(row.duration_ms) || 0,
    submittedAt: row.submitted_at,
    isCurrentAttempt: row.attempt_id === attemptId
  };
}

async function getLeaderboard(pool, leaderboardKey, attemptId = "") {
  const rowsResult = await pool.query(`
    WITH ranked AS (
      SELECT
        attempt_id,
        player_name,
        score_points,
        score_total,
        score_percent,
        duration_ms,
        submitted_at,
        RANK() OVER (
          ORDER BY score_points DESC, duration_ms ASC, submitted_at ASC, id ASC
        ) AS rank
      FROM practice_scores
      WHERE leaderboard_key = $1
    )
    SELECT *
    FROM ranked
    WHERE rank <= 10 OR attempt_id = $2
    ORDER BY rank ASC, submitted_at ASC
  `, [leaderboardKey, attemptId]);
  const countResult = await pool.query(
    "SELECT COUNT(*)::int AS count FROM practice_scores WHERE leaderboard_key = $1",
    [leaderboardKey]
  );
  const entries = rowsResult.rows.map(row => mapLeaderboardRow(row, attemptId));
  const current = entries.find(row => row.isCurrentAttempt) || null;
  return {
    leaderboardKey,
    rank: current ? current.rank : null,
    totalAttempts: Number(countResult.rows[0]?.count) || 0,
    entries
  };
}

function parseJsonField(value, fallback) {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object") return value;
  if (typeof value === "string" && value.trim()) {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }
  return fallback;
}

function storedAttemptFromRow(row) {
  return {
    attemptId: row.attempt_id,
    playerName: row.player_name,
    verbKeys: parseJsonField(row.verb_keys, []),
    verbLabels: parseJsonField(row.verb_labels, []),
    selectedKeys: parseJsonField(row.selected_keys, []),
    summary: {
      points: Number(row.score_points) || 0,
      total: Number(row.score_total) || 0,
      percent: Number(row.score_percent) || 0,
      weightedPoints: Number(row.score_weighted_points) || 0,
      weightedTotal: Number(row.score_weighted_total) || 0,
      weightedPercent: Number(row.score_weighted_percent) || 0,
      correct: Number(row.correct) || 0,
      accent_warning: Number(row.accent_warning) || 0,
      incorrect: Number(row.incorrect) || 0,
      empty: Number(row.empty) || 0
    },
    durationMs: Number(row.duration_ms) || 0,
    startedAt: row.started_at,
    submittedAt: row.submitted_at,
    appVersion: row.app_version
  };
}

async function getCombinedLeaderboard(pool, filters) {
  const rowsResult = await pool.query(`
    SELECT
      attempt_id,
      player_name,
      verb_keys,
      verb_labels,
      selected_keys,
      score_points,
      score_total,
      score_percent,
      score_weighted_points,
      score_weighted_total,
      score_weighted_percent,
      correct,
      accent_warning,
      incorrect,
      empty,
      duration_ms,
      started_at,
      submitted_at,
      app_version
    FROM practice_scores
    ORDER BY submitted_at DESC
    LIMIT $1
  `, [MAX_COMBINED_ATTEMPTS_TO_SCAN]);
  return rankedCombinedLeaderboard(rowsResult.rows.map(storedAttemptFromRow), filters);
}

async function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string" && req.body.trim()) return JSON.parse(req.body);
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

async function handleGet(req, res) {
  const url = new URL(req.url, "http://localhost");
  const scope = cleanText(url.searchParams.get("scope") || "");
  if (scope === "combined") {
    const filters = {
      playerName: normalizePlayerFilter(url.searchParams.get("playerName") || ""),
      verbKeys: normalizeOptionalVerbKeys(url.searchParams.get("verbKeys") || ""),
      selectedKeys: normalizeOptionalSelectedKeys(url.searchParams.get("selectedKeys") || "")
    };
    if (hasBlobStore()) {
      const leaderboard = await getBlobCombinedLeaderboard(filters);
      return json(res, 200, { ok: true, configured: true, storage: "blob", leaderboard });
    }
    const pool = getPool();
    if (!pool) {
      return json(res, 200, {
        ok: true,
        configured: false,
        message: "Online scores need Vercel Blob or Postgres storage configured."
      });
    }
    await ensureSchema(pool);
    const leaderboard = await getCombinedLeaderboard(pool, filters);
    return json(res, 200, { ok: true, configured: true, storage: "postgres", leaderboard });
  }

  const verbKeys = normalizeVerbKeys(url.searchParams.get("verbKeys") || "");
  const selectedKeys = normalizeSelectedKeys(url.searchParams.get("selectedKeys") || "");
  const leaderboardKey = buildLeaderboardKey(verbKeys, selectedKeys);
  if (hasBlobStore()) {
    const leaderboard = await getBlobLeaderboard(leaderboardKey);
    return json(res, 200, { ok: true, configured: true, storage: "blob", leaderboard });
  }
  const pool = getPool();
  if (!pool) {
    return json(res, 200, {
      ok: true,
      configured: false,
      message: "Online scores need Vercel Blob or Postgres storage configured."
    });
  }
  await ensureSchema(pool);
  const leaderboard = await getLeaderboard(pool, leaderboardKey);
  return json(res, 200, { ok: true, configured: true, storage: "postgres", leaderboard });
}

async function handlePost(req, res) {
  const body = await readBody(req);
  const playerName = sanitizePlayerName(body.playerName);
  if (!playerName) throw new Error("Player name is required.");

  const scored = summarizeAttempt(body);
  const attemptId = sanitizeAttemptId(body.attemptId);
  const durationMs = normalizeDurationMs(body.durationMs);
  const startedAt = normalizeTimestamp(body.startedAt);
  const submittedAt = normalizeTimestamp(body.submittedAt) || new Date().toISOString();

  if (hasBlobStore()) {
    const storedAttempt = buildStoredAttempt({ attemptId, playerName, scored, durationMs, startedAt, submittedAt });
    const leaderboard = await saveBlobScore(storedAttempt, scored.leaderboardKey);
    return json(res, 200, {
      ok: true,
      configured: true,
      storage: "blob",
      scored,
      leaderboard
    });
  }

  const pool = getPool();

  if (!pool) {
    return json(res, 200, {
      ok: true,
      configured: false,
      message: "Online scores need Vercel Blob or Postgres storage configured.",
      scored
    });
  }

  await ensureSchema(pool);
  await pool.query(`
    INSERT INTO practice_scores (
      attempt_id,
      leaderboard_key,
      player_name,
      verb_keys,
      verb_labels,
      selected_keys,
      score_points,
      score_total,
      score_percent,
      score_weighted_points,
      score_weighted_total,
      score_weighted_percent,
      correct,
      accent_warning,
      incorrect,
      empty,
      duration_ms,
      started_at,
      submitted_at,
      app_version
    ) VALUES (
      $1, $2, $3, $4::jsonb, $5::jsonb, $6::jsonb, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
    )
    ON CONFLICT (attempt_id) DO NOTHING
  `, [
    attemptId,
    scored.leaderboardKey,
    playerName,
    JSON.stringify(scored.verbKeys),
    JSON.stringify(scored.verbLabels),
    JSON.stringify(scored.selectedKeys),
    scored.summary.points,
    scored.summary.total,
    scored.summary.percent,
    scored.summary.weightedPoints,
    scored.summary.weightedTotal,
    scored.summary.weightedPercent,
    scored.summary.correct,
    scored.summary.accent_warning,
    scored.summary.incorrect,
    scored.summary.empty,
    durationMs,
    startedAt,
    submittedAt,
    SCORE_VERSION
  ]);

  const leaderboard = await getLeaderboard(pool, scored.leaderboardKey, attemptId);
  return json(res, 200, {
    ok: true,
    configured: true,
    storage: "postgres",
    scored,
    leaderboard
  });
}

module.exports = async function handler(req, res) {
  try {
    if (req.method === "OPTIONS") {
      res.statusCode = 204;
      return res.end();
    }
    if (req.method === "GET") return await handleGet(req, res);
    if (req.method === "POST") return await handlePost(req, res);
    return json(res, 405, { ok: false, message: "Method not allowed." });
  } catch (err) {
    return json(res, 400, {
      ok: false,
      message: err?.message || "Could not process practice score."
    });
  }
};
