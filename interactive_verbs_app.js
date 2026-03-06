"use strict";

const STATE_KEY = "ivc_state_v1";
const BACKUP_VERSION = 1;
const BASE_DATA = window.VERB_DATA || [];
const DEFAULT_STATE = {
  version: 1,
  custom_verbs: [],
  drafts: {},
  check_results: {},
  pending_queue: [],
  snapshots: [],
  ui: {
    selected_verb_key: null,
    search_text: "",
    pattern_filter: "all",
    tag_filter: "all"
  },
  seed_imported: {
    slang12: false
  }
};

const SLANG_STARTER_12 = [
  { infinitive: "ligar", meaning_en: "to hook up / flirt / score", model: "hablar" },
  { infinitive: "joder", meaning_en: "to screw / fuck / annoy", model: "comer" },
  { infinitive: "follar", meaning_en: "to fuck / have sex", model: "contar" },
  { infinitive: "costar", meaning_en: "to cost / be hard", model: "contar" },
  { infinitive: "calentar", meaning_en: "to turn on / heat up", model: "pensar" },
  { infinitive: "elegir", meaning_en: "to choose / pick", model: "pedir" },
  { infinitive: "empezar", meaning_en: "to start", model: "empezar" },
  { infinitive: "pirarse", meaning_en: "to split / take off", model: "hablar" },
  { infinitive: "largarse", meaning_en: "to get out / leave", model: "hablar" },
  { infinitive: "poner", meaning_en: "to put / post", model: "poner" },
  { infinitive: "salir", meaning_en: "to leave / go out", model: "salir" },
  { infinitive: "decir", meaning_en: "to say / tell", model: "decir" }
];

const PRONOUNS = {
  "1-sg": "yo",
  "2-sg": "tú",
  "3-sg": "él",
  "1-pl": "nosotros",
  "2-pl": "vosotros",
  "3-pl": "ellos"
};

const IMPERATIVE_META = {
  yo: { person: "1", number: "sg", label: "yo" },
  tu: { person: "2", number: "sg", label: "tú" },
  usted: { person: "3", number: "sg", label: "usted" },
  nosotros: { person: "1", number: "pl", label: "nosotros" },
  vosotros: { person: "2", number: "pl", label: "vosotros" },
  ustedes: { person: "3", number: "pl", label: "ustedes" }
};

const TENSE_HINTS = {
  "1": "Used for <strong>now</strong> and general truths (present).",
  "2": "Used for <strong>ongoing/habitual past</strong> or descriptions (imperfect).",
  "3": "Used for <strong>completed past actions</strong> (preterite).",
  "4": "Used for <strong>future</strong> statements and predictions.",
  "5": "Often used for <strong>would</strong> / hypothetical situations (conditional).",
  "6": "Used for <strong>present subjunctive</strong>: doubt, desire, recommendations.",
  "7": "Used for <strong>imperfect subjunctive</strong>: past hypotheticals, reported speech.",
  "8": "Present perfect: <strong>have + past participle</strong> (recent/connected past).",
  "9": "Past perfect: <strong>had + past participle</strong> (earlier past).",
  "10": "Preterite anterior: rare/literary; <strong>had (immediately) done</strong>.",
  "11": "Future perfect: <strong>will have + past participle</strong>.",
  "12": "Conditional perfect: <strong>would have + past participle</strong>.",
  "13": "Perfect subjunctive: <strong>have + past participle</strong> in subjunctive contexts.",
  "14": "Pluperfect subjunctive: <strong>had + past participle</strong> in subjunctive contexts."
};

const CORE_NOTES_OVERRIDES = {
  1: {
    related: [
      "abatidamente - dejectedly; batir - to beat, strike",
      "el abatimiento - abasement, depression, discouragement; batir palmas - to applaud, clap",
      "abatir el ánimo - to feel discouraged, low in spirit; abatido, abatida - dejected"
    ]
  },
  2: {
    related: [
      "abrasadamente - ardently, fervently; abrasarse vivo - to burn with passion",
      "abrasado, abrasada - burning",
      "abrasarse de amor - to be passionately in love; el abrasamiento - burning, excessive passion",
      "abrasarse en deseos - to become full of desire"
    ]
  },
  3: {
    pattern_notes: ["Regular -ar verb endings with spelling change: z becomes c before e"],
    related: [
      "un abrazo - embrace, hug; una abrazada - embrace",
      "el abrazamiento - embracing; una abrazadera - clamp, clasp",
      "un abrazo de Juanita - Love, Juanita"
    ]
  },
  4: {
    pattern_notes: ["Regular -ir verb endings with spelling change: irregular past participle"],
    related: [
      "Abrid los libros en la página diez, por favor. - Open your books to page ten, please.",
      "Todos los alumnos abrieron los libros en la página diez y Pablo comenzó a leer. - All the students opened their books to page ten, and Paul began to read.",
      "un abrimiento - opening; La puerta está abierta. - The door is open.",
      "abrir paso - to make way; en un abrir y cerrar de ojos - in a wink"
    ]
  },
  5: {
    pattern_notes: ["Regular -er verb endings with spelling change: irregular past participle; stem change: Tenses 1, 6, Imperative"],
    related: [
      "la absolución - absolution, acquittal, pardon; el absolutismo - absolutism, despotism",
      "absolutamente - absolutely; la absolución libre - not guilty verdict",
      "absoluto, absoluta - absolute, unconditional; salir absuelto - to come out clear of any charges",
      "en absoluto - absolutely; nada en absoluto - nothing at all"
    ]
  },
  6: {
    related: [
      "la abstención - abstention, forbearance; el, la abstencionista - abstentionist",
      "abstenerse de - to abstain from, to refrain from; el abstencionismo - abstentionism",
      "la abstinencia - abstinence, fasting; el día de abstinencia - day of fasting",
      "hacer abstinencia - to fast"
    ]
  }
};

let APP_STATE = loadState();
let CURRENT_VERB_KEY = APP_STATE.ui.selected_verb_key || null;
let ACTIVE_EDITOR = null;
let SAVE_TIMER = null;
let IMPORT_INPUT = null;
let CUSTOM_DATA = [];
let GLOBAL_FORM_FLOORS = null;
let GLOBAL_HEADER_FLOORS = null;
let CLICK_TIMER = null;

function normalize(s) {
  return (s || "").toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

function normalizeForMatch(s) {
  return (s || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();
}

function normalizeUserCellInput(s) {
  return (s || "").replace(/\s+/g, " ").trim();
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
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

function splitSynAntLine(line) {
  const synMatch = line.match(/(?:^|\s)Syn\.\:\s*(.*?)(?=\s+Ant\.\:|$)/i);
  const antMatch = line.match(/(?:^|\s)Ant\.\:\s*(.*)$/i);
  return {
    syn: synMatch ? synMatch[1].split(/\s*;\s*/).map(x => x.trim()).filter(Boolean) : [],
    ant: antMatch ? antMatch[1].split(/\s*;\s*/).map(x => x.trim()).filter(Boolean) : []
  };
}

function cleanText(input) {
  let out = (input || "").replace(/\u00ad/g, "").replace(/\s+/g, " ").trim();
  if (!out) return "";

  const replacements = [
    ["â€™", "’"], ["â€˜", "‘"], ["â€œ", "“"], ["â€", "”"],
    ["â€“", "–"], ["â€”", "—"], ["â€¦", "…"], ["â€¢", "•"],
    ["Â¿", "¿"], ["Â¡", "¡"], ["Â«", "«"], ["Â»", "»"],
    ["Ã¡", "á"], ["Ã©", "é"], ["Ã­", "í"], ["Ã³", "ó"], ["Ãº", "ú"],
    ["Ã", "Á"], ["Ã‰", "É"], ["Ã", "Í"], ["Ã“", "Ó"], ["Ãš", "Ú"],
    ["Ã±", "ñ"], ["Ã‘", "Ñ"], ["Ã¼", "ü"], ["Ãœ", "Ü"], ["Â", ""]
  ];
  replacements.forEach(([bad, good]) => {
    out = out.split(bad).join(good);
  });

  return out
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/([¿¡])\s+/g, "$1")
    .trim();
}

function isLikelyEditorialNote(line) {
  const t = normalize(line || "");
  return (
    /^an essential\b/.test(t) ||
    /^can'?t (find|remember)\b/.test(t) ||
    /^\d+\s+verb\b/.test(t) ||
    /^sentences using\b/.test(t) ||
    /^words and expressions related to (this|these) verb/.test(t) ||
    /^proverb(s)?\b/.test(t) ||
    /^[a-z]+(?:\/[a-z]+)?$/.test(t)
  );
}

function extractInlineSynAnt(line) {
  const text = cleanText(line);
  const markers = [...text.matchAll(/\b(Syn|Ant)\.\:\s*/gi)];
  if (!markers.length) return { rest: text, syn: [], ant: [] };

  const syn = [];
  const ant = [];
  const rest = cleanText(text.slice(0, markers[0].index));
  markers.forEach((m, idx) => {
    const label = (m[1] || "").toLowerCase();
    const start = (m.index ?? 0) + m[0].length;
    const end = idx + 1 < markers.length ? (markers[idx + 1].index ?? text.length) : text.length;
    const segment = cleanText(text.slice(start, end).replace(/^[-–—:;\s]+/, ""));
    if (!segment) return;
    const parts = segment.split(/\s*;\s*/).map(cleanText).filter(Boolean);
    if (label === "syn") syn.push(...parts);
    if (label === "ant") ant.push(...parts);
  });
  return { rest, syn, ant };
}

function splitReadableNoteLine(line) {
  const cleaned = cleanText(line);
  if (!cleaned) return [];

  const rows = [];
  const push = (text) => {
    const t = cleanText(text);
    if (t) rows.push(t);
  };

  cleaned.split(/\t+/).forEach(part => {
    const p = cleanText(part);
    if (!p) return;
    if (p.includes(";")) {
      p.split(/\s*;\s*/).forEach(push);
      return;
    }
    if (p.includes(" / ") && p.length > 90) {
      p.split(/\s+\/\s+/).forEach(push);
      return;
    }
    if (p.length > 120) {
      const sentenceParts = p.split(/(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÑ¿¡])/);
      if (sentenceParts.length > 1) {
        sentenceParts.forEach(push);
        return;
      }
    }
    push(p);
  });
  return rows;
}

function dedupeTextRows(rows) {
  const out = [];
  const seen = new Set();
  (rows || []).forEach(row => {
    const value = cleanText(row);
    const key = normalize(value);
    if (!value || seen.has(key)) return;
    seen.add(key);
    out.push(value);
  });
  return out;
}

function parseImperativeLines(lines) {
  const cleaned = (lines || []).map(line => (line || "").trim()).filter(Boolean);
  const pairParts = cleaned[1]
    ? cleaned[1].split(/\s+(?=[^\s;]+;\s*no\s+)/).map(part => part.trim()).filter(Boolean)
    : [];
  const lowerMatch = cleaned[2] ? cleaned[2].match(/^(.*\S)\s+(\S+)$/) : null;
  return {
    nosotros: cleaned[0] ? cleaned[0].replace(/^[-—]\s*/, "").trim() : "",
    tu: pairParts[0] || "",
    vosotros: pairParts[1] || "",
    usted: lowerMatch ? lowerMatch[1].trim() : (cleaned[2] || ""),
    ustedes: lowerMatch ? lowerMatch[2].trim() : ""
  };
}

function normalizeVerbRecord(v) {
  v.infinitive = cleanText(v.infinitive);
  v.meaning_en = cleanText(v.meaning_en);
  v.gerund = cleanText(v.gerund);
  v.past_participle = cleanText(v.past_participle);
  v.pattern_notes = dedupeTextRows((v.pattern_notes || []).flatMap(splitReadableNoteLine));

  const rawImperative = (v.imperative || []).map(line => cleanText(line)).filter(Boolean);
  const imperativeLines = rawImperative.slice(0, 3);
  const extras = {
    syn: [...(v.extras?.syn || [])].map(cleanText).filter(Boolean),
    ant: [...(v.extras?.ant || [])].map(cleanText).filter(Boolean),
    related: [...(v.extras?.related || [])].map(cleanText).filter(Boolean)
  };

  rawImperative.slice(3).forEach(line => {
    if (/(?:^|\s)(?:Syn|Ant)\.\:/i.test(line)) {
      const parsed = splitSynAntLine(line);
      extras.syn.push(...parsed.syn.map(cleanText));
      extras.ant.push(...parsed.ant.map(cleanText));
      return;
    }
    extras.related.push(line);
  });

  const related = [];
  const syn = [...extras.syn];
  const ant = [...extras.ant];
  extras.related.forEach(line => {
    const extracted = extractInlineSynAnt(line);
    if (extracted.syn.length) syn.push(...extracted.syn);
    if (extracted.ant.length) ant.push(...extracted.ant);
    if (extracted.rest && !isLikelyEditorialNote(extracted.rest)) {
      related.push(...splitReadableNoteLine(extracted.rest));
    }
  });

  v.extras = {
    related: dedupeTextRows(related),
    syn: dedupeTextRows(syn.flatMap(splitReadableNoteLine)),
    ant: dedupeTextRows(ant.flatMap(splitReadableNoteLine))
  };
  v.imperative_raw = rawImperative;
  v.imperative = imperativeLines;
  v.imperativeParsed = parseImperativeLines(imperativeLines);

  Object.entries(v.simple || {}).forEach(([tenseKey, tenseTable]) => {
    ["singular", "plural"].forEach(numKey => {
      tenseTable[numKey] = (tenseTable[numKey] || []).map(cleanText);
    });
    const cleanKey = cleanText(tenseKey);
    if (cleanKey !== tenseKey) {
      v.simple[cleanKey] = tenseTable;
      delete v.simple[tenseKey];
    }
  });

  Object.entries(v.compound || {}).forEach(([tenseKey, tenseTable]) => {
    ["singular", "plural"].forEach(numKey => {
      tenseTable[numKey] = (tenseTable[numKey] || []).map(cleanText);
    });
    const cleanKey = cleanText(tenseKey);
    if (cleanKey !== tenseKey) {
      v.compound[cleanKey] = tenseTable;
      delete v.compound[tenseKey];
    }
  });

  return v;
}

function applyCoreNotesOverride(v) {
  const idNum = Number(v?.id);
  const override = CORE_NOTES_OVERRIDES[idNum];
  if (!override) return v;
  if (Array.isArray(override.pattern_notes)) {
    v.pattern_notes = override.pattern_notes.map(cleanText).filter(Boolean);
  }
  if (!v.extras || typeof v.extras !== "object") {
    v.extras = { related: [], syn: [], ant: [] };
  }
  if (Array.isArray(override.related)) {
    v.extras.related = override.related.map(cleanText).filter(Boolean);
  }
  if (Array.isArray(override.syn)) {
    v.extras.syn = override.syn.map(cleanText).filter(Boolean);
  }
  if (Array.isArray(override.ant)) {
    v.extras.ant = override.ant.map(cleanText).filter(Boolean);
  }
  return v;
}

function coerceState(raw) {
  const src = raw && typeof raw === "object" ? raw : {};
  return {
    version: 1,
    custom_verbs: Array.isArray(src.custom_verbs) ? src.custom_verbs : [],
    drafts: src.drafts && typeof src.drafts === "object" ? src.drafts : {},
    check_results: src.check_results && typeof src.check_results === "object" ? src.check_results : {},
    pending_queue: Array.isArray(src.pending_queue) ? src.pending_queue : [],
    snapshots: Array.isArray(src.snapshots) ? src.snapshots : [],
    ui: {
      selected_verb_key: src.ui?.selected_verb_key || null,
      search_text: src.ui?.search_text || "",
      pattern_filter: src.ui?.pattern_filter || "all",
      tag_filter: src.ui?.tag_filter || "all"
    },
    seed_imported: {
      slang12: !!src.seed_imported?.slang12
    }
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (!raw) return deepClone(DEFAULT_STATE);
    return coerceState(JSON.parse(raw));
  } catch {
    return deepClone(DEFAULT_STATE);
  }
}

function saveStateNow() {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(coerceState(APP_STATE)));
  } catch {
    // ignore localStorage write issues
  }
}

function scheduleSave() {
  clearTimeout(SAVE_TIMER);
  SAVE_TIMER = setTimeout(saveStateNow, 120);
}

function withVerbIdentity(v, source) {
  const idNum = Number(v.id);
  v._source = source;
  v._key = source === "core" ? `core:${idNum}` : `custom:${idNum}`;
  return v;
}

const CORE_DATA = BASE_DATA.map(v => withVerbIdentity(applyCoreNotesOverride(normalizeVerbRecord(v)), "core"));
const CORE_BY_KEY = new Map(CORE_DATA.map(v => [v._key, v]));
const SIMPLE_TENSE_KEYS = getOrderedTenseKeys(CORE_DATA[0]?.simple || {});
const COMPOUND_TENSE_KEYS = getOrderedTenseKeys(CORE_DATA[0]?.compound || {});

function createBlankTenseSet(keys) {
  const out = {};
  (keys || []).forEach(k => {
    out[k] = { singular: ["", "", ""], plural: ["", "", ""] };
  });
  return out;
}

function stripCustomForState(v) {
  return {
    id: Number(v.id),
    infinitive: v.infinitive || "",
    meaning_en: v.meaning_en || "",
    gerund: v.gerund || "",
    past_participle: v.past_participle || "",
    pattern_notes: Array.isArray(v.pattern_notes) ? v.pattern_notes : [],
    simple: v.simple || createBlankTenseSet(SIMPLE_TENSE_KEYS),
    compound: v.compound || createBlankTenseSet(COMPOUND_TENSE_KEYS),
    imperative: Array.isArray(v.imperative) ? v.imperative : ["", "", ""],
    extras: v.extras || { related: [], syn: [], ant: [] },
    model_verb_ref: v.model_verb_ref || "",
    answer_key: v.answer_key && typeof v.answer_key === "object" ? v.answer_key : {},
    key_confidence: typeof v.key_confidence === "number" ? v.key_confidence : null,
    key_needs_review: !!v.key_needs_review,
    source_tag: v.source_tag || "user",
    locked: !!v.locked,
    created_at: v.created_at || new Date().toISOString(),
    updated_at: v.updated_at || new Date().toISOString(),
    finalized_at: v.finalized_at || null
  };
}

function hydrateCustomVerb(raw) {
  if (!raw || typeof raw !== "object") return null;
  const v = normalizeVerbRecord({
    id: Number(raw.id),
    infinitive: raw.infinitive || "",
    meaning_en: raw.meaning_en || "",
    gerund: raw.gerund || "",
    past_participle: raw.past_participle || "",
    pattern_notes: Array.isArray(raw.pattern_notes) ? raw.pattern_notes : [],
    simple: raw.simple || createBlankTenseSet(SIMPLE_TENSE_KEYS),
    compound: raw.compound || createBlankTenseSet(COMPOUND_TENSE_KEYS),
    imperative: Array.isArray(raw.imperative) ? raw.imperative : ["", "", ""],
    extras: raw.extras || { related: [], syn: [], ant: [] }
  });
  if (!v.infinitive) return null;
  v.model_verb_ref = raw.model_verb_ref || "";
  v.answer_key = raw.answer_key && typeof raw.answer_key === "object" ? raw.answer_key : {};
  v.key_confidence = typeof raw.key_confidence === "number" ? raw.key_confidence : null;
  v.key_needs_review = !!raw.key_needs_review;
  v.source_tag = raw.source_tag || "user";
  v.locked = !!raw.locked;
  v.created_at = raw.created_at || new Date().toISOString();
  v.updated_at = raw.updated_at || new Date().toISOString();
  v.finalized_at = raw.finalized_at || null;
  return withVerbIdentity(v, "custom");
}

function hydrateCustomData() {
  CUSTOM_DATA = (APP_STATE.custom_verbs || []).map(hydrateCustomVerb).filter(Boolean);
  APP_STATE.custom_verbs = CUSTOM_DATA.map(stripCustomForState);
}

function persistCustomData() {
  APP_STATE.custom_verbs = CUSTOM_DATA.map(stripCustomForState);
  scheduleSave();
}

hydrateCustomData();
autoBackfillMissingCustomPatternNotes();
autoGenerateMissingCustomAnswerKeys();

function getAllVerbs() {
  return [...CORE_DATA, ...CUSTOM_DATA];
}

function findVerbByKey(key) {
  if (!key) return null;
  if (CORE_BY_KEY.has(key)) return CORE_BY_KEY.get(key);
  return CUSTOM_DATA.find(v => v._key === key) || null;
}

function findVerbByInfinitive(inf) {
  const needle = normalize(cleanText(inf));
  if (!needle) return null;
  return getAllVerbs().find(v => normalize(v.infinitive) === needle) || null;
}

function nextCustomNumericId() {
  const customIds = CUSTOM_DATA.map(v => Number(v.id)).filter(Number.isFinite);
  const maxCustom = customIds.length ? Math.max(...customIds) : 1000;
  return Math.max(1000, maxCustom) + 1;
}

function createCustomVerbRecord(infinitive, sourceTag) {
  const now = new Date().toISOString();
  return {
    id: nextCustomNumericId(),
    infinitive: cleanText(infinitive),
    meaning_en: "",
    gerund: "",
    past_participle: "",
    pattern_notes: [],
    simple: createBlankTenseSet(SIMPLE_TENSE_KEYS),
    compound: createBlankTenseSet(COMPOUND_TENSE_KEYS),
    imperative: ["", "", ""],
    extras: { related: [], syn: [], ant: [] },
    model_verb_ref: "",
    answer_key: {},
    key_confidence: null,
    key_needs_review: false,
    source_tag: sourceTag || "user",
    locked: false,
    created_at: now,
    updated_at: now,
    finalized_at: null
  };
}

function getPatternNotesForDisplay(verb) {
  const ownNotes = (verb?.pattern_notes || []).map(cleanText).filter(Boolean);
  if (ownNotes.length) return ownNotes;
  if (verb?._source === "custom" && verb.model_verb_ref) {
    const model = findVerbByKey(verb.model_verb_ref);
    const modelNotes = (model?.pattern_notes || []).map(cleanText).filter(Boolean);
    if (modelNotes.length) return modelNotes;
  }
  return [];
}

function autoBackfillMissingCustomPatternNotes() {
  let updatedCount = 0;
  CUSTOM_DATA.forEach(verb => {
    if (!verb || verb._source !== "custom" || verb.locked) return;
    const ownNotes = (verb.pattern_notes || []).map(cleanText).filter(Boolean);
    if (ownNotes.length) return;
    if (!verb.model_verb_ref) return;
    const model = findVerbByKey(verb.model_verb_ref);
    const modelNotes = (model?.pattern_notes || []).map(cleanText).filter(Boolean);
    if (!modelNotes.length) return;
    verb.pattern_notes = deepClone(modelNotes);
    verb.updated_at = new Date().toISOString();
    updatedCount += 1;
  });
  if (updatedCount) {
    persistCustomData();
    scheduleSave();
    console.info(`Backfilled pattern notes for ${updatedCount} custom verbs.`);
  }
}

function getDisplayVerbNumber(verb) {
  return String(Number(verb.id) || 0).padStart(4, "0");
}

function buildCanonicalCellMap(verb) {
  const out = {};
  out[gerundCellKey()] = cleanText(verb.gerund || "");
  out[participleCellKey()] = cleanText(verb.past_participle || "");
  getOrderedTenseKeys(verb.simple).forEach(k => {
    const num = extractTenseNumber(k);
    const t = verb.simple[k] || { singular: [], plural: [] };
    [0, 1, 2].forEach(i => {
      out[tenseCellKey(num, "sg", i)] = t.singular?.[i] || "";
      out[tenseCellKey(num, "pl", i)] = t.plural?.[i] || "";
    });
  });
  getOrderedTenseKeys(verb.compound).forEach(k => {
    const num = extractTenseNumber(k);
    const t = verb.compound[k] || { singular: [], plural: [] };
    [0, 1, 2].forEach(i => {
      out[tenseCellKey(num, "sg", i)] = t.singular?.[i] || "";
      out[tenseCellKey(num, "pl", i)] = t.plural?.[i] || "";
    });
  });
  const imp = verb.imperativeParsed || parseImperativeLines(verb.imperative || []);
  out[imperativeCellKey("yo")] = "--";
  out[imperativeCellKey("tu")] = imp.tu || "";
  out[imperativeCellKey("usted")] = imp.usted || "";
  out[imperativeCellKey("nosotros")] = imp.nosotros || "";
  out[imperativeCellKey("vosotros")] = imp.vosotros || "";
  out[imperativeCellKey("ustedes")] = imp.ustedes || "";
  return out;
}

function getExpectedMap(verb) {
  if (!verb) return null;
  if (verb._source === "core") return buildCanonicalCellMap(verb);
  if (verb.answer_key && Object.keys(verb.answer_key).length) return verb.answer_key;
  return null;
}

function getVerbCellOrder(verb) {
  const keys = [];
  keys.push(gerundCellKey());
  keys.push(participleCellKey());
  getOrderedTenseKeys(verb.simple).forEach(k => {
    const num = extractTenseNumber(k);
    [0, 1, 2].forEach(i => {
      keys.push(tenseCellKey(num, "sg", i));
      keys.push(tenseCellKey(num, "pl", i));
    });
  });
  getOrderedTenseKeys(verb.compound).forEach(k => {
    const num = extractTenseNumber(k);
    [0, 1, 2].forEach(i => {
      keys.push(tenseCellKey(num, "sg", i));
      keys.push(tenseCellKey(num, "pl", i));
    });
  });
  keys.push(imperativeCellKey("yo"));
  keys.push(imperativeCellKey("tu"));
  keys.push(imperativeCellKey("usted"));
  keys.push(imperativeCellKey("nosotros"));
  keys.push(imperativeCellKey("vosotros"));
  keys.push(imperativeCellKey("ustedes"));
  return keys;
}

function getVerbNavigationCellOrder(verb) {
  const keys = [];
  keys.push(gerundCellKey());
  keys.push(participleCellKey());
  const pushTenseInNaturalReadingOrder = (tenseNum) => {
    // yo, tu, el, nosotros, vosotros, ellos
    [0, 1, 2].forEach(i => keys.push(tenseCellKey(tenseNum, "sg", i)));
    [0, 1, 2].forEach(i => keys.push(tenseCellKey(tenseNum, "pl", i)));
  };

  getOrderedTenseKeys(verb.simple).forEach(k => {
    pushTenseInNaturalReadingOrder(extractTenseNumber(k));
  });
  getOrderedTenseKeys(verb.compound).forEach(k => {
    pushTenseInNaturalReadingOrder(extractTenseNumber(k));
  });

  keys.push(imperativeCellKey("yo"));
  keys.push(imperativeCellKey("tu"));
  keys.push(imperativeCellKey("usted"));
  keys.push(imperativeCellKey("nosotros"));
  keys.push(imperativeCellKey("vosotros"));
  keys.push(imperativeCellKey("ustedes"));
  return keys;
}

function ensureDraft(verbKey) {
  if (!APP_STATE.drafts[verbKey] || typeof APP_STATE.drafts[verbKey] !== "object") {
    APP_STATE.drafts[verbKey] = { inputs: {}, updated_at: new Date().toISOString() };
  }
  if (!APP_STATE.drafts[verbKey].inputs || typeof APP_STATE.drafts[verbKey].inputs !== "object") {
    APP_STATE.drafts[verbKey].inputs = {};
  }
  return APP_STATE.drafts[verbKey];
}

function getDisplayCellValue(verb, cellKey, canonicalValue) {
  const inputs = APP_STATE.drafts?.[verb._key]?.inputs;
  if (inputs && Object.prototype.hasOwnProperty.call(inputs, cellKey)) {
    return inputs[cellKey];
  }
  return canonicalValue ?? "";
}

function setDraftCellValue(verbKey, cellKey, value) {
  const draft = ensureDraft(verbKey);
  draft.inputs[cellKey] = value;
  draft.updated_at = new Date().toISOString();
  delete APP_STATE.check_results[verbKey];
  scheduleSave();
}

function setDraftValues(verbKey, valuesObj) {
  const draft = ensureDraft(verbKey);
  Object.entries(valuesObj || {}).forEach(([k, v]) => {
    draft.inputs[k] = v;
  });
  draft.updated_at = new Date().toISOString();
  delete APP_STATE.check_results[verbKey];
  scheduleSave();
}

function getCellStatusClass(verbKey, cellKey) {
  const status = APP_STATE.check_results?.[verbKey]?.status_by_cell?.[cellKey];
  if (status === "correct") return "checkCorrect";
  if (status === "accent_warning") return "checkWarn";
  if (status === "incorrect") return "checkBad";
  return "";
}

function getDraftEditClass(verb, cellKey, displayValue, canonicalValue) {
  const inputs = APP_STATE.drafts?.[verb._key]?.inputs;
  if (!inputs || !Object.prototype.hasOwnProperty.call(inputs, cellKey)) return "";
  const expected = getExpectedMap(verb);
  if (!expected || !Object.keys(expected).length) return "draftEdited";
  const exp = expected[cellKey] ?? canonicalValue ?? "";
  const status = compareUserToExpected(displayValue, exp);
  if (status === "correct") return "";
  if (status === "accent_warning") return "checkWarn";
  return "draftEdited";
}

function compareUserToExpected(userValue, expectedValue) {
  const u = normalizeForMatch(userValue);
  const e = normalizeForMatch(expectedValue);
  if (!u) return "empty";
  if (!e) return "incorrect";
  if (normalize(u) === normalize(e)) return u === e ? "correct" : "accent_warning";
  return "incorrect";
}

function escapeHtml(str) {
  return (str || "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

function renderCellText(value) {
  const v = value || "";
  return v ? escapeHtml(v) : "&nbsp;";
}

function splitMeaningAndCaution(rawMeaning) {
  const text = cleanText(rawMeaning || "");
  if (!text) return { meaning: "", caution: "" };
  const match = text.match(/^(.*?)(?:\s+|^)Caution:\s*(.+)$/i);
  if (!match) return { meaning: text, caution: "" };
  return {
    meaning: cleanText(match[1] || ""),
    caution: cleanText(match[2] || "")
  };
}

function formatPatternLabel(noteText) {
  const note = cleanText(noteText || "");
  if (!note) return "";
  const endingMatch = note.match(/-(ar|er|ir)/i);
  const ending = endingMatch ? `-${endingMatch[1].toLowerCase()}` : "";
  const hasRegular = /\bregular\b/i.test(note);
  const hasIrregular = /\birregular\b/i.test(note);
  const hasSpelling = /spelling change/i.test(note);

  if (hasRegular && ending && !hasSpelling && !hasIrregular) return ending;
  if (hasRegular && ending && hasSpelling) {
    const tail = cleanText((note.split(":").slice(1).join(":") || "").trim());
    if (!tail) return `${ending} (spelling change)`;
    const conciseTail = tail
      .replace(/\bbecomes\b/gi, "→")
      .replace(/\s+/g, " ")
      .trim();
    return `${ending} (${conciseTail})`;
  }
  if (hasIrregular && ending) return `${ending} irregular`;
  if (hasIrregular) return "irregular";
  if (hasRegular && ending) return ending;
  return note;
}

function inferPatternCategory(verb) {
  const notes = getPatternNotesForDisplay(verb);
  const primary = normalize(notes[0] || "");
  if (primary.includes("irregular")) return "irregular";
  if (primary.includes("regular") && primary.includes("-ar")) return "regular-ar";
  if (primary.includes("regular") && primary.includes("-er")) return "regular-er";
  if (primary.includes("regular") && primary.includes("-ir")) return "regular-ir";
  return "other";
}

function isExplicitVerb(verb) {
  const text = normalize(`${verb.infinitive || ""} ${verb.meaning_en || ""}`);
  const markers = [
    "follar", "joder", "cagarla", "fuck", "sex", "explicit", "rude"
  ];
  return markers.some(m => text.includes(m));
}

function getVerbTags(verb) {
  const tags = [];
  if (verb._source === "core") tags.push("core501");
  if (verb._source === "custom") tags.push("custom");
  if (verb.source_tag === "slang_seed") tags.push("slang");
  if (isExplicitVerb(verb)) tags.push("explicit");
  return tags;
}

function renderTagPills(tags) {
  const seen = new Set();
  const ordered = (tags || []).filter(t => {
    if (!t || seen.has(t)) return false;
    seen.add(t);
    return true;
  });
  return ordered.map(tag => {
    const labelMap = {
      core501: "501",
      custom: "Custom",
      slang: "Slang",
      explicit: "Explicit"
    };
    const clsMap = {
      core501: "tagCore",
      custom: "tagCustom",
      slang: "tagSlang",
      explicit: "tagExplicit"
    };
    return `<div class="pill tagPill ${clsMap[tag] || ""}">${labelMap[tag] || escapeHtml(tag)}</div>`;
  }).join("");
}

function renderList(filterText) {
  const list = document.getElementById("list");
  list.innerHTML = "";
  APP_STATE.ui.search_text = filterText || "";
  const patternFilter = document.getElementById("filterPattern")?.value || "all";
  const tagFilter = document.getElementById("filterTag")?.value || "all";
  APP_STATE.ui.pattern_filter = patternFilter;
  APP_STATE.ui.tag_filter = tagFilter;
  scheduleSave();

  const q = normalize(filterText || "");
  const verbs = getAllVerbs();
  const items = verbs.filter(v => {
    if (!normalize(`${v.infinitive} ${v.meaning_en}`).includes(q)) return false;
    const patternCat = inferPatternCategory(v);
    if (patternFilter !== "all" && patternCat !== patternFilter) return false;
    const tags = getVerbTags(v);
    if (tagFilter !== "all" && !tags.includes(tagFilter)) return false;
    return true;
  });
  let selectedVisible = false;

  items.forEach(v => {
    const btn = document.createElement("button");
    btn.className = "verbBtn";
    btn.type = "button";
    btn.dataset.key = v._key;
    btn.setAttribute("aria-selected", v._key === CURRENT_VERB_KEY ? "true" : "false");
    if (v._key === CURRENT_VERB_KEY) selectedVisible = true;
    const meaningInfo = splitMeaningAndCaution(v.meaning_en || "");
    const tags = getVerbTags(v);
    const patternLabel = formatPatternLabel((getPatternNotesForDisplay(v)[0]) || "");
    const patternPill = patternLabel ? `<div class="pill typePill">${escapeHtml(patternLabel)}</div>` : "";
    btn.innerHTML = `
      <div class="verbTop">
        <div class="verbTitle"><span class="pill">#${getDisplayVerbNumber(v)}</span> ${escapeHtml(v.infinitive)}</div>
      </div>
      <div class="verbMeta">${escapeHtml(meaningInfo.meaning || "")}</div>
      <div class="tagRow">
        ${patternPill}
        ${renderTagPills(tags)}
      </div>
    `;
    btn.addEventListener("click", () => {
      document.querySelectorAll(".verbBtn").forEach(b => b.setAttribute("aria-selected", "false"));
      btn.setAttribute("aria-selected", "true");
      CURRENT_VERB_KEY = v._key;
      APP_STATE.ui.selected_verb_key = CURRENT_VERB_KEY;
      scheduleSave();
      renderDetail(v._key);
      hidePopover();
    });
    list.appendChild(btn);
  });

  if (q && (q.includes("slang") || q.includes("starter") || q.includes("import"))) {
    const importBtn = document.createElement("button");
    importBtn.className = "verbBtn";
    importBtn.type = "button";
    importBtn.innerHTML = `
      <div class="verbTop"><div class="verbTitle"><span class="pill">#----</span> Import 12 slang starters</div></div>
      <div class="verbMeta">Adds editable custom templates linked to model verbs.</div>
      <div class="tagRow"><div class="pill typePill">Action</div></div>
    `;
    importBtn.addEventListener("click", () => {
      importSlangStarterSet();
      renderList(filterText || "");
    });
    list.appendChild(importBtn);
  }

  const hasExact = !!findVerbByInfinitive(filterText || "");
  if (q && !hasExact) {
    const addBtn = document.createElement("button");
    addBtn.className = "verbBtn";
    addBtn.type = "button";
    addBtn.innerHTML = `
      <div class="verbTop"><div class="verbTitle"><span class="pill">#----</span> Add custom verb: ${escapeHtml(cleanText(filterText || ""))}</div></div>
      <div class="verbMeta">Creates a blank in-place editable template.</div>
      <div class="tagRow"><div class="pill typePill">Custom template</div></div>
    `;
    addBtn.addEventListener("click", () => createCustomVerbFromSearch(filterText || ""));
    list.appendChild(addBtn);
  }

  const firstVisibleVerbBtn = list.querySelector(".verbBtn[data-key]");
  if (firstVisibleVerbBtn && !selectedVisible) {
    firstVisibleVerbBtn.click();
  } else if (selectedVisible && CURRENT_VERB_KEY) {
    renderDetail(CURRENT_VERB_KEY);
  }
}

function createCustomVerbFromSearch(rawInput) {
  const infinitive = cleanText(rawInput);
  if (!infinitive) return;
  const existing = findVerbByInfinitive(infinitive);
  if (existing) {
    CURRENT_VERB_KEY = existing._key;
    APP_STATE.ui.selected_verb_key = CURRENT_VERB_KEY;
    scheduleSave();
    renderList(document.getElementById("q").value || "");
    return;
  }
  const hydrated = hydrateCustomVerb(createCustomVerbRecord(infinitive, "user"));
  if (!hydrated) return;
  CUSTOM_DATA.push(hydrated);
  persistCustomData();
  CURRENT_VERB_KEY = hydrated._key;
  APP_STATE.ui.selected_verb_key = CURRENT_VERB_KEY;
  scheduleSave();
  renderList(document.getElementById("q").value || "");
  renderDetail(CURRENT_VERB_KEY);
}

function renderTenseBlocks(obj, verb) {
  const keys = getOrderedTenseKeys(obj || {});
  const canonicalMap = buildCanonicalCellMap(verb);
  return keys.map((k, idx) => {
    const table = obj[k];
    const num = extractTenseNumber(k);
    const label = k.replace(/^\d+\s*/, "");
    const persons = ["1", "2", "3"];
    const rowHtml = persons.map((p, i) => {
      const sgCellKey = tenseCellKey(num, "sg", i);
      const plCellKey = tenseCellKey(num, "pl", i);
      const sgDisplay = getDisplayCellValue(verb, sgCellKey, canonicalMap[sgCellKey] || "");
      const plDisplay = getDisplayCellValue(verb, plCellKey, canonicalMap[plCellKey] || "");
      const sgClass = getCellStatusClass(verb._key, sgCellKey);
      const plClass = getCellStatusClass(verb._key, plCellKey);
      const sgDraftClass = getDraftEditClass(verb, sgCellKey, sgDisplay, canonicalMap[sgCellKey] || "");
      const plDraftClass = getDraftEditClass(verb, plCellKey, plDisplay, canonicalMap[plCellKey] || "");
      return `
        <tr>
          <td><span class="k">${PRONOUNS[`${p}-sg`]}</span></td>
          <td><button class="formBtn ${sgClass} ${sgDraftClass}" data-verb="${escapeHtml(verb.infinitive)}" data-verb-key="${verb._key}" data-tense="${escapeHtml(k)}" data-person="${p}" data-number="sg" data-cell-key="${sgCellKey}">${renderCellText(sgDisplay)}</button></td>
          <td><span class="k">${PRONOUNS[`${p}-pl`]}</span></td>
          <td><button class="formBtn ${plClass} ${plDraftClass}" data-verb="${escapeHtml(verb.infinitive)}" data-verb-key="${verb._key}" data-tense="${escapeHtml(k)}" data-person="${p}" data-number="pl" data-cell-key="${plCellKey}">${renderCellText(plDisplay)}</button></td>
        </tr>
      `;
    }).join("");
    return `
      <details class="tense tnum-${num}" data-tnum="${num}" open>
        <summary><div><div class="tenseTitle">${num} · ${escapeHtml(label)}</div></div></summary>
        <table>
          <colgroup><col class="p1"><col class="f1"><col class="p2"><col class="f2"></colgroup>
          ${idx === 0 ? `<thead><tr><th class="thgroup" colspan="2">SINGULAR</th><th class="thgroup" colspan="2">PLURAL</th></tr></thead>` : ``}
          <tbody>${rowHtml}</tbody>
        </table>
      </details>
    `;
  }).join("");
}

function renderImperative(verb) {
  const imp = verb.imperativeParsed || {};
  const canonical = {
    yo: "--",
    tu: imp.tu || "",
    usted: imp.usted || "",
    nosotros: imp.nosotros || "",
    vosotros: imp.vosotros || "",
    ustedes: imp.ustedes || ""
  };

  function renderEditable(slot) {
    const meta = IMPERATIVE_META[slot];
    const cellKey = imperativeCellKey(slot);
    const display = getDisplayCellValue(verb, cellKey, canonical[slot] || "");
    const cls = getCellStatusClass(verb._key, cellKey);
    const draftCls = getDraftEditClass(verb, cellKey, display, canonical[slot] || "");
    return `<button class="formBtn imperativeForm imperativeFormBtn ${cls} ${draftCls}" data-verb="${escapeHtml(verb.infinitive)}" data-verb-key="${verb._key}" data-tense="Imperative" data-person="${meta.person}" data-number="${meta.number}" data-cell-key="${cellKey}">${renderCellText(display)}</button>`;
  }

  return `
    <div class="imperativeBoard">
      <div class="imperativeHalf imperativeHalf--left">
        <div class="imperativeLabel">yo</div>
        <div class="imperativeForm">--</div>
        <div class="imperativeLabel">tú</div>
        <div class="imperativeForm">${renderEditable("tu")}</div>
        <div class="imperativeLabel">usted</div>
        <div class="imperativeForm">${renderEditable("usted")}</div>
      </div>
      <div class="imperativeHalf imperativeHalf--right">
        <div class="imperativeLabel">nosotros</div>
        <div class="imperativeForm">${renderEditable("nosotros")}</div>
        <div class="imperativeLabel">vosotros</div>
        <div class="imperativeForm">${renderEditable("vosotros")}</div>
        <div class="imperativeLabel">ustedes</div>
        <div class="imperativeForm">${renderEditable("ustedes")}</div>
      </div>
    </div>
  `;
}

function renderRelatedLines(lines) {
  const items = (lines || []).filter(Boolean);
  if (!items.length) return `<div class="mutedBlock">—</div>`;

  const parseSimpleEsEn = (text) => {
    const cleaned = cleanText(text);
    if (!cleaned) return null;
    const toMatch = cleaned.match(/^(.*?)\s+\bto\b\s+(.+)$/i);
    if (toMatch) return { es: cleanText(toMatch[1]), en: `to ${cleanText(toMatch[2])}` };
    const articleMatch = cleaned.match(/^((?:el|la|los|las|un|una|unos|unas)\s+\S+)\s+(.+)$/i);
    if (articleMatch) return { es: cleanText(articleMatch[1]), en: cleanText(articleMatch[2]) };
    const commaEsMatch = cleaned.match(/^([A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:,\s*[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)+)\s+(.+)$/);
    if (commaEsMatch) return { es: cleanText(commaEsMatch[1]), en: cleanText(commaEsMatch[2]) };
    const twoTokenAdverbMatch = cleaned.match(/^(\S+)\s+([A-Za-z-]+ly)$/i);
    if (twoTokenAdverbMatch) return { es: cleanText(twoTokenAdverbMatch[1]), en: cleanText(twoTokenAdverbMatch[2]) };
    const fallback = cleaned.match(/^(\S+)\s+(.+)$/);
    if (fallback) return { es: cleanText(fallback[1]), en: cleanText(fallback[2]) };
    return null;
  };

  const parseRelatedLine = (line) => {
    const segments = [];
    const chunked = cleanText(line).split(/\s*;\s*/).map(cleanText).filter(Boolean);
    chunked.forEach(chunk => {
      const explicitPair = chunk.match(/^(.+?)\s+-\s+(.+)$/);
      if (explicitPair) {
        segments.push({ es: cleanText(explicitPair[1]), en: cleanText(explicitPair[2]) });
        return;
      }
      const withTo = chunk.match(/^(.*?)([A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:\s+[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+){0,3})\s+\bto\b\s+(.+)$/i);
      if (withTo) {
        const prefix = cleanText(withTo[1]);
        if (prefix) {
          const prefixPair = parseSimpleEsEn(prefix);
          if (prefixPair) segments.push(prefixPair);
          else segments.push({ raw: prefix });
        }
        const mainEn = cleanText(withTo[3]);
        const tailPair = mainEn.match(/^(.*)\s+([A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:,\s*[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)+)\s+([A-Za-z][A-Za-z'-]+)$/);
        if (tailPair) {
          segments.push({ es: cleanText(withTo[2]), en: cleanText(tailPair[1]).startsWith("to ") ? cleanText(tailPair[1]) : `to ${cleanText(tailPair[1])}` });
          segments.push({ es: cleanText(tailPair[2]), en: cleanText(tailPair[3]) });
        } else {
          segments.push({ es: cleanText(withTo[2]), en: mainEn.startsWith("to ") ? mainEn : `to ${mainEn}` });
        }
        return;
      }
      const basicPair = parseSimpleEsEn(chunk);
      if (basicPair) segments.push(basicPair);
      else segments.push({ raw: chunk });
    });
    return segments;
  };

  return `
    <div class="notesList">
      ${items.map(line => {
        const parsed = parseRelatedLine(line);
        const rendered = parsed.map(part => part.raw
          ? escapeHtml(part.raw)
          : `<span class="notesEsRelated">${escapeHtml(part.es)}</span> - ${escapeHtml(part.en)}`
        ).join("; ");
        return `<div class="notesRow">${rendered}</div>`;
      }).join("")}
    </div>
  `;
}

function renderSynAntLines(syn, ant) {
  const parseSynAntItem = (item) => {
    const cleaned = cleanText(item);
    const explicitPair = cleaned.match(/^(.+?)\s+-\s+(.+)$/);
    if (explicitPair) return { es: cleanText(explicitPair[1]), en: cleanText(explicitPair[2]) };
    const toMatch = cleaned.match(/^(.*?)\s+\bto\b\s+(.+)$/i);
    if (toMatch) return { es: cleanText(toMatch[1]), en: `to ${cleanText(toMatch[2])}` };
    const fallback = cleaned.match(/^(\S+)\s+(.+)$/);
    if (fallback) return { es: cleanText(fallback[1]), en: cleanText(fallback[2]) };
    return { es: cleaned, en: "" };
  };

  const synItems = (syn || []).filter(Boolean).map(parseSynAntItem);
  const antItems = (ant || []).filter(Boolean).map(parseSynAntItem);
  if (!synItems.length && !antItems.length) return `<div class="mutedBlock">—</div>`;

  const renderItem = (item) => !item.en
    ? `<span class="notesEsSyn">${escapeHtml(item.es)}</span>`
    : `<span class="notesEsSyn">${escapeHtml(item.es)}</span> - ${escapeHtml(item.en)}`;

  return `
    <div class="notesList">
      ${synItems.length ? `<div class="notesRow"><span class="notesTagSyn">Synonyms:</span> ${synItems.map(renderItem).join("; ")}.</div>` : ""}
      ${antItems.length ? `<div class="notesRow"><span class="notesTagAnt">Antonyms:</span> ${antItems.map(renderItem).join("; ")}.</div>` : ""}
    </div>
  `;
}

function renderDetail(verbKey) {
  const verb = findVerbByKey(verbKey);
  if (!verb) return;
  const patternNotesForDisplay = getPatternNotesForDisplay(verb);
  const meaningInfo = splitMeaningAndCaution(verb.meaning_en || "");
  const canonical = buildCanonicalCellMap(verb);
  const gerundKey = gerundCellKey();
  const participleKey = participleCellKey();
  const gerundDisplay = getDisplayCellValue(verb, gerundKey, canonical[gerundKey] || "");
  const participleDisplay = getDisplayCellValue(verb, participleKey, canonical[participleKey] || "");
  const gerundStatusClass = getCellStatusClass(verb._key, gerundKey);
  const participleStatusClass = getCellStatusClass(verb._key, participleKey);
  const gerundDraftClass = getDraftEditClass(verb, gerundKey, gerundDisplay, canonical[gerundKey] || "");
  const participleDraftClass = getDraftEditClass(verb, participleKey, participleDisplay, canonical[participleKey] || "");

  CURRENT_VERB_KEY = verb._key;
  APP_STATE.ui.selected_verb_key = CURRENT_VERB_KEY;
  scheduleSave();

  const detail = document.getElementById("detail");
  detail.innerHTML = `
    <div class="detailHead">
      <div class="left">
        <div class="big">${escapeHtml(verb.infinitive)} <span class="pill">#${getDisplayVerbNumber(verb)}</span></div>
        <div class="meaning">${escapeHtml(meaningInfo.meaning || "")}</div>
      </div>
      <div class="chips">
        <div class="chip"><strong>Gerund</strong> <button class="formBtn chipFormBtn chipGerundBtn ${gerundStatusClass} ${gerundDraftClass}" data-verb="${escapeHtml(verb.infinitive)}" data-verb-key="${verb._key}" data-tense="Gerund" data-person="" data-number="" data-cell-key="${gerundKey}">${renderCellText(gerundDisplay)}</button></div>
        <div class="chip"><strong>Part.</strong> <button class="formBtn chipFormBtn chipPartBtn ${participleStatusClass} ${participleDraftClass}" data-verb="${escapeHtml(verb.infinitive)}" data-verb-key="${verb._key}" data-tense="Participle" data-person="" data-number="" data-cell-key="${participleKey}">${renderCellText(participleDisplay)}</button></div>
      </div>
    </div>
    <div class="panel">
      <div class="twoCol">
        <section class="side" data-side="simple">
          <div class="colHeader"><div class="h">Simple tenses (1–7)</div></div>
          ${renderTenseBlocks(verb.simple, verb)}
        </section>
        <section class="side" data-side="compound">
          <div class="colHeader"><div class="h">Compound tenses (8–14)</div></div>
          ${renderTenseBlocks(verb.compound, verb)}
        </section>
      </div>
      <details class="tense tense--spaced imperativePanel tense--centerHead" open>
        <summary><div class="summarySeam"><div class="summarySeamInner"><div class="tenseTitle">Imperative</div></div></div></summary>
        <div class="pad"><div class="seamAnchor">${renderImperative(verb)}</div></div>
      </details>
      <details class="tense notesPanel tense--centerHead" open>
        <summary><div class="summarySeam"><div class="summarySeamInner"><div class="tenseTitle">Notes</div></div></div></summary>
        <div class="pad">
          <div class="seamAnchor">
            <div class="seamCenter">
              <div class="sectionLabel">Pattern notes</div>
              <div class="mutedBlock">${escapeHtml(patternNotesForDisplay.join("\n") || "—")}</div>
              ${meaningInfo.caution ? `<div class="stackGapMd"></div><div class="sectionLabel">Usage caution</div><div class="mutedBlock">${escapeHtml(`Caution: ${meaningInfo.caution}`)}</div>` : ""}
              <div class="stackGapMd"></div>
              <div class="sectionLabel">Related words / expressions / examples</div>
              ${renderRelatedLines((verb.extras?.related || []).slice(0, 24))}
              <div class="stackGapMd"></div>
              ${renderSynAntLines(verb.extras?.syn || [], verb.extras?.ant || [])}
            </div>
          </div>
        </div>
      </details>
    </div>
  `;

  bindCellInteractions(detail, verb);
  setTimeout(() => runAutoWidths(detail), 0);
  setTimeout(() => runAutoWidths(detail), 120);
  setTimeout(syncSidebarHeight, 0);
  setTimeout(syncSidebarHeight, 120);
}

function bindCellInteractions(detailRoot, verb) {
  detailRoot.querySelectorAll(".formBtn[data-cell-key]").forEach(btn => {
    btn.addEventListener("click", () => {
      if (ACTIVE_EDITOR) return;
      clearTimeout(CLICK_TIMER);
      CLICK_TIMER = setTimeout(() => {
        hidePopover();
        startInlineEdit(btn, verb);
      }, 220);
    });
    btn.addEventListener("dblclick", (e) => {
      e.preventDefault();
      e.stopPropagation();
      clearTimeout(CLICK_TIMER);
      if (ACTIVE_EDITOR) commitInlineEdit(0);
      showPopover(btn, {
        verb: btn.dataset.verb,
        tense: btn.dataset.tense,
        person: btn.dataset.person,
        number: btn.dataset.number,
        form: btn.textContent.trim()
      });
    });
  });
}

function getEditableCells() {
  return Array.from(document.querySelectorAll("#detail .formBtn[data-cell-key]"));
}

function getEditableCellsForNavigation(verbKey) {
  const verb = findVerbByKey(verbKey);
  const cells = getEditableCells();
  if (!verb || !cells.length) return cells;
  const byKey = new Map(cells.map(el => [el.dataset.cellKey, el]));
  return getVerbNavigationCellOrder(verb).map(cellKey => byKey.get(cellKey)).filter(Boolean);
}

function startInlineEdit(btn, verb) {
  if (!btn || !verb) return;
  if (ACTIVE_EDITOR) commitInlineEdit(0);
  if (verb._source === "custom" && verb.locked) {
    alert("This custom verb is finalized (pending review) and locked for editing.");
    return;
  }

  const rect = btn.getBoundingClientRect();
  const cs = window.getComputedStyle(btn);
  const input = document.createElement("input");
  input.type = "text";
  input.className = "inlineCellEditor";
  input.value = (btn.textContent || "").trim();
  input.style.width = `${Math.max(56, Math.ceil(rect.width) + 16)}px`;
  input.style.fontFamily = cs.fontFamily;
  input.style.fontSize = cs.fontSize;
  input.style.fontWeight = cs.fontWeight;
  input.style.fontStyle = cs.fontStyle;
  input.style.letterSpacing = cs.letterSpacing;
  input.style.lineHeight = cs.lineHeight;
  input.style.color = "#ff4500";
  input.style.textAlign = "left";

  const parent = btn.parentElement;
  if (!parent) return;
  btn.style.display = "none";
  parent.appendChild(input);
  input.focus();
  input.select();

  ACTIVE_EDITOR = { input, btn, verbKey: verb._key, cellKey: btn.dataset.cellKey };
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commitInlineEdit(0);
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      cancelInlineEdit();
      return;
    }
    if (e.key === "Tab" || e.code === "Tab" || e.keyCode === 9) {
      e.preventDefault();
      e.stopPropagation();
      commitInlineEdit(e.shiftKey ? -1 : 1);
    }
  });
  input.addEventListener("blur", () => {
    // Defer blur-commit one tick so Tab key navigation can run first.
    setTimeout(() => {
      if (ACTIVE_EDITOR && ACTIVE_EDITOR.input === input) commitInlineEdit(0);
    }, 0);
  });
}

function commitInlineEdit(moveDelta) {
  if (!ACTIVE_EDITOR) return;
  const { input, btn, verbKey, cellKey } = ACTIVE_EDITOR;
  const newValue = normalizeUserCellInput(input.value);
  input.remove();
  btn.style.display = "";
  btn.innerHTML = renderCellText(newValue);
  ACTIVE_EDITOR = null;

  setDraftCellValue(verbKey, cellKey, newValue);
  const verb = findVerbByKey(verbKey);
  if (verb) {
    const canonical = buildCanonicalCellMap(verb);
    const draftCls = getDraftEditClass(verb, cellKey, newValue, canonical[cellKey] || "");
    btn.classList.remove("checkCorrect", "checkWarn", "checkBad", "draftEdited");
    if (draftCls) btn.classList.add(draftCls);
  }
  const detail = document.getElementById("detail");
  if (detail) runAutoWidths(detail);

  if (!moveDelta) return;
  const cells = getEditableCellsForNavigation(verbKey);
  const idx = cells.findIndex(el => el.dataset.cellKey === cellKey);
  if (idx < 0) return;
  let nextIdx = idx;
  while (true) {
    nextIdx += moveDelta;
    if (nextIdx < 0 || nextIdx >= cells.length) return;
    const next = cells[nextIdx];
    if (!next) return;
    const nextKey = next.dataset.cellKey;
    // In normal progression, imperative "yo" is intentionally skipped.
    if (nextKey === imperativeCellKey("yo") && cellKey !== imperativeCellKey("yo")) {
      continue;
    }
    const nextVerb = findVerbByKey(next.dataset.verbKey);
    if (nextVerb) {
      startInlineEdit(next, nextVerb);
      return;
    }
  }
}

function cancelInlineEdit() {
  if (!ACTIVE_EDITOR) return;
  ACTIVE_EDITOR.input.remove();
  ACTIVE_EDITOR.btn.style.display = "";
  ACTIVE_EDITOR = null;
}

function checkCurrentVerb() {
  const verb = findVerbByKey(CURRENT_VERB_KEY);
  if (!verb) return;
  const expected = getExpectedMap(verb);
  if (!expected || !Object.keys(expected).length) {
    alert("No answer key available for this verb yet. You can still practice in freeform mode.");
    return;
  }

  const canonical = buildCanonicalCellMap(verb);
  const statusByCell = {};
  const summary = { correct: 0, accent_warning: 0, incorrect: 0, empty: 0, total: 0 };
  getVerbCellOrder(verb).forEach(cellKey => {
    const exp = expected[cellKey] || "";
    const user = getDisplayCellValue(verb, cellKey, canonical[cellKey] || "");
    const status = compareUserToExpected(user, exp);
    statusByCell[cellKey] = status;
    summary[status] += 1;
    summary.total += 1;
  });

  APP_STATE.check_results[verb._key] = {
    checked_at: new Date().toISOString(),
    status_by_cell: statusByCell,
    summary
  };
  scheduleSave();
  renderDetail(verb._key);
  alert(`Check complete: ${summary.correct} correct, ${summary.accent_warning} accent warning, ${summary.incorrect} incorrect, ${summary.empty} empty.`);
}

function revealAnswersForCurrentVerb() {
  const verb = findVerbByKey(CURRENT_VERB_KEY);
  if (!verb) return;
  const expected = getExpectedMap(verb);
  if (!expected || !Object.keys(expected).length) {
    alert("No answer key available to reveal for this verb.");
    return;
  }
  setDraftValues(verb._key, expected);
  renderDetail(verb._key);
}

function clearCurrentVerbToBlanks() {
  const verb = findVerbByKey(CURRENT_VERB_KEY);
  if (!verb) return;
  const blankMap = {};
  getVerbCellOrder(verb).forEach(cellKey => {
    if (cellKey === imperativeCellKey("yo")) return;
    blankMap[cellKey] = "";
  });
  setDraftValues(verb._key, blankMap);
  renderDetail(verb._key);
}

function saveDraftSnapshot() {
  const snapshot = {
    id: `snap_${Date.now()}`,
    created_at: new Date().toISOString(),
    selected_verb_key: CURRENT_VERB_KEY,
    draft: CURRENT_VERB_KEY ? deepClone(APP_STATE.drafts[CURRENT_VERB_KEY] || { inputs: {} }) : { inputs: {} },
    check: CURRENT_VERB_KEY ? deepClone(APP_STATE.check_results[CURRENT_VERB_KEY] || null) : null
  };
  APP_STATE.snapshots.push(snapshot);
  if (APP_STATE.snapshots.length > 100) APP_STATE.snapshots.shift();
  scheduleSave();
  alert("Draft snapshot saved.");
}

function exportStateBackup() {
  const payload = {
    version: BACKUP_VERSION,
    exported_at: new Date().toISOString(),
    app_state: coerceState(APP_STATE)
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "ivc-practice-backup-v1.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function importStateBackup() {
  if (!IMPORT_INPUT) {
    IMPORT_INPUT = document.createElement("input");
    IMPORT_INPUT.type = "file";
    IMPORT_INPUT.accept = "application/json";
    IMPORT_INPUT.style.display = "none";
    document.body.appendChild(IMPORT_INPUT);
    IMPORT_INPUT.addEventListener("change", async () => {
      const file = IMPORT_INPUT.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        APP_STATE = coerceState(parsed.app_state || parsed);
        hydrateCustomData();
        CURRENT_VERB_KEY = APP_STATE.ui.selected_verb_key || null;
        saveStateNow();
        const q = document.getElementById("q");
        q.value = APP_STATE.ui.search_text || "";
        renderList(q.value || "");
        alert("Backup imported.");
      } catch {
        alert("Unable to import backup JSON.");
      } finally {
        IMPORT_INPUT.value = "";
      }
    });
  }
  IMPORT_INPUT.click();
}

function parseModelByUserInput(input) {
  const cleaned = cleanText(input);
  if (!cleaned) return null;
  const byIdMatch = cleaned.match(/^#?(\d{1,6})$/);
  if (byIdMatch) {
    const idNum = Number(byIdMatch[1]);
    return getAllVerbs().find(v => Number(v.id) === idNum) || null;
  }
  return findVerbByInfinitive(cleaned);
}

function setModelForCurrentCustomVerb() {
  const verb = findVerbByKey(CURRENT_VERB_KEY);
  if (!verb || verb._source !== "custom") {
    alert("Model assignment applies to custom verbs only.");
    return;
  }
  const currentModel = findVerbByKey(verb.model_verb_ref);
  const promptText = currentModel
    ? `Current model: ${currentModel.infinitive}. Enter model infinitive or #id (blank clears).`
    : "Enter model verb infinitive or #id (blank clears).";
  const answer = prompt(promptText, currentModel ? currentModel.infinitive : "");
  if (answer === null) return;
  const cleaned = cleanText(answer);
  if (!cleaned) {
    verb.model_verb_ref = "";
    verb.updated_at = new Date().toISOString();
    persistCustomData();
    alert("Model cleared.");
    return;
  }
  const model = parseModelByUserInput(cleaned);
  if (!model) {
    alert("Model verb not found.");
    return;
  }
  verb.model_verb_ref = model._key;
  verb.updated_at = new Date().toISOString();
  persistCustomData();
  alert(`Model set to ${model.infinitive}.`);
}

function splitInfinitive(infinitive) {
  const raw = cleanText(infinitive).toLowerCase();
  const reflexive = raw.endsWith("se");
  const base = reflexive ? raw.slice(0, -2) : raw;
  const ending = /(?:ar|er|ir)$/.test(base) ? base.slice(-2) : "";
  const stem = ending ? base.slice(0, -2) : base;
  return { raw, reflexive, base, ending, stem };
}

function replaceLastOccurrence(text, search, replacement) {
  const idx = text.lastIndexOf(search);
  if (idx < 0) return text;
  return text.slice(0, idx) + replacement + text.slice(idx + search.length);
}

function applyStemMutation(stem, type) {
  if (!stem) return stem;
  if (type === "base") return stem;
  if (type === "o_ue" && stem.includes("o")) return replaceLastOccurrence(stem, "o", "ue");
  if (type === "e_ie" && stem.includes("e")) return replaceLastOccurrence(stem, "e", "ie");
  if (type === "e_i" && stem.includes("e")) return replaceLastOccurrence(stem, "e", "i");
  if (type === "u_ue" && stem.includes("u")) return replaceLastOccurrence(stem, "u", "ue");
  if (type === "i_ie" && stem.includes("i")) return replaceLastOccurrence(stem, "i", "ie");
  return stem;
}

function guessRegularParticiple(infinitive) {
  const parts = splitInfinitive(infinitive);
  if (parts.ending === "ar") return `${parts.stem}ado`;
  if (parts.ending === "er" || parts.ending === "ir") return `${parts.stem}ido`;
  return parts.base;
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function transformModelFormToTarget(modelForm, modelVerb, targetVerb) {
  let out = modelForm || "";
  let changed = false;
  const modelParts = splitInfinitive(modelVerb.infinitive);
  const targetParts = splitInfinitive(targetVerb.infinitive);
  const modelPart = cleanText(modelVerb.past_participle || guessRegularParticiple(modelVerb.infinitive));
  const targetPart = cleanText(targetVerb.past_participle || guessRegularParticiple(targetVerb.infinitive));

  function replaceWord(from, to) {
    if (!from || from === to) return;
    const rx = new RegExp(`\\b${escapeRegExp(from)}\\b`, "gi");
    const next = out.replace(rx, to);
    if (next !== out) {
      out = next;
      changed = true;
    }
  }

  replaceWord(modelVerb.infinitive.toLowerCase(), targetVerb.infinitive.toLowerCase());
  replaceWord(modelPart.toLowerCase(), targetPart.toLowerCase());
  if (modelParts.stem && targetParts.stem && modelParts.stem !== targetParts.stem) {
    const stemRx = new RegExp(`\\b${escapeRegExp(modelParts.stem)}([a-záéíóúüñ]+)\\b`, "gi");
    const next = out.replace(stemRx, (_, suffix) => `${targetParts.stem}${suffix}`);
    if (next !== out) {
      out = next;
      changed = true;
    }
  }
  if (!changed && modelParts.stem && targetParts.stem) {
    const mutationTypes = ["o_ue", "e_ie", "e_i", "u_ue", "i_ie"];
    mutationTypes.forEach(type => {
      const modelStemVariant = applyStemMutation(modelParts.stem, type);
      const targetStemVariant = applyStemMutation(targetParts.stem, type);
      if (!modelStemVariant || !targetStemVariant || modelStemVariant === modelParts.stem) return;
      const rx = new RegExp(`\\b${escapeRegExp(modelStemVariant)}([\\p{L}]*)\\b`, "giu");
      const next = out.replace(rx, (_, suffix) => `${targetStemVariant}${suffix}`);
      if (next !== out) {
        out = next;
        changed = true;
      }
    });
  }
  return { value: cleanText(out), changed };
}

function generateAnswerKeyFromModel(targetVerb, modelVerb) {
  const modelExpected = getExpectedMap(modelVerb) || buildCanonicalCellMap(modelVerb);
  const output = {};
  let total = 0;
  let changed = 0;
  getVerbCellOrder(targetVerb).forEach(cellKey => {
    const src = modelExpected[cellKey] || "";
    if (cellKey === imperativeCellKey("yo")) {
      output[cellKey] = "--";
      total += 1;
      changed += 1;
      return;
    }
    const transformed = transformModelFormToTarget(src, modelVerb, targetVerb);
    output[cellKey] = transformed.value;
    total += 1;
    if (transformed.changed) changed += 1;
  });
  return { map: output, confidence: total ? changed / total : 0 };
}

function hasAnswerKey(verb) {
  return !!(verb && verb.answer_key && Object.keys(verb.answer_key).length);
}

function answerKeyHasModelLeak(verb, modelVerb) {
  if (!verb || !modelVerb || !hasAnswerKey(verb)) return false;
  const modelMap = getExpectedMap(modelVerb) || buildCanonicalCellMap(modelVerb);
  return getVerbCellOrder(verb).some(cellKey => {
    if (cellKey === imperativeCellKey("yo")) return false;
    const ownVal = normalizeForMatch(verb.answer_key[cellKey] || "");
    const modelVal = normalizeForMatch(modelMap[cellKey] || "");
    if (!ownVal || !modelVal) return false;
    return ownVal === modelVal;
  });
}

function draftExactlyMatchesAnswerKey(verbKey, answerKeyMap) {
  const inputs = APP_STATE.drafts?.[verbKey]?.inputs;
  if (!inputs || !answerKeyMap) return false;
  const keys = Object.keys(answerKeyMap);
  if (!keys.length) return false;
  return keys.every(cellKey => {
    if (!Object.prototype.hasOwnProperty.call(inputs, cellKey)) return false;
    return normalizeForMatch(inputs[cellKey] || "") === normalizeForMatch(answerKeyMap[cellKey] || "");
  });
}

function autoGenerateMissingCustomAnswerKeys() {
  let generatedCount = 0;
  let repairedCount = 0;
  CUSTOM_DATA.forEach(verb => {
    if (!verb || verb._source !== "custom") return;
    if (!verb.model_verb_ref || verb.locked) return;
    const model = findVerbByKey(verb.model_verb_ref);
    if (!model) return;
    const missingKey = !hasAnswerKey(verb);
    const missingHeaderForms = !missingKey && (
      !Object.prototype.hasOwnProperty.call(verb.answer_key || {}, gerundCellKey()) ||
      !Object.prototype.hasOwnProperty.call(verb.answer_key || {}, participleCellKey())
    );
    const leakedKey = !missingKey && verb.source_tag === "slang_seed" && answerKeyHasModelLeak(verb, model);
    if (!missingKey && !missingHeaderForms && !leakedKey) return;
    const previousKey = hasAnswerKey(verb) ? deepClone(verb.answer_key) : null;
    const generated = generateAnswerKeyFromModel(verb, model);
    if (!generated || !generated.map || !Object.keys(generated.map).length) return;
    const shouldRefreshDraft = leakedKey && previousKey && draftExactlyMatchesAnswerKey(verb._key, previousKey);
    verb.answer_key = generated.map;
    verb.key_confidence = generated.confidence;
    verb.key_needs_review = generated.confidence < 0.85;
    verb.updated_at = new Date().toISOString();
    if (shouldRefreshDraft) {
      APP_STATE.drafts[verb._key] = {
        inputs: deepClone(generated.map),
        updated_at: verb.updated_at
      };
      delete APP_STATE.check_results[verb._key];
    }
    if (missingKey) generatedCount += 1;
    if (leakedKey) repairedCount += 1;
  });
  if (generatedCount || repairedCount) {
    persistCustomData();
    scheduleSave();
    console.info(`Auto-generated ${generatedCount} and repaired ${repairedCount} custom answer keys.`);
  }
}

function generateModelKeyForCurrentCustomVerb() {
  const verb = findVerbByKey(CURRENT_VERB_KEY);
  if (!verb || verb._source !== "custom") {
    alert("Answer-key generation applies to custom verbs only.");
    return;
  }
  if (!verb.model_verb_ref) {
    alert("No model selected. Use Ctrl+Shift+M first.");
    return;
  }
  const model = findVerbByKey(verb.model_verb_ref);
  if (!model) {
    alert("Model verb not found.");
    return;
  }
  const generated = generateAnswerKeyFromModel(verb, model);
  verb.answer_key = generated.map;
  verb.key_confidence = generated.confidence;
  verb.key_needs_review = generated.confidence < 0.85;
  verb.updated_at = new Date().toISOString();
  persistCustomData();
  alert(`Generated answer key from ${model.infinitive}. Confidence ${(generated.confidence * 100).toFixed(1)}%${verb.key_needs_review ? " (needs review)." : "."}`);
}

function finalizeCurrentCustomVerb() {
  const verb = findVerbByKey(CURRENT_VERB_KEY);
  if (!verb || verb._source !== "custom") {
    alert("Finalize applies to custom verbs only.");
    return;
  }
  const entry = {
    custom_verb_id: Number(verb.id),
    snapshot: {
      verb: stripCustomForState(verb),
      draft: deepClone(APP_STATE.drafts[verb._key] || { inputs: {} }),
      check: deepClone(APP_STATE.check_results[verb._key] || null)
    },
    finalized_at: new Date().toISOString(),
    status: "pending_review"
  };
  APP_STATE.pending_queue.push(entry);
  verb.locked = true;
  verb.finalized_at = entry.finalized_at;
  verb.updated_at = entry.finalized_at;
  persistCustomData();
  scheduleSave();
  renderDetail(verb._key);
  alert(`Custom verb finalized and queued. Pending queue: ${APP_STATE.pending_queue.length}.`);
}

function importSlangStarterSet() {
  let added = 0;
  SLANG_STARTER_12.forEach(item => {
    if (findVerbByInfinitive(item.infinitive)) return;
    const hydrated = hydrateCustomVerb(createCustomVerbRecord(item.infinitive, "slang_seed"));
    if (!hydrated) return;
    hydrated.meaning_en = item.meaning_en || "";
    const model = findVerbByInfinitive(item.model);
    if (model) {
      hydrated.model_verb_ref = model._key;
      const modelNotes = (model.pattern_notes || []).map(cleanText).filter(Boolean);
      if (modelNotes.length && !(hydrated.pattern_notes || []).length) {
        hydrated.pattern_notes = deepClone(modelNotes);
      }
      const generated = generateAnswerKeyFromModel(hydrated, model);
      if (generated && generated.map && Object.keys(generated.map).length) {
        hydrated.answer_key = generated.map;
        hydrated.key_confidence = generated.confidence;
        hydrated.key_needs_review = generated.confidence < 0.85;
      }
    }
    CUSTOM_DATA.push(hydrated);
    added += 1;
  });
  APP_STATE.seed_imported.slang12 = true;
  persistCustomData();
  scheduleSave();
  alert(added ? `Imported ${added} slang starter custom verbs.` : "No new slang starters imported.");
}

function computeGlobalFormFloors(measureWithStyle, formSample) {
  if (GLOBAL_FORM_FLOORS) return GLOBAL_FORM_FLOORS;
  const floors = {
    sF1: Infinity,
    sF2: Infinity,
    cF1: Infinity,
    cF2: Infinity
  };

  CORE_DATA.forEach(v => {
    let s1 = 0;
    let s2 = 0;
    let c1 = 0;
    let c2 = 0;

    getOrderedTenseKeys(v.simple).forEach(k => {
      const t = v.simple[k] || {};
      (t.singular || []).forEach(val => {
        if (!val) return;
        s1 = Math.max(s1, measureWithStyle(formSample, val));
      });
      (t.plural || []).forEach(val => {
        if (!val) return;
        s2 = Math.max(s2, measureWithStyle(formSample, val));
      });
    });

    getOrderedTenseKeys(v.compound).forEach(k => {
      const t = v.compound[k] || {};
      (t.singular || []).forEach(val => {
        if (!val) return;
        c1 = Math.max(c1, measureWithStyle(formSample, val));
      });
      (t.plural || []).forEach(val => {
        if (!val) return;
        c2 = Math.max(c2, measureWithStyle(formSample, val));
      });
    });

    floors.sF1 = Math.min(floors.sF1, s1 || floors.sF1);
    floors.sF2 = Math.min(floors.sF2, s2 || floors.sF2);
    floors.cF1 = Math.min(floors.cF1, c1 || floors.cF1);
    floors.cF2 = Math.min(floors.cF2, c2 || floors.cF2);
  });

  GLOBAL_FORM_FLOORS = {
    sF1: Number.isFinite(floors.sF1) ? floors.sF1 : 120,
    sF2: Number.isFinite(floors.sF2) ? floors.sF2 : 150,
    cF1: Number.isFinite(floors.cF1) ? floors.cF1 : 180,
    cF2: Number.isFinite(floors.cF2) ? floors.cF2 : 210
  };
  return GLOBAL_FORM_FLOORS;
}

function computeGlobalHeaderFloors(measureWithStyle, chipSample) {
  if (GLOBAL_HEADER_FLOORS) return GLOBAL_HEADER_FLOORS;
  const floors = {
    gerund: Infinity,
    participle: Infinity
  };

  CORE_DATA.forEach(v => {
    const ger = cleanText(v.gerund || "");
    const part = cleanText(v.past_participle || "");
    if (ger) floors.gerund = Math.min(floors.gerund, measureWithStyle(chipSample, ger));
    if (part) floors.participle = Math.min(floors.participle, measureWithStyle(chipSample, part));
  });

  GLOBAL_HEADER_FLOORS = {
    gerund: Number.isFinite(floors.gerund) ? floors.gerund : 64,
    participle: Number.isFinite(floors.participle) ? floors.participle : 64
  };
  return GLOBAL_HEADER_FLOORS;
}

function computeGridWidths(detailRoot) {
  const meas = document.createElement("span");
  meas.style.position = "absolute";
  meas.style.left = "-99999px";
  meas.style.top = "-99999px";
  meas.style.whiteSpace = "nowrap";
  meas.style.visibility = "hidden";
  document.body.appendChild(meas);

  function measureWithStyle(sampleEl, text) {
    const cs = window.getComputedStyle(sampleEl);
    meas.style.fontFamily = cs.fontFamily;
    meas.style.fontSize = cs.fontSize;
    meas.style.fontWeight = cs.fontWeight;
    meas.style.fontStyle = cs.fontStyle;
    meas.style.fontVariant = cs.fontVariant;
    meas.textContent = text;
    return Math.ceil(meas.getBoundingClientRect().width);
  }

  const formSample = detailRoot.querySelector('section.side .formBtn[data-cell-key]') || detailRoot.querySelector(".formBtn[data-cell-key]");
  const pronSample = detailRoot.querySelector("tbody tr td:nth-child(1)");
  if (!formSample || !pronSample) {
    meas.remove();
    return;
  }

  let maxP1 = 0;
  let maxP2 = 0;
  detailRoot.querySelectorAll("tbody tr td:nth-child(1)").forEach(td => {
    const t = (td.textContent || "").trim();
    if (!t) return;
    maxP1 = Math.max(maxP1, measureWithStyle(pronSample, t));
  });
  detailRoot.querySelectorAll("tbody tr td:nth-child(3)").forEach(td => {
    const t = (td.textContent || "").trim();
    if (!t) return;
    maxP2 = Math.max(maxP2, measureWithStyle(pronSample, t));
  });

  function measureForms(sectionSel, colIdx) {
    let maxW = 0;
    detailRoot.querySelectorAll(sectionSel + ` tbody tr td:nth-child(${colIdx}) .formBtn`).forEach(btn => {
      const t = (btn.textContent || "").trim();
      if (!t) return;
      maxW = Math.max(maxW, measureWithStyle(formSample, t));
    });
    return maxW;
  }

  const sF1 = measureForms('section.side[data-side="simple"]', 2);
  const sF2 = measureForms('section.side[data-side="simple"]', 4);
  const cF1 = measureForms('section.side[data-side="compound"]', 2);
  const cF2 = measureForms('section.side[data-side="compound"]', 4);
  const floors = computeGlobalFormFloors(measureWithStyle, formSample);
  const chipSample = detailRoot.querySelector(".chipFormBtn") || formSample;
  const headerFloors = computeGlobalHeaderFloors(measureWithStyle, chipSample);

  const sF1Clamped = Math.max(sF1, floors.sF1);
  const sF2Clamped = Math.max(sF2, floors.sF2);
  const cF1Clamped = Math.max(cF1, floors.cF1);
  const cF2Clamped = Math.max(cF2, floors.cF2);

  const pronBuf = 18;
  const formBuf = 30;
  detailRoot.style.setProperty("--p1W", (maxP1 + pronBuf) + "px");
  detailRoot.style.setProperty("--p2W", (maxP2 + pronBuf) + "px");
  detailRoot.style.setProperty("--sF1W", (sF1Clamped + formBuf) + "px");
  detailRoot.style.setProperty("--sF2W", (sF2Clamped + formBuf) + "px");
  detailRoot.style.setProperty("--cF1W", (cF1Clamped + formBuf) + "px");
  detailRoot.style.setProperty("--cF2W", (cF2Clamped + formBuf) + "px");
  detailRoot.style.setProperty("--gerundMinW", (headerFloors.gerund + 6) + "px");
  detailRoot.style.setProperty("--partMinW", (headerFloors.participle + 6) + "px");

  const simpleSide = detailRoot.querySelector('section.side[data-side="simple"]');
  const compoundSide = detailRoot.querySelector('section.side[data-side="compound"]');
  if (simpleSide && compoundSide) {
    detailRoot.style.setProperty("--simpleSideW", Math.ceil(simpleSide.getBoundingClientRect().width) + "px");
    detailRoot.style.setProperty("--compoundSideW", Math.ceil(compoundSide.getBoundingClientRect().width) + "px");
  }

  meas.remove();
}

function runAutoWidths(detailEl) {
  const doIt = () => requestAnimationFrame(() => computeGridWidths(detailEl));
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(doIt).catch(doIt);
  else setTimeout(doIt, 0);
}

function syncSidebarHeight() {
  const listCard = document.querySelector(".listCard");
  const mainCard = document.querySelector("main.card");
  const search = listCard?.querySelector(".search");
  const list = document.getElementById("list");
  if (!listCard || !mainCard || !search || !list) return;
  if (window.matchMedia("(max-width: 900px)").matches) {
    listCard.style.height = "";
    list.style.height = "";
    list.style.maxHeight = "";
    return;
  }
  const targetHeight = Math.ceil(mainCard.getBoundingClientRect().height);
  const listHeight = Math.max(120, targetHeight - Math.ceil(search.getBoundingClientRect().height));
  listCard.style.height = `${targetHeight}px`;
  list.style.height = `${listHeight}px`;
  list.style.maxHeight = `${listHeight}px`;
}

const pop = document.getElementById("popover");
const popClose = document.getElementById("popClose");

function showPopover(anchorEl, meta) {
  const rect = anchorEl.getBoundingClientRect();
  const pad = 10;
  const num = (meta.tense.match(/^\d+/) || [""])[0];
  const label = meta.tense.replace(/^\d+\s*/, "");
  const key = `${meta.person}-${meta.number}`;
  const pron = PRONOUNS[key] || "";
  const personLabel = meta.person
    ? `${meta.person} (${meta.person === "1" ? "first" : meta.person === "2" ? "second" : "third"})${pron ? ` — ${pron}` : ""}`
    : "—";
  const numberLabel = meta.number === "sg" ? "singular" : meta.number === "pl" ? "plural" : "—";
  const hint = meta.tense === "Gerund"
    ? "Gerund form."
    : meta.tense === "Participle"
      ? "Past participle form."
      : (num ? (TENSE_HINTS[num] || "Tip: Add a short explanation here for this tense.") : "Imperative form.");

  document.getElementById("popWord").textContent = meta.form;
  document.getElementById("popVerb").textContent = meta.verb;
  document.getElementById("popTense").textContent = num ? `${num} · ${label}` : label;
  document.getElementById("popPerson").textContent = personLabel;
  document.getElementById("popNumber").textContent = numberLabel;
  document.getElementById("popHint").innerHTML = hint;

  pop.style.display = "block";
  pop.setAttribute("aria-hidden", "false");

  const popRect = pop.getBoundingClientRect();
  let x = rect.left;
  let y = rect.bottom + 8;
  if (x + popRect.width > window.innerWidth - pad) x = window.innerWidth - popRect.width - pad;
  if (x < pad) x = pad;
  if (y + popRect.height > window.innerHeight - pad) y = rect.top - popRect.height - 8;
  if (y < pad) y = pad;
  pop.style.left = Math.round(x) + "px";
  pop.style.top = Math.round(y) + "px";
}

function hidePopover() {
  pop.style.display = "none";
  pop.setAttribute("aria-hidden", "true");
}

function handleShortcut(e) {
  if (!e.ctrlKey || !e.shiftKey) return;
  const key = e.key.toLowerCase();
  if (!["k", "v", "x", "s", "e", "i", "l", "m", "g", "f"].includes(key)) return;
  e.preventDefault();
  if (ACTIVE_EDITOR) commitInlineEdit(0);

  if (key === "k") checkCurrentVerb();
  if (key === "v") revealAnswersForCurrentVerb();
  if (key === "x") clearCurrentVerbToBlanks();
  if (key === "s") saveDraftSnapshot();
  if (key === "e") exportStateBackup();
  if (key === "i") importStateBackup();
  if (key === "l") importSlangStarterSet();
  if (key === "m") setModelForCurrentCustomVerb();
  if (key === "g") generateModelKeyForCurrentCustomVerb();
  if (key === "f") finalizeCurrentCustomVerb();
}

popClose.addEventListener("click", hidePopover);

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && pop.style.display !== "none") hidePopover();
  handleShortcut(e);
});

document.addEventListener("click", (e) => {
  if (pop.style.display === "none") return;
  if (pop.contains(e.target)) return;
  if (e.target.classList && e.target.classList.contains("formBtn")) return;
  hidePopover();
});

document.getElementById("q").addEventListener("input", (e) => {
  renderList(e.target.value);
});
document.getElementById("filterPattern")?.addEventListener("change", () => {
  renderList(document.getElementById("q").value || "");
});
document.getElementById("filterTag")?.addEventListener("change", () => {
  renderList(document.getElementById("q").value || "");
});

document.addEventListener("DOMContentLoaded", () => {
  const q = document.getElementById("q");
  const patternFilter = document.getElementById("filterPattern");
  const tagFilter = document.getElementById("filterTag");
  q.value = APP_STATE.ui.search_text || "";
  if (patternFilter) patternFilter.value = APP_STATE.ui.pattern_filter || "all";
  if (tagFilter) tagFilter.value = APP_STATE.ui.tag_filter || "all";
  renderList(q.value || "");
  syncSidebarHeight();
  window.addEventListener("load", () => {
    const detail = document.getElementById("detail");
    if (detail) runAutoWidths(detail);
    syncSidebarHeight();
  }, { once: true });
});

window.addEventListener("resize", () => {
  const detail = document.getElementById("detail");
  if (detail) runAutoWidths(detail);
  syncSidebarHeight();
});
