import matplotlib.pyplot as plt
import os

def plot_decision(go_score, nogo_score, title, save_path="assets/graphs/decision.png"):
    os.makedirs(os.path.dirname(save_path), exist_ok=True)
    
    labels = ['Go / Yes', 'NoGo / No']
    scores = [go_score, nogo_score]
    colors = ['#2ecc71' if go_score > nogo_score else '#e74c3c', '#e74c3c' if nogo_score >= go_score else '#2ecc71']
    
    plt.figure(figsize=(6,4))
    plt.bar(labels, scores, color=colors)
    plt.ylim(0,10)
    plt.title(title)
    plt.ylabel("Score /10")
    for i, v in enumerate(scores):
        plt.text(i, v+0.2, str(v), ha='center', fontweight='bold')
    plt.savefig(save_path)
    plt.close()
    return save_path