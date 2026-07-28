# Local embedding classification (PRD §8.2 / §16 step 7) — no external API
# calls. Model runs in-process on CPU; the only cost is the one-time model
# download from Hugging Face on first run.
from fastapi import FastAPI
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer, util

app = FastAPI(title="ApplyChase ML Service")

model = SentenceTransformer("all-MiniLM-L6-v2")


class Candidate(BaseModel):
    key: str
    description: str


class ClassifyRequest(BaseModel):
    text: str
    candidates: list[Candidate]


class Match(BaseModel):
    key: str
    score: float


class ClassifyResponse(BaseModel):
    matches: list[Match]


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/classify", response_model=ClassifyResponse)
def classify(request: ClassifyRequest) -> ClassifyResponse:
    if not request.candidates:
        return ClassifyResponse(matches=[])

    text_embedding = model.encode(request.text, convert_to_tensor=True)
    descriptions = [candidate.description for candidate in request.candidates]
    candidate_embeddings = model.encode(descriptions, convert_to_tensor=True)

    scores = util.cos_sim(text_embedding, candidate_embeddings)[0]

    matches = [
        Match(key=candidate.key, score=float(score))
        for candidate, score in zip(request.candidates, scores)
    ]
    matches.sort(key=lambda match: match.score, reverse=True)

    return ClassifyResponse(matches=matches)
