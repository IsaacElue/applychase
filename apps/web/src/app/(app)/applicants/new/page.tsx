import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Property } from '@/lib/types'
import { createApplicant } from '../actions'

export default async function NewApplicantPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  const supabase = await createClient()

  const { data: properties } = await supabase
    .from('properties')
    .select('*')
    .order('created_at', { ascending: false })
    .returns<Property[]>()

  if (!properties || properties.length === 0) {
    return (
      <div className="mx-auto w-full max-w-md px-6 py-8">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          New Applicant
        </h2>
        <p className="text-sm text-slate-500">
          You need a property before adding an applicant.{' '}
          <Link href="/properties/new" className="text-slate-900 underline">
            Add one now
          </Link>
          .
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-md px-6 py-8">
      <h2 className="mb-6 text-lg font-semibold text-slate-900">
        New Applicant
      </h2>

      {error && (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <form action={createApplicant} className="space-y-4">
        <div>
          <label
            htmlFor="property_id"
            className="block text-sm font-medium text-slate-700"
          >
            Property
          </label>
          <select
            id="property_id"
            name="property_id"
            required
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none"
          >
            {properties.map((property) => (
              <option key={property.id} value={property.id}>
                {property.address}
                {property.unit ? ` #${property.unit}` : ''} (
                {property.jurisdiction_code})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-slate-700"
          >
            Applicant name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none"
          />
        </div>
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-slate-700"
          >
            Email (optional)
          </label>
          <input
            id="email"
            name="email"
            type="email"
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none"
          />
        </div>
        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-slate-700"
          >
            Phone (optional)
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Create Case File
        </button>
      </form>
    </div>
  )
}
