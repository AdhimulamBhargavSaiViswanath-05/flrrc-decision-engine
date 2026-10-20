from peft import PeftModel
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch

BASE = "TinyLlama/TinyLlama-1.1B-Chat-v1.0"
ADAPTER = "bhargavsai2005/flrrc-v1.3-lora"

# EXACT same system prompt + format the adapter was trained with (data/training/chatml.jsonl,
# notebook fmt(): "<|role|>\n{content}\n" for every message).
SYSTEM_PROMPT = (
    "You are FLRRC Decision Engine. Given Question + Profile, output 5 boxes: "
    "Fact, Logic, Reasoning, Conclusion, Next Action with Equation and Risk."
)

# Training data has "Question: ... Profile: {...}" as the user turn.
STOP_MARKERS = ("<|user|>", "<|system|>", "<|assistant|>")

print(f"Loading {ADAPTER} on CPU...")
# Mac fix: use float32 + cpu
model = AutoModelForCausalLM.from_pretrained(BASE, dtype=torch.float32, device_map="cpu", low_cpu_mem_usage=True)
model = PeftModel.from_pretrained(model, ADAPTER)
tokenizer = AutoTokenizer.from_pretrained(BASE)


def build_prompt(question):
    return (
        f"<|system|>\n{SYSTEM_PROMPT}\n"
        f"<|user|>\nQuestion: {question} Profile: {{}}\n"
        f"<|assistant|>\n"
    )


def ask(question):
    prompt = build_prompt(question)
    inputs = tokenizer(prompt, return_tensors="pt")
    prompt_len = inputs["input_ids"].shape[1]

    outputs = model.generate(
        **inputs,
        max_new_tokens=600,
        temperature=0.7,
        top_p=0.9,
        do_sample=True,
        repetition_penalty=1.05,
        eos_token_id=tokenizer.eos_token_id,
        pad_token_id=tokenizer.eos_token_id
    )
    # Decode only the newly generated tokens (no prompt slicing by string length)
    answer = tokenizer.decode(outputs[0][prompt_len:], skip_special_tokens=True)

    # Training had no end-of-turn token, so the model may start a new turn. Cut there.
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
