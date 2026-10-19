# FLRRC Decision Engine v1.3

> Not a Chatbot. A Decision Calculator.

Converts human confusion ("College ki vellala vadda?") into mathematical clarity.

[![Model](https://img.shields.io/badge/Model-TinyLlama%201.1B-blue)](https://huggingface.co/TinyLlama/TinyLlama-1.1B-Chat-v1.0)
[![Adapter](https://img.shields.io/badge/Adapter-FLRRC%20v1.3%20LoRA-green)](https://huggingface.co/bhargavsai2005/flrrc-v1.3-lora)

## What is FLRRC?

- F - Fact
- L - Logic
- R - Reasoning
- R - Representation (Equation + Graph)
- C - Conclusion

## Why different from ChatGPT?

- ChatGPT = Goldfish Memory (Rental Brain)
- FLRRC = Permanent Memory (Own Brain via `user_profile.json`)

## Output Format

Every decision gives 5 Boxes:

1. FLRRC Breakdown
2. Equation + Probability
3. Graph
4. Risk & Alternatives
5. Next Action

## Architecture

```text
User Question (Telugu / English) + user_profile.json
    |
    v
Rule-based engine (src/engine.py)         -> equation + graph (works today)
    |
TinyLlama-1.1B-Chat + LoRA adapter (~12 MB) -> LLM brain (v1.3, experimental)
    |
    v
5 Boxes + Math Proof + Graph
```

- **Base model:** `TinyLlama/TinyLlama-1.1B-Chat-v1.0`
- **Adapter:** [`bhargavsai2005/flrrc-v1.3-lora`](https://huggingface.co/bhargavsai2005/flrrc-v1.3-lora) (QLoRA 4-bit, r=8, alpha=16)
- **Training:** 100 samples, 3 epochs, Colab T4 (see `notebooks/flrrc.ipynb`)

## v1.3 Status

- [x] Training pipeline (QLoRA)
- [x] Adapter uploaded to Hugging Face + model card
- [x] CPU inference works on Mac (`float32`, no `device_map`)
- [ ] Limitation: adapter is under-trained. Logged loss only went `2.54 -> 2.34` (steps 10 to 30), so answers often ignore the FLRRC format.
- [ ] Limitation: inference prompt does not match the training prompt format yet.
- [ ] v1.4: fix prompt format, regenerate dataset with profiles, more samples, more epochs

## How to Run

### 1. Rule-based engine

```bash
python3 src/engine.py
```

### 2. CLI

```bash
python3 src/cli.py --question "College ki vellala vadda?"
```

### 3. LLM inference (downloads about 2.2 GB base model on first run)

```bash
pip3 install -r requirements-training.txt
python3 src/inference.py
```

### 4. Load the adapter in Python

```python
import torch
from peft import PeftModel
from transformers import AutoModelForCausalLM

base = AutoModelForCausalLM.from_pretrained(
    "TinyLlama/TinyLlama-1.1B-Chat-v1.0", dtype=torch.float32
)
model = PeftModel.from_pretrained(base, "bhargavsai2005/flrrc-v1.3-lora")
```

## Demo Result - Paytm Case

- **Question:** Paytm 6M unpaid WFO?
- **Equation:** Go=4.25, NoGo=7.65
- **Verdict:** NO-GO (unless PPO confirmed)
- **Graph:** ![Paytm Graph](assets/graphs/paytm_test.png)

## Roadmap

- [x] v1.0 Setup + gold samples + engine + graph
- [x] v1.1 100 samples dataset
- [x] v1.2 CLI + profile loader
- [x] v1.3 LoRA training + Hugging Face upload
- [ ] v1.4 Fix prompt format, dataset with profiles, retrain
- [ ] v2.0 API + frontend

## Branch Strategy

- `main` -> production
- `dev` -> development
- `feature/*` -> new features

## Author

Adhimulam Bhargav Sai Viswanath

> Idi Decision Support Tool matrame. Final decision neethi.
