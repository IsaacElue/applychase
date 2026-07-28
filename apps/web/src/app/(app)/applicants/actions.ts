'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function createApplicant(formData: FormData) {
  const property_id = formData.get('property_id') as string
  const name = formData.get('name') as string
  const email = (formData.get('email') as string) || null
  const phone = (formData.get('phone') as string) || null

  const supabase = await createClient()

  const { data: caseFileId, error } = await supabase.rpc(
    'create_applicant_case_file',
    {
      p_property_id: property_id,
      p_name: name,
      p_email: email,
      p_phone: phone,
    }
  )

  if (error) {
    redirect(`/applicants/new?error=${encodeURIComponent(error.message)}`)
  }

  redirect(`/case-files/${caseFileId}`)
}
