// Rule-based keyword matcher (PRD §8.1 / §16 step 4) — no embeddings, no
// LLM calls. Swapped for local embedding similarity in a later step.
export interface RequirementDefinition {
  key: string
  label: string
  description: string
  keywords: string[]
}

export interface MatchResult {
  requirementKey: string
  confidence: number
  matchedKeywords: string[]
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function containsKeyword(text: string, keyword: string): boolean {
  // Word-boundary match, not substring — otherwise short keywords like "id"
  // false-positive inside unrelated words (e.g. "provide").
  return new RegExp(`\\b${escapeRegExp(keyword.toLowerCase())}\\b`).test(text)
}

export function matchText(
  text: string,
  requirements: RequirementDefinition[]
): MatchResult[] {
  const normalized = text.toLowerCase()

  return requirements
    .map((requirement) => {
      const matchedKeywords = requirement.keywords.filter((keyword) =>
        containsKeyword(normalized, keyword)
      )
      return {
        requirementKey: requirement.key,
        confidence: matchedKeywords.length / requirement.keywords.length,
        matchedKeywords,
      }
    })
    .filter((result) => result.matchedKeywords.length > 0)
    .sort((a, b) => b.confidence - a.confidence)
}
