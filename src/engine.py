from core.flrrc import generate_flrrc_5box
from core.graph import plot_decision
import json

# TEST with your Paytm case
question = "Paytm internship vellala?"
profile = {"attendance": "68%", "financial": "unknown", "ppo": "unknown"}

go_factors = {"brand": 8, "learning": 7, "ppo_chance": 2, "cost": 9}
nogo_factors = {"placement_focus": 8, "product_build": 8, "degree_safety": 7, "cost": 2}
weights = {"brand":0.2, "learning":0.25, "ppo_chance":0.35, "cost":0.2, "placement_focus":0.2, "product_build":0.25, "degree_safety":0.35}

# Note: For demo, using same weights keys - real lo separate ga calculate cheyali

from core.equation import calculate_score
go_score = calculate_score(go_factors, weights)
nogo_score = calculate_score(nogo_factors, weights)

print(f"Go: {go_score} | NoGo: {nogo_score}")

result = generate_flrrc_5box(question, profile, go_factors, nogo_factors, weights)
print(json.dumps(result, indent=2))

plot_decision(go_score, nogo_score, "Paytm Decision", "assets/graphs/paytm_test.png")
print("Graph saved!")