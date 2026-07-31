import { Inbox, ListChecks, Send, FileCheck2 } from 'lucide-react'
import { signInWithGoogle } from '@/app/login/actions'
import { Card } from '@/components/Card'
import { WalkthroughStamp } from './WalkthroughStamp'

function GoogleIcon() {
  return (
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
  )
}

function GoogleSignInButton({
  className = '',
  children = 'Continue with Google',
}: {
  className?: string
  children?: React.ReactNode
}) {
  return (
    <form action={signInWithGoogle}>
      <button
        type="submit"
        className={`inline-flex items-center justify-center gap-2 rounded-card border border-rule bg-white px-4 py-2.5 text-sm font-medium text-ink transition-colors duration-150 hover:border-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 focus-visible:ring-offset-2 focus-visible:ring-offset-paper ${className}`}
      >
        <GoogleIcon />
        {children}
      </button>
    </form>
  )
}

const STEPS = [
  {
    icon: Inbox,
    label: 'Log what came in',
    description: "Paste the applicant's email or message. No forms to fill out.",
  },
  {
    icon: ListChecks,
    label: 'Checked automatically',
    description:
      "Matched locally against your jurisdiction's requirement list. Rules and text similarity, never an AI call.",
  },
  {
    icon: Send,
    label: "Chase what's missing",
    description:
      'A specific, ready-to-send message naming exactly what’s still needed.',
  },
  {
    icon: FileCheck2,
    label: 'Audit packet',
    description:
      'Once complete, everything compiles into one timestamped record.',
  },
]

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-paper">
      <header className="flex items-center justify-between px-6 py-5">
        <h1 className="font-display text-lg font-bold text-ink">
          ApplyChase
        </h1>
        <GoogleSignInButton className="px-3 py-1.5 text-sm" />
      </header>

      <main className="mx-auto w-full max-w-3xl px-6 pb-20 pt-8">
        <section className="text-center">
          <h2 className="font-display text-3xl font-bold leading-tight text-ink sm:text-4xl">
            Know what every applicant still owes you, and prove it if they
            ever ask.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-ink-soft">
            Paste in what an applicant sends you. ApplyChase checks it
            against what&rsquo;s required, chases what&rsquo;s missing, and
            keeps a timestamped record. No accept/deny scoring, ever.
          </p>
          <div className="mt-8 flex flex-col items-center gap-2">
            <GoogleSignInButton className="px-5 py-3 text-base" />
            <p className="text-xs text-ink-soft">
              Free to start. No per-document AI fees, ever.
            </p>
          </div>
        </section>

        <section className="mt-20">
          <h3 className="font-display text-xl font-bold text-ink">
            What&rsquo;s actually eating your time
          </h3>
          <ul className="mt-4 space-y-2 text-sm text-ink-soft">
            <li>&bull; Emailing the same applicant three times for one missing pay stub</li>
            <li>
              &bull; No record of what came in or when, until a rejected
              applicant disputes it
            </li>
            <li>
              &bull; New state paperwork rules and more regulatory scrutiny on
              screening documents, with no sign of easing up
            </li>
          </ul>
        </section>

        <section className="mt-20">
          <h3 className="font-display text-xl font-bold text-ink">
            How it works
          </h3>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {STEPS.map((step, index) => (
              <Card key={step.label} className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-ink-soft">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <step.icon
                    className="h-5 w-5 text-folder-tan"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                </div>
                <p className="text-sm font-semibold text-ink">{step.label}</p>
                <p className="text-xs text-ink-soft">{step.description}</p>
                {index === 1 && (
                  <div className="mt-1">
                    <WalkthroughStamp />
                  </div>
                )}
              </Card>
            ))}
          </div>
        </section>

        <p className="mt-20 rounded-card border border-folder-tan/40 bg-folder-tan/10 px-4 py-3 text-center text-xs text-ink-soft">
          ApplyChase tracks document intake only. It never scores, ranks, or
          recommends a decision on an applicant.
        </p>

        <section className="mt-16 text-center">
          <GoogleSignInButton className="px-5 py-3 text-base" />
          <p className="mt-2 text-xs text-ink-soft">
            Free to start. No per-document AI fees, ever.
          </p>
        </section>

        <footer className="mt-16 text-center text-xs text-ink-soft">
          ApplyChase: a document intake tool for independent landlords.
        </footer>
      </main>
    </div>
  )
}
