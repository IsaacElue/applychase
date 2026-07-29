import { createClient } from '@/lib/supabase/server'
import type { LlmCredential } from '@/lib/types'
import { saveLlmCredentials } from './actions'

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
      <h2 className="mb-2 text-lg font-semibold text-slate-900">Settings</h2>
      <p className="mb-6 text-sm text-slate-500">
        Chase messages are template-based by default, at no cost. Optionally,
        bring your own Anthropic API key to have AI polish the wording before
        you send it — off by default, and your key is encrypted at rest and
        never used for anything else.
      </p>

      {error && (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {message && (
        <p className="mb-4 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
          {message}
        </p>
      )}

      <form action={saveLlmCredentials} className="space-y-4">
        <div>
          <label
            htmlFor="api_key"
            className="block text-sm font-medium text-slate-700"
          >
            Anthropic API key
          </label>
          <input
            id="api_key"
            name="api_key"
            type="password"
            autoComplete="off"
            placeholder={
              credential ? 'Saved — leave blank to keep it unchanged' : 'sk-ant-...'
            }
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            id="enabled"
            name="enabled"
            type="checkbox"
            defaultChecked={credential?.enabled ?? false}
            className="h-4 w-4 rounded border-slate-300"
          />
          <label htmlFor="enabled" className="text-sm text-slate-700">
            Enable AI polish for chase messages
          </label>
        </div>
        <button
          type="submit"
          className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Save
        </button>
      </form>
    </div>
  )
}
