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
      lead: "This first week is about seeing the three regular families side by side. Hablar, comer, and vivir give you the cleanest possible comparison between -ar, -er, and -ir verbs, so use the shared shape of the endings to help your memory.",
      watch: [
        "In the present tense, notice that -er and -ir verbs are almost identical except nosotros and vosotros.",
        "In the preterite, the yo and el/ella forms need accents: hablé/habló, comí/comió, viví/vivió.",
        "The future is built from the full infinitive plus endings, so the verb ending type matters less there."
      ]
    },
    2: {
      lead: "This week keeps the verbs regular but asks you to trust the pattern with fresh vocabulary. Cantar, aprender, and escribir are useful verbs, and they reinforce the idea that regular endings can carry you a long way.",
      watch: [
        "Cantar behaves just like hablar, so it is a good confidence check for the -ar pattern.",
        "Aprender and escribir let you compare -er and -ir forms again without extra irregular distractions.",
        "Say the forms in order as you type; the rhythm often reveals whether an ending sounds wrong."
      ]
    },
    3: {
      lead: "Now the focus narrows to common -ar verbs. Estudiar, comprar, and tomar are regular, so the challenge is speed, accuracy, and not overthinking forms that follow the same model.",
      watch: [
        "All three verbs use the same -ar endings in the selected tenses.",
        "Preterite accents still matter: estudié/estudió, compré/compró, tomé/tomó.",
        "These verbs combine easily with nouns, so picture simple sentences as you conjugate."
      ]
    },
    4: {
      lead: "Trabajar, beber, and abrir return to the -ar, -er, -ir comparison. By now, the aim is to recognize the regular pattern quickly instead of rebuilding every form from scratch.",
      watch: [
        "Trabajar is a straightforward -ar verb even though the stem is a little longer.",
        "Beber and abrir are useful for comparing -er and -ir endings in present and preterite.",
        "Keep the stem stable; most of the work is choosing the correct ending."
      ]
    },
    5: {
      lead: "Necesitar, comprender, and recibir are classroom and communication verbs. They are regular, but they are also the sort of verbs learners use constantly when asking for help or explaining what they understand.",
      watch: [
        "Necesitar is an -ar verb, while comprender and recibir let you review the -er/-ir split.",
        "Comprender and aprender are close in meaning and form, so pay attention to the stem you are using.",
        "The preterite is useful here for saying what someone needed, understood, or received at a specific time."
      ]
    },
    6: {
      lead: "Escuchar, vender, and subir keep building fluency across the three regular endings. These are everyday action verbs, so aim for forms that feel automatic and sentence-ready.",
      watch: [
        "Escuchar is regular; do not confuse it with oír, which is much more irregular.",
        "Vender and subir are a clean -er/-ir pair for checking endings.",
        "The gerunds are especially useful: escuchando, vendiendo, subiendo."
      ]
    },
    7: {
      lead: "Ayudar, responder, and decidir are excellent sentence-building verbs. They let you practise regular forms while thinking about real communication: helping, answering, and deciding.",
      watch: [
        "Ayudar is regular -ar, responder is regular -er, and decidir is regular -ir.",
        "Decidir has an accented preterite yo form and third-person form, just like other regular -ir verbs.",
        "Try to attach each form to a simple subject in your head: yo decido, nosotros respondemos, ellos ayudan."
      ]
    },
    8: {
      lead: "Esperar, correr, and asistir look simple, but they are worth learning carefully because their meanings are high-frequency. Esperar can mean to wait or to hope, and asistir usually means to attend.",
      watch: [
        "Do not translate asistir as 'assist' automatically; in most learner sentences it means 'attend'.",
        "Correr gives you a very clean -er pattern to compare with the -ar and -ir verbs.",
        "Esperar is especially useful in future-looking sentences, so the future forms are worth saying aloud."
      ]
    },
    9: {
      lead: "Viajar, sufrir, and acabar are mostly regular, but acabar is especially useful because acabar de plus an infinitive means 'to have just done something'. This week is still pattern practice, with a small phrase-building bonus.",
      watch: [
        "Viajar keeps the j in the stem; the selected forms stay regular.",
        "Sufrir is a regular -ir verb, so use it to strengthen the vivir/abrir/recibir pattern.",
        "Acabar de is a phrase worth remembering: acabo de llegar means 'I have just arrived'."
      ]
    },
    10: {
      lead: "Entrar, deber, and llevar are regular verbs with very useful meanings. They help you move from isolated conjugation into common expressions about entering, needing to do something, carrying, wearing, or taking.",
      watch: [
        "Deber plus an infinitive means 'must' or 'should', so it behaves like a helper verb.",
        "Llevar can mean carry, wear, or take, depending on context.",
        "Even with flexible meanings, the forms themselves are regular, so let the endings do the work."
      ]
    },
    11: {
      lead: "Limpiar, romper, and cumplir are the final regular-pattern consolidation week. Treat this as a check that you can now handle new regular verbs without needing them to be familiar first.",
      watch: [
        "Limpiar is a regular -ar verb despite the i in the stem.",
        "Romper is the -er anchor, and cumplir is the -ir anchor.",
        "If an answer feels hard, identify the infinitive ending first, then choose the matching family."
      ]
    },
    12: {
      lead: "Llamar, llamarse, and usar introduce a key contrast: a normal verb beside its reflexive form. Llamar means to call, while llamarse is used for names, as in 'me llamo'.",
      watch: [
        "The reflexive verb needs reflexive pronouns: me, te, se, nos, os, se.",
        "The verb ending still follows the regular -ar pattern; the extra challenge is the pronoun.",
        "Compare llamo and me llamo so you see what changes and what stays the same."
      ]
    },
    13: {
      lead: "Mirar, mirarse, and preparar continue the reflexive contrast. Mirar means to look at something; mirarse usually means to look at oneself, so the pronoun changes the meaning.",
      watch: [
        "Do not drop the reflexive pronoun from mirarse forms.",
        "Mirar and preparar are regular -ar verbs, so their endings should feel familiar.",
        "Use the reflexive forms to practise keeping pronouns and verb endings aligned."
      ]
    },
    14: {
      lead: "Caer, caerse, and traer are the first week where related-looking verbs bring real irregular forms. This is a good moment to slow down and notice exactly where the irregularity appears.",
      watch: [
        "Caer and traer both have irregular yo forms in the present: caigo and traigo.",
        "Caerse adds reflexive pronouns, so you must manage both the pronoun and the irregular verb form.",
        "In the preterite, watch for spelling and stem changes rather than assuming a regular -er pattern."
      ]
    },
    15: {
      lead: "Sentir, sentirse, and dormir introduce important -ir stem-changing verbs. These verbs are common, useful, and slightly trickier because the stem can change before you even choose the ending.",
      watch: [
        "Sentir changes e to ie in many present-tense forms, and sentirse adds reflexive pronouns.",
        "Dormir changes o to ue in the present.",
        "In the preterite, third-person forms of these -ir stem changers can shift again, so check el/ella and ellos carefully."
      ]
    },
    16: {
      lead: "Poner, ponerse, and salir focus on irregular yo forms and useful everyday meanings. These verbs are worth learning early because they appear in many practical expressions.",
      watch: [
        "The present yo forms are pongo and salgo.",
        "Ponerse is reflexive, so include the pronouns as well as the irregular verb form.",
        "The future stems are irregular too: pondr- and saldr- before the future endings."
      ]
    },
    17: {
      lead: "Ir, irse, and volver are about movement: going, leaving, and returning. Ir is one of the most irregular verbs in Spanish, so this week is less about patterns and more about recognition.",
      watch: [
        "Ir has highly irregular present forms, so do not try to force a regular -ir pattern onto it.",
        "Irse is reflexive and usually means to leave or go away.",
        "Volver is stem-changing in the present and has the important past participle vuelto."
      ]
    },
    18: {
      lead: "Quedarse, estar, and ser bring together staying, states, and identity. This week is as much about meaning as form, because ser and estar divide work that English often gives to one verb: 'to be'.",
      watch: [
        "Ser is used for identity, origin, and defining characteristics; estar is used for states and location.",
        "Both ser and estar have irregular forms that need to be learned directly.",
        "Quedarse is reflexive and often means to stay or remain, so keep the pronoun attached to the idea."
      ]
    },
    19: {
      lead: "Gustar, parecer, and doler behave differently from ordinary subject-action verbs. Think of them as 'to be pleasing', 'to seem', and 'to hurt', where the thing causing the feeling often drives the verb form.",
      watch: [
        "Expect many forms to revolve around third-person singular and plural patterns: gusta/gustan, parece/parecen, duele/duelen.",
        "The person affected is usually shown with an indirect-object pronoun: me, te, le, nos, os, les.",
        "Doler also has a stem change, so watch the stem as well as the pronoun logic."
      ]
    },
    20: {
      lead: "Pagar, tocar, and buscar are regular in most ways, but they protect pronunciation in the preterite yo form. This week teaches you that spelling changes can preserve a sound rather than signal a whole new pattern.",
      watch: [
        "The yo preterite forms are pagué, toqué, and busqué.",
        "Those spelling changes keep the hard g, hard c, and hard qu sounds.",
        "Outside that spelling issue, the verbs mostly behave like normal -ar verbs."
      ]
    },
    21: {
      lead: "Comenzar, empezar, and pensar introduce e to ie stem-changing verbs. The endings are familiar, but the stem changes in stressed present-tense forms.",
      watch: [
        "Think of the present-tense boot pattern: the stem changes in all forms except nosotros and vosotros.",
        "Comenzar and empezar also have a spelling change in the yo preterite: comencé and empecé.",
        "The future uses the full infinitive, so the stem change does not apply there."
      ]
    },
    22: {
      lead: "Contar, poder, and jugar continue stem-change work with o to ue and u to ue. These verbs are very common, so the goal is to make the changed stem feel normal rather than surprising.",
      watch: [
        "Contar and poder change o to ue in many present-tense forms.",
        "Jugar changes u to ue, which is less common but follows the same boot-pattern idea.",
        "Poder has important irregular preterite forms, so do not expect every tense to follow the present pattern."
      ]
    },
    23: {
      lead: "Perder, querer, and cerrar give you more e to ie practice with three very useful verbs. This is a chance to build confidence with stem changers across different meanings.",
      watch: [
        "All three use e to ie in many present-tense forms.",
        "Querer is especially important and has irregular preterite forms, so treat it with extra care.",
        "The future forms are regular for perder and cerrar, but querer uses the irregular future stem querr-."
      ]
    },
    24: {
      lead: "Conocer, conducir, and traducir teach the -zco family and related irregular patterns. These verbs are common in real speech, especially conocer for knowing people or places.",
      watch: [
        "The present yo forms are conozco, conduzco, and traduzco.",
        "Conducir and traducir also have irregular preterite stems: conduj- and traduj-.",
        "Conocer is not the same as saber; it usually means to know or be familiar with a person, place, or thing."
      ]
    },
    25: {
      lead: "Leer, creer, and oír are vowel-heavy verbs, so spelling and accents matter. This week is excellent for training your eye as well as your memory.",
      watch: [
        "Past participles need written accents: leído, creído, oído.",
        "The preterite often introduces y sounds in third-person forms, such as leyó and creyó.",
        "Oír is more irregular than leer and creer, so give it extra attention."
      ]
    },
    26: {
      lead: "Tener, venir, and mantener are major irregular verbs and a related verb family. Once you learn tener and venir well, mantener becomes much easier because it carries many of the same patterns.",
      watch: [
        "The present yo forms are tengo, vengo, and mantengo.",
        "The preterite stems are tuv-, vin-, and mantuv-.",
        "The future stems are tendr-, vendr-, and mantendr- before the regular future endings."
      ]
    },
    27: {
      lead: "Saber, ver, and dar are short verbs, but they are not small in importance. Because the forms are compact, small spelling and accent details carry a lot of weight.",
      watch: [
        "Saber has the present yo form sé and an irregular preterite stem sup-.",
        "Ver and dar have very short preterite forms, so accents and exact spelling matter.",
        "Do not mistake short forms for easy forms; check each one deliberately."
      ]
    },
    28: {
      lead: "Hacer, decir, and pedir are high-frequency verbs with different kinds of irregularity. This week is about recognizing the particular personality of each verb rather than applying one rule to all three.",
      watch: [
        "Hacer and decir have irregular present yo forms: hago and digo.",
        "Hacer and decir also have irregular future stems: har- and dir-.",
        "Pedir is a stem-changing -ir verb, so watch present and preterite third-person forms."
      ]
    },
    29: {
      lead: "Haber, aparecer, and faltar deal with existence, appearance, and absence or need. These verbs often appear in sentence patterns that feel different from simple subject-action verbs.",
      watch: [
        "Haber is often used as an auxiliary or impersonally, so its meaning depends heavily on the structure around it.",
        "Aparecer belongs with verbs like conocer in the present yo form: aparezco.",
        "Faltar often works like gustar: me falta can mean 'I am missing' or 'I need'."
      ]
    },
    30: {
      lead: "Andar, construir, and elegir are a final mixed-pattern review. You have regular-looking forms, spelling changes, stem changes, and strong irregular preterite forms all in one week.",
      watch: [
        "Andar has the irregular preterite stem anduv-.",
        "Construir has y forms in places like construyo and construyó.",
        "Elegir changes e to i in some forms and has the present yo form elijo."
      ]
    }
  };

  WEEKS.forEach(challenge => {
    challenge.intro = INTRO_BY_WEEK[challenge.week] || null;
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
