import os

from peft import PeftModel
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch

# Single source of truth for the v1.4 system prompt (same string the adapter was trained with).
from src.training.prepare_dataset import SYSTEM_PROMPT_V14 as SYSTEM_PROMPT

BASE = "TinyLlama/TinyLlama-1.1B-Chat-v1.0"
HF_ADAPTER = "bhargavsai2005/flrrc-v1.4-lora"
LOCAL_ADAPTER = "models/flrrc-v1.4-lora-final"

# Override with FLRRC_ADAPTER=<local path or HF repo>. Default: local folder if it exists, else the HF repo.
ADAPTER = os.environ.get("FLRRC_ADAPTER") or (LOCAL_ADAPTER if os.path.isdir(LOCAL_ADAPTER) else HF_ADAPTER)
TEMPERATURE = float(os.environ.get("FLRRC_TEMP", "0.7"))
MAX_NEW_TOKENS = int(os.environ.get("FLRRC_MAX_NEW_TOKENS", "800"))

# The adapter was trained with an end token, but cut at a new turn marker just in case.
STOP_MARKERS = ("<|user|>", "<|system|>", "<|assistant|>")

print(f"Loading {ADAPTER} on CPU...")
# Mac fix: use float32 + cpu
model = AutoModelForCausalLM.from_pretrained(BASE, dtype=torch.float32, device_map="cpu", low_cpu_mem_usage=True)
model = PeftModel.from_pretrained(model, ADAPTER)
model.eval()
tokenizer = AutoTokenizer.from_pretrained(BASE)


def build_prompt(question):
    # Must match training exactly: system prompt, then "Question: ..." (no Profile field in v1.4).
    return (
        f"<|system|>\n{SYSTEM_PROMPT}\n"
        f"<|user|>\nQuestion: {question}\n"
        f"<|assistant|>\n"
    )


def ask(question):
    prompt = build_prompt(question)
    inputs = tokenizer(prompt, return_tensors="pt")
    prompt_len = inputs["input_ids"].shape[1]

    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=MAX_NEW_TOKENS,
            temperature=TEMPERATURE,
            top_p=0.9,
            do_sample=True,
            repetition_penalty=1.05,
            eos_token_id=tokenizer.eos_token_id,
            pad_token_id=tokenizer.eos_token_id
        )
    # Decode only the newly generated tokens (no prompt slicing by string length)
    answer = tokenizer.decode(outputs[0][prompt_len:], skip_special_tokens=True)

    for marker in STOP_MARKERS:
        idx = answer.find(marker)
        if idx != -1:
            answer = answer[:idx]
    return answer.strip()


if __name__ == "__main__":
    print("FLRRC Ready! (type exit)")
    while True:
        q = input("\nYou: ")
        if q.lower() in ["exit", "quit"]: break
        print("\nFLRRC:", ask(q))
