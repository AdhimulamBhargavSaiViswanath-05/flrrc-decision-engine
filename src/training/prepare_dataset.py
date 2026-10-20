"""Dataset preparation.

v1.3: convert_to_chatml()      -> data/training/chatml.jsonl      (kept unchanged for reference)
v1.4: convert_to_chatml_v14()  -> data/training/chatml-v1.4.jsonl (new file, never overwrites v1.3)

Run v1.4 from the repo root:
    python3 -m src.training.prepare_dataset                    # gold samples only
    python3 -m src.training.prepare_dataset --include-drafts   # gold + reviewed-or-not drafts (for a dry run)
"""
import argparse
import json
import os
import re

# ---------------------------------------------------------------- v1.3 (unchanged)

def convert_to_chatml(input_path="data/samples/dataset_100.jsonl", output_path="data/training/chatml.jsonl"):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    with open(input_path) as fin, open(output_path, "w") as fout:
        for line in fin:
            data = json.loads(line)
            # FLRRC Prompt format
            chat = {
                "messages": [
                    {"role": "system", "content": "You are FLRRC Decision Engine. Given Question + Profile, output 5 boxes: Fact, Logic, Reasoning, Conclusion, Next Action with Equation and Risk."},
                    {"role": "user", "content": f"Question: {data.get('question','')} Profile: {json.dumps(data.get('profile',{}))}"},
                    {"role": "assistant", "content": json.dumps(data, indent=2)}
                ]
            }
            fout.write(json.dumps(chat) + "\n")

    print(f"✅ Converted {input_path} -> {output_path}")

# ---------------------------------------------------------------- v1.4

# inference.py must use EXACTLY this system prompt + user format when the v1.4 adapter is used.
SYSTEM_PROMPT_V14 = (
    "You are FLRRC Decision Engine. Given a Question, output 5 boxes as JSON: "
    "box_1_flrrc, box_2_equation, box_3_graph, box_4_risk, box_5_next_action."
)

# Later files override earlier ones with the same sample_id, so gold_v1.4.jsonl (normalized,
# math-checked gold 1-5) replaces the original rows 1-5 of dataset_100.jsonl without editing it.
DEFAULT_INPUTS = [
    "data/samples/dataset_100.jsonl",
    "data/samples/gold_v1.4.jsonl",
    "data/samples/drafts_v1.4.jsonl",
    "data/samples/drafts_v1.4_b.jsonl",
    "data/samples/drafts_v1.4_c.jsonl",
]
DEFAULT_OUTPUT = "data/training/chatml-v1.4.jsonl"

BOX1_REQUIRED = ["fact", "logic", "reasoning", "representation", "conclusion"]
BOX2_REQUIRED = ["formula", "go_score", "nogo_score", "regret_probability"]
BOX4_REQUIRED = ["best", "worst", "middle"]
FILLER_PREFIX = "Question about"  # marker of the auto-generated template samples


def is_filler(row):
    fact = (row.get("box_1_flrrc") or {}).get("fact", "")
    return isinstance(fact, str) and fact.startswith(FILLER_PREFIX)


def merge_profile_into_question(row):
    """The user only types a question at inference time, so any profile details
    must live inside the question text (no separate Profile field)."""
    q = (row.get("question") or "").strip()
    profile = row.get("user_profile_ref") or row.get("profile")
    if isinstance(profile, dict) and profile:
        parts = []
        for k, v in profile.items():
            v = "yes" if v is True else "no" if v is False else v
            parts.append(f"{k.replace('_', ' ')}: {v}")
        q = f"{q} ({', '.join(parts)})"
    return q


def _nonempty(v):
    return isinstance(v, str) and v.strip() != ""


def validate(row, sid):
    """Return a list of problems. Empty list = valid."""
    errs = []
    if not _nonempty(row.get("question")):
        errs.append("question missing")

    b1 = row.get("box_1_flrrc")
    if not isinstance(b1, dict):
        errs.append("box_1_flrrc missing/not dict")
    else:
        errs += [f"box_1_flrrc.{k} empty" for k in BOX1_REQUIRED if not _nonempty(b1.get(k))]

    b2 = row.get("box_2_equation")
    if not isinstance(b2, dict):
        errs.append("box_2_equation missing/not dict")
    else:
        # Fixed schema: the UI reads go_score / nogo_score, so every sample must use these keys.
        errs += [f"box_2_equation.{k} empty" for k in BOX2_REQUIRED if not _nonempty(b2.get(k))]
        for k in ("go_score", "nogo_score"):
            if _nonempty(b2.get(k)) and not re.search(r"=\s*-?\d+(?:\.\d+)?\s*/\s*10\s*$", b2[k].strip()):
                errs.append(f"box_2_equation.{k} must end with '= <number>/10'")

    if not _nonempty(row.get("box_3_graph")):
        errs.append("box_3_graph empty")

    b4 = row.get("box_4_risk")
    if not isinstance(b4, dict):
        errs.append("box_4_risk missing/not dict")
    else:
        errs += [f"box_4_risk.{k} empty" for k in BOX4_REQUIRED if not _nonempty(b4.get(k))]

    if not _nonempty(row.get("box_5_next_action")):
        errs.append("box_5_next_action empty")
    return errs


_EXPR = re.compile(r"^[0-9.+\-*()\s]+$")


def arithmetic_warnings(row):
    """Check 'X = (a*b)+(c*d)-(e*f) = t1+t2-t3 = total/10' lines. Warnings only."""
    out = []
    b2 = row.get("box_2_equation") or {}
    for k, v in b2.items():
        if not (k.endswith("score") and isinstance(v, str)):
            continue
        parts = [p.strip() for p in v.split("=")]
        if len(parts) < 3:
            continue
        try:
            total = float(re.match(r"-?\d+(?:\.\d+)?", parts[-1]).group(0))
            for expr in parts[1:-1]:
                if _EXPR.match(expr) and abs(eval(expr) - total) > 0.06:  # noqa: S307 (charset checked)
                    out.append(f"{k}: '{expr}' != {total}")
        except Exception:
            out.append(f"{k}: could not parse '{v[:50]}'")
    return out


def build_messages(row):
    target = {
        "box_1_flrrc": row["box_1_flrrc"],
        "box_2_equation": row["box_2_equation"],
        "box_3_graph": row["box_3_graph"],
        "box_4_risk": row["box_4_risk"],
        "box_5_next_action": row["box_5_next_action"],
    }
    return [
        {"role": "system", "content": SYSTEM_PROMPT_V14},
        {"role": "user", "content": f"Question: {merge_profile_into_question(row)}"},
        {"role": "assistant", "content": json.dumps(target, ensure_ascii=False)},
    ]


def load_rows(paths):
    rows = []
    for p in paths:
        if not os.path.exists(p):
            print(f"  (skip, not found) {p}")
            continue
        with open(p) as f:
            for i, line in enumerate(f, 1):
                line = line.strip()
                if line:
                    r = json.loads(line)
                    r["_src"] = f"{os.path.basename(p)}:{i}"
                    rows.append(r)
    return rows


def convert_to_chatml_v14(inputs=None, output_path=DEFAULT_OUTPUT, include_drafts=False, keep_filler=False):
    raw_rows = load_rows(inputs or DEFAULT_INPUTS)
    # later files override earlier rows with the same sample_id (keeps original position)
    by_id, rows, overridden = {}, [], 0
    for r in raw_rows:
        sid = r.get("sample_id")
        if sid is not None and sid in by_id:
            rows[by_id[sid]] = r
            overridden += 1
        else:
            if sid is not None:
                by_id[sid] = len(rows)
            rows.append(r)
    kept, skipped_filler, skipped_draft, bad = [], 0, 0, []

    for r in rows:
        sid = r.get("sample_id", r["_src"])
        if r.get("status") == "draft" and not include_drafts:
            skipped_draft += 1
            continue
        if is_filler(r) and not keep_filler:
            skipped_filler += 1
            continue
        errs = validate(r, sid)
        if errs:
            bad.append((sid, errs))
            continue
        kept.append(r)

    if bad:
        for sid, errs in bad:
            print(f"❌ sample {sid}: {'; '.join(errs)}")
        raise SystemExit(f"{len(bad)} invalid sample(s). Fix them, nothing was written.")

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w") as fout:
        for r in kept:
            fout.write(json.dumps({"messages": build_messages(r)}, ensure_ascii=False) + "\n")

    print(f"Read {len(rows)} rows ({overridden} overridden by later files) | "
          f"skipped template filler: {skipped_filler} | skipped drafts: {skipped_draft}")
    print(f"✅ Wrote {len(kept)} samples -> {output_path} (v1.3 chatml.jsonl untouched)")

    for r in kept:
        for w in arithmetic_warnings(r):
            print(f"⚠️  sample {r.get('sample_id', r['_src'])}: arithmetic {w}")

    shapes = {}
    for r in kept:
        key = tuple(sorted(k for k in r["box_2_equation"] if k.endswith("score") or k.startswith("regret")))
        shapes.setdefault(key, []).append(r.get("sample_id", r["_src"]))
    if len(shapes) > 1:
        print("⚠️  box_2_equation key sets are NOT consistent (model learns a fuzzy schema):")
        for key, ids in shapes.items():
            print(f"    {list(key)} -> samples {ids}")
    return kept


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--inputs", nargs="+", default=None)
    ap.add_argument("--output", default=DEFAULT_OUTPUT)
    ap.add_argument("--include-drafts", action="store_true", help="include rows with status=draft")
    ap.add_argument("--keep-filler", action="store_true", help="keep the 'Question about ...' template samples")
    a = ap.parse_args()
    convert_to_chatml_v14(a.inputs, a.output, a.include_drafts, a.keep_filler)
