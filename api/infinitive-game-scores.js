"use strict";

const fs = require("fs");
const path = require("path");
const { createHash, randomUUID } = require("crypto");

const SCORE_VERSION = "infinitive-game-v3";
const SET_COUNT = 5;
const FULL_SET_NUMBER = 0;
const MAX_DURATION_MS = 4 * 60 * 60 * 1000;
const MAX_BLOB_ATTEMPTS_PER_BOARD = 1000;
const MAX_LEADERBOARD_ENTRIES = 20;
const VALID_LISTS = new Set(["essential55", "core501"]);
const ESSENTIAL_55_VERB_KEYS = new Set([
  "acabar", "andar", "aprender", "caer", "caerse", "cantar", "comenzar", "comer",
  "comprar", "conducir", "conocer", "construir", "contar", "creer", "dar", "deber",
  "decir", "dormir", "entrar", "escribir", "estar", "estudiar", "gustar", "haber",
  "hablar", "hacer", "ir", "irse", "leer", "llamar", "llamarse", "llevar", "mirar",
  "mirarse", "oir", "pagar", "pensar", "perder", "poder", "poner", "ponerse",
  "quedarse", "querer", "saber", "salir", "sentir", "sentirse", "ser", "tener",
  "tomar", "traer", "venir", "ver", "vivir", "volver"
]);
const MEANING_FALLBACKS = {
  haber: "to have (auxiliary); there is / there are"
};

let DATA_CACHE = null;
let POOL = null;
let SCHEMA_READY = false;

function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function cleanText(input) {
  return String(input || "").replace(/\u00ad/g, "").replace(/\s+/g, " ").trim();
}

function normalize(value) {
  return cleanText(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function normalizeAnswer(value) {
  return cleanText(value)
    .toLocaleLowerCase("es-ES")
    .replace(/\u00f1/g, "__enye__")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/__enye__/g, "\u00f1")
    .replace(/[^a-z\u00f10-9]/g, "");
}

function sanitizePlayerName(name) {
  return cleanText(name)
    .replace(/[^\p{L}\p{N} ._'-]/gu, "")
    .replace(/\s+/g, " ")
    .slice(0, 24)
    .trim();
}

function sanitizeAttemptId(value) {
  const cleaned = String(value || "").replace(/[^\w:-]/g, "").slice(0, 80);
  return cleaned || randomUUID();
}

function getDisplayVerbNumber(verb) {
  if (verb?.display_id) return String(verb.display_id);
  return String(Number(verb?.id) || 0).padStart(4, "0");
}

function initialInfinitiveKey(verb) {
  return normalize(verb?.infinitive || "");
}

function getData() {
  if (DATA_CACHE) return DATA_CACHE;
  const dataPath = path.join(process.cwd(), "verbs-data.json");
  const supplementalPath = path.join(process.cwd(), "supplemental-verbs.js");
  const rows = JSON.parse(fs.readFileSync(dataPath, "utf8"));
  const supplemental = fs.existsSync(supplementalPath)
    ? require(supplementalPath)
    : [];
  const rowNames = new Set(rows.map(initialInfinitiveKey));
  const supplementalRows = (Array.isArray(supplemental) ? supplemental : [])
    .filter(verb => {
      const key = initialInfinitiveKey(verb);
      return key && !rowNames.has(key);
    });
  DATA_CACHE = rows.concat(supplementalRows);
  return DATA_CACHE;
}

function isEssential55Verb(verb) {
  return ESSENTIAL_55_VERB_KEYS.has(normalize(verb?.infinitive || ""));
}

function getInfinitiveGamePool(listId) {
  const rows = getData()
    .filter(verb => verb?.infinitive && (verb?.meaning_en || MEANING_FALLBACKS[normalize(verb.infinitive)]))
    .filter(verb => {
      if (listId === "essential55") return isEssential55Verb(verb);
      return verb.source_tag !== "supplemental_essential55";
    })
    .sort((a, b) => {
      const nameDiff = normalize(a.infinitive).localeCompare(normalize(b.infinitive));
      if (nameDiff) return nameDiff;
      return (Number(a.id) || 0) - (Number(b.id) || 0);
    });
  const seen = new Set();
  return rows.filter(verb => {
    const key = cleanText(verb.infinitive || "").toLocaleLowerCase("es-ES");
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function hashStringSeed(value) {
  let hash = 2166136261;
  String(value || "").split("").forEach(char => {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  });
  return hash >>> 0;
}

function seededRandom(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function deterministicShuffle(items, seedText) {
  const out = [...items];
  const rand = seededRandom(hashStringSeed(seedText));
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function getInfinitiveGameSets(listId) {
  const shuffled = deterministicShuffle(getInfinitiveGamePool(listId), `${SCORE_VERSION}:${listId}`);
  const baseSize = Math.floor(shuffled.length / SET_COUNT);
  const remainder = shuffled.length % SET_COUNT;
  const sets = [];
  let start = 0;
  for (let idx = 0; idx < SET_COUNT; idx += 1) {
    const size = baseSize + (idx < remainder ? 1 : 0);
    sets.push(shuffled.slice(start, start + size));
    start += size;
  }
  return sets;
}

function getInfinitiveGameSet(listId, setNumber) {
  const n = normalizeSetNumber(setNumber);
  if (n === FULL_SET_NUMBER) {
    return deterministicShuffle(getInfinitiveGamePool(listId), `${SCORE_VERSION}:${listId}`);
  }
  return getInfinitiveGameSets(listId)[n - 1] || [];
}

function normalizeListId(value) {
  const listId = cleanText(value);
  if (!VALID_LISTS.has(listId)) throw new Error("Choose Essential 55 or Full 501.");
  return listId;
}

function normalizeSetNumber(value) {
  if (String(value) === "0" || String(value).toLowerCase() === "full") return FULL_SET_NUMBER;
  const n = Math.round(Number(value) || 0);
  if (n < 1 || n > SET_COUNT) throw new Error("Choose a set from 1 to 5, or the full list.");
  return n;
}

function buildLeaderboardKey(listId, setNumber) {
  return `${SCORE_VERSION}|list:${listId}|set:${setNumber === FULL_SET_NUMBER ? "full" : setNumber}`;
}

function summarizeAttempt(body) {
  const listId = normalizeListId(body.listId);
  const setNumber = normalizeSetNumber(body.setNumber);
  const expectedSet = getInfinitiveGameSet(listId, setNumber);
  if (!expectedSet.length) throw new Error("No verbs are available for that game set.");
  const answers = Array.isArray(body.answers) ? body.answers : [];
  const answersByIndex = new Map();
  answers.forEach((answer, idx) => {
    const rawIndex = Number(answer?.index);
    const answerIndex = Number.isInteger(rawIndex) ? rawIndex : idx;
    if (answerIndex >= 0 && answerIndex < expectedSet.length && !answersByIndex.has(answerIndex)) {
      answersByIndex.set(answerIndex, answer);
    }
  });
  let score = 0;
  for (let idx = 0; idx < expectedSet.length; idx += 1) {
    const answer = answersByIndex.get(idx);
    if (!answer) continue;
    const expected = normalizeAnswer(expectedSet[idx].infinitive || "");
    const actual = normalizeAnswer(answer.input || "");
    if (actual && actual === expected) score += 1;
  }
  const total = expectedSet.length;
  const completed = answersByIndex.size >= total;
  const percent = total ? Math.round((score / total) * 100) : 0;
  const shapeRevealCount = Math.max(0, Math.round(Number(body.shapeRevealCount) || (body.shapeRevealed ? 1 : 0)));
  const firstLetterCount = Math.max(0, Math.round(Number(body.firstLetterCount) || 0));
  const clueCount = Math.max(0, Math.round(Number(body.clueCount) || 0));
  const totalHints = shapeRevealCount + firstLetterCount + clueCount;
  const hintCount = Math.max(totalHints, Math.max(0, Math.round(Number(body.hintCount) || 0)));
  const helpedVerbCount = Math.min(total, Math.max(0, Math.round(Number(body.helpedVerbCount) || (hintCount ? 1 : 0))));
  return {
    listId,
    setNumber,
    leaderboardKey: buildLeaderboardKey(listId, setNumber),
    score,
    total,
    percent,
    completed,
    wrongCount: Math.max(0, Math.round(Number(body.wrongCount) || 0)),
    shapeRevealed: shapeRevealCount > 0,
    helpedVerbCount,
    shapeRevealCount,
    firstLetterCount,
    clueCount,
    hintCount,
    verbKeys: expectedSet.map(verb => `core:${Number(verb.id)}`),
    verbLabels: expectedSet.map(verb => ({
      verbKey: `core:${Number(verb.id)}`,
      infinitive: cleanText(verb.infinitive || ""),
      displayNumber: getDisplayVerbNumber(verb)
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
  return `infinitive-game-leaderboards/${hash}.json`;
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
  return await put(pathname, JSON.stringify(doc), {
    access: "private",
    allowOverwrite: true,
    contentType: "application/json",
    cacheControlMaxAge: 60
  });
}

function compareAttempts(a, b) {
  const scoreDiff = (Number(b.score) || 0) - (Number(a.score) || 0);
  if (scoreDiff) return scoreDiff;
  const completedDiff = Number(!!b.completed) - Number(!!a.completed);
  if (completedDiff) return completedDiff;
  const helpedVerbDiff = (Number(a.helpedVerbCount) || 0) - (Number(b.helpedVerbCount) || 0);
  if (helpedVerbDiff) return helpedVerbDiff;
  const hintDiff = (Number(a.hintCount) || 0) - (Number(b.hintCount) || 0);
  if (hintDiff) return hintDiff;
  const wrongDiff = (Number(a.wrongCount) || 0) - (Number(b.wrongCount) || 0);
  if (wrongDiff) return wrongDiff;
  const durationDiff = (Number(a.durationMs) || 0) - (Number(b.durationMs) || 0);
  if (durationDiff) return durationDiff;
  const submittedDiff = (Date.parse(a.submittedAt || "") || 0) - (Date.parse(b.submittedAt || "") || 0);
  if (submittedDiff) return submittedDiff;
  return String(a.attemptId || "").localeCompare(String(b.attemptId || ""));
}

function rankedLeaderboardFromAttempts(leaderboardKey, attempts, attemptId = "") {
  const sorted = [...(attempts || [])].sort(compareAttempts);
  let rank = 0;
  let lastKey = "";
  const ranked = sorted.map((attempt, idx) => {
    const key = [
      Number(attempt.score) || 0,
      attempt.completed ? 1 : 0,
      Number(attempt.helpedVerbCount) || 0,
      Number(attempt.hintCount) || 0,
      Number(attempt.wrongCount) || 0,
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
    .filter(attempt => attempt.rank <= MAX_LEADERBOARD_ENTRIES || attempt.attemptId === attemptId)
    .map(attempt => ({
      rank: attempt.rank,
      attemptId: attempt.attemptId || "",
      playerName: attempt.playerName || "",
      listId: attempt.listId || "",
      setNumber: Number(attempt.setNumber) || 0,
      score: Number(attempt.score) || 0,
      total: Number(attempt.total) || 0,
      percent: Number(attempt.percent) || 0,
      completed: !!attempt.completed,
      shapeRevealed: !!attempt.shapeRevealed,
      helpedVerbCount: Number(attempt.helpedVerbCount) || 0,
      shapeRevealCount: Number(attempt.shapeRevealCount) || 0,
      firstLetterCount: Number(attempt.firstLetterCount) || 0,
      clueCount: Number(attempt.clueCount) || 0,
      hintCount: Number(attempt.hintCount) || 0,
      wrongCount: Number(attempt.wrongCount) || 0,
      durationMs: Number(attempt.durationMs) || 0,
      submittedAt: attempt.submittedAt || "",
      isCurrentAttempt: attempt.attemptId === attemptId
    }));
  const current = ranked.find(attempt => attempt.attemptId === attemptId) || null;
  return {
    leaderboardKey,
    rank: current ? current.rank : null,
    totalAttempts: ranked.length,
    entries
  };
}

async function getBlobLeaderboard(leaderboardKey, attemptId = "") {
  const { doc } = await readBlobLeaderboard(leaderboardKey);
  return rankedLeaderboardFromAttempts(leaderboardKey, doc.attempts, attemptId);
}

async function saveBlobScore(storedAttempt, leaderboardKey) {
  const { pathname, doc } = await readBlobLeaderboard(leaderboardKey);
  const existingIdx = doc.attempts.findIndex(item => item.attemptId === storedAttempt.attemptId);
  if (existingIdx >= 0) doc.attempts[existingIdx] = storedAttempt;
  else doc.attempts.push(storedAttempt);
  doc.attempts = doc.attempts
    .sort(compareAttempts)
    .slice(0, MAX_BLOB_ATTEMPTS_PER_BOARD);
  await writeBlobLeaderboard(pathname, doc);
  return rankedLeaderboardFromAttempts(leaderboardKey, doc.attempts, storedAttempt.attemptId);
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
    CREATE TABLE IF NOT EXISTS infinitive_game_scores (
      id BIGSERIAL PRIMARY KEY,
      attempt_id TEXT NOT NULL UNIQUE,
      leaderboard_key TEXT NOT NULL,
      player_name TEXT NOT NULL,
      list_id TEXT NOT NULL,
      set_number INTEGER NOT NULL,
      verb_keys JSONB NOT NULL,
      verb_labels JSONB NOT NULL,
      score INTEGER NOT NULL,
      total INTEGER NOT NULL,
      percent INTEGER NOT NULL,
      completed BOOLEAN NOT NULL,
      shape_revealed BOOLEAN NOT NULL DEFAULT FALSE,
      helped_verb_count INTEGER NOT NULL DEFAULT 0,
      shape_reveal_count INTEGER NOT NULL DEFAULT 0,
      first_letter_count INTEGER NOT NULL DEFAULT 0,
      clue_count INTEGER NOT NULL DEFAULT 0,
      hint_count INTEGER NOT NULL DEFAULT 0,
      wrong_count INTEGER NOT NULL,
      duration_ms INTEGER NOT NULL,
      started_at TIMESTAMPTZ,
      submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      app_version TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_infinitive_game_scores_board
      ON infinitive_game_scores (leaderboard_key, score DESC, completed DESC, helped_verb_count ASC, hint_count ASC, wrong_count ASC, duration_ms ASC, submitted_at ASC);
    ALTER TABLE infinitive_game_scores ADD COLUMN IF NOT EXISTS shape_revealed BOOLEAN NOT NULL DEFAULT FALSE;
    ALTER TABLE infinitive_game_scores ADD COLUMN IF NOT EXISTS helped_verb_count INTEGER NOT NULL DEFAULT 0;
    ALTER TABLE infinitive_game_scores ADD COLUMN IF NOT EXISTS shape_reveal_count INTEGER NOT NULL DEFAULT 0;
    ALTER TABLE infinitive_game_scores ADD COLUMN IF NOT EXISTS first_letter_count INTEGER NOT NULL DEFAULT 0;
    ALTER TABLE infinitive_game_scores ADD COLUMN IF NOT EXISTS clue_count INTEGER NOT NULL DEFAULT 0;
    ALTER TABLE infinitive_game_scores ADD COLUMN IF NOT EXISTS hint_count INTEGER NOT NULL DEFAULT 0;
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

function mapPostgresRow(row, attemptId = "") {
  return {
    rank: Number(row.rank) || 0,
    attemptId: row.attempt_id,
    playerName: row.player_name,
    listId: row.list_id,
    setNumber: Number(row.set_number) || 0,
    score: Number(row.score) || 0,
    total: Number(row.total) || 0,
    percent: Number(row.percent) || 0,
    completed: !!row.completed,
    shapeRevealed: !!row.shape_revealed,
    helpedVerbCount: Number(row.helped_verb_count) || 0,
    shapeRevealCount: Number(row.shape_reveal_count) || 0,
    firstLetterCount: Number(row.first_letter_count) || 0,
    clueCount: Number(row.clue_count) || 0,
    hintCount: Number(row.hint_count) || 0,
    wrongCount: Number(row.wrong_count) || 0,
    durationMs: Number(row.duration_ms) || 0,
    submittedAt: row.submitted_at,
    isCurrentAttempt: row.attempt_id === attemptId
  };
}

async function getPostgresLeaderboard(pool, leaderboardKey, attemptId = "") {
  const rowsResult = await pool.query(`
    WITH ranked AS (
      SELECT
        attempt_id,
        player_name,
        list_id,
        set_number,
        score,
        total,
        percent,
        completed,
        shape_revealed,
        helped_verb_count,
        shape_reveal_count,
        first_letter_count,
        clue_count,
        hint_count,
        wrong_count,
        duration_ms,
        submitted_at,
        RANK() OVER (
          ORDER BY score DESC, completed DESC, helped_verb_count ASC, hint_count ASC, wrong_count ASC, duration_ms ASC, submitted_at ASC, id ASC
        ) AS rank
      FROM infinitive_game_scores
      WHERE leaderboard_key = $1
    )
    SELECT *
    FROM ranked
    WHERE rank <= $3 OR attempt_id = $2
    ORDER BY rank ASC, submitted_at ASC
  `, [leaderboardKey, attemptId, MAX_LEADERBOARD_ENTRIES]);
  const countResult = await pool.query(
    "SELECT COUNT(*)::int AS count FROM infinitive_game_scores WHERE leaderboard_key = $1",
    [leaderboardKey]
  );
  const entries = rowsResult.rows.map(row => mapPostgresRow(row, attemptId));
  const current = entries.find(row => row.isCurrentAttempt) || null;
  return {
    leaderboardKey,
    rank: current ? current.rank : null,
    totalAttempts: Number(countResult.rows[0]?.count) || 0,
    entries
  };
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
  const listId = normalizeListId(url.searchParams.get("listId") || "");
  const setNumber = normalizeSetNumber(url.searchParams.get("setNumber") || "");
  const attemptId = sanitizeAttemptId(url.searchParams.get("attemptId") || "");
  const leaderboardKey = buildLeaderboardKey(listId, setNumber);

  if (hasBlobStore()) {
    const leaderboard = await getBlobLeaderboard(leaderboardKey, attemptId);
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
  const leaderboard = await getPostgresLeaderboard(pool, leaderboardKey, attemptId);
  return json(res, 200, { ok: true, configured: true, storage: "postgres", leaderboard });
}

function buildStoredAttempt({ attemptId, playerName, scored, durationMs, startedAt, submittedAt }) {
  return {
    attemptId,
    playerName,
    listId: scored.listId,
    setNumber: scored.setNumber,
    verbKeys: scored.verbKeys,
    verbLabels: scored.verbLabels,
    score: scored.score,
    total: scored.total,
    percent: scored.percent,
    completed: scored.completed,
    shapeRevealed: scored.shapeRevealed,
    helpedVerbCount: scored.helpedVerbCount,
    shapeRevealCount: scored.shapeRevealCount,
    firstLetterCount: scored.firstLetterCount,
    clueCount: scored.clueCount,
    hintCount: scored.hintCount,
    wrongCount: scored.wrongCount,
    durationMs,
    startedAt,
    submittedAt,
    appVersion: SCORE_VERSION
  };
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
    INSERT INTO infinitive_game_scores (
      attempt_id,
      leaderboard_key,
      player_name,
      list_id,
      set_number,
      verb_keys,
      verb_labels,
      score,
      total,
      percent,
      completed,
      shape_revealed,
      helped_verb_count,
      shape_reveal_count,
      first_letter_count,
      clue_count,
      hint_count,
      wrong_count,
      duration_ms,
      started_at,
      submitted_at,
      app_version
    ) VALUES (
      $1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22
    )
    ON CONFLICT (attempt_id) DO NOTHING
  `, [
    attemptId,
    scored.leaderboardKey,
    playerName,
    scored.listId,
    scored.setNumber,
    JSON.stringify(scored.verbKeys),
    JSON.stringify(scored.verbLabels),
    scored.score,
    scored.total,
    scored.percent,
    scored.completed,
    scored.shapeRevealed,
    scored.helpedVerbCount,
    scored.shapeRevealCount,
    scored.firstLetterCount,
    scored.clueCount,
    scored.hintCount,
    scored.wrongCount,
    durationMs,
    startedAt,
    submittedAt,
    SCORE_VERSION
  ]);

  const leaderboard = await getPostgresLeaderboard(pool, scored.leaderboardKey, attemptId);
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
    if (req.method === "GET") return await handleGet(req, res);
    if (req.method === "POST") return await handlePost(req, res);
    res.setHeader("Allow", "GET, POST");
    return json(res, 405, { ok: false, message: "Method not allowed." });
  } catch (err) {
    return json(res, 400, {
      ok: false,
      message: err?.message || "Infinitive game score request failed."
    });
  }
};
