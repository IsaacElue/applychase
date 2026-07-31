import { createClient } from '@/lib/supabase/server'
import type { LlmCredential } from '@/lib/types'
import { saveLlmCredentials } from './actions'
import { Input } from '@/components/Input'
import { Button } from '@/components/Button'

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>
}) {
  const { error, message } = await searchParams
  const supabase = await createClient()

  const { data: credential } = await supabase
    .from('llm_credentials')
    .select('*')
    .eq('provider', 'anthropic')
    .maybeSingle<LlmCredential>()

  return (
    <div className="mx-auto w-full max-w-md px-6 py-8">
      <h2 className="mb-2 font-display text-xl font-bold text-ink">
        Settings
      </h2>
      <p className="mb-6 text-sm text-ink-soft">
        Chase messages are template-based by default, at no cost. Optionally
        add your own Anthropic API key to polish the wording. Off by default.
        Your key stays encrypted, never used for anything else.
      </p>

      {error && (
        <p className="mb-4 rounded-card bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {message && (
        <p className="mb-4 rounded-card bg-verified/10 px-3 py-2 text-sm text-verified">
          {message}
        </p>
      )}

      <form action={saveLlmCredentials} className="space-y-5">
        <div>
          <label
            htmlFor="api_key"
            className="block text-sm font-medium text-ink"
          >
            Anthropic API key
          </label>
          <Input
            id="api_key"
            name="api_key"
            type="password"
            autoComplete="off"
            placeholder={
              credential ? 'Saved, leave blank to keep it unchanged' : 'sk-ant-...'
            }
            className="mt-1"
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            id="enabled"
            name="enabled"
            type="checkbox"
            defaultChecked={credential?.enabled ?? false}
            className="h-4 w-4 rounded-tag border-rule text-ink focus:ring-ink/20"
          />
          <label htmlFor="enabled" className="text-sm text-ink">
            Enable AI polish for chase messages
          </label>
        </div>
        <Button type="submit">Save</Button>
      </form>
    </div>
  )
}
