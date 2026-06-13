from __future__ import annotations

import argparse
import importlib.util
import json
import re
import sys
import unicodedata
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DATA = ROOT / "verbs-data.json"
WORKBOOK_GENERATOR = ROOT / "scripts" / "generate_essential55_paper_workbook.py"


def load_generator_helpers():
    spec = importlib.util.spec_from_file_location("workbook_generator", WORKBOOK_GENERATOR)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Cannot load {WORKBOOK_GENERATOR}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def normalize(value: str | None) -> str:
    text = unicodedata.normalize("NFD", (value or "").lower())
    return "".join(ch for ch in text if unicodedata.category(ch) != "Mn")


def is_plain_regular(notes: list[str]) -> bool:
    joined = normalize(" ".join(notes))
    if any(word in joined for word in ("irregular", "double participle", "stem change", "spelling change")):
        return False
    first = normalize(notes[0] if notes else "")
    return bool(re.fullmatch(r"(reflexive )?regular -(ar|er|ir) verb", first))


def label_for_cell(cell_key: str) -> str:
    if cell_key == "h:gerund":
        return "gerund"
    if cell_key == "h:participle":
        return "participle"
    match = re.fullmatch(r"s:(\d+):(sg|pl):(\d+)", cell_key)
    if not match:
        return cell_key
    people = {
        ("sg", "0"): "yo",
        ("sg", "1"): "tu",
        ("sg", "2"): "el",
        ("pl", "0"): "nosotros",
        ("pl", "1"): "vosotros",
        ("pl", "2"): "ellos",
    }
    return f"tense {match.group(1)} {people.get((match.group(2), match.group(3)), cell_key)}"


def main() -> int:
    parser = argparse.ArgumentParser(description="Check plain-regular verb records against regular templates.")
    parser.add_argument("data_path", nargs="?", default=str(DEFAULT_DATA))
    args = parser.parse_args()

    data_path = Path(args.data_path)
    data = json.loads(data_path.read_text(encoding="utf-8"))
    helpers = load_generator_helpers()
    verbs_by_infinitive = {helpers.normalize(verb["infinitive"]): verb for verb in data}

    regular_mismatches: list[str] = []
    pattern_ending_mismatches: list[str] = []
    malformed_participles: list[str] = []

    for verb in data:
        notes = [helpers.clean_text(item) for item in (verb.get("pattern_notes") or []) if helpers.clean_text(item)]
        note_text = normalize(" ".join(notes))
        parts = helpers.split_infinitive(verb["infinitive"])
        mentioned_regular_endings = set(re.findall(r"\bregular\s+-(ar|er|ir)\b", note_text))
        if parts["ending"] and mentioned_regular_endings and parts["ending"] not in mentioned_regular_endings:
            pattern_ending_mismatches.append(
                f"{verb['infinitive']}: infinitive is -{parts['ending']} but notes say "
                f"{', '.join('-' + ending for ending in sorted(mentioned_regular_endings))}"
            )

        participle = helpers.clean_text(verb.get("past_participle"))
        if ("(" in participle or ")" in participle) and verb.get("infinitive") != "su(b)scribir":
            malformed_participles.append(f"{verb['infinitive']}: {participle}")

        if not is_plain_regular(notes):
            continue

        actual = helpers.canonical_cell_map(verb)
        regular = helpers.regular_expected_map(verb, verbs_by_infinitive)
        for cell_key, actual_value in actual.items():
            regular_value = regular.get(cell_key, "")
            if helpers.forms_differ(actual_value, regular_value):
                regular_mismatches.append(
                    f"{verb['infinitive']} {label_for_cell(cell_key)}: "
                    f"{actual_value!r} should be {regular_value!r}"
                )

    if regular_mismatches:
        print("Plain-regular verbs with non-regular stored forms:")
        print("\n".join(f"- {line}" for line in regular_mismatches))
    if pattern_ending_mismatches:
        print("Pattern notes with the wrong regular ending:")
        print("\n".join(f"- {line}" for line in pattern_ending_mismatches))
    if malformed_participles:
        print("Participle answer fields containing explanatory parentheses:")
        print("\n".join(f"- {line}" for line in malformed_participles))

    if regular_mismatches or pattern_ending_mismatches or malformed_participles:
        return 1

    print(
        f"OK: {data_path} has no plain-regular mismatches, wrong regular-ending notes, "
        "or malformed participle answer fields."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
