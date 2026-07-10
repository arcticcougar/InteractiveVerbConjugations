"use strict";

const learnerAccounts = require("./learner-accounts");

const MAX_CARD_ID_LENGTH = 180;
const MAX_CARDS_PER_SYNC = 12000;

let SCHEMA_READY = false;

function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function cleanText(input) {
  return String(input || "").replace(/\u00ad/g, "").replace(/\s+/g, " ").trim();
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

async function ensureSchema(pool) {
  if (SCHEMA_READY) return;
  await learnerAccounts.ensureLearnerSchema(pool);
  await pool.query(`
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

async function handlePostgres(body, auth) {
  const pool = learnerAccounts.getPool();
  if (!pool) return null;
  await ensureSchema(pool);
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
      account: learnerAccounts.accountPayload(auth),
      cards
    }
  };
}

async function handleBlob(body, auth) {
  const pathname = auth.blob?.pathname;
  const doc = auth.blob?.doc;
  if (!pathname || !doc) return { status: 400, payload: { ok: false, message: "Learner account could not be loaded." } };

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
  await learnerAccounts.writeBlobLearnerDoc(pathname, doc);
  return {
    status: 200,
    payload: {
      ok: true,
      configured: true,
      storage: "blob",
      account: learnerAccounts.accountPayload(auth),
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
    const auth = await learnerAccounts.authenticateLearner(body, { create: true });
    if (!auth.ok) return json(res, auth.status, auth.payload);

    if (auth.storage === "postgres") {
      const pgResult = await handlePostgres(body, auth);
      return json(res, pgResult.status, pgResult.payload);
    }

    if (auth.storage === "blob") {
      const result = await handleBlob(body, auth);
      return json(res, result.status, result.payload);
    }

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
