import threading

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from src.inference import ask, ADAPTER

app = FastAPI(title="FLRRC Decision Engine v1.4")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

_generate_lock = threading.Lock()


class Query(BaseModel):
    question: str


@app.get("/")
def home():
    return {"status": "FLRRC v1.4 Running", "model": ADAPTER}


@app.post("/decide")
def decide(q: Query):
    question = q.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="question is empty")
    with _generate_lock:
        result = ask(question)
    return {
        "query": question,
        "flrrc_decision": result,
        "model": "v1.4-poc",
        "note": "POC model. Format is reliable, but scores/facts can be wrong. Scores are recalculated in the UI.",
    }
