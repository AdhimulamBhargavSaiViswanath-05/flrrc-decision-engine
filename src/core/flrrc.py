from .equation import calculate_score, regret_probability, get_verdict

def generate_flrrc_5box(question, user_profile, go_factors, nogo_factors, weights):
    """
    Returns 5 boxes as dict
    """
    go_score = calculate_score(go_factors, weights)
    nogo_score = calculate_score(nogo_factors, weights)
    verdict = get_verdict(go_score, nogo_score)
    regret = regret_probability(go_score, nogo_score)

    box_1 = {
        "fact": f"Question: {question} | Profile: {user_profile}",
        "logic": f"Go factors: {go_factors} | NoGo: {nogo_factors}",
        "reasoning": f"Weights {weights} basis. Go={go_score}, NoGo={nogo_score}",
        "conclusion": verdict
    }
    box_2 = {
        "formula": "Score = Sum(Factor * Weight) [Cost inverted]",
        "go_score": go_score,
        "nogo_score": nogo_score,
        "regret_probability": f"{regret}% if choose lower score",
        "verdict": verdict
    }
    box_3 = {"graph_data": {"Go": go_score, "NoGo": nogo_score}}
    box_4 = {
        "best": f"If {verdict} works, best outcome",
        "worst": f"If {verdict} fails, worst outcome",
        "middle": "Negotiate middle path"
    }
    box_5 = {"next_action": "Ask clarifying questions if verdict is NEGOTIATE"}

    return {
        "box_1_flrrc": box_1,
        "box_2_equation": box_2,
        "box_3_graph": box_3,
        "box_4_risk": box_4,
        "box_5_next_action": box_5,
        "note": "Idi Decision Support Tool matrame. Final decision neethi. Manam proofs istham, choose chesedi nuvve."
    }