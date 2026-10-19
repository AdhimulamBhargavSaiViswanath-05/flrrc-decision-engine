import json
import os
import random

# Base 5 gold samples data
base_questions = [
    {"cat": "college", "q": "College ki vellala vadda?", "template": 1},
    {"cat": "career", "q": "Paytm internship vellala vadda?", "template": 2},
    {"cat": "health", "q": "Gym ki vellala vadda?", "template": 3},
    {"cat": "career", "q": "AI/ML nerchukovala leka Web Dev na?", "template": 4},
    {"cat": "finance", "q": "Rs 2000 course konala vadda?", "template": 5},
]

# Variations for 100
variations = {
    "college": [
        "Assignment submit cheyala vadda?", "Class bunk cheyala?", "Lab ki vellala?",
        "Internal exam ki prepare avala?", "Project meeting ki vellala?", "Library ki vellala?",
        "Friend ki notes ivvala?", "Hostel lo undala day scholar na?", "Extra class ki vellala?",
        "Seminar ki attend avala?", "Coding contest ki vellala?", "Placement training ki vellala?",
        "Backlog subject ki class vellala?", "Group study ki vellala?", "Sports ki vellala?"
    ],
    "career": [
        "Internship stipend 5k teesukovala?", "WFH vs WFO choose cheyala?", "Startup vs MNC?",
        "Resume lo project add cheyala?", "LinkedIn post veyala?", "Interview ki vellala?",
        "Python vs Java nerchukovala?", "DSA daily cheyala?", "Open source contribute cheyala?",
        "Freelancing cheyala?", "Portfolio website cheyala?", "GitHub daily push cheyala?",
        "Mock interview ki vellala?", "Company X ki apply cheyala?", "Offer letter accept cheyala?"
    ],
    "health": [
        "Morning walk ki vellala?", "Protein powder konala?", "Early sleep cheyala?",
        "Junk food thinnala?", "Water ekkuva tagala?", "Meditation cheyala?",
        "Creatine konala?", "Rest day teesukovala?", "Cardio cheyala weights na?",
        "Diet follow avala?", "Yoga cheyala?", "Supplements konala?",
        "Gym evening ki vellala morning na?", "Cheat meal teesukovala?", "Injury tho gym ki vellala?"
    ],
    "finance": [
        "Laptop konala vadda?", "Phone upgrade cheyala?", "Course 5000 konala?",
        "Domain name konala?", "Hosting konala?", "ChatGPT Plus konala?",
        "Udemy course konala?", "Book konala?", "Gym membership renew cheyala?",
        "Bike konala?", "Headphones konala?", "Keyboard konala?",
        "Invest cheyala?", "Savings teeyala?", "Part-time job cheyala?"
    ],
    "product": [
        "FLRRC app cheyala website na?", "Feature X add cheyala?", "Logo change cheyala?",
        "User feedback adagala?", "MVP launch cheyala?", "Marketing cheyala?",
        "Co-founder teesukovala?", "Investor ki pitch cheyala?", "Product Hunt lo launch cheyala?",
        "Pricing 99 pettala 199 na?", "Free trial ivvala?", "Beta users ki adagala?",
        "Tech stack change cheyala?", "UI redesign cheyala?", "Backend optimize cheyala?"
    ]
}

def create_sample(id, category, question, template_id):
    # Simple FLRRC generation based on template
    go = round(random.uniform(3.5, 8.5), 2)
    nogo = round(random.uniform(3.5, 8.5), 2)
    if go == nogo:
        nogo += 0.5
    
    verdict = "GO" if go > nogo else "NO-GO"
    
    return {
        "sample_id": id,
        "category": category,
        "question": question,
        "template_base": template_id,
        "note_point": "Idi Decision Support Tool matrame. Final decision neethi. Manam proofs istham, choose chesedi nuvve.",
        "box_1_flrrc": {
            "fact": f"Question about {category}: {question}",
            "logic": f"Factors analyzed for {category}",
            "reasoning": f"Based on profile and {category} context",
            "conclusion": verdict
        },
        "box_2_equation": {
            "formula": "Score = Sum(Factor*Weight) [Cost inverted]",
            "go_score": go,
            "nogo_score": nogo,
            "verdict": verdict,
            "regret": f"{round(75 - abs(go-nogo)*10, 1)}% if wrong"
        },
        "box_3_graph": f"Bar: Go {go} vs NoGo {nogo}",
        "box_4_risk": {"best": f"{verdict} best", "worst": f"{verdict} worst", "middle": "Negotiate"},
        "box_5_next_action": f"Next: Decide based on {verdict}"
    }

# Generate 100
all_samples = []
id_counter = 1

# First 5 gold
for i in range(1,6):
    path = f"data/samples/sample_{i}_{['college','paytm','gym','ai_vs_webdev','course_buy'][i-1]}.json"
    # try load real file if exists
    try:
        with open(path, 'r') as f:
            data = json.load(f)
            data['sample_id'] = id_counter
            data['category'] = base_questions[i-1]['cat']
            all_samples.append(data)
            id_counter += 1
    except:
        # fallback
        q = base_questions[i-1]
        all_samples.append(create_sample(id_counter, q['cat'], q['q'], q['template']))
        id_counter += 1

# Generate remaining 95
for cat, qs in variations.items():
    for q in qs:
        if id_counter > 100:
            break
        all_samples.append(create_sample(id_counter, cat, q, random.randint(1,5)))
        id_counter += 1
    if id_counter > 100:
        break

# Fill if less than 100
while len(all_samples) < 100:
    cat = random.choice(list(variations.keys()))
    q = f"Random {cat} decision {id_counter}?"
    all_samples.append(create_sample(id_counter, cat, q, 1))
    id_counter += 1

# Save JSONL
os.makedirs("data/samples", exist_ok=True)
with open("data/samples/dataset_100.jsonl", "w") as out:
    for s in all_samples:
        out.write(json.dumps(s) + "\n")

print(f"Generated {len(all_samples)} samples -> data/samples/dataset_100.jsonl")
print(f"Categories: { {c: len([x for x in all_samples if x['category']==c]) for c in variations.keys()} }")