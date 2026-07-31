import Link from 'next/link'
import { Building2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import type { Property } from '@/lib/types'
import { buttonVariants } from '@/components/Button'
import { Badge } from '@/components/Badge'
import { EmptyState } from '@/components/EmptyState'

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
        <h2 className="font-display text-xl font-bold text-ink">
          Properties
        </h2>
        <Link href="/properties/new" className={buttonVariants('primary')}>
          + New Property
        </Link>
      </div>

      {error && (
        <p className="rounded-card bg-red-50 px-3 py-2 text-sm text-red-700">
          {error.message}
        </p>
      )}

      {properties && properties.length === 0 && (
        <EmptyState
          icon={Building2}
          message="Every applicant attaches to a property, and each property sets the jurisdiction that determines what documents you need. Add one to get started."
          actionLabel="+ New Property"
          actionHref="/properties/new"
        />
      )}

      {properties && properties.length > 0 && (
        <ul className="divide-y divide-rule rounded-card border border-rule bg-card">
          {properties.map((property) => (
            <li
              key={property.id}
              className="flex items-center justify-between px-4 py-3"
            >
              <p className="text-sm font-semibold text-ink">
                {property.address}
                {property.unit ? ` #${property.unit}` : ''}
              </p>
              <Badge variant="jurisdiction">{property.jurisdiction_code}</Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
