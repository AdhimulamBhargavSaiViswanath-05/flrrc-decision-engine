import json

def load_profile(path="data/profiles/user_profile.json"):
    with open(path) as f:
        return json.load(f)

def save_profile(profile, path="data/profiles/user_profile.json"):
    with open(path, "w") as f:
        json.dump(profile, f, indent=2)