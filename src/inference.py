from peft import PeftModel
from transformers import AutoModelForCausalLM, AutoTokenizer, pipeline

def load_flrrc(adapter_id="bhargavsai2005/flrrc-v1.3-lora", base="TinyLlama/TinyLlama-1.1B-Chat-v1.0"):
    model = AutoModelForCausalLM.from_pretrained(base, device_map="auto", torch_dtype="float16")
    model = PeftModel.from_pretrained(model, adapter_id)
    model = model.merge_and_unload()
    tokenizer = AutoTokenizer.from_pretrained(base)
    pipe = pipeline("text-generation", model=model, tokenizer=tokenizer, max_new_tokens=256, temperature=0.7, top_p=0.9)
    return pipe

if __name__ == "__main__":
    pipe = load_flrrc()
    while True:
        q = input("You: ")
        if q in ["exit","quit"]: break
        prompt = f"<|user|>\n{q}\n<|assistant|>\n"
        print(pipe(prompt)[0]['generated_text'][len(prompt):])
