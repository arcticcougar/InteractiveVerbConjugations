"use strict";

const learnerAccounts = require("./learner-accounts");

function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

async function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string" && req.body.trim()) return JSON.parse(req.body);
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
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
    const action = learnerAccounts.cleanText(body.action || "auth").toLowerCase();
    if (action === "reset-passcode") {
      const result = await learnerAccounts.resetLearnerPasscode(body);
      return json(res, result.status, result.payload);
    }
    const auth = await learnerAccounts.authenticateLearner(body, { create: true });
    if (!auth.ok) return json(res, auth.status, auth.payload);
    return json(res, 200, {
      ok: true,
      configured: true,
      storage: auth.storage,
      account: learnerAccounts.accountPayload(auth)
    });
  } catch (err) {
    return json(res, 400, {
      ok: false,
      message: err?.message || "Learner account could not be processed."
    });
  }
};
