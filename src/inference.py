from peft import PeftModel
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch

BASE = "TinyLlama/TinyLlama-1.1B-Chat-v1.0"
ADAPTER = "bhargavsai2005/flrrc-v1.3-lora"

print(f"Loading {ADAPTER} on CPU...")
# Mac fix: use float32 + cpu
model = AutoModelForCausalLM.from_pretrained(BASE, dtype=torch.float32, device_map="cpu", low_cpu_mem_usage=True)
model = PeftModel.from_pretrained(model, ADAPTER)
tokenizer = AutoTokenizer.from_pretrained(BASE)

def ask(question):
    messages = [{"role": "user", "content": question}]
    prompt = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
    print(f"\n[DEBUG Prompt]: {prompt[:200]}")
    inputs = tokenizer(prompt, return_tensors="pt")
    
    outputs = model.generate(
        **inputs,
        max_new_tokens=200,
        temperature=0.8,
        top_p=0.9,
        do_sample=True,
        repetition_penalty=1.15,
        eos_token_id=tokenizer.eos_token_id,
        pad_token_id=tokenizer.eos_token_id
    )
    full = tokenizer.decode(outputs[0], skip_special_tokens=True)
    # Remove prompt
    answer = full[len(tokenizer.decode(inputs['input_ids'][0], skip_special_tokens=True)):].strip()
    return answer if answer else full

if __name__ == "__main__":
    print("FLRRC Ready! (type exit)")
    while True:
        q = input("\nYou: ")
        if q.lower() in ["exit","quit"]: break
        print("\nFLRRC:", ask(q))
