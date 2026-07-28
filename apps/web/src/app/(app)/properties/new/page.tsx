import { createClient } from '@/lib/supabase/server'
import { createProperty } from '../actions'

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
      <h2 className="mb-6 text-lg font-semibold text-slate-900">
        New Property
      </h2>

      {error && (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <form action={createProperty} className="space-y-4">
        <div>
          <label
            htmlFor="address"
            className="block text-sm font-medium text-slate-700"
          >
            Address
          </label>
          <input
            id="address"
            name="address"
            type="text"
            required
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none"
          />
        </div>
        <div>
          <label
            htmlFor="unit"
            className="block text-sm font-medium text-slate-700"
          >
            Unit (optional)
          </label>
          <input
            id="unit"
            name="unit"
            type="text"
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none"
          />
        </div>
        <div>
          <label
            htmlFor="jurisdiction_code"
            className="block text-sm font-medium text-slate-700"
          >
            Jurisdiction
          </label>
          <select
            id="jurisdiction_code"
            name="jurisdiction_code"
            required
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none"
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
        <button
          type="submit"
          className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Save Property
        </button>
      </form>
    </div>
  )
}
