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

# FLRRC v1.3 LoRA - College Decision Engine

Telugu + English college attendance decision assistant built with the FLRRC framework (Fact, Logic, Reasoning, Representation, Conclusion).

**Try:** "College ki vellala vadda? Attendance 68%, energy low"

> This is a Decision Support Tool only. The final decision is yours.

## Model Details

### Model Description

TinyLlama-1.1B-Chat fine-tuned with QLoRA to produce structured, profile-aware college attendance decisions.

- **Developed by:** Adhimulam Bhargav Sai Viswanath (bhargavsai2005)
- **Model type:** Causal LM + LoRA adapter
- **Language(s):** English, Telugu (code-mixed)
- **License:** MIT
- **Finetuned from:** TinyLlama/TinyLlama-1.1B-Chat-v1.0

### Model Sources

- **Repository:** https://github.com/AdhimulamBhargavSaiViswanath-05/flrrc-decision-engine
- **Base model:** https://huggingface.co/TinyLlama/TinyLlama-1.1B-Chat-v1.0
- **Demo:** `python3 src/inference.py`

## Uses

### Direct Use

Ask college attendance questions, for example: `College ki vellala vadda? attendance 68%`

The FLRRC engine returns a 5-box decision: FLRRC Breakdown, Equation + Probability, Graph, Risk & Alternatives, Next Action.

### Out-of-Scope Use

Not for medical or legal advice. Intended only for attendance-style personal decisions.

## How to Get Started

```python
from peft import PeftModel
from transformers import AutoModelForCausalLM, AutoTokenizer, pipeline

base = "TinyLlama/TinyLlama-1.1B-Chat-v1.0"
adapter = "bhargavsai2005/flrrc-v1.3-lora"

model = AutoModelForCausalLM.from_pretrained(base, device_map="auto", torch_dtype="float16")
model = PeftModel.from_pretrained(model, adapter)
model = model.merge_and_unload()

tokenizer = AutoTokenizer.from_pretrained(base)
pipe = pipeline(
    "text-generation",
    model=model,
    tokenizer=tokenizer,
    max_new_tokens=256,
    do_sample=True,
    temperature=0.7,
    top_p=0.9,
)

prompt = "<|user|>\nCollege ki vellala vadda? attendance 68%\n<|assistant|>\n"
print(pipe(prompt)[0]["generated_text"])
```

## Training Details

### Training Data

100 samples in ChatML format (`data/training/chatml.jsonl`), generated from user profiles with attendance %, energy, health and subject importance.

### Training Procedure

QLoRA fine-tuning on a Google Colab T4 GPU (see `notebooks/flrrc.ipynb`).

#### Training Hyperparameters

- **Quantization:** 4-bit (nf4), fp16 compute
- **LoRA:** r=8, alpha=16, dropout=0.05
- **Target modules:** q_proj, k_proj, v_proj, o_proj, gate_proj, up_proj, down_proj
- **Epochs:** 3

#### Results

- **Logged training loss:** 2.54 (step 10), 2.44 (step 20), 2.34 (step 30)
- **Adapter size:** about 12 MB

## Evaluation

No formal evaluation yet. Only informal manual testing was done.

## Environmental Impact

- **Hardware:** NVIDIA T4 (Google Colab)
- **Cloud provider:** Google Colab

## Technical Specifications

TinyLlama-1.1B decoder with LoRA adapters on attention and MLP layers.

## Citation

```bibtex
@misc{flrrc-v1.3-lora,
  author = {Adhimulam Bhargav Sai Viswanath},
  title = {FLRRC v1.3 LoRA - Decision Engine},
  year = {2026},
  publisher = {Hugging Face},
  url = {https://huggingface.co/bhargavsai2005/flrrc-v1.3-lora}
}
```

## More Information

GitHub: https://github.com/AdhimulamBhargavSaiViswanath-05/flrrc-decision-engine
