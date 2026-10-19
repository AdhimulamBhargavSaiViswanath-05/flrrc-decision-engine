def calculate_score(factors: dict, weights: dict) -> float:
    """
    factors: {"brand": 8, "learning": 7, "cost": 9} - 0 to 10 scale
    weights: {"brand": 0.2, "learning": 0.3, "cost": 0.2} - sum = 1
    Cost factor ayithe invert cheyali (high cost = low score)
    """
    score = 0
    for key, value in factors.items():
        w = weights.get(key, 0)
        # Cost, Risk lanti negative factors ni invert
        if key in ["cost", "risk", "tiredness", "recovery_risk"]:
            value = 10 - value
        score += value * w
    return round(score, 2)

def regret_probability(best_score, second_score):
    # Difference ekkuva ayithe regret takkuva
    diff = abs(best_score - second_score)
    # diff 0 ante 50% regret, diff 5 ante 10% regret
    regret = max(5, 75 - (diff * 13))
    return round(regret, 1)

def get_verdict(go_score, nogo_score):
    if go_score > nogo_score + 1:
        return "GO"
    elif nogo_score > go_score + 1:
        return "NO-GO"
    else:
        return "NEGOTIATE / NEED MORE INFO"