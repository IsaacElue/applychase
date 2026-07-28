// Fill-in-the-blank chase message (PRD §8.5 / §16 step 5) — zero cost,
// no LLM call. The optional "polish with AI" step (later, BYOK/Ollama)
// takes this same output and rewrites it; it never generates from scratch.
export function buildChaseMessage(params: {
  applicantName: string
  orgName?: string | null
  missingLabels: string[]
}): string {
  const { applicantName, orgName, missingLabels } = params

  const itemList = missingLabels.map((label) => `- ${label}`).join('\n')

  return `Hi ${applicantName},

Thanks for applying! To keep your application moving, we still need the following from you:

${itemList}

Please send these over at your earliest convenience so we can finish reviewing your file.

Thanks,
${orgName ?? 'The leasing team'}`
}
