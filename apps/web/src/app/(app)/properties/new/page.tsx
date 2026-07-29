import { createClient } from '@/lib/supabase/server'
import { createProperty } from '../actions'
import { Input } from '@/components/Input'
import { Button } from '@/components/Button'

export default async function NewPropertyPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  const supabase = await createClient()

  const { data: packs } = await supabase
    .from('requirement_packs')
    .select('jurisdiction_code')
    .returns<{ jurisdiction_code: string }[]>()

  const jurisdictionCodes = [
    ...new Set((packs ?? []).map((pack) => pack.jurisdiction_code)),
  ]

  return (
    <div className="mx-auto w-full max-w-md px-6 py-8">
      <h2 className="mb-6 font-display text-xl font-bold text-ink">
        New Property
      </h2>

      {error && (
        <p className="mb-4 rounded-card bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <form action={createProperty} className="space-y-5">
        <div>
          <label
            htmlFor="address"
            className="block text-sm font-medium text-ink"
          >
            Address
          </label>
          <Input id="address" name="address" type="text" required className="mt-1" />
        </div>
        <div>
          <label
            htmlFor="unit"
            className="block text-sm font-medium text-ink"
          >
            Unit (optional)
          </label>
          <Input id="unit" name="unit" type="text" className="mt-1" />
        </div>
        <div>
          <label
            htmlFor="jurisdiction_code"
            className="block text-sm font-medium text-ink"
          >
            Jurisdiction
          </label>
          <p className="mt-0.5 text-xs text-ink-soft">
            Determines which documents this property&rsquo;s case files require.
          </p>
          <select
            id="jurisdiction_code"
            name="jurisdiction_code"
            required
            className="mt-1 block w-full rounded-tag border-none bg-folder-tan px-3 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-ink/30"
          >
            {jurisdictionCodes.length === 0 && (
              <option value="">No requirement packs seeded</option>
            )}
            {jurisdictionCodes.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" className="w-full">
          Save Property
        </Button>
      </form>
    </div>
  )
}
