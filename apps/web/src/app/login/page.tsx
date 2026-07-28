import { signInWithGoogle } from './actions'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>
}) {
  const { error, message } = await searchParams

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm space-y-6 rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">ApplyChase</h1>
          <p className="text-sm text-slate-500">Sign in to your account</p>
        </div>

        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        {message && (
          <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
            {message}
          </p>
        )}

        <form action={signInWithGoogle}>
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M23.49 12.27c0-.82-.07-1.42-.22-2.05H12v3.85h6.5c-.13 1.03-.83 2.6-2.4 3.65l-.02.15 3.48 2.65.24.02c2.22-2 3.5-4.95 3.5-8.27"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.05 7.93-2.86l-3.78-2.9c-1.01.7-2.36 1.19-4.15 1.19-3.17 0-5.86-2.05-6.82-4.9l-.14.01-3.62 2.75-.05.13C3.36 21.3 7.35 24 12 24"
              />
              <path
                fill="#FBBC05"
                d="M5.18 14.53a7.2 7.2 0 0 1-.4-2.53c0-.88.16-1.73.39-2.53l-.01-.17-3.66-2.8-.12.06A11.96 11.96 0 0 0 0 12c0 1.93.47 3.76 1.38 5.44l3.8-2.91"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c2.25 0 3.77.96 4.64 1.77l3.39-3.29C17.94 1.2 15.24 0 12 0 7.35 0 3.36 2.7 1.38 6.56l3.79 2.91c.97-2.85 3.66-4.9 6.83-4.9"
              />
            </svg>
            Continue with Google
          </button>
        </form>
      </div>
    </div>
  )
}
