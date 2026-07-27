import { createClient } from '@/lib/supabase/server'
import { signOut } from './login/actions'

export default async function Home() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="flex flex-1 flex-col bg-slate-50">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <h1 className="text-lg font-semibold text-slate-900">ApplyChase</h1>
        <div className="flex items-center gap-4 text-sm text-slate-600">
          <span>{user?.email}</span>
          <form action={signOut}>
            <button className="rounded-md border border-slate-300 px-3 py-1.5 hover:bg-slate-50">
              Sign out
            </button>
          </form>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center">
        <p className="text-slate-500">
          Case files dashboard coming up next.
        </p>
      </main>
    </div>
  )
}
