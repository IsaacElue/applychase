'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { encryptSecret } from '@/lib/crypto/byok'

export async function saveLlmCredentials(formData: FormData) {
  const apiKey = (formData.get('api_key') as string) || ''
  const enabled = formData.get('enabled') === 'on'

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
    redirect('/settings?error=No organization found for your account')
  }

  const { data: existing } = await supabase
    .from('llm_credentials')
    .select('id')
    .eq('org_id', profile.org_id)
    .eq('provider', 'anthropic')
    .maybeSingle()

  if (!existing && !apiKey) {
    redirect('/settings?error=Add an API key before enabling AI polish')
  }

  const { error } = existing
    ? await supabase
        .from('llm_credentials')
        .update({
          enabled,
          updated_at: new Date().toISOString(),
          ...(apiKey ? { encrypted_key: encryptSecret(apiKey) } : {}),
        })
        .eq('id', existing.id)
    : await supabase.from('llm_credentials').insert({
        org_id: profile.org_id,
        provider: 'anthropic',
        encrypted_key: encryptSecret(apiKey),
        enabled,
      })

  if (error) {
    redirect(`/settings?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/settings')
  redirect('/settings?message=Saved')
}
