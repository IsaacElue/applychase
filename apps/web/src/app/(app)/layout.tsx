import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/app/login/actions'
import { buttonVariants } from '@/components/Button'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="flex flex-1 flex-col bg-paper">
      <header className="print:hidden flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-rule bg-card px-6 py-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <h1 className="font-display text-lg font-bold text-ink">
            ApplyChase
          </h1>
          <nav className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-soft">
            <Link href="/" className="rounded-tag hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40">
              Case Files
            </Link>
            <Link href="/properties" className="rounded-tag hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40">
              Properties
            </Link>
            <Link href="/applicants/new" className="rounded-tag hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40">
              + New Applicant
            </Link>
            <Link href="/settings" className="rounded-tag hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40">
              Settings
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4 text-sm text-ink-soft">
          <span className="hidden sm:inline">{user?.email}</span>
          <form action={signOut}>
            <button className={`${buttonVariants('secondary')} px-3 py-1.5`}>
              Sign out
            </button>
          </form>
        </div>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  )
}
