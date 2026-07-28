// Local embedding similarity fallback (PRD §8.2 / §16 step 7). Only tried
// for requirements the zero-cost keyword matcher didn't already catch —
// calls apps/ml-service, a local process, never an external API.
export interface EmbeddingCandidate {
  key: string
  description: string
}

export interface EmbeddingMatch {
  key: string
  score: number
}

// Empirically calibrated against the CA pack's descriptions: genuine
// matches scored ~0.42-0.54, unrelated text scored ~0 or negative. Tune
// as more requirement packs/real usage data comes in.
export const EMBEDDING_MATCH_THRESHOLD = 0.4

const ML_SERVICE_URL = process.env.ML_SERVICE_URL ?? 'http://localhost:8000'

export async function classifyByEmbedding(
  text: string,
  candidates: EmbeddingCandidate[]
): Promise<EmbeddingMatch[]> {
  if (candidates.length === 0) {
    return []
  }

  const response = await fetch(`${ML_SERVICE_URL}/classify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, candidates }),
  })

  if (!response.ok) {
    throw new Error(`ML service returned ${response.status}`)
  }

  const data: { matches: EmbeddingMatch[] } = await response.json()
  return data.matches
}
