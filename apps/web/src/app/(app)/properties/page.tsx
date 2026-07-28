import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Property } from '@/lib/types'

export default async function PropertiesPage() {
  const supabase = await createClient()
  const { data: properties, error } = await supabase
    .from('properties')
    .select('*')
    .order('created_at', { ascending: false })
    .returns<Property[]>()

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Properties</h2>
        <Link
          href="/properties/new"
          className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          + New Property
        </Link>
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error.message}
        </p>
      )}

      {properties && properties.length === 0 && (
        <p className="text-sm text-slate-500">
          No properties yet. Add one before creating an applicant.
        </p>
      )}

      {properties && properties.length > 0 && (
        <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
          {properties.map((property) => (
            <li key={property.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium text-slate-900">
                  {property.address}
                  {property.unit ? ` #${property.unit}` : ''}
                </p>
                <p className="text-xs text-slate-500">
                  Jurisdiction: {property.jurisdiction_code}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
