# ApplyChase

**A defensible paper trail for independent landlords — without the chasing.**

---

## The Problem

Independent landlords and small property managers (1–200 units) don't struggle with the tenant-screening *decision* — credit and background checks are commoditized, well-served by existing providers. What actually eats their time and creates real risk is everything *around* the decision:

- Emailing an applicant a form, then manually chasing whichever document is missing — a pay stub here, a signature there, over and over, applicant by applicant
- No single, dated record of what was actually received and when — which becomes a real liability the moment a rejected applicant disputes how they were treated
- A rising compliance bar: new state-level documentation requirements, and active U.S. regulatory scrutiny (FTC/CFPB) into how landlords use screening data — meaning the paperwork burden is going up, not down
- Speed matters: the first applicant with a complete file usually gets the unit, so every day spent chasing a document is a day a stronger applicant rents somewhere else

This is a genuinely underserved, rising problem — not a saturated one. Unlike bookkeeping (absorbed by QuickBooks' built-in AI) or support-ticket routing (absorbed by Zendesk/Freshdesk), no incumbent has fully owned the specific "chase and assemble" workflow yet.

## The Solution

ApplyChase is a **case-file system**, not a chatbot and not a screening-decision engine.

1. An applicant's documents come in
2. ApplyChase checks each item against a jurisdiction-specific requirements checklist — locally, using rules and lightweight matching, never sending applicant data to a paid AI API by default
3. Whatever's missing triggers a specific, named chase message — "we still need your government ID," not a vague nudge
4. Once complete, everything compiles into a single timestamped audit packet: what was received, when, and by what method — with an explicit statement that no automated accept/deny decision was ever made

**The one hard line the product never crosses:** ApplyChase never scores, ranks, or recommends accept/deny on an applicant. That's not just a scoping choice — it's what keeps the product on the right side of the exact regulatory scrutiny landlords are increasingly facing, and it's what makes the audit trail actually trustworthy.

## Why Now

- Compliance requirements are getting heavier, not lighter — the problem is growing
- The AI-cost structure most "AI startups" carry (per-call LLM fees) doesn't apply here — the core product runs on rules and local matching, so unit economics don't degrade as usage scales
- Several "workflow orchestration" tools exist in this space already, but none own the specific chase-and-assemble motion with a compliance-first framing — the wedge is real but not yet claimed by anyone dominant

## Who It's For

**Primary:** Independent landlords self-managing 1–20 units
**Secondary:** Small property management companies handling 20–200 doors
**Not the target (yet):** Large multifamily portfolios already running Yardi/RealPage/AppFolio — different sales motion, different problem stage

## The Real Value

| Who | What they get |
|---|---|
| Landlord | Hours saved per applicant, faster time-to-lease, and a record that actually protects them if a decision is ever challenged |
| Applicant | Fewer vague "you're missing something" emails, faster answers |
| Small PM company | A standardized, defensible process across multiple owners and properties without hiring a compliance admin |

## The Wedge & The Moat

**Wedge:** own the unglamorous middle nobody else wants — chasing and assembling — and differentiate on the audit trail, not on out-competing screening providers or full property-management suites.

**Moat:** jurisdiction-specific requirement packs are tedious, unglamorous research to build and maintain — that's real defensible work. And every case file processed becomes labeled data that improves the product's own local classifier over time, without ever needing to spend more on AI API calls to get smarter — a compounding advantage a generic LLM-wrapper competitor doesn't accumulate.
