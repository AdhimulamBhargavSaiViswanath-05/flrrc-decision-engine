# v1.3 Evaluation

Status: informal manual testing only. No validation split, no automated metrics.

## Training

- Base: TinyLlama-1.1B-Chat-v1.0
- Method: QLoRA 4-bit (nf4), r=8, alpha=16, dropout=0.05
- Target modules: q_proj, k_proj, v_proj, o_proj, gate_proj, up_proj, down_proj
- Samples: 100 (`data/training/chatml.jsonl`)
- Epochs: 3
- Hardware: Colab T4
- Logged training loss: 2.54 (step 10), 2.44 (step 20), 2.34 (step 30)
- Adapter size: about 12 MB
- Notebook: `notebooks/flrrc.ipynb` (contains a traceback in `_save_checkpoint`; adapter files were still produced)

## Test Setup

- Machine: Mac, CPU only, `float32`, no `device_map`
- Script: `src/inference.py` (`do_sample=True`, temperature 0.7, top_p 0.9), so outputs vary between runs
- Prompt sent: `<|user|>\n{question}\n<|assistant|>\n`

## Test Results

### Test 1: Telugu, no profile

Input: `nenu clg nundi intiki vellala vaddha`
Output: `no chance, no chance at all.`
Status: FAIL. No FLRRC structure, no equation, no risk or next action.

### Test 2: Telugu with attendance

Input: `Nenu College ki vellala vadda? attendance 68%`
Output: restates the question and says the text contains the phrase "Nenu College ki vellala vadda?".
Status: FAIL. Not a decision. Base model behaviour.

### Test 3: English-style question with attendance

Input: `College ki vellala vadda? attendance 68%`
Output: `Yes, according to the given material, the attendance for class 68 in College is 68%.`
Status: FAIL. Misreads 68% as a class number. No FLRRC format.

## Findings

1. The adapter did not learn the FLRRC output structure.
2. Prompt mismatch (verified):
   - Training: system prompt + `Question: ... Profile: {...}` and the assistant reply is the full sample JSON.
   - Inference: bare `<|user|>\n{question}\n<|assistant|>\n`, no system prompt, no `Question:` / `Profile:` fields.
3. Training data issue (verified): `prepare_dataset.py` reads `data["profile"]`, but samples use `user_profile_ref`, so the first training sample has `Profile: {}`.
4. Training was very short: loss moved only from 2.54 to 2.34 over the logged steps.

## Conclusion

v1.3 is a proof of concept. The pipeline works end to end (train, upload to Hugging Face, load on CPU), but the model output is not usable as a decision engine yet.

## What v1.4 needs

- Fix `prepare_dataset.py` to use `user_profile_ref` so the profile appears in the input.
- Use the same system prompt and `Question: ... Profile: ...` format in `src/inference.py` (via `apply_chat_template`).
- More gold samples, more epochs (5 to 10).
- Validation split and a small fixed test set so results are comparable between versions.
- Confirm training completes without the `_save_checkpoint` error.
