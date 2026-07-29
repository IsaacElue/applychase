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

// A bare threshold isn't sufficient on its own: tested against same-domain
// text that only mentions *some* requirements, an unmentioned requirement's
// description routinely scored 0.5+ against the whole blob — sometimes
// higher than the requirement that was actually mentioned. See
// classifyByEmbeddingWithMargin, which is what actually guards matches.
export const EMBEDDING_MATCH_THRESHOLD = 0.4

// Minimum gap between the top-scoring candidate and the runner-up within
// one chunk of text before the top pick is trusted. Empirically, genuine
// matches (even indirectly phrased, no keyword overlap) cleared a
// 0.048-0.35 margin; same-domain text that didn't actually mention the
// top-scoring candidate cleared only 0.01-0.044. That's a narrow, close-run
// gap, not a clean separation — 0.045 sits in it, biased toward the reject
// side deliberately: a missed match just means the landlord clicks "Mark
// received" manually, but a false positive silently claims a compliance
// item was satisfied when it wasn't. Re-verify against
// packages/requirements/*.yaml if a new pack's descriptions score
// differently, and tighten this once real usage data accumulates (PRD §8.4).
export const EMBEDDING_MATCH_MARGIN = 0.045

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

// A whole multi-topic paragraph embeds as a blend of all its topics, which
// is exactly what produces same-domain false positives (a paragraph about
// income and ID can still score "background check consent" at 0.55+ even
// though it's never mentioned). Splitting into sentence-level chunks keeps
// each comparison closer to a single topic; the full text is kept as an
// extra chunk too, for terse pastes with no sentence punctuation.
function splitIntoChunks(text: string): string[] {
  const sentences = text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)

  const trimmedFull = text.trim()
  return sentences.includes(trimmedFull)
    ? sentences
    : [...sentences, trimmedFull]
}

// For each chunk, only the single top-scoring candidate is ever trusted,
// and only if it clears both the absolute floor and a margin over the
// runner-up in that same chunk. The margin check is what actually rejects
// the false positive above: "background_check_consent" is often the
// highest-scoring candidate for rental-adjacent text in general, but it
// isn't the top pick by a confident margin unless a background check is
// genuinely mentioned in that chunk.
export async function classifyByEmbeddingWithMargin(
  text: string,
  candidates: EmbeddingCandidate[]
): Promise<EmbeddingMatch[]> {
  if (candidates.length === 0) {
    return []
  }

  const bestByKey = new Map<string, number>()

  for (const chunk of splitIntoChunks(text)) {
    const matches = await classifyByEmbedding(chunk, candidates)
    if (matches.length === 0) continue

    const [top, runnerUp] = [...matches].sort((a, b) => b.score - a.score)
    const margin = runnerUp ? top.score - runnerUp.score : top.score

    if (
      top.score >= EMBEDDING_MATCH_THRESHOLD &&
      margin >= EMBEDDING_MATCH_MARGIN
    ) {
      const existingScore = bestByKey.get(top.key)
      if (existingScore === undefined || top.score > existingScore) {
        bestByKey.set(top.key, top.score)
      }
    }
  }

  return [...bestByKey.entries()].map(([key, score]) => ({ key, score }))
}
