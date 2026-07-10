"use strict";

const { createHash, randomBytes, timingSafeEqual } = require("crypto");

const FLASHCARD_PROGRESS_VERSION = "flashcard-progress-v1";
const MAX_PASSCODE_LENGTH = 64;
const MAX_CARD_ID_LENGTH = 180;
const MAX_CARDS_PER_SYNC = 12000;

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

function sanitizePlayerName(name) {
  return cleanText(name)
    .replace(/[^\p{L}\p{N} ._'-]/gu, "")
    .replace(/\s+/g, " ")
    .slice(0, 24)
    .trim();
}

function playerSlug(playerName) {
  return normalize(playerName)
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}

function sanitizePasscode(value) {
  return String(value || "").trim().slice(0, MAX_PASSCODE_LENGTH);
}

function sanitizeCardId(value) {
  return cleanText(value).replace(/[^\w|:.-]/g, "").slice(0, MAX_CARD_ID_LENGTH);
}

function clampNumber(value, min, max, fallback = 0) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function sanitizeProgressRecord(value) {
  const src = value && typeof value === "object" ? value : {};
  const lastRating = cleanText(src.lastRating || "").toLowerCase();
  return {
    reps: Math.round(clampNumber(src.reps, 0, 100000, 0)),
    lapses: Math.round(clampNumber(src.lapses, 0, 100000, 0)),
    ease: clampNumber(src.ease, 1.3, 5, 2.5),
    intervalDays: clampNumber(src.intervalDays, 0, 36500, 0),
    dueAt: Math.round(clampNumber(src.dueAt, 0, 9999999999999, 0)),
    lastReviewedAt: Math.round(clampNumber(src.lastReviewedAt, 0, 9999999999999, 0)),
    lastRating: ["again", "hard", "good", "easy"].includes(lastRating) ? lastRating : ""
  };
}

function sanitizeCardsMap(cards) {
  const out = {};
  const entries = Object.entries(cards && typeof cards === "object" ? cards : {}).slice(0, MAX_CARDS_PER_SYNC);
  entries.forEach(([rawCardId, rawProgress]) => {
    const cardId = sanitizeCardId(rawCardId);
    if (!cardId) return;
    const progress = sanitizeProgressRecord(rawProgress);
    if (!progress.reps && !progress.lastReviewedAt) return;
    out[cardId] = progress;
  });
  return out;
}

function shouldReplaceProgress(existing, incoming) {
  if (!existing) return true;
  const existingReviewed = Number(existing.lastReviewedAt) || 0;
  const incomingReviewed = Number(incoming.lastReviewedAt) || 0;
  if (incomingReviewed !== existingReviewed) return incomingReviewed > existingReviewed;
  return (Number(incoming.reps) || 0) >= (Number(existing.reps) || 0);
}

function mergeProgressMaps(base, incoming) {
  const merged = { ...(base || {}) };
  Object.entries(incoming || {}).forEach(([cardId, progress]) => {
    if (shouldReplaceProgress(merged[cardId], progress)) merged[cardId] = progress;
  });
  return merged;
}

function hashPasscode(passcode, salt) {
  return createHash("sha256").update(`${salt}\0${passcode}`).digest("hex");
}

function makePasscodeRecord(passcode) {
  const salt = randomBytes(16).toString("hex");
  return { salt, hash: hashPasscode(passcode, salt) };
}

function verifyPasscode(passcode, salt, expectedHash) {
  const actual = Buffer.from(hashPasscode(passcode, salt), "hex");
  const expected = Buffer.from(String(expectedHash || ""), "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function getConnectionString() {
  return process.env.POSTGRES_URL || process.env.DATABASE_URL || process.env.POSTGRES_URL_NON_POOLING || "";
}

function hasBlobStore() {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
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
    CREATE TABLE IF NOT EXISTS flashcard_accounts (
      id BIGSERIAL PRIMARY KEY,
      player_slug TEXT NOT NULL UNIQUE,
      player_name TEXT NOT NULL,
      passcode_salt TEXT NOT NULL,
      passcode_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS flashcard_progress (
      account_id BIGINT NOT NULL REFERENCES flashcard_accounts(id) ON DELETE CASCADE,
      card_id TEXT NOT NULL,
      reps INTEGER NOT NULL DEFAULT 0,
      lapses INTEGER NOT NULL DEFAULT 0,
      ease REAL NOT NULL DEFAULT 2.5,
      interval_days REAL NOT NULL DEFAULT 0,
      due_at BIGINT NOT NULL DEFAULT 0,
      last_reviewed_at BIGINT NOT NULL DEFAULT 0,
      last_rating TEXT NOT NULL DEFAULT '',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (account_id, card_id)
    );
    CREATE INDEX IF NOT EXISTS idx_flashcard_progress_account_reviewed
      ON flashcard_progress (account_id, last_reviewed_at DESC);
  `);
  SCHEMA_READY = true;
}

async function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string" && req.body.trim()) return JSON.parse(req.body);
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function validateCredentials(body) {
  const playerName = sanitizePlayerName(body.playerName);
  const slug = playerSlug(playerName);
  const passcode = sanitizePasscode(body.passcode);
  if (!playerName || !slug) return { error: "Choose a learner or enter a name." };
  if (passcode.length < 4) return { error: "Enter a passcode of at least 4 characters." };
  return { playerName, slug, passcode };
}

function mapPgProgress(row) {
  return sanitizeProgressRecord({
    reps: row.reps,
    lapses: row.lapses,
    ease: row.ease,
    intervalDays: row.interval_days,
    dueAt: row.due_at,
    lastReviewedAt: row.last_reviewed_at,
    lastRating: row.last_rating
  });
}

async function getOrCreatePgAccount(pool, playerName, slug, passcode) {
  const found = await pool.query(
    "SELECT * FROM flashcard_accounts WHERE player_slug = $1 LIMIT 1",
    [slug]
  );
  if (found.rows[0]) {
    const account = found.rows[0];
    if (!verifyPasscode(passcode, account.passcode_salt, account.passcode_hash)) {
      return { error: "That passcode does not match this learner." };
    }
    if (account.player_name !== playerName) {
      await pool.query(
        "UPDATE flashcard_accounts SET player_name = $1, updated_at = NOW() WHERE id = $2",
        [playerName, account.id]
      );
      account.player_name = playerName;
    }
    return { account, created: false };
  }
  const pass = makePasscodeRecord(passcode);
  const inserted = await pool.query(`
    INSERT INTO flashcard_accounts (player_slug, player_name, passcode_salt, passcode_hash)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `, [slug, playerName, pass.salt, pass.hash]);
  return { account: inserted.rows[0], created: true };
}

async function getPgCards(pool, accountId) {
  const rows = await pool.query(`
    SELECT card_id, reps, lapses, ease, interval_days, due_at, last_reviewed_at, last_rating
    FROM flashcard_progress
    WHERE account_id = $1
  `, [accountId]);
  const cards = {};
  rows.rows.forEach(row => {
    cards[row.card_id] = mapPgProgress(row);
  });
  return cards;
}

async function upsertPgCard(pool, accountId, cardId, progress) {
  await pool.query(`
    INSERT INTO flashcard_progress (
      account_id, card_id, reps, lapses, ease, interval_days, due_at, last_reviewed_at, last_rating, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
    ON CONFLICT (account_id, card_id) DO UPDATE SET
      reps = EXCLUDED.reps,
      lapses = EXCLUDED.lapses,
      ease = EXCLUDED.ease,
      interval_days = EXCLUDED.interval_days,
      due_at = EXCLUDED.due_at,
      last_reviewed_at = EXCLUDED.last_reviewed_at,
      last_rating = EXCLUDED.last_rating,
      updated_at = NOW()
  `, [
    accountId,
    cardId,
    progress.reps,
    progress.lapses,
    progress.ease,
    progress.intervalDays,
    progress.dueAt,
    progress.lastReviewedAt,
    progress.lastRating
  ]);
}

async function handlePostgres(body, credentials) {
  const pool = getPool();
  if (!pool) return null;
  await ensureSchema(pool);
  const auth = await getOrCreatePgAccount(pool, credentials.playerName, credentials.slug, credentials.passcode);
  if (auth.error) return { status: 401, payload: { ok: false, message: auth.error } };
  const accountId = auth.account.id;
  const action = cleanText(body.action || "sync").toLowerCase();

  if (action === "reset") {
    const cardIds = (Array.isArray(body.cardIds) ? body.cardIds : [])
      .map(sanitizeCardId)
      .filter(Boolean)
      .slice(0, MAX_CARDS_PER_SYNC);
    if (cardIds.length) {
      await pool.query(
        "DELETE FROM flashcard_progress WHERE account_id = $1 AND card_id = ANY($2::text[])",
        [accountId, cardIds]
      );
    }
  } else if (action === "update") {
    const cardId = sanitizeCardId(body.cardId);
    if (!cardId) return { status: 400, payload: { ok: false, message: "Card id is required." } };
    await upsertPgCard(pool, accountId, cardId, sanitizeProgressRecord(body.progress));
  } else {
    const incoming = sanitizeCardsMap(body.cards);
    if (Object.keys(incoming).length) {
      const existing = await getPgCards(pool, accountId);
      for (const [cardId, progress] of Object.entries(incoming)) {
        if (shouldReplaceProgress(existing[cardId], progress)) {
          await upsertPgCard(pool, accountId, cardId, progress);
        }
      }
    }
  }

  const cards = await getPgCards(pool, accountId);
  return {
    status: 200,
    payload: {
      ok: true,
      configured: true,
      storage: "postgres",
      account: {
        playerName: auth.account.player_name,
        playerSlug: auth.account.player_slug,
        created: auth.created
      },
      cards
    }
  };
}

function getBlobPath(slug) {
  const hash = createHash("sha256").update(slug).digest("hex").slice(0, 48);
  return `flashcard-progress/${hash}.json`;
}

async function streamToText(stream) {
  if (!stream) return "";
  return await new Response(stream).text();
}

function emptyBlobAccount(playerName, slug, passcode) {
  const pass = makePasscodeRecord(passcode);
  return {
    version: FLASHCARD_PROGRESS_VERSION,
    playerName,
    playerSlug: slug,
    passcodeSalt: pass.salt,
    passcodeHash: pass.hash,
    cards: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function normalizeBlobAccount(value, playerName, slug, passcode) {
  if (!value || typeof value !== "object") return emptyBlobAccount(playerName, slug, passcode);
  return {
    version: FLASHCARD_PROGRESS_VERSION,
    playerName: sanitizePlayerName(value.playerName || playerName) || playerName,
    playerSlug: playerSlug(value.playerName || playerName) || slug,
    passcodeSalt: cleanText(value.passcodeSalt || ""),
    passcodeHash: cleanText(value.passcodeHash || ""),
    cards: sanitizeCardsMap(value.cards),
    createdAt: cleanText(value.createdAt || "") || new Date().toISOString(),
    updatedAt: cleanText(value.updatedAt || "") || new Date().toISOString()
  };
}

async function readBlobAccount(playerName, slug, passcode) {
  const { get } = require("@vercel/blob");
  const pathname = getBlobPath(slug);
  try {
    const result = await get(pathname, { access: "private", useCache: false });
    if (!result || result.statusCode !== 200) {
      return { pathname, doc: emptyBlobAccount(playerName, slug, passcode), created: true };
    }
    const text = await streamToText(result.stream);
    const parsed = text ? JSON.parse(text) : null;
    return { pathname, doc: normalizeBlobAccount(parsed, playerName, slug, passcode), created: false };
  } catch (err) {
    if (/not.?found/i.test(err?.name || "") || /not.?found/i.test(err?.message || "")) {
      return { pathname, doc: emptyBlobAccount(playerName, slug, passcode), created: true };
    }
    throw err;
  }
}

async function writeBlobAccount(pathname, doc) {
  const { put } = require("@vercel/blob");
  doc.updatedAt = new Date().toISOString();
  return await put(pathname, JSON.stringify(doc), {
    access: "private",
    allowOverwrite: true,
    contentType: "application/json",
    cacheControlMaxAge: 60
  });
}

async function handleBlob(body, credentials) {
  const { pathname, doc, created } = await readBlobAccount(
    credentials.playerName,
    credentials.slug,
    credentials.passcode
  );
  if (!created && !verifyPasscode(credentials.passcode, doc.passcodeSalt, doc.passcodeHash)) {
    return { status: 401, payload: { ok: false, message: "That passcode does not match this learner." } };
  }

  doc.playerName = credentials.playerName;
  doc.playerSlug = credentials.slug;
  const action = cleanText(body.action || "sync").toLowerCase();
  if (action === "reset") {
    (Array.isArray(body.cardIds) ? body.cardIds : [])
      .map(sanitizeCardId)
      .filter(Boolean)
      .slice(0, MAX_CARDS_PER_SYNC)
      .forEach(cardId => {
        delete doc.cards[cardId];
      });
  } else if (action === "update") {
    const cardId = sanitizeCardId(body.cardId);
    if (!cardId) return { status: 400, payload: { ok: false, message: "Card id is required." } };
    const progress = sanitizeProgressRecord(body.progress);
    if (shouldReplaceProgress(doc.cards[cardId], progress)) doc.cards[cardId] = progress;
  } else {
    doc.cards = mergeProgressMaps(doc.cards, sanitizeCardsMap(body.cards));
  }
  await writeBlobAccount(pathname, doc);
  return {
    status: 200,
    payload: {
      ok: true,
      configured: true,
      storage: "blob",
      account: {
        playerName: doc.playerName,
        playerSlug: doc.playerSlug,
        created
      },
      cards: doc.cards
    }
  };
}

module.exports = async function handler(req, res) {
  try {
    if (req.method === "OPTIONS") {
      res.statusCode = 204;
      return res.end();
    }
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return json(res, 405, { ok: false, message: "Method not allowed." });
    }
    const body = await readBody(req);
    const credentials = validateCredentials(body);
    if (credentials.error) return json(res, 400, { ok: false, message: credentials.error });

    if (hasBlobStore()) {
      const result = await handleBlob(body, credentials);
      return json(res, result.status, result.payload);
    }

    const pgResult = await handlePostgres(body, credentials);
    if (pgResult) return json(res, pgResult.status, pgResult.payload);

    return json(res, 200, {
      ok: true,
      configured: false,
      message: "Online flashcard progress needs Vercel Blob or Postgres storage configured."
    });
  } catch (err) {
    return json(res, 400, {
      ok: false,
      message: err?.message || "Flashcard progress could not be saved."
    });
  }
};
