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
    href: "Essential55_Paper_Practice_Workbook.xlsx?v=paper-workbook-qc-1",
    title: "Download paper practice workbook",
    detail: "30 printable weekly sheets"
  };
  const WEEK_1_PRONUNCIATION_AUDIO = {
    type: "audio",
    src: "Essential55-Week1%20Verb%20Pronunciation.mp3",
    title: "Week 1 verb pronunciation"
  };
  const WEEKS = [
    { week: 1, verbs: ["hablar", "cantar", "estudiar"], focus: "First regular -ar endings" },
    { week: 2, verbs: ["comer", "aprender", "beber"], focus: "First regular -er endings" },
    { week: 3, verbs: ["vivir", "recibir", "subir"], focus: "First regular -ir endings" },
    { week: 4, verbs: ["trabajar", "comprender", "decidir"], focus: "Clean mixed -ar, -er, -ir practice" },
    { week: 5, verbs: ["comprar", "vender", "asistir"], focus: "Mixed regular endings in everyday verbs" },
    { week: 6, verbs: ["escuchar", "responder", "cumplir"], focus: "Regular speed and accuracy across endings" },
    { week: 7, verbs: ["necesitar", "correr", "escribir"], focus: "Mixed endings with escribir's irregular participle" },
    { week: 8, verbs: ["tomar", "deber", "abrir"], focus: "Mixed endings with abrir's irregular participle" },
    { week: 9, verbs: ["ayudar", "romper", "sufrir"], focus: "Mixed endings with romper's irregular participle" },
    { week: 10, verbs: ["esperar", "leer", "creer"], focus: "Useful verbs with vowel-heavy written forms" },
    { week: 11, verbs: ["viajar", "conocer", "construir"], focus: "Regular anchor plus -zco and y-spelling patterns" },
    { week: 12, verbs: ["acabar", "conducir", "traducir"], focus: "Acabar de plus conducir/traducir preterites" },
    { week: 13, verbs: ["entrar", "dormir", "salir"], focus: "Movement verbs with first stem and yo-form pressure" },
    { week: 14, verbs: ["llamar", "llamarse", "usar"], focus: "First reflexive/nonreflexive contrast" },
    { week: 15, verbs: ["mirar", "mirarse", "preparar"], focus: "Reflexive meaning contrast, kept manageable" },
    { week: 16, verbs: ["limpiar", "pagar", "buscar"], focus: "Preterite spelling changes with a regular anchor" },
    { week: 17, verbs: ["tocar", "comenzar", "empezar"], focus: "More preterite spelling changes and e to ie stems" },
    { week: 18, verbs: ["pensar", "contar", "jugar"], focus: "Present stem changes: e to ie, o to ue, u to ue" },
    { week: 19, verbs: ["perder", "querer", "cerrar"], focus: "More e to ie stem-changing practice" },
    { week: 20, verbs: ["sentir", "sentirse", "pedir"], focus: "-ir stem changers with reflexive practice" },
    { week: 21, verbs: ["caer", "caerse", "traer"], focus: "Related difficult forms: caigo, traigo" },
    { week: 22, verbs: ["poner", "ponerse", "volver"], focus: "Ponerse and volver with major irregular pieces" },
    { week: 23, verbs: ["ir", "irse", "andar"], focus: "Going, leaving, and the anduv- preterite" },
    { week: 24, verbs: ["llevar", "estar", "ser"], focus: "Useful expressions plus the two Spanish 'to be' verbs" },
    { week: 25, verbs: ["gustar", "parecer", "doler"], focus: "Indirect-object verbs: me gusta, me parece, me duele" },
    { week: 26, verbs: ["tener", "venir", "mantener"], focus: "Major irregulars and related verb families" },
    { week: 27, verbs: ["saber", "ver", "dar"], focus: "Short but important irregular verbs" },
    { week: 28, verbs: ["hacer", "decir", "haber"], focus: "High-frequency irregulars and haber as a helper verb" },
    { week: 29, verbs: ["quedarse", "aparecer", "faltar"], focus: "Staying, appearing, absence, and need" },
    { week: 30, verbs: ["poder", "elegir", "oir"], focus: "Final mixed-pattern week and consolidation" }
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
      lead: "This week asks you to prove that last week's patterns mostly transfer to new verbs. Cantar and aprender are regular, while escribir follows the regular -ir endings but has the irregular past participle escrito.",
      watch: [
        "Cantar follows hablar exactly; if a cantar form feels uncertain, mentally swap in hablar and then return to the new stem.",
        "Aprender and escribir reinforce the -er/-ir split: most finite forms match, but nosotros and vosotros tell the families apart.",
        "Escribir does not use the regular participle escribido; the form to learn is escrito.",
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
      lead: "Trabajar, beber, and abrir bring the three ending families back together. The finite endings are still friendly, but abrir has an important irregular past participle: abierto.",
      watch: [
        "Trabajar has a longer stem, but it is still just trabaj- plus regular -ar endings.",
        "Beber and abrir are useful for the -er/-ir contrast; compare bebo/bebemos with abro/abrimos.",
        "Abrir does not use the regular participle abrido; use abierto.",
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
      lead: "Limpiar, romper, and cumplir are mostly regular-pattern consolidation, with one important exception: romper has the irregular past participle roto.",
      watch: [
        "Limpiar is regular despite the i in the stem; do not let the spelling distract you from the -ar pattern.",
        "Romper keeps regular finite endings here, but its participle is roto, not rompido.",
        "Cumplir is your regular -ir anchor for this week.",
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

  const REVISED_INTRO_BY_WEEK = {
    1: {
      lead: "Welcome to the first pattern week. Hablar, cantar, and estudiar are all regular -ar verbs, so the aim is to make one family of endings feel calm, predictable, and usable before any other ending type gets involved.",
      watch: [
        "Use hablar as the model: hablo, hablas, habla, hablamos, habl\u00e1is, hablan. Cantar and estudiar copy that shape.",
        "In the preterite, the accent marks show who did the action: habl\u00e9 means I spoke, habl\u00f3 means he or she spoke.",
        "The future is built from the full infinitive plus endings: hablar\u00e9, cantar\u00e9, estudiar\u00e9."
      ]
    },
    2: {
      lead: "This week introduces the regular -er family on its own. Comer, aprender, and beber let you practise the new endings without also having to compare them with -ar and -ir at the same time.",
      watch: [
        "The present-tense pattern is como, comes, come, comemos, com\u00e9is, comen.",
        "The preterite endings use i sounds: com\u00ed, comiste, comi\u00f3, comimos, comisteis, comieron.",
        "Aprender and beber are regular, so any uncertainty should be solved by going back to comer as the model."
      ]
    },
    3: {
      lead: "Now you add the regular -ir family. Vivir, recibir, and subir keep the workload focused: learn where -ir matches -er, and notice the two places where it has its own identity.",
      watch: [
        "In the present, -ir looks like -er except nosotros and vosotros: vivimos and viv\u00eds, not comemos and com\u00e9is.",
        "In the preterite, regular -er and -ir verbs share the same endings, so vivir works like comer in that tense.",
        "The gerund and participle are regular: viviendo, recibido, subido."
      ]
    },
    4: {
      lead: "This is the first clean mixed week. Trabajar, comprender, and decidir bring -ar, -er, and -ir together, but the verbs themselves stay regular so you can compare the endings directly.",
      watch: [
        "Start every form by identifying the infinitive ending: trabajar is -ar, comprender is -er, decidir is -ir.",
        "Compare nosotros forms carefully: trabajamos, comprendemos, decidimos.",
        "The future tense is reassuring because all three keep the full infinitive before the same future endings."
      ]
    },
    5: {
      lead: "Comprar, vender, and asistir are everyday verbs that keep the mixed-ending practice going. The purpose is to make switching between the three regular families feel ordinary.",
      watch: [
        "Comprar is your -ar anchor, vender is your -er anchor, and asistir is your -ir anchor.",
        "Asistir usually means to attend, not to assist, so do not let the English lookalike distract you.",
        "Preterite accents still matter: compr\u00e9, vend\u00ed, asist\u00ed; compr\u00f3, vendi\u00f3, asisti\u00f3."
      ]
    },
    6: {
      lead: "Escuchar, responder, and cumplir are still regular, but this week is about speed and confidence. You should be able to choose the right ending family without long hesitation.",
      watch: [
        "Escuchar is regular -ar; do not confuse it with oir, which comes much later and is more irregular.",
        "Responder and cumplir are a useful -er/-ir contrast, especially in nosotros and vosotros.",
        "Cumplir is often used for completing duties, promises, ages, or requirements, so it is worth making automatic."
      ]
    },
    7: {
      lead: "Necesitar, correr, and escribir look mostly friendly, but escribir introduces the first important irregular past participle. This is a good moment to learn that a verb can be regular in many places and still have one form to highlight.",
      watch: [
        "Necesitar and correr are regular in the selected forms.",
        "Escribir follows regular -ir endings in the present, preterite, and future.",
        "The past participle is escrito, not escribido. Treat that as the special form of the week."
      ]
    },
    8: {
      lead: "Tomar, deber, and abrir continue the mixed pattern, with abrir adding another irregular participle. The lesson is to keep regular endings steady while giving special forms the attention they deserve.",
      watch: [
        "Tomar is regular -ar and deber is regular -er in the selected forms.",
        "Abrir has regular finite endings here: abro, abri, abrire.",
        "The past participle is abierto, not abrido."
      ]
    },
    9: {
      lead: "Ayudar, romper, and sufrir keep all three endings active and add roto as a high-value irregular participle. You are now building the habit of checking the participle instead of assuming every -er/-ir verb ends in -ido.",
      watch: [
        "Ayudar and sufrir follow their regular families in the selected forms.",
        "Romper uses regular finite endings here: rompo, rompi, rompere.",
        "The past participle is roto, not rompido."
      ]
    },
    10: {
      lead: "Esperar, leer, and creer begin a careful-writing section. Esperar is regular and useful, while leer and creer train your eye for vowel-heavy forms, accents, and written detail.",
      watch: [
        "Esperar can mean to wait, to hope, or to expect; context decides the best English translation.",
        "Leer and creer have accented participles: le\u00eddo and cre\u00eddo.",
        "In the preterite, third-person forms of leer and creer use y sounds: ley\u00f3/leyeron and crey\u00f3/creyeron."
      ]
    },
    11: {
      lead: "Viajar, conocer, and construir move from regular confidence into spelling-pattern awareness. Viajar is the anchor; conocer and construir show how one visible detail can mark a family of forms.",
      watch: [
        "Viajar keeps the j in the stem throughout these forms.",
        "Conocer has the present yo form conozco.",
        "Construir has y forms such as construyo, construy\u00f3, and construyeron, so watch its spelling carefully."
      ]
    },
    12: {
      lead: "Acabar, conducir, and traducir give you one useful expression and two related difficult verbs. Acabar de plus an infinitive means to have just done something; conducir and traducir share the -ducir family behavior.",
      watch: [
        "Acabo de llegar means I have just arrived; the conjugated acabar carries the time.",
        "Conducir and traducir have present yo forms conduzco and traduzco.",
        "Their preterites use conduj- and traduj-, with ellos forms condujeron and tradujeron."
      ]
    },
    13: {
      lead: "Entrar, dormir, and salir are movement and everyday-action verbs with a step up in difficulty. Entrar stays regular, while dormir and salir ask you to notice stem and yo-form changes.",
      watch: [
        "Dormir changes o to ue in the present: duermo, duermes, duerme.",
        "Dormir also shifts in the preterite third-person forms: durmi\u00f3 and durmieron.",
        "Salir has the present yo form salgo and the irregular future stem saldr-."
      ]
    },
    14: {
      lead: "Llamar, llamarse, and usar introduce the first major reflexive contrast. The endings remain familiar, but llamarse shows how a pronoun can change what the verb is doing.",
      watch: [
        "Llamar means to call; llamarse is used for names, as in me llamo.",
        "The reflexive pronouns are me, te, se, nos, os, se.",
        "Do not let the pronoun distract you from the regular -ar endings underneath."
      ]
    },
    15: {
      lead: "Mirar, mirarse, and preparar continue reflexive practice in a manageable setting. Mirar means to look at something; mirarse often means to look at oneself.",
      watch: [
        "Keep pronoun and subject aligned: me miro, te miras, se mira.",
        "Mirar and preparar are regular -ar verbs.",
        "The challenge is not the ending pattern; it is remembering when the reflexive pronoun belongs."
      ]
    },
    16: {
      lead: "Limpiar, pagar, and buscar start the spelling-change section. Limpiar is your regular anchor, while pagar and buscar show how Spanish spelling protects pronunciation in the yo preterite.",
      watch: [
        "Pagar changes to pagu\u00e9 in the yo preterite to keep the hard g sound.",
        "Buscar changes to busqu\u00e9 in the yo preterite to keep the k sound.",
        "Outside that yo preterite spelling issue, treat pagar and buscar as regular -ar verbs."
      ]
    },
    17: {
      lead: "Tocar, comenzar, and empezar continue preterite spelling changes and introduce more e to ie stem-changing practice. This is a week for separating spelling protection from true stem changes.",
      watch: [
        "Tocar becomes toqu\u00e9 in the yo preterite to keep the k sound.",
        "Comenzar and empezar change e to ie in the present: comienzo, empiezo.",
        "Their yo preterites are comenc\u00e9 and empec\u00e9, where the spelling changes before the e ending."
      ]
    },
    18: {
      lead: "Pensar, contar, and jugar give you three common present-tense stem-change types. The endings are familiar, but the stem itself moves in most present forms.",
      watch: [
        "Pensar changes e to ie: pienso, piensas, piensa.",
        "Contar changes o to ue: cuento, cuentas, cuenta.",
        "Jugar changes u to ue and has jugu\u00e9 in the yo preterite."
      ]
    },
    19: {
      lead: "Perder, querer, and cerrar give you more e to ie practice, with querer adding extra irregular weight. This week trains you to recognise family resemblance without assuming every verb behaves identically.",
      watch: [
        "All three change e to ie in the present: pierdo, quiero, cierro.",
        "Querer has an irregular preterite: quise, quiso, quisieron.",
        "Querer also uses the future stem querr-."
      ]
    },
    20: {
      lead: "Sentir, sentirse, and pedir are important -ir stem changers. This week also brings reflexive practice back, so you are watching both the stem and the pronoun.",
      watch: [
        "Sentir changes e to ie in the present and e to i in some preterite forms.",
        "Pedir changes e to i: pido, pidi\u00f3, pidieron.",
        "Sentirse adds reflexive pronouns to the same stem-changing behavior."
      ]
    },
    21: {
      lead: "Caer, caerse, and traer are related difficult verbs. They are short enough to look simple, but the spelling and irregular present yo forms deserve careful attention.",
      watch: [
        "Caer and traer have present yo forms caigo and traigo.",
        "Caerse adds reflexive pronouns: me caigo, te caes, se cae.",
        "Watch the preterite: caer gives cay\u00f3/cayeron, while traer gives trajo/trajeron."
      ]
    },
    22: {
      lead: "Poner, ponerse, and volver combine high-frequency meaning with memorable irregular forms. Ponerse also keeps the reflexive habit alive while volver adds a major participle.",
      watch: [
        "Poner has pongo in the present yo and pondr- in the future.",
        "Ponerse needs the reflexive pronoun: me pongo, se puso.",
        "Volver changes o to ue in the present and has the past participle vuelto."
      ]
    },
    23: {
      lead: "Ir, irse, and andar are a movement-heavy week. Ir is a memory verb, irse adds the idea of leaving, and andar brings the distinctive anduv- preterite.",
      watch: [
        "Ir has highly irregular present forms: voy, vas, va, vamos, vais, van.",
        "Irse means to leave or go away, so keep the reflexive pronoun.",
        "Andar has the preterite stem anduv-: anduve, anduvo, anduvieron."
      ]
    },
    24: {
      lead: "Llevar, estar, and ser mix one flexible regular verb with the two central Spanish 'to be' verbs. This is a meaning-heavy week, not just a form-heavy one.",
      watch: [
        "Llevar can mean to carry, to wear, or to take someone or something somewhere.",
        "Ser is used for identity, origin, and defining characteristics.",
        "Estar is used for states and location; its present yo form is estoy."
      ]
    },
    25: {
      lead: "Gustar, parecer, and doler behave differently from ordinary subject-action verbs. They are essential because they let you talk about likes, impressions, and pain in natural Spanish.",
      watch: [
        "The thing liked, seeming true, or hurting often controls the verb: me gusta el libro, me gustan los libros.",
        "Use indirect-object pronouns for the person affected: me, te, le, nos, os, les.",
        "Doler changes o to ue in the present: duele and duelen."
      ]
    },
    26: {
      lead: "Tener, venir, and mantener are major irregulars and a useful family study. Mantener is not random: it borrows heavily from tener, which helps you learn the pattern as a family.",
      watch: [
        "The present yo forms are tengo, vengo, and mantengo.",
        "The preterite stems are tuv-, vin-, and mantuv-.",
        "The future stems are tendr-, vendr-, and mantendr-."
      ]
    },
    27: {
      lead: "Saber, ver, and dar are short, high-frequency verbs where tiny details matter. Because the forms are compact, one missing accent or one extra letter can change the answer completely.",
      watch: [
        "Saber has the present yo form s\u00e9 and an irregular preterite stem sup-.",
        "Ver has veo in the present and vi/vio in the preterite.",
        "Dar has doy in the present and di/dio in the preterite; those short preterite forms do not use written accents."
      ]
    },
    28: {
      lead: "Hacer, decir, and haber are heavy-duty Spanish verbs. Hacer and decir carry many everyday meanings, while haber is vital for compound tenses and impersonal expressions.",
      watch: [
        "Hacer and decir have present yo forms hago and digo.",
        "Their preterites are distinctive: hice/hizo and dije/dijo.",
        "Haber is often auxiliary or impersonal: he hablado, hay una mesa."
      ]
    },
    29: {
      lead: "Quedarse, aparecer, and faltar are about staying, appearing, absence, and need. The forms matter, but the bigger lesson is how Spanish often builds meaning differently from English.",
      watch: [
        "Quedarse is reflexive, so include the pronoun: me quedo, se qued\u00f3.",
        "Aparecer belongs with conocer in the present yo form: aparezco.",
        "Faltar often works like gustar: me falta tiempo means I lack time or I need time."
      ]
    },
    30: {
      lead: "Poder, elegir, and oir make a strong final mixed week. You have a major irregular, an e to i verb with spelling pressure, and a vowel-heavy verb that rewards careful writing.",
      watch: [
        "Poder changes o to ue in the present and has pude/pudo in the preterite.",
        "Elegir changes e to i and has the present yo form elijo.",
        "Oir has forms such as oigo, oye, oy\u00f3, and oyeron, so listen and write carefully."
      ]
    }
  };

  const COURSE_INTROS = {
    ...INTRO_BY_WEEK,
    ...REVISED_INTRO_BY_WEEK
  };

  WEEKS.forEach(challenge => {
    const intro = COURSE_INTROS[challenge.week] || null;
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

  function forWeek(week, value) {
    const challenge = byWeek(week);
    if (!challenge) return null;
    const schedule = scheduleForDate(value || new Date());
    if (!schedule) return applySchedule(challenge);
    return applySchedule(challenge, {
      ...schedule,
      week: challenge.week,
      absoluteWeek: ((schedule.pass || 1) - 1) * WEEKS.length + challenge.week
    });
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
    forWeek,
    label,
    sameSet,
    sameTenses,
    tenseCycleForKeys,
    matchingChallenge
  };
});
