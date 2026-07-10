"use strict";

const { createHash, randomBytes, timingSafeEqual, pbkdf2Sync } = require("crypto");

const LEARNER_ACCOUNT_VERSION = "learner-account-v2";
const PASSCODE_ALGO = "pbkdf2-sha256";
const LEGACY_PASSCODE_ALGO = "sha256";
const PBKDF2_ITERATIONS = 210000;
const PASSCODE_KEY_BYTES = 32;
const MAX_PASSCODE_LENGTH = 64;

let POOL = null;
let SCHEMA_READY = false;

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

function hashPasscode(passcode, salt, algo = PASSCODE_ALGO) {
  if (algo === LEGACY_PASSCODE_ALGO) {
    return createHash("sha256").update(`${salt}\0${passcode}`).digest("hex");
  }
  return pbkdf2Sync(passcode, salt, PBKDF2_ITERATIONS, PASSCODE_KEY_BYTES, "sha256").toString("hex");
}

function makePasscodeRecord(passcode) {
  const salt = randomBytes(16).toString("hex");
  return {
    salt,
    hash: hashPasscode(passcode, salt, PASSCODE_ALGO),
    algo: PASSCODE_ALGO
  };
}

function safeEqualHex(a, b) {
  const actual = Buffer.from(String(a || ""), "hex");
  const expected = Buffer.from(String(b || ""), "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function verifyPasscodeRecord(passcode, salt, expectedHash, algo = LEGACY_PASSCODE_ALGO) {
  const actual = hashPasscode(passcode, salt, algo || LEGACY_PASSCODE_ALGO);
  return {
    ok: safeEqualHex(actual, expectedHash),
    needsUpgrade: (algo || LEGACY_PASSCODE_ALGO) !== PASSCODE_ALGO
  };
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

async function ensureLearnerSchema(pool) {
  if (SCHEMA_READY) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS flashcard_accounts (
      id BIGSERIAL PRIMARY KEY,
      player_slug TEXT NOT NULL UNIQUE,
      player_name TEXT NOT NULL,
      passcode_salt TEXT NOT NULL,
      passcode_hash TEXT NOT NULL,
      passcode_algo TEXT NOT NULL DEFAULT 'sha256',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    ALTER TABLE flashcard_accounts ADD COLUMN IF NOT EXISTS passcode_algo TEXT NOT NULL DEFAULT 'sha256';
  `);
  SCHEMA_READY = true;
}

function validateCredentials(body) {
  const playerName = sanitizePlayerName(body?.playerName);
  const slug = playerSlug(playerName);
  const passcode = sanitizePasscode(body?.passcode);
  if (!playerName || !slug) return { error: "Choose a learner or enter a name." };
  if (passcode.length < 4) return { error: "Enter a passcode of at least 4 characters." };
  return { playerName, slug, passcode };
}

async function authenticatePostgresLearner(pool, credentials, options = {}) {
  await ensureLearnerSchema(pool);
  const found = await pool.query(
    "SELECT * FROM flashcard_accounts WHERE player_slug = $1 LIMIT 1",
    [credentials.slug]
  );
  if (found.rows[0]) {
    const account = found.rows[0];
    const verified = verifyPasscodeRecord(
      credentials.passcode,
      account.passcode_salt,
      account.passcode_hash,
      account.passcode_algo || LEGACY_PASSCODE_ALGO
    );
    if (!verified.ok) {
      return { ok: false, status: 401, payload: { ok: false, message: "That passcode does not match this learner." } };
    }
    const updates = [];
    const values = [];
    if (account.player_name !== credentials.playerName) {
      values.push(credentials.playerName);
      updates.push(`player_name = $${values.length}`);
      account.player_name = credentials.playerName;
    }
    if (verified.needsUpgrade) {
      const pass = makePasscodeRecord(credentials.passcode);
      values.push(pass.salt);
      updates.push(`passcode_salt = $${values.length}`);
      values.push(pass.hash);
      updates.push(`passcode_hash = $${values.length}`);
      values.push(pass.algo);
      updates.push(`passcode_algo = $${values.length}`);
      account.passcode_salt = pass.salt;
      account.passcode_hash = pass.hash;
      account.passcode_algo = pass.algo;
    }
    if (updates.length) {
      values.push(account.id);
      await pool.query(
        `UPDATE flashcard_accounts SET ${updates.join(", ")}, updated_at = NOW() WHERE id = $${values.length}`,
        values
      );
    }
    return { ok: true, storage: "postgres", account, created: false, upgraded: verified.needsUpgrade };
  }

  if (options.create === false) {
    return { ok: false, status: 404, payload: { ok: false, message: "Learner account was not found." } };
  }

  const pass = makePasscodeRecord(credentials.passcode);
  const inserted = await pool.query(`
    INSERT INTO flashcard_accounts (player_slug, player_name, passcode_salt, passcode_hash, passcode_algo)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `, [credentials.slug, credentials.playerName, pass.salt, pass.hash, pass.algo]);
  return { ok: true, storage: "postgres", account: inserted.rows[0], created: true, upgraded: false };
}

function getBlobPath(slug) {
  const hash = createHash("sha256").update(slug).digest("hex").slice(0, 48);
  return `flashcard-progress/${hash}.json`;
}

async function streamToText(stream) {
  if (!stream) return "";
  return await new Response(stream).text();
}

function createBlobLearnerDoc(playerName, slug, passcode) {
  const pass = makePasscodeRecord(passcode);
  return {
    version: LEARNER_ACCOUNT_VERSION,
    playerName,
    playerSlug: slug,
    passcodeSalt: pass.salt,
    passcodeHash: pass.hash,
    passcodeAlgo: pass.algo,
    cards: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function normalizeBlobLearnerDoc(value, playerName, slug, passcode) {
  if (!value || typeof value !== "object") return createBlobLearnerDoc(playerName, slug, passcode);
  return {
    ...value,
    version: LEARNER_ACCOUNT_VERSION,
    playerName: sanitizePlayerName(value.playerName || playerName) || playerName,
    playerSlug: playerSlug(value.playerName || playerName) || slug,
    passcodeSalt: cleanText(value.passcodeSalt || ""),
    passcodeHash: cleanText(value.passcodeHash || ""),
    passcodeAlgo: cleanText(value.passcodeAlgo || "") || LEGACY_PASSCODE_ALGO,
    cards: value.cards && typeof value.cards === "object" ? value.cards : {},
    createdAt: cleanText(value.createdAt || "") || new Date().toISOString(),
    updatedAt: cleanText(value.updatedAt || "") || new Date().toISOString()
  };
}

async function readBlobLearnerDoc(playerName, slug, passcode) {
  const { get } = require("@vercel/blob");
  const pathname = getBlobPath(slug);
  try {
    const result = await get(pathname, { access: "private", useCache: false });
    if (!result || result.statusCode !== 200) {
      return { pathname, doc: createBlobLearnerDoc(playerName, slug, passcode), created: true };
    }
    const text = await streamToText(result.stream);
    const parsed = text ? JSON.parse(text) : null;
    return { pathname, doc: normalizeBlobLearnerDoc(parsed, playerName, slug, passcode), created: false };
  } catch (err) {
    if (/not.?found/i.test(err?.name || "") || /not.?found/i.test(err?.message || "")) {
      return { pathname, doc: createBlobLearnerDoc(playerName, slug, passcode), created: true };
    }
    throw err;
  }
}

async function writeBlobLearnerDoc(pathname, doc) {
  const { put } = require("@vercel/blob");
  doc.version = LEARNER_ACCOUNT_VERSION;
  doc.updatedAt = new Date().toISOString();
  return await put(pathname, JSON.stringify(doc), {
    access: "private",
    allowOverwrite: true,
    contentType: "application/json",
    cacheControlMaxAge: 60
  });
}

async function authenticateBlobLearner(credentials, options = {}) {
  const { pathname, doc, created } = await readBlobLearnerDoc(
    credentials.playerName,
    credentials.slug,
    credentials.passcode
  );
  if (created && options.create === false) {
    return { ok: false, status: 404, payload: { ok: false, message: "Learner account was not found." } };
  }
  let upgraded = false;
  if (!created) {
    const verified = verifyPasscodeRecord(
      credentials.passcode,
      doc.passcodeSalt,
      doc.passcodeHash,
      doc.passcodeAlgo || LEGACY_PASSCODE_ALGO
    );
    if (!verified.ok) {
      return { ok: false, status: 401, payload: { ok: false, message: "That passcode does not match this learner." } };
    }
    if (verified.needsUpgrade) {
      const pass = makePasscodeRecord(credentials.passcode);
      doc.passcodeSalt = pass.salt;
      doc.passcodeHash = pass.hash;
      doc.passcodeAlgo = pass.algo;
      upgraded = true;
    }
  }
  doc.playerName = credentials.playerName;
  doc.playerSlug = credentials.slug;
  await writeBlobLearnerDoc(pathname, doc);
  return {
    ok: true,
    storage: "blob",
    account: {
      player_name: doc.playerName,
      player_slug: doc.playerSlug,
      id: null
    },
    blob: { pathname, doc },
    created,
    upgraded
  };
}

async function authenticateLearner(body, options = {}) {
  const credentials = validateCredentials(body);
  if (credentials.error) {
    return { ok: false, status: 400, payload: { ok: false, message: credentials.error } };
  }
  const pool = getPool();
  if (pool) return await authenticatePostgresLearner(pool, credentials, options);
  if (hasBlobStore()) return await authenticateBlobLearner(credentials, options);
  return {
    ok: false,
    status: 200,
    payload: {
      ok: true,
      configured: false,
      message: "Learner accounts need Vercel Blob or Postgres storage configured."
    }
  };
}

function accountPayload(auth) {
  return {
    playerName: auth.account?.player_name || "",
    playerSlug: auth.account?.player_slug || "",
    created: !!auth.created,
    upgraded: !!auth.upgraded
  };
}

function getAdminKey() {
  return String(process.env.LEARNER_ADMIN_KEY || process.env.ADMIN_KEY || "").trim();
}

async function resetPostgresPasscode(pool, credentials) {
  await ensureLearnerSchema(pool);
  const pass = makePasscodeRecord(credentials.passcode);
  const result = await pool.query(`
    INSERT INTO flashcard_accounts (player_slug, player_name, passcode_salt, passcode_hash, passcode_algo)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (player_slug) DO UPDATE SET
      player_name = EXCLUDED.player_name,
      passcode_salt = EXCLUDED.passcode_salt,
      passcode_hash = EXCLUDED.passcode_hash,
      passcode_algo = EXCLUDED.passcode_algo,
      updated_at = NOW()
    RETURNING *
  `, [credentials.slug, credentials.playerName, pass.salt, pass.hash, pass.algo]);
  return result.rows[0] || null;
}

async function resetBlobPasscode(credentials) {
  const { pathname, doc } = await readBlobLearnerDoc(credentials.playerName, credentials.slug, credentials.passcode);
  const pass = makePasscodeRecord(credentials.passcode);
  doc.playerName = credentials.playerName;
  doc.playerSlug = credentials.slug;
  doc.passcodeSalt = pass.salt;
  doc.passcodeHash = pass.hash;
  doc.passcodeAlgo = pass.algo;
  await writeBlobLearnerDoc(pathname, doc);
  return doc;
}

async function resetLearnerPasscode(body) {
  const adminKey = getAdminKey();
  if (!adminKey) {
    return {
      ok: false,
      status: 200,
      payload: {
        ok: true,
        configured: false,
        message: "Passcode reset needs LEARNER_ADMIN_KEY configured."
      }
    };
  }
  if (String(body?.adminKey || "") !== adminKey) {
    return { ok: false, status: 401, payload: { ok: false, message: "Admin key is not valid." } };
  }
  const credentials = validateCredentials({
    playerName: body?.playerName,
    passcode: body?.newPasscode || body?.passcode
  });
  if (credentials.error) {
    return { ok: false, status: 400, payload: { ok: false, message: credentials.error } };
  }
  const targets = [];
  const pool = getPool();
  if (pool) {
    await resetPostgresPasscode(pool, credentials);
    targets.push("postgres");
  }
  if (hasBlobStore()) {
    await resetBlobPasscode(credentials);
    targets.push("blob");
  }
  if (!targets.length) {
    return {
      ok: false,
      status: 200,
      payload: {
        ok: true,
        configured: false,
        message: "Learner accounts need Vercel Blob or Postgres storage configured."
      }
    };
  }
  return {
    ok: true,
    status: 200,
    payload: {
      ok: true,
      configured: true,
      storage: targets.join("+"),
      account: {
        playerName: credentials.playerName,
        playerSlug: credentials.slug
      }
    }
  };
}

module.exports = {
  PASSCODE_ALGO,
  cleanText,
  sanitizePlayerName,
  sanitizePasscode,
  playerSlug,
  hasBlobStore,
  getPool,
  ensureLearnerSchema,
  validateCredentials,
  authenticateLearner,
  accountPayload,
  readBlobLearnerDoc,
  writeBlobLearnerDoc,
  resetLearnerPasscode
};
