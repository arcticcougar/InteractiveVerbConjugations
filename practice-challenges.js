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
  const INTERMEDIATE_TENSE_KEYS = [
    "gerund", "participle",
    "1", "2", "3", "4", "5", "6", "8",
    "imperative"
  ];
  const ALL_TENSE_KEYS = [
    "gerund", "participle",
    "1", "2", "3", "4", "5", "6", "7",
    "8", "9", "10", "11", "12", "13", "14",
    "imperative"
  ];
  const TENSE_CYCLES = [
    { id: "beginner", label: "Beginner", tenseKeys: DEFAULT_TENSE_KEYS },
    { id: "intermediate", label: "Intermediate", tenseKeys: INTERMEDIATE_TENSE_KEYS },
    { id: "all", label: "All tenses", tenseKeys: ALL_TENSE_KEYS }
  ];
  const PROGRAM_LABEL = "Essential 55";
  const COURSE_WELCOME_VIDEO = {
    src: "Essential55_Welcome.mp4",
    title: "Essential 55 course welcome"
  };
  const COURSE_PAPER_WORKBOOK = {
    href: "Essential55_Paper_Practice_Workbook.xlsx",
    title: "Download paper practice workbook",
    detail: "30 printable weekly sheets"
  };
  const WEEK_1_PRONUNCIATION_AUDIO = {
    type: "audio",
    src: "Essential55-Week1%20Verb%20Pronunciation.mp3",
    title: "Week 1 verb pronunciation"
  };
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
    { week: 11, verbs: ["limpiar", "romper", "cumplir"], focus: "Final regular-pattern consolidation week" },
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
    { week: 29, verbs: ["haber", "aparecer", "faltar"], focus: "Existence, appearance, absence, and need" },
    { week: 30, verbs: ["andar", "construir", "elegir"], focus: "Final mixed-pattern week and consolidation" }
  ];

  const INTRO_BY_WEEK = {
    1: {
      lead: "This opening week is your reference point for the whole course. Hablar, comer, and vivir show the three regular verb families in their simplest form, so treat them as patterns you will keep returning to rather than as three isolated verbs.",
      audio: WEEK_1_PRONUNCIATION_AUDIO,
      watch: [
        "In the present, -er and -ir verbs are almost identical except nosotros and vosotros: comemos/coméis versus vivimos/vivís.",
        "In the preterite, the accent marks separate past-tense forms from present-tense lookalikes: hablé/habló, comí/comió, viví/vivió.",
        "In the future, all three keep the full infinitive and add the same endings, so hablaré, comeré, and viviré are built the same way."
      ]
    },
    2: {
      lead: "This week asks you to prove that last week's patterns transfer to new verbs. Cantar, aprender, and escribir are still regular, so the skill is to recognize the family quickly and apply the ending without hesitation.",
      watch: [
        "Cantar follows hablar exactly; if a cantar form feels uncertain, mentally swap in hablar and then return to the new stem.",
        "Aprender and escribir reinforce the -er/-ir split: most forms match, but nosotros and vosotros tell the families apart.",
        "Use the infinitive ending as your first decision point, then keep the stem steady while the endings do the work."
      ]
    },
    3: {
      lead: "Now you get a concentrated -ar week. Estudiar, comprar, and tomar are common classroom and everyday verbs, and the point is to make the -ar pattern feel automatic enough that you can focus on meaning.",
      watch: [
        "All three verbs use the same -ar endings, so any difference should come from the stem, not the pattern.",
        "Preterite accents still matter: estudié/estudió, compré/compró, tomé/tomó.",
        "Practise them as sentence starters: estudio español, compré café, tomaré agua."
      ]
    },
    4: {
      lead: "Trabajar, beber, and abrir bring the three regular families back together. This is a fluency week: you are training yourself to see a new regular verb and immediately know which endings belong to it.",
      watch: [
        "Trabajar has a longer stem, but it is still just trabaj- plus regular -ar endings.",
        "Beber and abrir are a clean -er/-ir pair; compare bebo/bebemos with abro/abrimos.",
        "The future is your breather: trabajaré, beberé, and abriré all use the infinitive plus the same future endings."
      ]
    },
    5: {
      lead: "Necesitar, comprender, and recibir are practical communication verbs. They let you say what you need, what you understand, and what you receive, which makes them useful far beyond this test.",
      watch: [
        "Necesitar is your -ar anchor; comprender and recibir keep the -er/-ir contrast active.",
        "Comprender looks and sounds close to aprender, so make sure you are writing comprend- when this verb is tested.",
        "These verbs are especially useful in the preterite: necesité ayuda, comprendí la pregunta, recibí un mensaje."
      ]
    },
    6: {
      lead: "Escuchar, vender, and subir are straightforward regular verbs, but they are excellent for building usable speed. The goal is not just to get the forms right, but to make them arrive without a long pause.",
      watch: [
        "Escuchar is regular; do not confuse it with oír, which follows a much more irregular pattern.",
        "Vender and subir are a clean -er/-ir pair, especially in nosotros and vosotros.",
        "The gerunds are useful in real speech: escuchando, vendiendo, subiendo."
      ]
    },
    7: {
      lead: "Ayudar, responder, and decidir are strong sentence-building verbs because they often connect people, questions, and choices. The forms are regular, so put your attention on clean endings and accurate accents.",
      watch: [
        "Ayudar is regular -ar, responder is regular -er, and decidir is regular -ir.",
        "Decidir has the regular -ir preterite accents: decidí and decidió.",
        "Attach each form to a subject as you type: yo ayudo, tú respondes, ellos decidirán."
      ]
    },
    8: {
      lead: "Esperar, correr, and asistir are regular verbs with meanings learners use early and often. This week is a reminder that a verb can be grammatically simple but still deserve careful attention because of how common it is.",
      watch: [
        "Esperar can mean to wait, to hope, or to expect; context decides which English translation fits.",
        "Asistir usually means to attend, not to assist, so do not let the English lookalike mislead you.",
        "Correr is a clean -er model; use it to check whether your -er endings are secure."
      ]
    },
    9: {
      lead: "Viajar, sufrir, and acabar continue regular-pattern work, but acabar adds a useful phrase: acabar de plus an infinitive means to have just done something. This gives the week a small but important communication bonus.",
      watch: [
        "Viajar keeps the j in the stem throughout these forms: viajo, viajé, viajaré.",
        "Sufrir strengthens the regular -ir pattern: sufro, sufrí, sufriré.",
        "Acabo de llegar means 'I have just arrived'; the conjugated acabar carries the time."
      ]
    },
    10: {
      lead: "Entrar, deber, and llevar are regular, but their meanings open a lot of real sentences. This week is about turning reliable forms into useful expressions about entering, obligation, carrying, wearing, and taking.",
      watch: [
        "Deber plus an infinitive means must, should, or ought to: debo estudiar, debemos salir.",
        "Llevar is flexible: it can mean to carry, to wear, or to take someone/something somewhere.",
        "The meanings are flexible, but the conjugations are regular; do not invent irregularities that are not there."
      ]
    },
    11: {
      lead: "Limpiar, romper, and cumplir are your final regular-pattern consolidation week. By this point, a new regular verb should feel manageable even when the vocabulary itself is less familiar.",
      watch: [
        "Limpiar is regular despite the i in the stem; do not let the spelling distract you from the -ar pattern.",
        "Romper is your -er anchor and cumplir is your -ir anchor.",
        "If you hesitate, pause for the sequence: infinitive ending, stem, tense, subject."
      ]
    },
    12: {
      lead: "Llamar, llamarse, and usar introduce the first major reflexive contrast. Llamar means to call; llamarse is the form used for names, so this week teaches you that a pronoun can change the whole job of a verb.",
      watch: [
        "The reflexive pronouns are me, te, se, nos, os, se.",
        "The verb ending still follows the regular -ar pattern; the extra task is placing the correct pronoun.",
        "Compare llamo with me llamo: the verb ending is familiar, but the meaning changes."
      ]
    },
    13: {
      lead: "Mirar, mirarse, and preparar continue the reflexive idea in a very manageable setting. Mirar means to look at something; mirarse usually means to look at oneself, so the grammar is also teaching meaning.",
      watch: [
        "Do not drop the reflexive pronoun from mirarse: me miro, te miras, se mira.",
        "Mirar and preparar are regular -ar verbs, so the endings should feel familiar.",
        "Keep pronoun and subject aligned; se miro is not the same as me miro."
      ]
    },
    14: {
      lead: "Caer, caerse, and traer move you into more serious irregular territory. They are related by sound and by some spelling behavior, but each form still needs to be checked carefully rather than guessed from a regular -er model.",
      watch: [
        "Caer and traer both have irregular present yo forms: caigo and traigo.",
        "Caerse adds reflexive pronouns on top of the irregular forms: me caigo, se cayó.",
        "Watch the preterite third-person forms: caer gives cayó/cayeron, while traer gives trajo/trajeron."
      ]
    },
    15: {
      lead: "Sentir, sentirse, and dormir introduce high-value -ir stem changers. The endings may be familiar, but the stem itself can move, so this week trains you to look inside the word before adding the ending.",
      watch: [
        "Sentir changes e to ie in the present: siento, sientes, siente.",
        "Dormir changes o to ue in the present: duermo, duermes, duerme.",
        "In the preterite, third-person -ir forms shift again: sintió/sintieron and durmió/durmieron."
      ]
    },
    16: {
      lead: "Poner, ponerse, and salir are everyday verbs with irregular forms that learners meet constantly. This week is about noticing the small irregular stems that make these verbs sound natural.",
      watch: [
        "The present yo forms are pongo and salgo.",
        "Ponerse is reflexive, so include both the pronoun and the correct verb form: me pongo, se pone.",
        "The future stems are irregular: pondré/pondrás and saldré/saldrás."
      ]
    },
    17: {
      lead: "Ir, irse, and volver are movement verbs: going, going away, and returning. Ir is so irregular that it becomes a memory verb, while volver gives you a useful contrast between an irregular present stem and a very common past participle.",
      watch: [
        "Ir has highly irregular present forms: voy, vas, va, vamos, vais, van.",
        "Irse means to leave or go away, so keep the reflexive pronoun: me voy, se fue.",
        "Volver changes o to ue in the present and has the important past participle vuelto."
      ]
    },
    18: {
      lead: "Quedarse, estar, and ser are a meaning-heavy week. English uses one verb, to be, for many ideas, but Spanish divides identity, condition, location, and staying into different patterns.",
      watch: [
        "Ser is used for identity, origin, and defining characteristics; estar is used for states and location.",
        "Estar has the present yo form estoy and the preterite stem estuv-.",
        "Ser shares its preterite forms with ir: fui, fuiste, fue, fuimos, fuisteis, fueron."
      ]
    },
    19: {
      lead: "Gustar, parecer, and doler behave differently from ordinary subject-action verbs. In real use, the thing liked, seeming true, or hurting often controls the verb, while the person affected is shown with a pronoun.",
      watch: [
        "The key everyday contrast is singular versus plural: me gusta el libro, me gustan los libros.",
        "Use indirect-object pronouns for the person affected: me, te, le, nos, os, les.",
        "Doler also changes o to ue in the present: duele and duelen."
      ]
    },
    20: {
      lead: "Pagar, tocar, and buscar are regular -ar verbs with one important spelling lesson. The yo preterite changes spelling to protect the original sound before the é ending.",
      watch: [
        "The yo preterite forms are pagué, toqué, and busqué.",
        "Those changes preserve the hard g/k sounds; the spelling changes, but the pronunciation stays loyal to the infinitive.",
        "Outside that yo preterite spelling issue, treat the verbs as regular -ar verbs."
      ]
    },
    21: {
      lead: "Comenzar, empezar, and pensar train the e to ie stem-change pattern. This is the moment to stop seeing stem changers as random and start seeing the predictable present-tense shape.",
      watch: [
        "In the present, the stem changes in all forms except nosotros and vosotros: pienso, piensas, piensa, pensamos.",
        "Comenzar and empezar also have a spelling change in the yo preterite: comencé and empecé.",
        "The future uses the full infinitive, so pensaré and empezaré do not use the present-tense stem change."
      ]
    },
    22: {
      lead: "Contar, poder, and jugar continue stem-change work with o to ue and u to ue. These verbs are common enough that the changed forms need to feel normal, not exceptional.",
      watch: [
        "Contar and poder change o to ue in the present: cuento, cuentas; puedo, puedes.",
        "Jugar changes u to ue in the present and has a yo preterite spelling change: jugué.",
        "Poder has a separate irregular preterite and future: pude, pudo, podré."
      ]
    },
    23: {
      lead: "Perder, querer, and cerrar give you more e to ie practice, but querer raises the difficulty because it has important irregular forms outside the present. This week is about comparing similar-looking patterns without flattening them into one rule.",
      watch: [
        "All three change e to ie in the present: pierdo, quiero, cierro.",
        "Querer has an irregular preterite: quise, quiso, quisieron.",
        "Perder and cerrar have regular futures, but querer uses querr-: querré, querrás."
      ]
    },
    24: {
      lead: "Conocer, conducir, and traducir teach the -zco family and then move beyond it. The present yo forms are the obvious hook, but conducir and traducir also have distinctive preterite stems.",
      watch: [
        "The present yo forms are conozco, conduzco, and traduzco.",
        "Conducir and traducir use conduj- and traduj- in the preterite, with ellos forms condujeron and tradujeron.",
        "Conocer is not the same as saber; it usually means to know or be familiar with a person, place, or thing."
      ]
    },
    25: {
      lead: "Leer, creer, and oír are vowel-heavy verbs, which means spelling, accents, and inserted y forms matter. This is a careful-writing week as much as a memory week.",
      watch: [
        "Past participles need written accents: leído, creído, oído.",
        "The preterite third-person forms introduce y: leyó/leyeron, creyó/creyeron, oyó/oyeron.",
        "Oír also has present forms such as oigo, oyes, oye, so give it extra attention."
      ]
    },
    26: {
      lead: "Tener, venir, and mantener are major irregular verbs and a useful family study. Mantener is not a brand-new pattern; it borrows heavily from tener, which helps you learn more by noticing the family resemblance.",
      watch: [
        "The present yo forms are tengo, vengo, and mantengo.",
        "The preterite stems are tuv-, vin-, and mantuv-: tuve, vine, mantuve.",
        "The future stems are tendr-, vendr-, and mantendr-: tendré, vendré, mantendré."
      ]
    },
    27: {
      lead: "Saber, ver, and dar are short, high-frequency verbs where small details matter. Because the forms are compact, one missing accent or one extra letter can change the answer completely.",
      watch: [
        "Saber has the present yo form sé and an irregular preterite stem sup-.",
        "Ver has veo in the present and vi/vio in the preterite; dar has doy and di/dio.",
        "Notice that vi, vio, di, and dio are short preterite forms without written accents."
      ]
    },
    28: {
      lead: "Hacer, decir, and pedir are high-frequency verbs with three different irregular personalities. This week rewards careful pattern recognition: each verb is common, but each one misbehaves in its own way.",
      watch: [
        "Hacer and decir have irregular present yo forms: hago and digo.",
        "Their preterites are also distinctive: hice/hizo and dije/dijo.",
        "Pedir changes e to i: pido in the present, pidió/pidieron in the preterite."
      ]
    },
    29: {
      lead: "Haber, aparecer, and faltar deal with existence, appearance, and absence or need. They often appear in structures that do not feel like simple subject-action sentences, so meaning and grammar have to be learned together.",
      watch: [
        "Haber is often auxiliary or impersonal: he hablado, hay una mesa.",
        "Aparecer belongs with verbs like conocer in the present yo form: aparezco.",
        "Faltar often works like gustar: me falta tiempo means 'I lack time' or 'I need time'."
      ]
    },
    30: {
      lead: "Andar, construir, and elegir are a final mixed-pattern week. You have an irregular preterite stem, a verb with y-spelling behavior, and an e to i stem changer, so the goal is to identify the kind of challenge before you type.",
      watch: [
        "Andar has the irregular preterite stem anduv-: anduve, anduvo, anduvieron.",
        "Construir has y forms such as construyo, construyó, and construyeron.",
        "Elegir changes e to i in several forms and has the present yo form elijo."
      ]
    }
  };

  WEEKS.forEach(challenge => {
    const intro = INTRO_BY_WEEK[challenge.week] || null;
    if (!intro) {
      challenge.intro = null;
      return;
    }
    const extraMedia = [
      ...(Array.isArray(intro.media) ? intro.media : []),
      ...(intro.video ? [intro.video] : []),
      ...(Array.isArray(intro.videos) ? intro.videos : []),
      ...(intro.audio ? [intro.audio] : []),
      ...(Array.isArray(intro.audios) ? intro.audios : [])
    ];
    const { video, videos, audio, audios, media, downloads, ...introCopy } = intro;
    challenge.intro = {
      ...introCopy,
      media: [COURSE_WELCOME_VIDEO, ...extraMedia],
      downloads: [
        COURSE_PAPER_WORKBOOK,
        ...(Array.isArray(intro.downloads) ? intro.downloads : [])
      ]
    };
  });

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
    const schedule = scheduleForDate(value);
    return schedule ? schedule.week : null;
  }

  function byWeek(week) {
    const n = Number(week) || 0;
    return WEEKS.find(item => item.week === n) || null;
  }

  function scheduleForDate(value) {
    const elapsedWeeks = Math.floor((dayNumber(value || new Date()) - dayNumber(START_DATE)) / 7);
    if (elapsedWeeks < 0) return null;
    const cycleIndex = Math.min(Math.floor(elapsedWeeks / WEEKS.length), TENSE_CYCLES.length - 1);
    const tenseCycle = TENSE_CYCLES[cycleIndex];
    return {
      absoluteWeek: elapsedWeeks + 1,
      week: (elapsedWeeks % WEEKS.length) + 1,
      pass: Math.floor(elapsedWeeks / WEEKS.length) + 1,
      cycleId: tenseCycle.id,
      cycleLabel: tenseCycle.label,
      tenseKeys: [...tenseCycle.tenseKeys]
    };
  }

  function applySchedule(challenge, schedule) {
    if (!challenge) return null;
    const activeSchedule = schedule || {
      absoluteWeek: challenge.week,
      week: challenge.week,
      pass: 1,
      cycleId: TENSE_CYCLES[0].id,
      cycleLabel: TENSE_CYCLES[0].label,
      tenseKeys: [...TENSE_CYCLES[0].tenseKeys]
    };
    return {
      ...challenge,
      absoluteWeek: activeSchedule.absoluteWeek,
      pass: activeSchedule.pass,
      cycleId: activeSchedule.cycleId,
      cycleLabel: activeSchedule.cycleLabel,
      tenseKeys: [...activeSchedule.tenseKeys]
    };
  }

  function current(value) {
    const schedule = scheduleForDate(value);
    return schedule ? applySchedule(byWeek(schedule.week), schedule) : null;
  }

  function label(challenge) {
    if (!challenge) return "";
    const suffix = challenge.cycleId && challenge.cycleId !== "beginner"
      ? ` (${challenge.cycleLabel})`
      : "";
    return `${PROGRAM_LABEL} - Week ${challenge.week}${suffix}`;
  }

  function sameSet(a, b) {
    const left = [...(a || [])].map(normalizeText).filter(Boolean).sort();
    const right = [...(b || [])].map(normalizeText).filter(Boolean).sort();
    return left.length === right.length && left.every((item, idx) => item === right[idx]);
  }

  function tenseCycleForKeys(keys) {
    return TENSE_CYCLES.find(cycle => sameSet(keys || [], cycle.tenseKeys)) || null;
  }

  function sameTenses(keys) {
    return !!tenseCycleForKeys(keys);
  }

  function matchingChallenge(verbs, selectedKeys) {
    const tenseCycle = tenseCycleForKeys(selectedKeys);
    if (!tenseCycle) return null;
    const challenge = WEEKS.find(item => sameSet(verbs, item.verbs)) || null;
    return challenge ? applySchedule(challenge, {
      absoluteWeek: challenge.week,
      week: challenge.week,
      pass: TENSE_CYCLES.findIndex(cycle => cycle.id === tenseCycle.id) + 1,
      cycleId: tenseCycle.id,
      cycleLabel: tenseCycle.label,
      tenseKeys: [...tenseCycle.tenseKeys]
    }) : null;
  }

  return {
    START_DATE,
    DEFAULT_TENSE_KEYS,
    INTERMEDIATE_TENSE_KEYS,
    ALL_TENSE_KEYS,
    TENSE_CYCLES,
    PROGRAM_LABEL,
    WEEKS,
    normalizeText,
    scheduleForDate,
    weekForDate,
    byWeek,
    current,
    label,
    sameSet,
    sameTenses,
    tenseCycleForKeys,
    matchingChallenge
  };
});
