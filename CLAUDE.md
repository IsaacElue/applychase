# CLAUDE.md — working instructions for this repo

This file is read automatically at the start of every Claude Code session in this repo. It's the standing context so the full plan doesn't need to be re-explained each time.

## What this project is

ApplyChase — a compliance-aware document intake and chasing tool for independent landlords. Full spec, architecture, data model, and roadmap live in **`docs/PRD.md`** — read that file in full before doing any work, every session, since it's the source of truth for scope and decisions.

## Non-negotiable constraints (do not drift from these without asking first)

1. **No LLM calls in the default/core path.** Document classification and requirement matching must work via rules + local embeddings (see PRD §8), not by calling out to Anthropic/OpenAI. The only place an LLM is allowed is the optional, off-by-default "polish chase message" feature, and only via a user-supplied API key (BYOK) or local Ollama — never a key this project pays for.
2. **No accept/deny scoring of applicants, ever.** This product tracks document intake only. Do not add any feature, field, or UI that ranks, scores, or recommends a decision on an applicant. If a request seems to drift toward this, stop and flag it rather than building it.
3. **Local-first Supabase.** Develop entirely against `supabase start` (local Docker stack). Do not create or connect to a hosted Supabase project until explicitly told the MVP is ready to deploy — see PRD §16 build order, step 10 is the only point a hosted project gets created.
4. **Follow the build order in PRD §16 in sequence.** Don't jump ahead to the ML service or LLM polish step before the rules-based/local-first loop works end to end. The point of the order is to have a fully working, zero-AI-cost product before any AI layer gets added.

## Session start checklist

1. Read `docs/PRD.md` in full.
2. Check `git status` / recent commits to see what's already built.
3. Check which numbered step in PRD §16 the project is currently at.
4. Confirm Docker Desktop is running before touching anything Supabase-related (`supabase status` is a quick check).
5. Continue from the next unfinished checklist item — don't restart or re-scaffold what already exists.

## Conventions

- Commits: small, one logical change each, clear messages (what changed and why, not just "update files").
- Schema changes always go through `supabase migration new <name>` — never hand-edit the database directly, local or hosted.
- New jurisdiction requirement packs go in `packages/requirements/<state-code>.yaml`, following the shape of `ca.yaml`.
- Before marking a PRD checklist item done, actually run/test it — don't check a box on faith.

## When something in the PRD seems wrong or outdated

Flag it and ask rather than silently deviating. The PRD is a living plan, not scripture, but changes to scope, architecture, or the non-negotiables above should be a conscious decision, not something that happens implicitly mid-build.
