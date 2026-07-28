'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function createProperty(formData: FormData) {
  const address = formData.get('address') as string
  const unit = (formData.get('unit') as string) || null
  const jurisdiction_code = formData.get('jurisdiction_code') as string

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
    redirect('/properties/new?error=No organization found for your account')
  }

  const { error } = await supabase.from('properties').insert({
    org_id: profile.org_id,
    address,
    unit,
    jurisdiction_code,
  })

  if (error) {
    redirect(`/properties/new?error=${encodeURIComponent(error.message)}`)
  }

  redirect('/properties')
}
