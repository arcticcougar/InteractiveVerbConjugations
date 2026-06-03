(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.PRACTICE_CHALLENGES = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const START_DATE = "2026-06-01";
  const DEFAULT_TENSE_KEYS = ["gerund", "participle", "1", "3", "4"];
  const PROGRAM_LABEL = "Essential 55";
  const WEEKS = [
    { week: 1, verbs: ["hablar", "comer", "vivir"], focus: "Simplest regular -ar, -er, -ir verbs" },
    { week: 2, verbs: ["cantar", "aprender", "escribir"], focus: "More regular verb confidence" },
    { week: 3, verbs: ["estudiar", "comprar", "tomar"], focus: "Common regular -ar verbs" },
    { week: 4, verbs: ["trabajar", "beber", "abrir"], focus: "Another clean -ar, -er, -ir set" },
    { week: 5, verbs: ["necesitar", "comprender", "recibir"], focus: "Useful classroom and communication verbs" },
    { week: 6, verbs: ["escuchar", "vender", "subir"], focus: "Regular verbs across the three endings" },
    { week: 7, verbs: ["ayudar", "responder", "decidir"], focus: "Sentence-building regular verbs" },
    { week: 8, verbs: ["esperar", "correr", "asistir"], focus: "Regular verbs with useful everyday meanings" },
    { week: 9, verbs: ["viajar", "sufrir", "acabar"], focus: "Mostly regular; introduces acabar de + infinitive" },
    { week: 10, verbs: ["entrar", "deber", "llevar"], focus: "Useful regular verbs and common expressions" },
    { week: 11, verbs: ["limpiar", "romper", "compartir"], focus: "Final regular-pattern consolidation week" },
    { week: 12, verbs: ["llamar", "llamarse", "usar"], focus: "First reflexive/nonreflexive contrast" },
    { week: 13, verbs: ["mirar", "mirarse", "preparar"], focus: "Reflexive meaning contrast, kept manageable" },
    { week: 14, verbs: ["caer", "caerse", "traer"], focus: "Related difficult forms: caigo, traigo" },
    { week: 15, verbs: ["sentir", "sentirse", "dormir"], focus: "Stem-changing -ir verbs" },
    { week: 16, verbs: ["poner", "ponerse", "salir"], focus: "Irregular yo forms: pongo, salgo" },
    { week: 17, verbs: ["ir", "irse", "volver"], focus: "Going, leaving, returning" },
    { week: 18, verbs: ["quedarse", "estar", "ser"], focus: "Staying, states, identity" },
    { week: 19, verbs: ["gustar", "parecer", "doler"], focus: "Indirect-object verbs: me gusta, me parece, me duele" },
    { week: 20, verbs: ["pagar", "tocar", "buscar"], focus: "Spelling changes in the preterite" },
    { week: 21, verbs: ["comenzar", "empezar", "pensar"], focus: "e to ie stem-changing verbs" },
    { week: 22, verbs: ["contar", "poder", "jugar"], focus: "o to ue / u to ue stem-changing verbs" },
    { week: 23, verbs: ["perder", "querer", "cerrar"], focus: "More e to ie stem-changing practice" },
    { week: 24, verbs: ["conocer", "conducir", "traducir"], focus: "-zco verbs: conozco, conduzco, traduzco" },
    { week: 25, verbs: ["leer", "creer", "oir"], focus: "Vowel-heavy verbs, accents, spelling patterns" },
    { week: 26, verbs: ["tener", "venir", "mantener"], focus: "Major irregulars and related verb families" },
    { week: 27, verbs: ["saber", "ver", "dar"], focus: "Short but important irregular verbs" },
    { week: 28, verbs: ["hacer", "decir", "pedir"], focus: "High-frequency irregulars plus a stem-changing helper" },
    { week: 29, verbs: ["haber", "existir", "faltar"], focus: "Existence, presence, absence, and need" },
    { week: 30, verbs: ["andar", "construir", "elegir"], focus: "Final mixed-pattern week and consolidation" }
  ];

  function normalizeText(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  }

  function dayNumber(value) {
    const date = value instanceof Date ? value : new Date(value);
    return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);
  }

  function weekForDate(value) {
    const week = Math.floor((dayNumber(value || new Date()) - dayNumber(START_DATE)) / 7) + 1;
    return week >= 1 && week <= WEEKS.length ? week : null;
  }

  function byWeek(week) {
    const n = Number(week) || 0;
    return WEEKS.find(item => item.week === n) || null;
  }

  function current(value) {
    return byWeek(weekForDate(value));
  }

  function label(challenge) {
    return challenge ? `${PROGRAM_LABEL} - Week ${challenge.week}` : "";
  }

  function sameSet(a, b) {
    const left = [...(a || [])].map(normalizeText).filter(Boolean).sort();
    const right = [...(b || [])].map(normalizeText).filter(Boolean).sort();
    return left.length === right.length && left.every((item, idx) => item === right[idx]);
  }

  function sameTenses(keys) {
    return sameSet(keys || [], DEFAULT_TENSE_KEYS);
  }

  function matchingChallenge(verbs, selectedKeys) {
    if (!sameTenses(selectedKeys)) return null;
    return WEEKS.find(challenge => sameSet(verbs, challenge.verbs)) || null;
  }

  return {
    START_DATE,
    DEFAULT_TENSE_KEYS,
    PROGRAM_LABEL,
    WEEKS,
    normalizeText,
    weekForDate,
    byWeek,
    current,
    label,
    sameSet,
    sameTenses,
    matchingChallenge
  };
});
