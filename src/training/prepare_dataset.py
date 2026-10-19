import json
import os

def convert_to_chatml(input_path="data/samples/dataset_100.jsonl", output_path="data/training/chatml.jsonl"):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    with open(input_path) as fin, open(output_path, "w") as fout:
        for line in fin:
            data = json.loads(line)
            # FLRRC Prompt format
            chat = {
                "messages": [
                    {"role": "system", "content": "You are FLRRC Decision Engine. Given Question + Profile, output 5 boxes: Fact, Logic, Reasoning, Conclusion, Next Action with Equation and Risk."},
                    {"role": "user", "content": f"Question: {data.get('question','')} Profile: {json.dumps(data.get('profile',{}))}"},
                    {"role": "assistant", "content": json.dumps(data, indent=2)}
                ]
            }
            fout.write(json.dumps(chat) + "\n")
    
    print(f"✅ Converted {input_path} -> {output_path}")

if __name__ == "__main__":
    convert_to_chatml()
