"""
FLRRC v1.3 - LoRA Fine-tune
Base: TinyLlama-1.1B or Llama-3.2-1B (free on Colab)
Dataset: 100 samples ChatML
"""

import json
print("FLRRC v1.3 Fine-tune Setup")

# Check dataset
try:
    with open("data/samples/dataset_100.jsonl") as f:
        samples = list(f)
    print(f"✅ Dataset: {len(samples)} samples")
except Exception as e:
    print(f"❌ Dataset missing: {e}")
    exit(1)

# LoRA Config
lora_config = {
    "r": 8,
    "lora_alpha": 16,
    "target_modules": ["q_proj", "v_proj", "k_proj", "o_proj"],
    "lora_dropout": 0.05,
    "bias": "none",
    "task_type": "CAUSAL_LM"
}

training_args = {
    "per_device_train_batch_size": 2,
    "gradient_accumulation_steps": 4,
    "num_train_epochs": 3,
    "learning_rate": 2e-4,
    "fp16": True,
    "logging_steps": 10,
    "output_dir": "models/flrrc-v1.3-lora",
    "save_steps": 50
}

print("LoRA Config:", json.dumps(lora_config, indent=2))
print("Training Args:", json.dumps(training_args, indent=2))

print("""
\n🚀 To train (on Colab / GPU machine):
pip install transformers peft accelerate trl datasets

python src/training/prepare_dataset.py
python -m trl.sft --model_name TinyLlama/TinyLlama-1.1B-Chat-v1.0 --dataset data/training/chatml.jsonl --lora_r 8 ...

Model will save to models/flrrc-v1.3-lora/
""")

# Save configs
import os
os.makedirs("models/flrrc-v1.3-lora", exist_ok=True)
with open("models/flrrc-v1.3-lora/config.json", "w") as f:
    json.dump({"lora": lora_config, "training": training_args}, f, indent=2)

print("✅ Config saved. Ready for GPU training")
