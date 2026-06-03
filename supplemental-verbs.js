(function (root, factory) {
  const data = factory();
  if (typeof module === "object" && module.exports) module.exports = data;
  if (root) root.SUPPLEMENTAL_VERBS = data;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  return [
    {
      id: 502,
      display_id: "E55",
      source_tag: "supplemental_essential55",
      infinitive: "gustar",
      meaning_en: "to be pleasing (to), to like",
      gerund: "gustando",
      past_participle: "gustado",
      pattern_notes: [
        "Regular -ar verb",
        "Defective/impersonal-style Essential 55 verb: commonly used in third person singular or plural"
      ],
      simple: {
        "1 presente de indicativo": {
          singular: ["", "", "gusta"],
          plural: ["", "", "gustan"]
        },
        "2 imperfecto de indicativo": {
          singular: ["", "", "gustaba"],
          plural: ["", "", "gustaban"]
        },
        "3 pret\u00e9rito": {
          singular: ["", "", "gust\u00f3"],
          plural: ["", "", "gustaron"]
        },
        "4 futuro": {
          singular: ["", "", "gustar\u00e1"],
          plural: ["", "", "gustar\u00e1n"]
        },
        "5 potencial simple": {
          singular: ["", "", "gustar\u00eda"],
          plural: ["", "", "gustar\u00edan"]
        },
        "6 presente de subjuntivo": {
          singular: ["", "", "guste"],
          plural: ["", "", "gusten"]
        },
        "7 imperfecto de subjuntivo": {
          singular: ["", "", "gustara / gustase"],
          plural: ["", "", "gustaran / gustasen"]
        }
      },
      compound: {
        "8 perfecto de indicativo": {
          singular: ["", "", "ha gustado"],
          plural: ["", "", "han gustado"]
        },
        "9 pluscuamperfecto de indicativo": {
          singular: ["", "", "hab\u00eda gustado"],
          plural: ["", "", "hab\u00edan gustado"]
        },
        "10 pret\u00e9rito anterior": {
          singular: ["", "", "hubo gustado"],
          plural: ["", "", "hubieron gustado"]
        },
        "11 futuro perfecto": {
          singular: ["", "", "habr\u00e1 gustado"],
          plural: ["", "", "habr\u00e1n gustado"]
        },
        "12 potencial compuesto": {
          singular: ["", "", "habr\u00eda gustado"],
          plural: ["", "", "habr\u00edan gustado"]
        },
        "13 perfecto de subjuntivo": {
          singular: ["", "", "haya gustado"],
          plural: ["", "", "hayan gustado"]
        },
        "14 pluscuamperfecto de subjuntivo": {
          singular: ["", "", "hubiera / hubiese gustado"],
          plural: ["", "", "hubieran / hubiesen gustado"]
        }
      },
      imperative: ["-", "-", "guste gusten"],
      extras: {
        related: [
          "Gustar usually agrees with the thing liked: Me gusta el cafe; Me gustan los dulces.",
          "The person who likes something is usually expressed with an indirect object pronoun: me, te, le, nos, os, les.",
          "Book source: Essential 55, Defective and Impersonal Verbs section."
        ],
        syn: [
          "agradar to be pleasing",
          "placer to please"
        ],
        ant: [
          "desagradar to be unpleasant",
          "disgustar to displease, to annoy"
        ]
      }
    }
  ];
});
