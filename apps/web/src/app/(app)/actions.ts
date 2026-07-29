'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { matchText } from '@/lib/matching/rules'
import { applyCaseItemMatches, type CaseItemMatch } from '@/lib/matching/applyMatches'
import type { CaseItem, RequirementPack } from '@/lib/types'

interface CaseFileForSeeding {
  id: string
  requirement_packs: RequirementPack
  case_items: CaseItem[]
}

// Reads naturally enough to hit 3 of the 5 CA pack keywords (rental
// application, driver's license, proof of income) while leaving background
// check consent and prior landlord contact missing, so the seeded case file
// looks like a realistic partial intake rather than an empty or finished one.
const DEMO_SOURCE_TEXT =
  "Attached is my completed rental application along with a copy of my driver's license for ID verification. I've also included proof of income in the form of my recent pay stubs."

// Dev-only: creates one demo property + applicant with a partially-complete
// case file, so classify/chase/audit-packet can be exercised without
// re-typing an applicant by hand every time. Gated in both the page (button
// only renders outside production) and here, since a server action's
// existence doesn't depend on whether the button that calls it is shown.
export async function loadDemoData() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Demo data seeding is not available in production')
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('org_id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/?error=No organization found for your account')
  }

  const { data: property, error: propertyError } = await supabase
    .from('properties')
    .insert({
      org_id: profile.org_id,
      address: '123 Demo Street',
      unit: null,
      jurisdiction_code: 'CA',
    })
    .select('id')
    .single()

  if (propertyError || !property) {
    redirect(
      `/?error=${encodeURIComponent(propertyError?.message ?? 'Could not create demo property')}`
    )
  }

  const { data: caseFileId, error: rpcError } = await supabase.rpc(
    'create_applicant_case_file',
    {
      p_property_id: property.id,
      p_name: 'Demo Applicant',
      p_email: 'demo-applicant@example.com',
      p_phone: null,
    }
  )

  if (rpcError || !caseFileId) {
    redirect(
      `/?error=${encodeURIComponent(rpcError?.message ?? 'Could not create demo case file')}`
    )
  }

  const { data: caseFile } = await supabase
    .from('case_files')
    .select('id, requirement_packs ( * ), case_items ( * )')
    .eq('id', caseFileId)
    .single<CaseFileForSeeding>()

  let justStamped: string[] = []

  if (caseFile) {
    const ruleMatches = matchText(
      DEMO_SOURCE_TEXT,
      caseFile.requirement_packs.requirements
    )

    const matches: CaseItemMatch[] = ruleMatches.map((match) => ({
      requirementKey: match.requirementKey,
      confidence: match.confidence,
      matchedBy: 'rule' as const,
      matchedKeywords: match.matchedKeywords,
    }))

    await applyCaseItemMatches(
      supabase,
      caseFileId,
      caseFile.case_items,
      matches,
      DEMO_SOURCE_TEXT
    )

    justStamped = matches.map((match) => match.requirementKey)
  }

  redirect(
    justStamped.length > 0
      ? `/case-files/${caseFileId}?justStamped=${justStamped.join(',')}`
      : `/case-files/${caseFileId}`
  )
}
