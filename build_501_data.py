from __future__ import annotations

import json
import re
import unicodedata
from pathlib import Path


ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / "501 Spanish Verbs.txt"
OUTPUT_JS = ROOT / "verbs-data.js"
OUTPUT_JSON = ROOT / "verbs-data.json"

START_LINE = 3791
END_LINE = 125839

ENTRY_RE = re.compile(r"^(?P<verb>.+?) \((?P<id>\d{1,3})\)\s*$")
HEADING_RE = re.compile(r"^(?P<num>\d{1,2})\s+(?P<label>.+)$")

COMPOUND_AUXILIARIES = {
    8: {1: ("he", "hemos"), 2: ("has", "habéis"), 3: ("ha", "han")},
    9: {1: ("había", "habíamos"), 2: ("habías", "habíais"), 3: ("había", "habían")},
    10: {1: ("hube", "hubimos"), 2: ("hubiste", "hubisteis"), 3: ("hubo", "hubieron")},
    11: {1: ("habré", "habremos"), 2: ("habrás", "habréis"), 3: ("habrá", "habrán")},
    12: {1: ("habría", "habríamos"), 2: ("habrías", "habríais"), 3: ("habría", "habrían")},
    13: {1: ("haya", "hayamos"), 2: ("hayas", "hayáis"), 3: ("haya", "hayan")},
    14: {
        1: ("hubiera / hubiese", "hubiéramos / hubiésemos"),
        2: ("hubieras / hubieses", "hubierais / hubieseis"),
        3: ("hubiera / hubiese", "hubieran / hubiesen"),
    },
}

SINGULAR_ENDINGS = {
    1: {1: ["o", "oy", "go"], 2: ["s"], 3: ["a", "e"]},
    2: {1: ["aba", "ia"], 2: ["abas", "ias"], 3: ["aba", "ia"]},
    3: {1: ["e", "i"], 2: ["aste", "iste"], 3: ["o", "io"]},
    4: {1: ["e"], 2: ["as"], 3: ["a"]},
    5: {1: ["ia"], 2: ["ias"], 3: ["ia"]},
    6: {1: ["e", "a"], 2: ["es", "as"], 3: ["e", "a"]},
    7: {1: ["ra", "se"], 2: ["ras", "ses"], 3: ["ra", "se"]},
}

PLURAL_ENDINGS = {
    1: {1: ["mos"], 2: ["ais", "eis", "is"], 3: ["n"]},
    2: {1: ["bamos", "iamos"], 2: ["bais", "iais"], 3: ["ban", "ian"]},
    3: {1: ["amos", "imos"], 2: ["asteis", "isteis"], 3: ["aron", "ieron"]},
    4: {1: ["emos"], 2: ["eis"], 3: ["an"]},
    5: {1: ["iamos"], 2: ["iais"], 3: ["ian"]},
    6: {1: ["emos", "amos"], 2: ["eis", "ais"], 3: ["en", "an"]},
    7: {1: ["ramos", "semos"], 2: ["rais", "seis"], 3: ["ran", "sen"]},
}

EDITORIAL_MARKER_RE = re.compile(
    r"^(?:"
    r"AN ESSENTIAL|"
    r"Can[’']t find the verb you[’']re looking for\?|"
    r"Mirar/Mirarse|"
    r"Sentences using mirar and mirarse|"
    r"Words and expressions related to these verbs|"
    r"Proverbs|"
    r"Present Perfect \(or Perfect\) Indicative|"
    r"Pluperfect \(or Past Perfect\) Indicative|"
    r"Preterit Perfect \(or Past Anterior\)|"
    r"Future Perfect \(or Future Anterior\)|"
    r"Conditional Perfect|"
    r"Present Perfect \(or Past\) Subjunctive|"
    r"Pluperfect \(or Past Perfect\) Subjunctive|"
    r"\(\w\)\s+.+|"
    r"\d+\.\s+.+|"
    r"\d+\s+Verb"
    r")$",
    re.IGNORECASE,
)


def normalize(text: str) -> str:
    return "".join(
        ch
        for ch in unicodedata.normalize("NFD", text.lower())
        if unicodedata.category(ch) != "Mn"
    )


def compact(text: str) -> str:
    return re.sub(r"\s+", " ", text.replace("\u00ad", "")).strip()


def get_window() -> list[str]:
    lines = SOURCE.read_text(encoding="utf-8", errors="replace").splitlines()
    return lines[START_LINE - 1 : END_LINE]


def is_entry_start(window: list[str], idx: int) -> bool:
    line = window[idx].strip()
    if ":" in line.split("(")[0]:
        return False
    match = ENTRY_RE.match(line)
    if not match:
        return False
    if " " in match.group("verb").strip():
        return False
    num = int(match.group("id"))
    if not (1 <= num <= 501):
        return False
    lookahead = window[idx : min(len(window), idx + 260)]
    near = window[idx : min(len(window), idx + 20)]
    return (
        any(line.startswith("Part. pas. ") or line.startswith("Gerundio ") for line in near)
        and "The Seven Simple Tenses" in lookahead
        and "The Seven Compound Tenses" in lookahead
        and "imperativo" in lookahead
    )


def entry_spans(window: list[str]) -> list[tuple[int, int]]:
    starts = [i for i in range(len(window)) if is_entry_start(window, i)]
    spans = []
    for pos, start in enumerate(starts):
        end = starts[pos + 1] if pos + 1 < len(starts) else len(window)
        spans.append((start, end))
    return spans


def split_reflexive_line(line: str, person: int) -> tuple[str, str] | None:
    plural_pronoun = {1: "nos", 2: "os", 3: "se"}[person]
    tokens = line.split()
    indexes = [i for i, token in enumerate(tokens) if normalize(token) == plural_pronoun]
    if not indexes:
        return None
    cut = indexes[1] if person == 3 and len(indexes) > 1 else indexes[0]
    if cut <= 0:
        return None
    return compact(" ".join(tokens[:cut])), compact(" ".join(tokens[cut:]))


def last_word(tokens: list[str]) -> str:
    for token in reversed(tokens):
        if token != "/":
            return normalize(token)
    return ""


def score_split(left: list[str], right: list[str], tense_num: int, person: int) -> int:
    if not left or not right:
        return -10_000
    score = 0
    if left[-1] == "/" or right[0] == "/":
        score -= 200
    if left.count("/") != right.count("/"):
        score -= 40
    left_last = last_word(left)
    right_last = last_word(right)
    singular_targets = SINGULAR_ENDINGS.get(tense_num, {}).get(person, [])
    plural_targets = PLURAL_ENDINGS.get(tense_num, {}).get(person, [])
    if any(right_last.endswith(end) for end in plural_targets):
        score += 120
    if any(left_last.endswith(end) for end in singular_targets):
        score += 60
    if any(left_last.endswith(end) for end in plural_targets):
        score -= 30
    if any(right_last.endswith(end) for end in singular_targets):
        score -= 15
    score -= abs((len(left) - len(right))) * 3
    return score


def split_simple_line(line: str, tense_num: int, person: int) -> tuple[str, str]:
    tokens = line.split()
    best: tuple[int, tuple[str, str]] | None = None
    for cut in range(1, len(tokens)):
        left = tokens[:cut]
        right = tokens[cut:]
        score = score_split(left, right, tense_num, person)
        pair = (compact(" ".join(left)), compact(" ".join(right)))
        if best is None or score > best[0]:
            best = (score, pair)
    if best is None:
        return line, ""
    return best[1]


def split_form_line(line: str, tense_num: int, person: int, reflexive: bool) -> tuple[str, str]:
    line = compact(line)
    if reflexive:
        reflexive_pair = split_reflexive_line(line, person)
        if reflexive_pair:
            return reflexive_pair
    return split_simple_line(line, tense_num, person)


def expand_tense_body(lines: list[str], tense_num: int) -> list[str]:
    body: list[str] = []
    for raw in lines:
        text = raw.replace("\u00ad", "").strip()
        if not text:
            continue
        if compact(text) == "Singular Plural":
            continue
        parts = [compact(part) for part in text.split("\t") if compact(part)]
        if tense_num < 8 and len(parts) == 3:
            body.append(parts[0])
            body.append(f"{parts[1]} {parts[2]}")
            continue
        body.append(compact(text))
    return body


def parse_tense_lines(lines: list[str], tense_num: int, reflexive: bool) -> dict[str, list[str]]:
    body = expand_tense_body(lines, tense_num)
    if "OR" in body:
        split_at = body.index("OR")
        primary = [line for line in body[:split_at] if line != "OR"]
        alternate = [line for line in body[split_at + 1 :] if line != "OR"]
        base_s, base_p, alt_s, alt_p = [], [], [], []
        for person, line in enumerate(primary[:3], start=1):
            singular, plural = split_form_line(line, tense_num, person, reflexive)
            base_s.append(singular)
            base_p.append(plural)
        for person, line in enumerate(alternate[:3], start=1):
            singular, plural = split_form_line(line, tense_num, person, reflexive)
            alt_s.append(singular)
            alt_p.append(plural)
        while len(base_s) < 3:
            base_s.append("")
            base_p.append("")
        while len(alt_s) < 3:
            alt_s.append("")
            alt_p.append("")
        singular = [f"{base_s[i]} / {alt_s[i]}".strip(" /") for i in range(3)]
        plural = [f"{base_p[i]} / {alt_p[i]}".strip(" /") for i in range(3)]
        return {"singular": singular, "plural": plural}

    singular, plural = [], []
    for person, line in enumerate(body[:3], start=1):
        left, right = split_form_line(line, tense_num, person, reflexive)
        singular.append(left)
        plural.append(right)
    return {"singular": singular, "plural": plural}


def parse_section(lines: list[str], reflexive: bool, tense_nums: set[int]) -> dict[str, dict[str, list[str]]]:
    result: dict[str, dict[str, list[str]]] = {}
    headings = []
    for idx, line in enumerate(lines):
        match = HEADING_RE.match(compact(line))
        if match and int(match.group("num")) in tense_nums:
            headings.append((idx, int(match.group("num")), match.group("label")))
    for pos, (start_idx, num, label) in enumerate(headings):
        end_idx = headings[pos + 1][0] if pos + 1 < len(headings) else len(lines)
        section_lines = lines[start_idx + 1 : end_idx]
        result[f"{num} {compact(label)}"] = parse_tense_lines(section_lines, num, reflexive)
    return result


def build_compound_section(past_participle: str, reflexive: bool) -> dict[str, dict[str, list[str]]]:
    labels = {
        8: "perfecto de indicativo",
        9: "pluscuamperfecto de indicativo",
        10: "pretérito anterior",
        11: "futuro perfecto",
        12: "potencial compuesto",
        13: "perfecto de subjuntivo",
        14: "pluscuamperfecto de subjuntivo",
    }
    reflexive_sg = {1: "me", 2: "te", 3: "se"}
    reflexive_pl = {1: "nos", 2: "os", 3: "se"}
    participle = re.split(r"\s+\(", past_participle, 1)[0].strip()
    out: dict[str, dict[str, list[str]]] = {}
    for tense_num, people in COMPOUND_AUXILIARIES.items():
        singular, plural = [], []
        for person in (1, 2, 3):
            sg_aux, pl_aux = people[person]
            if reflexive:
                singular.append(f"{reflexive_sg[person]} {sg_aux} {participle}".strip())
                plural.append(f"{reflexive_pl[person]} {pl_aux} {participle}".strip())
            else:
                singular.append(f"{sg_aux} {participle}".strip())
                plural.append(f"{pl_aux} {participle}".strip())
        out[f"{tense_num} {labels[tense_num]}"] = {"singular": singular, "plural": plural}
    return out


def parse_header(lines: list[str]) -> tuple[str, str, list[str], str]:
    header = [compact(line) for line in lines if compact(line)]
    gerund = ""
    past = ""
    notes: list[str] = []
    meaning_start = next((idx for idx, line in enumerate(header) if line.startswith("to ")), None)
    body = header if meaning_start is None else header[:meaning_start]
    meaning = "" if meaning_start is None else " ".join(header[meaning_start:])

    for line in body:
        if line.startswith("Gerundio "):
            gerund = line.removeprefix("Gerundio ").strip()
        elif line.startswith("Part. pas. "):
            past = line.removeprefix("Part. pas. ").strip()
        else:
            notes.append(line)

    return gerund, past, notes, meaning


def split_syn_ant_line(line: str) -> tuple[list[str], list[str]]:
    syn_match = re.search(r"(?:^|\s)Syn\.\:\s*(.*?)(?=\s+Ant\.\:|$)", line, re.IGNORECASE)
    ant_match = re.search(r"(?:^|\s)Ant\.\:\s*(.*)$", line, re.IGNORECASE)
    syn = [part.strip() for part in (syn_match.group(1).split(";") if syn_match else []) if part.strip()]
    ant = [part.strip() for part in (ant_match.group(1).split(";") if ant_match else []) if part.strip()]
    return syn, ant


def is_editorial_marker(line: str) -> bool:
    return bool(EDITORIAL_MARKER_RE.match(compact(line)))


def parse_imperative_and_extras(lines: list[str]) -> tuple[list[str], dict[str, list[str]]]:
    cleaned = [compact(line) for line in lines if compact(line)]
    imperative = cleaned[:3]
    extras = {"syn": [], "ant": [], "related": []}

    for line in cleaned[3:]:
        if is_editorial_marker(line):
            break
        if re.search(r"(?:^|\s)(?:Syn|Ant)\.\:", line, re.IGNORECASE):
            syn, ant = split_syn_ant_line(line)
            extras["syn"].extend(syn)
            extras["ant"].extend(ant)
            break
        extras["related"].append(line)

    return imperative, extras


def parse_block(block_lines: list[str]) -> dict:
    first = compact(block_lines[0])
    match = ENTRY_RE.match(first)
    assert match, first

    infinitive = match.group("verb").strip()
    verb_id = int(match.group("id"))
    reflexive = infinitive.endswith("se")

    simple_idx = block_lines.index("The Seven Simple Tenses")
    compound_idx = block_lines.index("The Seven Compound Tenses")
    imperative_idx = block_lines.index("imperativo")

    header_lines = block_lines[1:simple_idx]
    gerund, past, notes, meaning = parse_header(header_lines)

    simple = parse_section(block_lines[simple_idx:compound_idx], reflexive, set(range(1, 8)))
    compound = build_compound_section(past, reflexive)
    imperative, extras = parse_imperative_and_extras(block_lines[imperative_idx + 1 :])

    return {
        "id": verb_id,
        "infinitive": infinitive,
        "meaning_en": meaning,
        "gerund": gerund,
        "past_participle": past,
        "pattern_notes": notes,
        "simple": simple,
        "compound": compound,
        "imperative": imperative,
        "extras": extras,
    }


def build() -> list[dict]:
    window = get_window()
    spans = entry_spans(window)
    data = [parse_block(window[start:end]) for start, end in spans]
    if len(data) != 501:
        raise RuntimeError(f"Expected 501 entries, found {len(data)}")
    if data[0]["id"] != 1 or data[-1]["id"] != 501:
        raise RuntimeError("Unexpected first/last ids")
    return data


def main() -> None:
    data = build()
    OUTPUT_JSON.write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    OUTPUT_JS.write_text(
        "window.VERB_DATA = " + json.dumps(data, ensure_ascii=True) + ";\n",
        encoding="utf-8",
    )
    print(f"Wrote {OUTPUT_JSON} with {len(data)} entries")
    print(f"Wrote {OUTPUT_JS} with {len(data)} entries")


if __name__ == "__main__":
    main()
