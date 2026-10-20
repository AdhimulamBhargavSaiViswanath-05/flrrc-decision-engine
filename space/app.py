import gradio as gr
import spaces
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
from peft import PeftModel

BASE = "TinyLlama/TinyLlama-1.1B-Chat-v1.0"
LORA = "bhargavsai2005/flrrc-lora"

# Must match the v1.4 training prompt exactly (src/training/prepare_dataset.py SYSTEM_PROMPT_V14).
SYSTEM_PROMPT = (
    "You are FLRRC Decision Engine. Given a Question, output 5 boxes as JSON: "
    "box_1_flrrc, box_2_equation, box_3_graph, box_4_risk, box_5_next_action."
)
STOP_MARKERS = ("<|user|>", "<|system|>", "<|assistant|>")

model = None
tokenizer = None


def load_models():
    global model, tokenizer
    if model is None:
        tokenizer = AutoTokenizer.from_pretrained(BASE)
        base = AutoModelForCausalLM.from_pretrained(BASE, torch_dtype=torch.float16, device_map="auto")
        model = PeftModel.from_pretrained(base, LORA)
        model = model.merge_and_unload()
        model.eval()


def build_prompt(question):
    return (
        f"<|system|>\n{SYSTEM_PROMPT}\n"
        f"<|user|>\nQuestion: {question}\n"
        f"<|assistant|>\n"
    )


@spaces.GPU(duration=90)
def decide(question):
    if not question or not question.strip():
        return "Question enter chey"
    try:
        load_models()
        inputs = tokenizer(build_prompt(question.strip()), return_tensors="pt").to(model.device)
        prompt_len = inputs["input_ids"].shape[1]
        with torch.no_grad():
            out = model.generate(
                **inputs,
                max_new_tokens=800,
                temperature=0.7,
                top_p=0.9,
                do_sample=True,
                repetition_penalty=1.05,
                eos_token_id=tokenizer.eos_token_id,
                pad_token_id=tokenizer.eos_token_id,
            )
        text = tokenizer.decode(out[0][prompt_len:], skip_special_tokens=True)
        for marker in STOP_MARKERS:
            idx = text.find(marker)
            if idx != -1:
                text = text[:idx]
        return text.strip()
    except Exception as e:
        return f"Error: {e}\nTry again - GPU warming up (first request takes 30s)"


with gr.Blocks() as demo:
    gr.Markdown(
        "# FLRRC Decision Engine\n"
        "**Not a Chatbot. A Decision Calculator.**\n\n"
        "POC (TinyLlama 1.1B + LoRA). Output is JSON with 5 boxes. "
        "Scores and facts can be wrong. Idi Decision Support Tool matrame. Final decision neethi."
    )
    inp = gr.Textbox(
        label="Your Dilemma",
        placeholder="Gym ki vellala? (energy 3/10, sleep 5 hrs, exam repu)",
    )
    out = gr.Textbox(label="FLRRC Decision (JSON)", lines=14)
    btn = gr.Button("Decide", variant="primary")
    btn.click(fn=decide, inputs=inp, outputs=out, api_name="decide")
    inp.submit(fn=decide, inputs=inp, outputs=out)
    gr.Examples(
        [
            "Gym ki vellala? (energy 3/10, sleep 5 hrs, exam repu)",
            "College ki vellala? (attendance 68%, exam in 10 days)",
            "Paid course konala? (cost 4000, free alternatives available)",
        ],
        inputs=inp,
    )

demo.launch()
