import argparse
from core.flrrc import generate_flrrc_5box
from core.equation import calculate_score
from core.graph import plot_decision
from utils.profile_loader import load_profile
import json

parser = argparse.ArgumentParser(description="FLRRC Decision Calculator")
parser.add_argument("--question", required=True, help="Your confusion question")
args = parser.parse_args()

profile = load_profile()
print(f"Loaded Profile: {profile}")

# Demo scoring - later LLM will generate factors
go_factors = {"learning": 7, "brand": 8, "cost": 8}
nogo_factors = {"safety": 8, "focus": 7, "cost": 2}
weights = {"learning":0.3, "brand":0.2, "cost":0.2, "safety":0.3, "focus":0.2}

go_score = calculate_score(go_factors, weights)
nogo_score = calculate_score(nogo_factors, weights)

result = generate_flrrc_5box(args.question, profile, go_factors, nogo_factors, weights)
print(json.dumps(result, indent=2))
plot_decision(go_score, nogo_score, args.question, "assets/graphs/cli_result.png")
print("Graph saved to assets/graphs/cli_result.png")
print("Note: Idi Decision Support Tool matrame. Final decision neethi.")