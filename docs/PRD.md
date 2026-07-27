# ApplyChase — Product Requirements Document

**Status:** Pre-build spec, v1.0
**Purpose of this document:** This is the single source of truth for building ApplyChase. It is written to be read and executed against by an AI coding agent (Claude Code) as well as by a human. Every section that implies work has explicit, checkable tasks.

---

## 1. Vision

Independent landlords shouldn't need enterprise software or a compliance officer to run a defensible tenant-screening process. ApplyChase turns the messiest, most manual part of leasing — collecting and proving you collected the right documents — into a system that runs mostly on rules and local models, not on a subscription to someone else's AI meter. The long-term vision is a self-hosted-friendly, low-marginal-cost "case file" layer that any independent landlord can run, that gets smarter over time from its own accumulated data rather than from calling out to an expensive LLM on every action.

## 2. The Problem

Independent landlords and small property managers (1–200 doors) don't struggle with the *screening decision* — that part is commoditized (TransUnion SmartMove, RentPrep, etc. already do credit/background checks well). They struggle with everything around it:

- Manually emailing applicants a form, then manually chasing whichever document is missing
- No single, dated record of what was received and when — which becomes a liability the moment a rejected applicant disputes the process
- Rising compliance load: new state-level documentation requirements (e.g., California's 2025 unit-photo/timestamp rule) and active FTC/CFPB scrutiny of how landlords use screening data
- Speed matters — the first applicant with a complete file usually wins the unit, so every day spent manually chasing a document is a day a stronger applicant rents elsewhere

This is a **rising, not saturated** problem: the compliance burden is going up, and unlike bookkeeping (absorbed by QuickBooks' native AI) or ticket routing (absorbed by Zendesk/Freshdesk), no incumbent has fully owned this specific "chase and assemble" workflow yet.

## 3. The Solution

ApplyChase is a case-file system, not a chatbot and not a screening-decision engine.

1. Applicant documents/details come in (uploaded file, pasted text, or forwarded email)
2. The system checks each item against a jurisdiction-specific requirements checklist
3. Missing items trigger a specific, applicant-named chase message (not a generic reminder)
4. Once complete, the system assembles a single timestamped audit packet: what was received, when, and an explicit statement that no automated accept/deny decision was made

**Explicit non-goal:** ApplyChase never scores, ranks, or recommends accept/deny on an applicant. That is a legal and ethical line, not just a scoping choice — algorithmic tenant-screening decisioning is under active regulatory review, and the product's core value (a defensible paper trail) depends on staying on the "documentation," not "decisioning," side of that line.

## 4. Target Market

- **Primary:** Independent landlords self-managing 1–20 units
- **Secondary:** Small property management companies handling 20–200 doors across multiple owners
- **Explicitly not the target (v1):** Large multifamily portfolios already on Yardi/RealPage/AppFolio with built-in screening workflows — they're a different sales motion and already have this problem partially solved

## 5. Value Proposition

| Who | Value |
|---|---|
| Landlord | Hours saved per applicant; faster time-to-lease; a defensible record if a decision is ever challenged |
| Applicant | Fewer vague "you're missing something" emails; faster, clearer answers |
| Small PM company | Standardized process across multiple owners/properties without hiring a compliance admin |

## 6. Wedge & Moat

- **Wedge:** Own the unglamorous middle — chasing and assembling — that neither the screening-report providers nor the full property-management suites treat as their core product. Differentiate on the audit trail, not on doing screening "better."
- **Moat (early):** Jurisdiction-specific requirement packs (CA today, more states over time) are annoying, unglamorous research to build and maintain — that's real, defensible work, not a demo feature.
- **Moat (compounding):** Every case file processed is training data for the system's own local classifier (see §8) — the more a given landlord/market uses it, the more accurate and less LLM-dependent it gets, which is a data moat competitors using generic LLM wrappers don't accumulate.

## 7. Explicit Non-Goals (v1)

- No credit/background report generation (integrate with existing providers, don't rebuild)
- No accept/deny scoring or ranking of applicants
- No full property-management suite (accounting, maintenance tickets, lease e-signing) — integrate with existing tools instead of replacing them
- No enterprise/multifamily sales motion in v1

---

## 8. AI / ML Architecture — cost-conscious by design

The person building this explicitly does not want a product whose unit economics depend on burning LLM API credits per action. Design accordingly, in this priority order:

1. **Deterministic rules engine (zero cost, do this first):** Jurisdiction requirements live as versioned config (YAML/JSON), not model output — e.g. `jurisdictions/ca.yaml` lists required item types, keywords, and any state-specific fields (like CA's unit-photo requirement). Most "is this document present and does it look right" logic should be rule/keyword matching against filenames, email subject lines, and extracted text — not a model call.
2. **Local, self-hosted embeddings for classification (near-zero marginal cost):** For fuzzy matching ("is this pasted text plausibly a pay stub description?") use a small local sentence-embedding model (e.g. `all-MiniLM-L6-v2` via `sentence-transformers`, or an ONNX-exported equivalent) run in-process or in a small Python microservice. Precompute one embedding per required-document category description; classify incoming text by cosine similarity. This is genuine ML, runs on CPU, costs nothing per request, and needs no API key.
3. **Local OCR for real files (zero cost):** When an actual file is uploaded (PDF/image), extract text with an open-source OCR pipeline (Tesseract via `pytesseract`, or `unstructured`/`pdfplumber` for text PDFs) before classification. No cloud OCR API.
4. **Own-data ML over time (compounding, zero marginal cost once trained):** As the product accumulates labeled outcomes (landlord confirms/rejects the classifier's guess), periodically retrain a lightweight local classifier (e.g. logistic regression or a small gradient-boosted tree on TF-IDF or embedding features) on the landlord's own corrected history. This is the actual "gets smarter without more tokens" mechanism — classic supervised ML, not an LLM call, and it's trained on your own users' correction data, which nobody else has.
5. **LLM use — opt-in and isolated, never required for core function (BYOK):**
   - Chase-message drafting is the *only* place a generative model adds real value (natural, specific-sounding language). Ship this as **template-based by default** (fill-in-the-blank sentences referencing the missing item names — zero cost) with an **optional "polish with AI" toggle** that requires the landlord's own Anthropic/OpenAI API key (bring-your-own-key), stored encrypted, so the product's own margins are never exposed to per-call LLM cost.
   - If self-hosted inference is wanted instead of BYOK cloud calls, support an **Ollama** integration (local LLM, e.g. Llama 3 8B or similar, running on the landlord's or the company's own hardware) as an alternative backend for the same "polish" step — zero marginal cost, zero external API dependency, at the cost of needing a machine to run it on.
   - MCP: if/when this integrates with external services (email sending, calendar, a screening-report provider's API), expose those as MCP servers/tools rather than hardcoding vendor SDKs — keeps the integration layer swappable and lets Claude Code (or Claude in-product) call them uniformly later.
6. **What NOT to build:** No per-document LLM classification call in the default path — that's the exact "AI credits" cost structure being avoided. The rules engine + local embeddings should resolve the large majority of classifications; LLM/BYOK is a fallback for ambiguous cases only, and even then, it's optional and user-funded.

---

## 9. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js (React) + TypeScript, Tailwind CSS | Fast to build, good Claude Code familiarity, server components for the dashboard |
| Backend / API | Next.js API routes (MVP) → dedicated Node/Express or FastAPI service (post-MVP, once the ML microservice needs isolation) | Keep MVP monolithic; split when the Python ML service justifies it |
| ML microservice | Python, FastAPI, `sentence-transformers`, `scikit-learn`, `pytesseract` / `unstructured` | Local embeddings, local OCR, local classical ML — no external API dependency |
| Database | PostgreSQL (via Supabase or self-hosted) | Relational fit for case files, requirement items, audit logs; Supabase gives auth + storage for free-tier MVP |
| File storage | S3-compatible (Supabase Storage or Cloudflare R2) | Uploaded documents |
| Auth | Supabase Auth or Clerk | Don't build auth from scratch |
| Optional LLM (BYOK) | Anthropic API, key stored per-user, encrypted at rest | Only for the "polish chase message" opt-in path |
| Optional local LLM | Ollama (self-hosted) | Zero-marginal-cost alternative to BYOK cloud calls |
| Email sending | Resend or Postmark | Transactional email for chase messages |
| Hosting | Vercel (frontend) + Railway/Fly.io (Python ML service) | Simple, cheap, matches Next.js + FastAPI split |
| CI | GitHub Actions | Lint, typecheck, test on PR |

---

## 10. Data Model (initial)

```
organizations
  id, name, plan, created_at

users
  id, org_id, email, role (owner/manager), created_at

properties
  id, org_id, address, unit, jurisdiction_code

applicants
  id, property_id, name, email, phone, status, created_at

requirement_packs        -- versioned per jurisdiction
  id, jurisdiction_code, version, requirements (jsonb)

case_files
  id, applicant_id, requirement_pack_id, created_at

case_items
  id, case_file_id, requirement_key, status (missing/received/flagged),
  source_text, matched_confidence, matched_by (rule/embedding/llm),
  received_at, reviewed_by

chase_messages
  id, case_file_id, method (template/llm/ollama), body, sent_at

audit_log
  id, case_file_id, event_type, event_payload (jsonb), actor, created_at
```

---

## 11. MVP Scope (2–3 weeks)

Goal: prove the core loop — intake → classify → chase → assemble — for one jurisdiction, with zero required LLM spend.

- [ ] Auth + org/property setup (Supabase Auth)
- [ ] Single jurisdiction pack: California, hardcoded `requirements` config (5 items as prototyped: application, ID, income proof, background-check consent, prior-landlord contact)
- [ ] Applicant intake form (manual entry, no public-facing portal yet)
- [ ] Case file view with the 5 requirement items, rule-based + embedding-based classification of pasted text against each item (no LLM call required)
- [ ] Template-based chase message generation (fill-in-the-blank, zero cost) with a copy-to-clipboard / send-via-email action
- [ ] Optional "polish with AI" toggle, BYOK, off by default
- [ ] Audit packet view: compiled, timestamped, printable/exportable summary per case file
- [ ] Basic dashboard: list of case files with completeness indicator
- [ ] Deploy: Vercel + Railway, single jurisdiction, single org (yourself) as the test tenant

**MVP explicitly excludes:** multi-jurisdiction packs, public applicant-facing portal, real screening-report API integration, team roles/permissions beyond owner, retraining pipeline, Ollama integration.

## 12. Full Product Roadmap (post-MVP)

**Phase 2 — Multi-jurisdiction + applicant portal (4–6 weeks)**
- [ ] Public applicant-facing intake link (no login required for applicant)
- [ ] Real file upload + OCR pipeline (Tesseract/`unstructured`) replacing "paste a description"
- [ ] 3–5 additional state requirement packs
- [ ] Email-based chase automation (scheduled follow-ups, not just one-off drafts)
- [ ] Team roles: owner vs. manager, multi-property orgs

**Phase 3 — Real classification pipeline (4 weeks)**
- [ ] Python ML microservice live: local embeddings replace/augment rule matching
- [ ] Landlord correction UI (confirm/reject a classification) — this is the labeled-data flywheel
- [ ] First retraining pass on accumulated correction data (logistic regression / gradient boosting on embeddings)
- [ ] Confidence-based routing: high-confidence → auto-log, low-confidence → flag for landlord review, only-if-BYOK-enabled → optional LLM fallback

**Phase 4 — Integrations (ongoing)**
- [ ] Screening-report provider integration (e.g., TransUnion SmartMove) via API/MCP server, not rebuilt
- [ ] Calendar/property-management tool integrations (Google Calendar, existing PM software) via MCP
- [ ] Ollama support as a self-hosted alternative to BYOK cloud LLM for the "polish" step
- [ ] Webhooks / Zapier-style connector for landlords already on other tools

**Phase 5 — Compliance depth**
- [ ] Full 50-state requirement pack library
- [ ] Fair-housing-aware language checks on any landlord-authored communication (rule-based flagging of risky phrasing, not AI-generated legal advice)
- [ ] Exportable, shareable audit packets formatted for potential dispute/legal use

---

## 13. Success Metrics

- **MVP validation:** 5–10 real landlords use it for at least one real applicant cycle; qualitative feedback on whether it actually reduced chasing effort
- **Activation:** % of case files that reach "complete" without the landlord manually emailing outside the tool
- **Core value metric:** average time-to-complete-file, before vs. after adoption (self-reported for MVP, measured directly once traffic exists)
- **Cost discipline:** % of classifications resolved without any LLM call (target: >90% by Phase 3)

## 14. Risks

- **Regulatory risk:** screening-adjacent products draw scrutiny; staying strictly on the "documentation, not decisioning" side of the line is a product requirement, not just a talking point — revisit this framing before any feature that could be read as scoring applicants
- **Thin moat early:** four comparable "workflow orchestration" tools already exist in this space per market scan; the audit-trail framing and jurisdiction-pack depth are the differentiation, and both take real time to build
- **Cold-start on the ML flywheel:** local embeddings + rules need to be good enough on day one, since the retraining flywheel (§8.4) has no data until real usage happens

---

## 15. Suggested Repo Structure (for Claude Code)

```
applychase/
  apps/
    web/                # Next.js frontend + API routes
    ml-service/          # Python FastAPI: embeddings, OCR, classical ML
  packages/
    requirements/         # jurisdiction config packs (ca.yaml, ...)
    shared-types/          # TS types shared by web + (generated) ml-service client
  infra/
    supabase/               # schema.sql, migrations
  docs/
    PRD.md                    # this file
```

## 16. Build Order for Claude Code

1. Scaffold `apps/web` (Next.js + TS + Tailwind), wire Supabase auth
2. Create `infra/supabase/schema.sql` from §10, run migrations
3. Build `packages/requirements/ca.yaml` from §11's 5-item CA pack
4. Build case-file UI (list + detail) reading/writing to Postgres, no ML yet — hardcode rule-based keyword matching first so the loop works end to end
5. Add template-based chase message generation (no LLM)
6. Add audit packet view/export
7. Only after the above works end-to-end: stand up `apps/ml-service` and swap keyword matching for local embedding similarity
8. Only after that: add the optional BYOK "polish" toggle, off by default

Build in this order — a fully working, zero-LLM-cost MVP first, AI layered on as an optional enhancement, never as a dependency for the core loop to function.
