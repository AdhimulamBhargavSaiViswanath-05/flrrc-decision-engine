---
base_model: TinyLlama/TinyLlama-1.1B-Chat-v1.0
library_name: peft
pipeline_tag: text-generation
license: mit
tags:
- lora
- flrrc
- decision-engine
- telugu
language:
- en
- te
---

# FLRRC v1.4 LoRA - Decision Engine

**Not a Chatbot. A Decision Calculator.**

A small LoRA adapter on TinyLlama-1.1B-Chat that turns a personal decision question (English / Telugu-English mix) into a structured 5-box answer using the FLRRC framework: Fact, Logic, Reasoning, Representation (Equation + Graph), Conclusion.

> Decision Support Tool only. The final decision is yours. This is a proof of concept: the output format is reliable, but the numbers and facts are not. See "Known limitations".

## Model Details

- **Developed by:** Adhimulam Bhargav Sai Viswanath (bhargavsai2005)
- **Model type:** Causal LM + LoRA adapter (about 12.6 MB)
- **Language(s):** English, Telugu-English code-mixed
- **License:** MIT
- **Finetuned from:** TinyLlama/TinyLlama-1.1B-Chat-v1.0
- **Repository:** https://github.com/AdhimulamBhargavSaiViswanath-05/flrrc-decision-engine
- **Demo (Space):** https://huggingface.co/spaces/bhargavsai2005/flrrc-v1.3

## Output format

The model writes compact JSON followed by the end-of-sequence token:

```json
{
  "box_1_flrrc": {"fact": "", "logic": "", "reasoning": "", "representation": "", "conclusion": ""},
  "box_2_equation": {"formula": "", "go_score": "Go (..) = (v*w)+(v*w)-(v*w) = ... = x/10", "nogo_score": "", "regret_probability": ""},
  "box_3_graph": "Bar chart: Go X vs NoGo Y. note",
  "box_4_risk": {"best": "", "worst": "", "middle": ""},
  "box_5_next_action": ""
}
```

## How to use

The prompt must match the training format exactly. There is no separate profile field: put the details in the question, in brackets.

```python
import torch
from peft import PeftModel
from transformers import AutoModelForCausalLM, AutoTokenizer

BASE = "TinyLlama/TinyLlama-1.1B-Chat-v1.0"
ADAPTER = "bhargavsai2005/flrrc-v1.4-lora"

SYSTEM = (
    "You are FLRRC Decision Engine. Given a Question, output 5 boxes as JSON: "
    "box_1_flrrc, box_2_equation, box_3_graph, box_4_risk, box_5_next_action."
)

tokenizer = AutoTokenizer.from_pretrained(BASE)
model = AutoModelForCausalLM.from_pretrained(BASE, dtype=torch.float32, device_map="cpu")
model = PeftModel.from_pretrained(model, ADAPTER).eval()

question = "Gym ki vellala? (energy 3/10, sleep 5 hrs, exam repu)"
prompt = f"<|system|>\n{SYSTEM}\n<|user|>\nQuestion: {question}\n<|assistant|>\n"
inputs = tokenizer(prompt, return_tensors="pt")

with torch.no_grad():
    out = model.generate(
        **inputs,
        max_new_tokens=800,
        do_sample=True,
        temperature=0.7,
        top_p=0.9,
        repetition_penalty=1.05,
        eos_token_id=tokenizer.eos_token_id,
        pad_token_id=tokenizer.eos_token_id,
    )
print(tokenizer.decode(out[0][inputs["input_ids"].shape[1]:], skip_special_tokens=True))
```

Recommended: do not trust the totals the model writes. Re-compute `go_score` / `nogo_score` from the `(value*weight)` terms in the string. The reference UI in the GitHub repo does this and shows a warning when the corrected winner differs from the model's own.

## Training Details

### Training data

75 hand-reviewed samples in ChatML format (`data/training/chatml-v1.4.jsonl`): 5 normalized gold samples plus 70 reviewed drafts. Go and NoGo totals in every sample are computed by code from the factors and weights. Winners: 37 Go / 38 NoGo. All fact, logic, reasoning and conclusion texts are unique. About 26 questions are English-style, the rest Telugu-English.

### Training procedure

QLoRA on a Google Colab T4 (see `notebooks/flrrc_v1_4.ipynb`).

- **Quantization:** 4-bit nf4, fp16 compute
- **LoRA:** r=8, alpha=16, dropout=0.05, all attention and MLP projections
- **Epochs:** 5 (about 95 optimizer steps), batch 1, gradient accumulation 4
- **Learning rate:** 2e-4, cosine schedule, warmup 0.1
- **Max length:** 1024 tokens; `</s>` appended after each answer so the model learns to stop
- **Loss:** 2.52 (step 5) to about 0.95 (step 95)

### Compared with v1.3

v1.3 trained for only 39 steps at the default learning rate on template-heavy data (loss 2.54 to 2.34) and did not produce the intended format. v1.4 fixes the data (no template filler), the learning rate, the step count and the end token.

## Evaluation

No formal benchmark. Informal manual tests on a handful of questions (Colab and CPU):

- Valid 5-box JSON, stops at EOS: 4 of 4 in every informal run.
- Totals written by the model disagree with its own factors and weights in most samples checked (7 of 8 in one check).

## Known limitations

- **Arithmetic is unreliable.** The formula is usually fine, the total often is not.
- **Conclusion can contradict the scores.** The text conclusion is free-form and may not match the numeric winner.
- **Invents facts and numbers** that are not in the question, and misreads vague or unusual questions.
- Trained on only 75 samples. Do not use for medical, legal or financial decisions.

## Environmental Impact

- **Hardware:** NVIDIA T4 (Google Colab), about 15 minutes of training

## Citation

```bibtex
@misc{flrrc-v1.4-lora,
  author = {Adhimulam Bhargav Sai Viswanath},
  title = {FLRRC v1.4 LoRA - Decision Engine},
  year = {2026},
  publisher = {Hugging Face},
  url = {https://huggingface.co/bhargavsai2005/flrrc-v1.4-lora}
}
```
