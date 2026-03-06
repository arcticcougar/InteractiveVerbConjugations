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

const CORE_NOTES_OVERRIDES_BASE = {
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
  },
  7: {
    related: [
      "Los amigos de mi hermano me aburren. - My brother's friends bore me.",
      "aburrido, aburrida - bored; una cara de aburrimiento - a bored look",
      "el aburrimiento - boredom, weariness; la aburrición - annoyance, ennui",
      "un aburridor, una aburridora - boring person; ¡Qué aburrimiento! - What a bore!",
      "See also aburrirse."
    ],
    syn: [
      "cansar - to tire (172)"
    ],
    ant: [
      "divertir - to entertain (370)"
    ]
  },
  8: {
    related: [
      "Aquí tienes mi teléfono celular. Puedes entretenerte con una aplicación para no aburrirte. - Here's my cell phone. You can keep yourself amused with an app so you won't be bored.",
      "el aburrimiento - boredom, weariness; aburrirse como una ostra - to be bored stiff",
      "aburridamente - tediously",
      "Me aburro como una ostra. - I'm bored stiff.",
      "See also aburrir."
    ],
    syn: [
      "cansarse - to become tired"
    ],
    ant: [
      "divertirse - to enjoy oneself"
    ]
  },
  9: {
    related: [
      "acabar de + infinitive - to have just + past participle",
      "María acaba de llegar. - Mary has just arrived.",
      "Acabo de comer. - I have just eaten.",
      "Acabamos de terminar la lección. - We have just finished the lesson.",
      "María acababa de llegar. - Mary had just arrived.",
      "Yo acababa de comer. - I had just eaten.",
      "Acabábamos de terminar la lección. - We had just finished the lesson.",
      "el acabamiento - completion; acabado, acabada - finished",
      "acabar con - to put an end to; acabar en - to end in; acabar por - to end by, to finally...",
      "Acabábamos de entrar cuando el teléfono sonó. - We had just entered the house when the telephone rang."
    ]
  },
  10: {
    related: [
      "No aceleres cuando el semáforo cambia a rojo. ¡Es muy peligroso! - Do not accelerate when the traffic light changes to red. It is very dangerous!",
      "aceleradamente - hastily, quickly, speedily; el acelerante, el acelerador - accelerant",
      "la aceleración - haste, acceleration; el aceleramiento - acceleration",
      "el acelerador de partícula - particle accelerator; el pedal del acelerador - accelerator pedal"
    ],
    syn: [
      "apresurarse - to hasten, hurry"
    ],
    ant: [
      "detener - to stop, detain",
      "retardar - to slow down (199)"
    ]
  },
  11: {
    related: [
      "aceptable - acceptable; aceptar + infinitive - to agree + infinitive",
      "el aceptador, la aceptadora - acceptor; aceptar empleo - to take a job",
      "el aceptante - accepter; acepto, acepta - acceptable",
      "la aceptación - acceptance; aceptar o rechazar una oferta - to accept or reject an offer",
      "la acepción - meaning (of a word)"
    ],
    syn: [
      "aprobar - to approve"
    ],
    ant: [
      "negar - to deny, refuse",
      "rechazar - to reject (81)"
    ]
  },
  12: {
    pattern_notes: ["Regular -ar verb endings with spelling change: c becomes qu before e"],
    related: [
      "acerca de - about, regarding; de cerca - close at hand, closely",
      "el acercamiento - approach, approximation; acerca de esto - hereof, about this",
      "cerca de - near; mis parientes cercanos - my close relatives",
      "See also acercarse."
    ],
    syn: [
      "aproximar - to bring close (107)",
      "traer - to bring"
    ],
    ant: [
      "alejar - to move away from (86)"
    ]
  },
  13: {
    pattern_notes: ["Reflexive regular -ar verb endings with spelling change: c becomes qu before e"],
    related: [
      "cerca de - near; cercano, cercana - near, close",
      "de cerca - close at hand, closely; cercar - to enclose, to fence in",
      "cercanamente - soon, shortly; las cercanías - neighborhood, suburbs",
      "See also acercar."
    ],
    ant: [
      "alejarse (de) - to get away from (86, 289)"
    ]
  },
  14: {
    pattern_notes: ["Regular -ar verb endings with stem change: Tenses 1, 6, Imperative"],
    related: [
      "acertado, acertada - proper, fit, sensible; el acertijo - riddle",
      "el acertador, la acertadora - good guesser; acertadamente - opportunely, correctly",
      "acertar a + infinitive - to happen to + infinitive; ciertamente - certainly",
      "acertar con - to come across, to find; Es cierto. - It's certain."
    ],
    ant: [
      "equivocarse - to make a mistake",
      "errar - to err"
    ]
  },
  15: {
    related: [
      "aclamado, aclamada - acclaimed; aclamable - laudable",
      "la aclamación - acclaim, acclamation; por aclamación - unanimously",
      "la reclamación - claim, demand; reclamar - to claim, to demand, to reclaim",
      "reclamar en juicio - to sue; reclamar por daños - to claim damages"
    ],
    syn: [
      "aplaudir - to applaud"
    ],
    ant: [
      "abuchear - to boo (175)"
    ]
  },
  16: {
    related: [
      "una aclaración - explanation; ¡Claro que sí! - Of course!",
      "aclarado, aclarada - cleared, made clear, rinsed; ¡Claro que no! - Of course not!",
      "aclarar la voz - to clear one's throat; ¿Está claro? - Is that clear?",
      "poner en claro - to clarify"
    ],
    syn: [
      "esclarecer - to make clear (344)",
      "explicar - to explain"
    ],
    ant: [
      "complicar - to complicate (76)"
    ]
  },
  17: {
    related: [
      "el acompañador, la acompañadora - companion, chaperon, accompanist",
      "el acompañamiento - accompaniment",
      "el acompañado, la acompañada - assistant",
      "un compañero, una compañera - friend, mate, companion",
      "compañero de cuarto - roommate"
    ],
    ant: [
      "abandonar - to abandon (473)"
    ]
  },
  18: {
    related: [
      "el aconsejador, la aconsejadora - adviser, counselor; aconsejarse - to seek advice",
      "aconsejar con - to consult; aconsejarse de - to consult with",
      "el consejo - advice, counsel; el aconsejamiento - counseling",
      "El tiempo da buen consejo. - Time will tell.",
      "mal aconsejado, mal aconsejada - ill-advised"
    ],
    syn: [
      "recomendar - to recommend",
      "sugerir - to suggest"
    ],
    ant: [
      "desaconsejar - to advise against (18)"
    ]
  },
  19: {
    pattern_notes: ["Regular -ar verb endings with stem change: Tenses 1, 6, Imperative"],
    related: [
      "la acordada - decision, resolution; desacordar - to put out of tune",
      "acordadamente - jointly, by common consent; desacordado, desacordada - out of tune",
      "un acuerdo - agreement; estar de acuerdo con - to be in agreement with",
      "de acuerdo - in agreement; de común acuerdo - unanimously, by mutual agreement",
      "See also acordarse."
    ],
    syn: [
      "estar de acuerdo con - to be in agreement with"
    ],
    ant: [
      "desacordar - to put out of tune"
    ]
  },
  20: {
    pattern_notes: ["Reflexive regular -ar verb endings with stem change: Tenses 1, 6, Imperative"],
    related: [
      "si mal no me acuerdo - if I remember correctly",
      "Lo siento, pero no me acuerdo de su nombre. - I'm sorry, but I don't remember your name.",
      "See also acordar."
    ],
    syn: [
      "recordar - to remember",
      "rememorar - to remember (32)"
    ],
    ant: [
      "olvidar - to forget"
    ]
  },
  21: {
    pattern_notes: ["Reflexive regular -ar verb endings with stem change: Tenses 1, 6, Imperative"],
    related: [
      "Todas las noches me acuesto a las diez y mi hermanito se acuesta a las ocho. - Every night, I go to bed at ten and my little brother goes to bed at eight.",
      "el acostamiento - lying down; acostar - to put to bed",
      "acostado, acostada - in bed, lying down",
      "Note: Do not use acostar to express to accost; use abordar (54).",
      "acostarse con las gallinas - to go to bed very early"
    ],
    ant: [
      "levantarse - to get up"
    ]
  },
  22: {
    related: [
      "acostumbradamente - customarily; acostumbrado, acostumbrada - accustomed",
      "la costumbre - custom, habit; acostumbrarse a algo - to become accustomed to something",
      "de costumbre - customary, usual",
      "tener por costumbre - to be in the habit of"
    ],
    syn: [
      "soler - to be accustomed (Def. and Imp.)"
    ]
  },
  23: {
    related: [
      "un cuchillo - knife; acuchillado, acuchillada - knifed, slashed",
      "un cuchillo de monte - hunting knife; las mangas acuchilladas - slashed sleeves (fashion)",
      "un cuchillo de cocina - kitchen knife"
    ],
    syn: [
      "apuñalar - to stab (259)",
      "herir - to wound"
    ]
  },
  24: {
    related: [
      "acudir en socorro de - to go to help; acudir a un examen - to take an exam",
      "acudir con el remedio - to bring the remedy; acudir a alguien - to give help to someone",
      "acudir a los tribunales - to go to court; acudir en ayuda de alguien - to come to someone's rescue",
      "acudir a una cita - to keep an appointment"
    ],
    syn: [
      "asistir - to assist, attend",
      "auxiliar - to help (106)",
      "ayudar - to help",
      "socorrer - to help"
    ]
  },
  25: {
    related: [
      "Tenemos derecho de encontrarnos cara a cara con una persona que nos acusa de un crimen. - We have the right to face a person who accuses us of a crime.",
      "La propia conciencia acusa. - One's own conscience accuses.",
      "el acusado, la acusada - defendant, accused; acusar de robo - to accuse of robbery",
      "la acusación - accusation; acusar recibo de una cosa - to acknowledge receipt of something",
      "el acusador, la acusadora - accuser",
      "acusarse de un pecado - to confess a sin"
    ],
    syn: [
      "denunciar - to denounce"
    ],
    ant: [
      "absolver - to absolve",
      "defender - to defend",
      "perdonar - to pardon"
    ]
  },
  26: {
    related: [
      "el adelantamiento - advance, growth, increase, progress",
      "adelante - ahead, forward; ¡Adelante! - Come in! Go ahead!",
      "adelantar dinero - to advance money; un adelanto - advance payment",
      "en lo adelante - in the future; de aquí en adelante - henceforth; de hoy en adelante - from now on",
      "los adelantos tecnológicos - technological advances, progress",
      "See also adelantarse."
    ],
    syn: [
      "avanzar - to advance",
      "progresar - to progress (235)"
    ],
    ant: [
      "atrasar - to retard, to delay (2)",
      "retrasar - to delay, to postpone"
    ]
  },
  27: {
    related: [
      "adelantado, adelantada - bold, anticipated, fast (watch or clock)",
      "adelantadamente - in anticipation, beforehand",
      "más adelante - later on, farther on",
      "llevar adelante - to carry on, to go ahead",
      "See also adelantar."
    ],
    syn: [
      "avanzar - to advance"
    ],
    ant: [
      "retirarse - to move back, to withdraw (414, 64)",
      "retrasarse - to be delayed, to be late (415, 64)"
    ]
  },
  28: {
    related: [
      "un adivino, una adivina - prophet, fortune teller, guesser",
      "la adivinación - fortune telling; una adivinanza - prophecy, prediction, riddle",
      "¡Adivine quién soy! - Guess who I am!",
      "adivinar el pensamiento de alguien - to read a person's mind"
    ],
    syn: [
      "predecir - to predict",
      "pronosticar - to forecast, foretell (424)"
    ]
  },
  29: {
    related: [
      "el admirador, la admiradora - admirer; sentir admiración por alguien - to feel admiration for someone",
      "la admiración - admiration; hablar en tono admirativo - to speak in an admiring tone",
      "admirable - admirable; admirablemente - admirably",
      "admirativamente - admiringly, with admiration; causar admiración - to inspire admiration"
    ],
    ant: [
      "despreciar - to despise, to scorn (57)"
    ]
  },
  30: {
    related: [
      "la admisión - acceptance, admission; admitir una reclamación - to accept a claim",
      "admisible - admissible; el examen de admisión - entrance exam"
    ],
    syn: [
      "permitir - to permit"
    ],
    ant: [
      "rechazar - to reject (81)",
      "rehusar - to refuse (481)"
    ]
  },
  31: {
    related: [
      "El Congreso adoptó una nueva ley para proteger a los consumidores. - Congress adopted a new law to protect consumers.",
      "la adopción - adoption; adoptable - adoptable",
      "el adopcionismo - adoptionism; adoptado, adoptada - adopted"
    ],
    ant: [
      "abandonar - to abandon (473)"
    ]
  },
  32: {
    related: [
      "el adorador, la adoradora - adorer, worshipper; adorablemente - adorably, adoringly",
      "adorable - adorable; adorado, adorada - adored",
      "la adoración - adoration, worship, veneration"
    ],
    syn: [
      "amar - to love",
      "venerar - to venerate (409)"
    ],
    ant: [
      "despreciar - to despise (57)",
      "odiar - to hate (232)"
    ]
  },
  33: {
    related: [
      "el adquiridor, la adquiridora - acquirer; los bienes adquiridos - acquired wealth",
      "el, la adquirente - acquirer, purchaser; adquirible - obtainable",
      "la adquisición - acquisition, attainment; adquirir un hábito - to acquire a habit"
    ],
    syn: [
      "comprar - to buy",
      "obtener - to obtain",
      "recibir - to receive, get"
    ],
    ant: [
      "dar - to give",
      "perder - to lose"
    ]
  },
  34: {
    related: [
      "advertido, advertida - skillful, clever; después de repetidas advertencias - after repeated warnings",
      "la advertencia - warning, notice, foreword",
      "advertidamente - advisedly; hacer una advertencia a un niño - to correct a child's inappropriate behavior",
      "un advertimiento - notice, warning"
    ],
    syn: [
      "aconsejar - to advise",
      "avisar - to advise (340)"
    ]
  },
  35: {
    related: [
      "afeitar - to shave; una afeitadora - shaving machine, shaver",
      "un afeitado - a shave; la maquinilla (de afeitar) eléctrica - electric shaver, razor",
      "el afeite - cosmetic, makeup",
      "Esta mañana, me levanté, me afeité y me fui al trabajo. - This morning I got up, shaved, and went to work."
    ],
    syn: [
      "rasurarse - to shave (one's beard) (292)"
    ]
  },
  36: {
    related: [
      "Me agarré bien al paraguas, pero hacía demasiado viento. - I held onto my umbrella tightly, but it was too windy.",
      "el agarro - grasp; agarrarse a/de - to seize, to hold on",
      "la agarrada - quarrel, scrap; agarrarse una fiebre - to catch a fever"
    ],
    syn: [
      "asir - to seize, grasp",
      "coger - to seize, grasp (Spain: see note in coger)",
      "tomar - to take"
    ],
    ant: [
      "soltar - to let go (138)",
      "liberar - to release (409)"
    ]
  },
  37: {
    related: [
      "la agitación - agitation, excitement; agitarse - to fidget, to become agitated",
      "agitado, agitada - agitated, excited; un agitador, una agitadora - agitator, shaker"
    ],
    syn: [
      "mover - to move",
      "sacudir - to shake, jolt"
    ],
    ant: [
      "aquietar - to calm down (11)",
      "calmar - to calm (54)"
    ]
  },
  38: {
    related: [
      "agotador, agotadora - exhausting; agotable - exhaustible",
      "el agotamiento - exhaustion; agotado, agotada - exhausted, out of print, out of stock, sold out",
      "agotarse - to become exhausted"
    ],
    syn: [
      "cansar - to tire (172)",
      "gastar - to wear out, waste"
    ]
  },
  39: {
    related: [
      "agradable - pleasing, pleasant, agreeable; de su agrado - to one's liking",
      "agradablemente - agreeably, pleasantly; ser del agrado de uno - to be to one's taste",
      "el agrado - pleasure, liking; Es de mi agrado. - It's to my liking.",
      "desagradable - unpleasant, disagreeable"
    ],
    syn: [
      "gustar - to like (Def. and Imp.)",
      "satisfacer - to satisfy"
    ],
    ant: [
      "desagradar - to be unpleasant (39)"
    ]
  },
  40: {
    pattern_notes: ["Regular -er verb endings with spelling change: c becomes zc before a or o"],
    related: [
      "agradecido, agradecida - thankful, grateful; Yo le agradezco el regalo. - I am grateful for the gift.",
      "el agradecimiento - gratitude, gratefulness",
      "muy agradecido - much obliged; desagradecidamente - ungratefully"
    ],
    syn: [
      "dar las gracias a - to thank",
      "reconocer - to be grateful for"
    ],
    ant: [
      "desagradecer - to be ungrateful (40)"
    ]
  },
  41: {
    related: [
      "Un agujero negro se agranda al agarrar los objetos que pasan de cerca. - A black hole grows by grabbing objects that pass nearby.",
      "el agrandamiento - aggrandizement, increase; grande - great, big, large, grand, huge",
      "en grande - in a grand way; la grandeza - greatness, size",
      "grandemente - greatly"
    ],
    syn: [
      "añadir - to add",
      "crecer - to grow",
      "incrementar - to augment, increase (11)"
    ],
    ant: [
      "disminuir - to diminish (271)",
      "reducir - to reduce"
    ]
  },
  42: {
    related: [
      "agraviadamente - offensively; agravante - aggravating",
      "agraviador, agraviadora - insulting; una agravación, un agravamiento - aggravation",
      "el agravio - offense, wrongful injury"
    ],
    syn: [
      "empeorar - to make worse (409)"
    ],
    ant: [
      "mejorar - to improve"
    ]
  },
  43: {
    pattern_notes: ["Regular -ar verb endings with spelling change: g becomes gu before e"],
    related: [
      "agregarse a - to join; agregar dos a cinco - to add two to five",
      "un agregado comercial - commercial attaché",
      "desagregar - to disintegrate, to separate",
      "un agregado cultural, una agregada cultural - cultural attaché",
      "una agregación - aggregation"
    ],
    syn: [
      "añadir - to add",
      "colegir - to collect",
      "recoger - to gather, collect"
    ],
    ant: [
      "segregar - to segregate (421)",
      "sustraer - to subtract, to take away (477)"
    ]
  },
  44: {
    related: [
      "una agrupación, un agrupamiento - group, cluster; un grupo - group",
      "una agrupación coral - choral group",
      "agrupado, agrupada - grouped",
      "agruparse - to form a group"
    ],
    syn: [
      "unir - to unite, join"
    ],
    ant: [
      "separar - to separate, set apart"
    ]
  },
  45: {
    related: [
      "Aguardamos con inquietud los resultados de las elecciones presidenciales. - We are waiting anxiously for the results of the presidential elections.",
      "la aguardada - expecting, waiting; guardar silencio - to keep silent",
      "guardar - to guard, to watch over; ¡Dios guarde al Rey! - God save the King!"
    ],
    syn: [
      "esperar - to wait for, to hope"
    ]
  },
  46: {
    related: [
      "un ahorrador de tiempo - time saver; los ahorros - savings",
      "ahorrador, ahorradora - thrifty person; el ahorramiento - saving, economy"
    ],
    syn: [
      "economizar - to economize on (339)"
    ],
    ant: [
      "gastar - to waste",
      "despilfarrar - to squander, to waste (46)"
    ]
  },
  47: {
    pattern_notes: ["Regular -ar verb endings with spelling change: z becomes c before e"],
    related: [
      "Afortunadamente, la estropeada barca de remos alcanzó la orilla antes de hundirse. - Fortunately, the damaged rowboat reached the shore before sinking.",
      "el alcance - overtaking, reach; al alcance del oído - within earshot",
      "al alcance de - within reach of; alcanzable - attainable, reachable",
      "dar alcance a - to overtake; el alcanzador, la alcanzadora - pursuer"
    ],
    syn: [
      "conseguir - to attain",
      "lograr - to attain (29)",
      "obtener - to obtain"
    ],
    ant: [
      "perder - to lose"
    ]
  },
  48: {
    related: [
      "la alegría - joy, rejoicing, mirth; alegremente - gladly, cheerfully",
      "alegro - allegro; alegre - happy, joyful, merry, bright",
      "tener mucha alegría - to be very glad; alegrar la fiesta - to liven up the party",
      "¡Qué alegría! - What joy!; saltar de alegría - to jump for joy"
    ],
    syn: [
      "disfrutar - to enjoy",
      "divertirse - to have a good time",
      "gozar - to enjoy"
    ],
    ant: [
      "entristecerse - to become sad (345)"
    ]
  },
  49: {
    pattern_notes: ["Regular -ar verb endings with stem change: Tenses 1, 6, Imperative; spelling change: z becomes c before e"],
    related: [
      "Todos los días desayuno en casa, almuerzo en la escuela y ceno con mi familia. - Every day I breakfast at home, lunch at school, and have dinner with my family.",
      "el desayuno - breakfast; cenar - to have dinner, supper",
      "el almuerzo - lunch; una almorzada - handful",
      "la cena - dinner, supper; desayunarse - to have breakfast"
    ],
    syn: [
      "comer - to eat",
      "tomar el almuerzo - to have lunch"
    ]
  },
  50: {
    related: [
      "El verano pasado, alquilamos una cabaña en la playa, cerca de Cancún. - Last summer, we rented a hut at the beach, near Cancún.",
      "alquilable - rentable; desalquilarse - to become vacant, unrented",
      "SE ALQUILA - for rent; desalquilado, desalquilada - unrented, unlet, vacant",
      "ALQUILA - available"
    ],
    syn: [
      "arrendar - to rent (352)"
    ],
    ant: [
      "desalquilar - to vacate, to stop renting (50)"
    ]
  },
  51: {
    related: [
      "alumbrante - illuminating, enlightening",
      "el alumbramiento - lighting; el alumbrado fluorescente - fluorescent lighting",
      "el alumbrado indirecto - indirect lighting",
      "la lumbre - fire, light; calentarse a la lumbre - to warm oneself by the fire"
    ],
    syn: [
      "aclarar - to clarify",
      "iluminar - to illuminate (107)"
    ],
    ant: [
      "apagar - to extinguish"
    ]
  },
  52: {
    related: [
      "Mi tío se alumbró en la fiesta. Afortunadamente, él me había dado las llaves de su coche. - My uncle got tipsy at the party. Fortunately, he had given me his car keys.",
      "See also alumbrar."
    ],
    syn: [
      "alzar el codo - to drink to excess"
    ],
    ant: [
      "abstenerse del alcohol - to abstain from alcohol",
      "ser abstemio, abstemia - to be a teetotaler"
    ]
  },
  53: {
    pattern_notes: ["Regular -ar verb endings with spelling change: z becomes c before e"],
    related: [
      "alzar velas - to set the sails, to hoist sail; el alzo - robbery, theft",
      "alzar con - to run off with, to steal; alzar la mano - to threaten, to raise one's hand",
      "la alza - rise, rising; estar en alza - to be on the rise",
      "alzar la voz - to raise one's voice",
      "el alzamiento - raising, lifting; alzar el codo - to drink to excess"
    ],
    syn: [
      "subir - to go up, to rise",
      "elevar - to elevate (259)",
      "levantar - to lift"
    ],
    ant: [
      "bajar - to lower, descend"
    ]
  },
  54: {
    related: [
      "la amabilidad - amiability, kindness; amablemente - amiably, kindly",
      "amable - amiable, kind, affable; el amor - love; amante - lover",
      "Note: To say 'to love' in common usage, prefer querer or gustar. Amar is often used in poetic or religious contexts.",
      "También los pecadores aman a los que los aman. - Even sinners love those who love them. (Luke 6:32)"
    ],
    syn: [
      "adorar - to adore",
      "querer bien a - to love"
    ],
    ant: [
      "detestar - to detest (250)",
      "odiar - to hate (232)"
    ]
  },
  55: {
    related: [
      "la añadidura - increase, addition; de añadidura - extra, for good measure",
      "por añadidura - in addition, besides; añadido, añadida - added, additional"
    ],
    syn: [
      "adicionar - to add (54)",
      "agregar - to add, gather",
      "sumar - to add (54)"
    ],
    ant: [
      "sustraer - to subtract (477)"
    ]
  },
  56: {
    related: [
      "Andar is a very useful verb for beginning students. Pay attention to the spelling change in Tenses 3 and 7.",
      "¿Cómo andan los negocios? - How's business?",
      "Anda despacio que tengo prisa. - Make haste slowly.",
      "Amadís de Gaula fue un caballero andante de la Edad Media. - Amadis of Gaul was a knight-errant of the Middle Ages.",
      "¡Anda a pasear! - Take a walk!",
      "¡A Magdalena le gusta andar a caballo! Anda a caballo tres veces por semana. - Madeleine loves horseback riding. She rides a horse three times per week.",
      "andarse - to go away; las andanzas - events",
      "buena andanza - good fortune; mala andanza - bad fortune; a todo andar - at full speed",
      "desandar - to retrace one's steps; andante - errant; un caballero andante - knight-errant",
      "Anda con Dios. - Go with God.",
      "andar con cien ojos - to be cautious",
      "el andar - gait; andar a gatas - to crawl, to walk on all fours",
      "andar a caballo - to ride a horse",
      "Dime con quién andas y te diré quién eres. - Tell me who your friends are and I will tell you who you are.",
      "Poco a poco se anda lejos. - Little by little, one goes far."
    ],
    syn: [
      "caminar - to walk",
      "ir - to go",
      "marchar - to walk, march"
    ],
    ant: [
      "detenerse - to stop",
      "pararse - to stop"
    ]
  },
  57: {
    related: [
      "el, la anunciante - advertiser; el anuncio - advertisement, announcement",
      "la Anunciación - Annunciation; el cartel anunciador - billboard",
      "el anunciador, la anunciadora - advertiser, announcer; los anuncios por palabras - classified advertisements"
    ],
    syn: [
      "adivinar - to divine, to foretell",
      "predecir - to predict, to foretell",
      "proclamar - to proclaim"
    ],
    ant: [
      "callarse - to be silent"
    ]
  },
  58: {
    pattern_notes: ["Regular -ar verb endings with spelling change: g becomes gu before e"],
    related: [
      "el apagador, el extintor - fire extinguisher; el apagavelas - candle extinguisher, snuffer",
      "el apagón - blackout",
      "apagadizo, apagadiza - fire resistant",
      "apagar la computadora - to shut down the computer",
      "¡Apaga y vámonos! - Let's end this and go."
    ],
    syn: [
      "extinguir - to extinguish (193)"
    ],
    ant: [
      "encender - to light, to turn on"
    ]
  },
  59: {
    pattern_notes: ["Regular -er verb endings with spelling change: c becomes zc before a or o"],
    related: [
      "un aparecimiento - apparition; aparecerse entre sueños - to see someone in a dream",
      "un aparecido - ghost",
      "una aparición - apparition, appearance; parecer - to seem, to appear",
      "aparecerse en casa - to arrive home unexpectedly",
      "See also parecerse."
    ],
    syn: [
      "surgir - to arise, appear"
    ],
    ant: [
      "desaparecer - to disappear (59)"
    ]
  },
  60: {
    related: [
      "Al fin del espectáculo, el público aplaudió con entusiasmo. - At the end of the show, the audience applauded enthusiastically.",
      "el aplauso - applause; con el aplauso de - to the applause of",
      "el aplaudidor, la aplaudidora - applauder; una salva de aplausos - thunderous applause"
    ],
    syn: [
      "aclamar - to acclaim, applaud",
      "felicitar - to congratulate",
      "palmear - to clap hands (206)"
    ],
    ant: [
      "abuchear - to boo (175)"
    ]
  },
  61: {
    related: [
      "El príncipe Luis se apoderó del trono después de la abdicación de su padre Felipe V. - Prince Louis took the throne after the abdication of his father, Philip V.",
      "poder - to be able; apoderarse de algo - to take possession of something",
      "el poder - power; apoderado, apoderada - empowered",
      "el apoderado - proxy, representative; apoderar - to empower, to authorize"
    ],
    syn: [
      "apropiarse - to appropriate, take (106, 289)"
    ],
    ant: [
      "dar - to give"
    ]
  },
  62: {
    related: [
      "el aprecio - appreciation, esteem; preciar - to appraise, to estimate",
      "la apreciación - appreciation, estimation; el precio - price",
      "apreciable - appreciable, worthy",
      "no tener precio - to be priceless",
      "la apreciabilidad - appreciability; un precio fijo - set price, fixed price"
    ],
    syn: [
      "estimar - to estimate, esteem"
    ],
    ant: [
      "despreciar - to despise, scorn (57)"
    ]
  },
  63: {
    related: [
      "Aprender is an important verb to learn because it is regular and appears in many everyday expressions.",
      "En la clase de español estamos aprendiendo a hablar, a leer y a escribir en español. - In Spanish class we are learning to speak, read and write in Spanish.",
      "Machacando se aprende el oficio. - Practice makes perfect.",
      "Mi abuela aprendió a navegar en Internet. - My grandmother learned to surf the Internet.",
      "Estoy aprendiendo el diseño web para ser administrador de web. - I am learning web design to become a webmaster.",
      "el aprendizaje - apprenticeship; el aprendizaje en línea - online learning, e-learning",
      "el aprendiz, la aprendiza - apprentice",
      "aprender a + infinitive - to learn + infinitive",
      "aprender de memoria - to memorize",
      "aprender con - to study with",
      "desaprender - to unlearn",
      "aprendiz de todo, oficial de nada - Jack of all trades, master of none"
    ]
  },
  64: {
    related: [
      "Mateo se apresuró a la tienda de teléfonos celulares. - Matthew hurried to the cell phone store.",
      "apresurado, apresurada - hasty, quick; el apresuramiento - hastiness",
      "apresuradamente - hastily; apresurar - to accelerate, to rush",
      "la prisa - haste, hurry; tener prisa - to be in a hurry",
      "apresurarse a + infinitive - to hurry + infinitive"
    ],
    syn: [
      "acelerar - to accelerate, hasten",
      "tener prisa - to be in a hurry"
    ],
    ant: [
      "detenerse - to stop",
      "pararse - to stop"
    ]
  },
  65: {
    pattern_notes: ["Regular -ar verb endings with stem change: Tenses 1, 6, Imperative"],
    related: [
      "la aprobación - approbation, approval, consent; aprobado por mayoría - accepted by a majority",
      "la desaprobación - disapproval",
      "el aprobado - passing grade in an exam; comprobar - to verify, compare, check, prove",
      "aprobado, aprobada - accepted, admitted, approved, passed"
    ],
    syn: [
      "aceptar - to accept"
    ],
    ant: [
      "negar - to deny",
      "desaprobar - to disapprove (65)"
    ]
  },
  66: {
    pattern_notes: ["Regular -ar verb"],
    related: [
      "aprovechado, aprovechada - economical; aprovechar - to make use of",
      "aprovechable - available, profitable; aprovechar la ocasión - to take the opportunity",
      "aprovechamiento - use, utilization; aprovechón, aprovechona - opportunist",
      "aprovecharse de - to take advantage of, to abuse"
    ],
    syn: [
      "usar - to use",
      "utilizar - to utilize"
    ]
  },
  67: {
    related: [
      "No te apures. Me ocuparé de todo. - Don't worry. I'll take care of everything.",
      "apurar - to purify, to exhaust, to consume, to annoy, to tease",
      "apurar la paciencia de uno - to wear out someone's patience",
      "apurar todos los recursos - to exhaust every recourse; apurarse por poco - to worry over trivialities",
      "el apuro - difficulty, trouble; estar en un apuro - to be in a fix"
    ],
    syn: [
      "preocuparse - to worry, be concerned"
    ],
    ant: [
      "despreocuparse - to stop worrying (372)",
      "tranquilizarse - to calm down (339, 289)"
    ]
  },
  68: {
    pattern_notes: ["Regular -ar verb endings with spelling change: c becomes qu before e"],
    related: [
      "Si tu computadora se bloquea, apágala y arráncala de nuevo. - If your computer freezes up, shut it down and boot it up again.",
      "un arrancarraíces - tool to pull out roots; la arrancadura - extraction",
      "arrancar a - to snatch away from; el arranque - starter (engine)",
      "arrancar de raíz - to cut up, to pull out by the root",
      "arrancar la computadora - to turn on, boot up the computer"
    ],
    syn: [
      "desarraigar - to uproot (341)",
      "extirpar - to extirpate (332)",
      "extraer - to extract (477)"
    ],
    ant: [
      "apagar (un motor) - to shut down (an engine)"
    ]
  },
  69: {
    related: [
      "Es muy tarde. Arreglemos la factura y salgamos. - It's very late. Let's settle the bill and leave.",
      "arregladamente - regularly; arreglar una factura - to pay a bill",
      "arreglarse con - to settle with, to reach an agreement; con arreglo a - according to",
      "un reglamento - rule, regulation; un arreglo - agreement, solution",
      "arreglarse por las buenas - to settle a matter in a friendly way",
      "arreglado, arreglada - neat, orderly; arreglar una cuenta - to settle an account"
    ],
    syn: [
      "ajustar - to adjust (259)",
      "reparar - to repair"
    ],
    ant: [
      "desarreglar - to make untidy, disarrange (69)"
    ]
  },
  70: {
    related: [
      "Un buen competidor no arroja nunca la esponja. - A good competitor never throws in the towel.",
      "el arrojador, la arrojadora - thrower; arrojar la esponja - to throw in the towel",
      "arrojado, arrojada - fearless",
      "el arrojo - fearlessness"
    ],
    syn: [
      "echar - to throw, cast",
      "lanzar - to throw",
      "tirar - to pitch, to throw"
    ],
    ant: [
      "atrapar - to catch (332)",
      "coger - to catch"
    ]
  },
  71: {
    related: [
      "Cuando contestes una pregunta, primero piensa y luego articula claramente. - When you answer a question, first think and then articulate clearly.",
      "articuladamente - clearly, distinctly; el, la articulista - someone who writes articles",
      "la articulación - articulation, pronunciation; articular claramente - to articulate clearly"
    ],
    syn: [
      "pronunciar - to pronounce"
    ],
    ant: [
      "desarticular - to take apart (71)"
    ]
  },
  72: {
    related: [
      "el seguro - insurance; seguramente - surely, securely",
      "asegurable - insurable; ¡Ya puede usted asegurarlo! - You can be sure of it!",
      "el asegurado, la asegurada - insured person",
      "la seguridad - security, surety; tener por seguro - to be sure, confident"
    ],
    syn: [
      "afirmar - to affirm, assert (243)",
      "asegurarse - to make sure (64)",
      "certificar - to certify",
      "confirmar - to confirm (243)"
    ]
  },
  73: {
    pattern_notes: ["Irregular -ir verb in Tenses 1, 6, and Imperative"],
    related: [
      "Afortunadamente, el buen samaritano me asió del brazo para que no me cayera. - Fortunately, the Good Samaritan grabbed my arm so that I would not fall.",
      "asir de los cabellos - to grab by the hair; asirse - to quarrel with each other",
      "asirse a, asirse de - to take hold of, seize, grab",
      "asirse con - to grapple with; asir del brazo - to get hold of by the arm"
    ],
    syn: [
      "agarrar - to grasp",
      "coger - to seize, grasp (Spain: see note in coger)"
    ],
    ant: [
      "desasir - to undo (73)",
      "soltar - to let go (138)"
    ]
  },
  74: {
    related: [
      "asistir a - to attend, to be present at; la asistencia social - social welfare",
      "la asistencia - attendance, presence; la asistencia técnica - technical assistance, tech support",
      "Habríamos asistido a la boda si hubiéramos estado invitados. - We would have attended the wedding if we had been invited."
    ],
    syn: [
      "acudir - to attend"
    ],
    ant: [
      "faltar - to miss"
    ]
  },
  75: {
    related: [
      "asustado, asustada - frightened, scared; un susto - fright, scare",
      "asustadizo, asustadiza - easily frightened, shy; asustarse de + infinitive - to be afraid to + infinitive",
      "asustador, asustadora - frightening; asustarse por nada - to be frightened by the slightest thing",
      "asustar - to frighten, to scare",
      "Me asusto de pensarlo. - It frightens me to think about it."
    ],
    syn: [
      "espantarse - to be frightened (292)"
    ],
    ant: [
      "tranquilizarse - to calm down (339, 289)"
    ]
  },
  76: {
    pattern_notes: ["Regular -ar verb endings with spelling change: c becomes qu before e"],
    related: [
      "Cuando Francesca tiene una dificultad, ella ataca el problema valientemente. - When Francesca has trouble, she attacks the problem bravely.",
      "el ataque - attack; el, la atacante - attacker",
      "atacado, atacada - attacked; el atacador, la atacadora - aggressor",
      "un ataque al corazón - a heart attack"
    ],
    syn: [
      "asaltar - to assault, attack (427)"
    ],
    ant: [
      "defender - to defend",
      "proteger - to protect"
    ]
  },
  77: {
    related: [
      "mantener - to maintain; atenerse al convenio - to abide by the agreement",
      "atenerse a - to depend on, rely on; atenerse a las reglas - to abide by the rules"
    ],
    syn: [
      "amoldarse - to adapt oneself, to conform (289)",
      "obedecer - to obey"
    ]
  },
  78: {
    related: [
      "la atracción - attraction; atracción sexual - sex appeal",
      "las atracciones - entertainment; atrayentemente - attractively",
      "atrayente - appealing, attractive; atractivo, atractiva - attractive",
      "el parque de atracciones - amusement park",
      "atraer las miradas - to attract attention"
    ],
    syn: [
      "encantar - to enchant (Def. and Imp.)",
      "seducir - to seduce (381)"
    ],
    ant: [
      "rechazar - to repel (81)",
      "repulsar - to repulse (2)"
    ]
  },
  79: {
    pattern_notes: ["Regular -ar verb endings with stem change: Tenses 1, 6, Imperative"],
    related: [
      "atravesar con - to run through, to pierce; atravesado, atravesada - cross-eyed, lying across",
      "travesar - to cross; atravesable - traversable",
      "atravesar la calle - to cross the street; a través de - across, through",
      "la travesía - crossing, voyage"
    ],
    syn: [
      "cruzar - to cross",
      "pasar - to go over"
    ]
  },
  80: {
    related: [
      "atrevido, atrevida - daring, bold; ¡Atrévete! - You just dare!",
      "el atrevimiento - audacity, boldness; Hazlo si te atreves. - Do it if you dare.",
      "atrevidamente - boldly, daringly; atreverse a + infinitive - to dare to + infinitive",
      "atreverse con, atreverse contra - to be insolent to, to be offensive toward"
    ],
    syn: [
      "osar - to dare, to venture"
    ],
    ant: [
      "acobardarse - to turn cowardly (39, 289)"
    ]
  },
  81: {
    pattern_notes: ["Regular -ar verb endings with spelling change: z becomes c before e"],
    related: [
      "¿Puede usted avanzarme un poco de dinero? - Could you advance me a little money?",
      "avanzado, avanzada - advanced; de edad avanzada - advanced in years",
      "la avanzada - advance guard; los avances tecnológicos - technological advances",
      "el avance - advance; el avanzo - balance sheet"
    ],
    syn: [
      "adelantar - to advance",
      "progresar - to progress (235)"
    ],
    ant: [
      "retrasar - to delay, to retard"
    ]
  },
  82: {
    pattern_notes: ["Regular -ar verb endings with spelling changes: z becomes c before e; gu becomes gü before e"],
    related: [
      "avergonzado, avergonzada - ashamed; avergonzarse - to be ashamed",
      "tener vergüenza - to be ashamed; la desvergüenza - shamelessness",
      "la vergüenza - shame, embarrassment; desvergonzado, desvergonzada - shameless, unashamed",
      "sin vergüenza - shameless"
    ],
    syn: [
      "humillar - to humiliate (261)"
    ]
  },
  83: {
    pattern_notes: ["Regular -ar verb endings with spelling change: gu becomes gü before e"],
    related: [
      "Antes de enviar un mensaje de texto, averiguo si hay faltas de ortografía. - Before sending a text, I check if there are spelling errors.",
      "el averiguador, la averiguadora - investigator; averiguable - investigable, verifiable",
      "la averiguación - inquiry, investigation; averiguadamente - surely, certainly"
    ],
    syn: [
      "inquirir - to inquire, investigate (33)",
      "investigar - to investigate (421)"
    ]
  },
  84: {
    related: [
      "la ayuda - aid, assistance, help; la ayuda financiera - financial aid",
      "el ayuda de cámara - valet; A quien madruga, Dios le ayuda. - The early bird catches the worm.",
      "un ayudador, una ayudadora - helper; ayudante - assistant",
      "¡Ayúdame! - Help me!",
      "el menú de ayuda - help menu"
    ],
    syn: [
      "asistir - to assist",
      "auxiliar - to help (106)",
      "proteger - to protect",
      "socorrer - to help"
    ],
    ant: [
      "abandonar - to abandon (473)",
      "impedir - to hinder, impede"
    ]
  },
  85: {
    related: [
      "Cuando el gato va a sus devociones, bailan los ratones. - When the cat is away, the mice will play.",
      "un bailarín, una bailarina - dancer (professional); un bailador, una bailadora - dancer",
      "la música bailable - danceable music",
      "un baile - dance; un bailete - ballet"
    ],
    syn: [
      "danzar - to dance (81)"
    ]
  },
  86: {
    related: [
      "la baja - reduction, fall in prices; rebajar - to reduce",
      "la bajada - descent; bajar de - to get off",
      "en voz baja - in a low voice; el piso bajo - ground floor",
      "bajar, bajarse el correo electrónico - to download e-mail; bajo - down, below",
      "¿En qué estación debo bajar? - At what station do I need to get off?"
    ],
    syn: [
      "descender - to descend (354)",
      "telecargar - to download (111)",
      "descargar - to download (111)"
    ],
    ant: [
      "levantar - to raise",
      "subir - to go up"
    ]
  },
  87: {
    related: [
      "Cuando vi al ladrón en mi casa, balbuceé: ¿Qué quieres aquí? - When I saw the burglar in my house, I stammered: What do you want here?",
      "balbuciente - stammering, stuttering",
      "el balbuceo, la balbucencia - stuttering, stammering"
    ],
    syn: [
      "balbucir - to stammer (386)",
      "tartamudear - to stammer (206)"
    ]
  },
  88: {
    related: [
      "Me baño antes de acostarme. Me ayuda a relajarme. - I take a bath before going to bed. It helps me relax.",
      "una bañera, una bañadera - bathtub; un baño de vapor - steam bath",
      "un bañador, una bañadora - bather; bañar a la luz - to light up, illuminate",
      "un baño - bath, bathing; bañar - to bathe"
    ],
    syn: [
      "ducharse - to take a shower",
      "lavarse - to wash oneself",
      "limpiarse - to clean oneself",
      "mojarse - to get wet"
    ],
    ant: [
      "ensuciarse - to get dirty (195)"
    ]
  },
  89: {
    related: [
      "Miguel, tráigame la escoba, barreremos la cocina antes de la fiesta. - Michael, bring me the broom, we'll sweep the kitchen before the party.",
      "la barredora de calle - street sweeper; la barredora eléctrica, la aspiradora - vacuum cleaner",
      "la barredura - sweeping"
    ],
    syn: [
      "cepillar - to brush",
      "limpiar - to clean"
    ]
  },
  90: {
    pattern_notes: ["Regular -ar verb endings with spelling change: z becomes c before e"],
    related: [
      "Un buque argentino fue bautizado Francisco en 2013 en honor al Papa Francisco. - An Argentine vessel was christened Francis in 2013 in honor of Pope Francis.",
      "el bautisterio - baptistery; el, la Bautista - Baptist",
      "el bautismo - baptism, christening; bautizar una calle - to name a street",
      "bautismal - baptismal"
    ],
    syn: [
      "cristianar - to baptize, to christen (249)"
    ]
  },
  91: {
    related: [
      "una bebida - drink, beverage; embebedor, embebedora - absorbent",
      "beber de - to drink from; beber como una esponja - to drink like a fish",
      "beber a la salud - to drink to health",
      "embeber - to soak in, soak up, imbibe",
      "embeberse en - to absorb oneself in, immerse oneself in"
    ],
    syn: [
      "tomar una bebida - to take a drink, to drink"
    ]
  },
  92: {
    pattern_notes: ["Irregular verb"],
    related: [
      "la bendición - benediction, blessing; el pan bendito - communion bread (blessed)",
      "las bendiciones nupciales - marriage blessings",
      "Dormí como un bendito. - I slept like a baby.",
      "See also maldecir."
    ],
    syn: [
      "consagrar - to consecrate (259)"
    ],
    ant: [
      "maldecir - to curse"
    ]
  },
  93: {
    related: [
      "Yo lo borré todo y recomencé el trabajo. - I erased everything and started the job again.",
      "la goma de borrar - eraser; desborrar - to clean off knots from cloth",
      "la borradura - erasure",
      "el borrador - eraser, rough draft; emborrar - to pad, to stuff, to wad, to gulp down food",
      "la tecla de borrado - delete key"
    ],
    syn: [
      "eliminar - to eliminate (107)",
      "obliterar - to erase, obliterate (227)",
      "suprimir - to delete, suppress"
    ]
  },
  94: {
    pattern_notes: ["Regular -ar verb endings with spelling change: z becomes c before e"],
    related: [
      "¡Qué película tan aburrida! Bostezamos de principio a fin. - What a boring movie! We yawned from beginning to end.",
      "un bostezo - yawn; bostezante - yawning, gaping"
    ],
    syn: [
      "aburrirse - to be bored"
    ]
  },
  95: {
    related: [
      "Al escuchar las buenas noticias, Alejandro botó de alegría. - Upon hearing the good news, Alexander jumped for joy.",
      "un bote - thrust, blow, jump, leap; la botadura - launching",
      "rebotar - to bend back, repel, bounce back, rebound",
      "un rebote - bounce, rebound; de rebote - indirectly"
    ],
    syn: [
      "lanzar - to throw, launch",
      "tirar - to throw"
    ]
  },
  96: {
    related: [
      "el bronce - bronze",
      "bronceado, bronceada - bronze-colored, sunburned, tanned",
      "broncearse - to tan, bronze oneself",
      "el bronceador - suntan lotion",
      "la bronceadura - bronzing",
      "bronquíneo, bronquínea - bronze"
    ],
    syn: [
      "tostarse - to tan, to turn brown",
      "tostar - to tan, toast"
    ],
    ant: [
      "palidecer - to turn pale (344)"
    ]
  },
  97: {
    pattern_notes: ["Irregular verb (Tenses 3 and 7)"],
    related: [
      "Me gusta la ciudad de Quito, en Ecuador; es un lugar que bulle de actividad. - I like the city of Quito, Ecuador; it's a place bustling with activity.",
      "el bullicio - noise, bustle; bullente - bubbling",
      "bulliciosamente - noisily; la bulla - bustle, noise, mob",
      "la ebullición - boiling; el punto de ebullición - boiling point",
      "un bullaje - noisy crowd"
    ],
    syn: [
      "burbujear - to bubble (54)",
      "hervir - to boil (370)"
    ]
  },
  98: {
    related: [
      "el burlador, la burladora - practical joker, jester; burlarse de alguien - to make fun of someone",
      "burlar a alguien - to deceive someone",
      "de burlas - for fun; hacer burla de - to make fun of",
      "la burlería - trick, mockery; una burla - jeer",
      "burlesco, burlesca - burlesque"
    ],
    syn: [
      "escarnecer - to ridicule (344)",
      "reírse - to laugh"
    ],
    ant: [
      "respetar - to respect (54)"
    ]
  },
  99: {
    pattern_notes: ["Regular -ar verb endings with spelling change: c becomes qu before e"],
    related: [
      "¿Qué busca Ud.? - What are you looking for?; la búsqueda - search",
      "Busco mis libros. - I'm looking for my books.; rebuscar - to search meticulously",
      "Busco a mi padre. - I'm looking for my father. Don't forget personal a before a person.",
      "el rebuscamiento - meticulous searching",
      "un buscador - search engine",
      "la busca, la buscada - research, search"
    ],
    syn: [
      "explorar - to explore (32)"
    ],
    ant: [
      "descubrir - to discover",
      "encontrar - to find",
      "hallar - to find",
      "perder - to lose"
    ]
  }
};

const CORE_NOTES_OVERRIDES = {
  ...CORE_NOTES_OVERRIDES_BASE,
  ...(window.CORE_NOTES_OVERRIDES || {})
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

  const EN_STOP_RE = /\b(to|the|and|or|for|with|from|my|your|his|her|our|their|all|any|one|two|three|what|when|where|who|how|i|we|you|he|she|they|is|are|was|were|have|has|had|will|would|should|can|could|do|does|did|not|long|work|cloud|photos?|price|prices|up|down)\b/i;
  const ES_HINT_RE = /[áéíóúñü¿¡]|\b(el|la|los|las|un|una|unos|unas|de|del|al|que|por|para|con|sin|se|yo|tú|usted|nosotros|vosotros|ellos|ellas|mi|mis|su|sus|qué|cómo|dónde)\b/i;

  const looksSpanishish = (text) => ES_HINT_RE.test(cleanText(text));
  const looksMostlyEnglish = (text) => EN_STOP_RE.test(cleanText(text));

  const shouldHighlightLeft = (left) => {
    const l = cleanText(left);
    if (!l) return false;
    if (looksMostlyEnglish(l) && !looksSpanishish(l)) return false;
    return true;
  };

  const splitDashSegments = (chunk) => {
    const parts = cleanText(chunk).split(/\s+-\s+/).map(cleanText).filter(Boolean);
    if (parts.length < 2) return [{ raw: cleanText(chunk) }];
    const out = [];
    if (parts.length % 2 === 0) {
      for (let i = 0; i < parts.length; i += 2) out.push({ es: parts[i], en: parts[i + 1] });
      return out;
    }
    out.push({ es: parts[0], en: parts[1] });
    out.push({ raw: parts.slice(2).join(" - ") });
    return out;
  };

  const splitEmbeddedTailPair = (pair) => {
    const en = cleanText(pair.en || "");
    const m = en.match(/^(.*?\bto\b.+?)\s+((?:el|la|los|las|un|una|unos|unas)\s+[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:\s+[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+){0,2})\s+([A-Za-z][A-Za-z'-]+(?:\s*\(\d+\))?)$/i);
    if (!m) return [pair];
    const firstEn = cleanText(m[1]);
    const es2 = cleanText(m[2]);
    const en2 = cleanText(m[3]);
    const out = [{ es: cleanText(pair.es), en: firstEn }];
    if (es2 && en2) out.push({ es: es2, en: en2 });
    return out;
  };

  const parseChunk = (chunk) => {
    const t = cleanText(chunk);
    if (!t) return [];

    if (/\s+-\s+/.test(t)) {
      const split = splitDashSegments(t);
      const out = [];
      split.forEach(part => {
        if (part.raw) {
          out.push(part);
          return;
        }
        splitEmbeddedTailPair(part).forEach(p => out.push(p));
      });
      return out;
    }

    // conservative fallback only for simple "X to Y" lines
    const toMatch = t.match(/^(.*?)\s+\bto\b\s+(.+)$/i);
    if (toMatch) {
      const es = cleanText(toMatch[1]);
      const en = `to ${cleanText(toMatch[2])}`;
      if (es && !looksMostlyEnglish(es)) return [{ es, en }];
    }

    return [{ raw: t }];
  };

  return `
    <div class="notesList">
      ${items.map(line => {
        const chunks = cleanText(line).split(/\s*;\s*/).map(cleanText).filter(Boolean);
        const parsed = chunks.flatMap(parseChunk);
        const rendered = parsed.map(part => {
          if (part.raw) return escapeHtml(part.raw);
          const es = cleanText(part.es || "");
          const en = cleanText(part.en || "");
          if (!es || !en) return escapeHtml([es, en].filter(Boolean).join(" - "));
          if (!shouldHighlightLeft(es)) return escapeHtml(`${es} - ${en}`);
          return `<span class="notesEsRelated">${escapeHtml(es)}</span> - ${escapeHtml(en)}`;
        }).join("; ");
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
