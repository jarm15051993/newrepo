'use client'

import { useRouter } from 'next/navigation'

export default function SignupSuccessPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream p-4">
      <div className="bg-warm-white rounded-2xl p-10 w-full max-w-md border border-rule text-center shadow-sm">
        <h1 className="text-3xl font-serif font-light text-burg mb-2 tracking-wide">OOMA Wellness Club</h1>

        {/* Envelope icon */}
        <div className="w-20 h-20 bg-burg-pale/20 border border-burg-pale rounded-full flex items-center justify-center mx-auto mt-8 mb-6">
          <svg className="w-10 h-10 text-burg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>

        <h2 className="text-xl font-serif font-light text-ink mb-3 tracking-wide">Check your email</h2>
        <p className="text-mgray leading-relaxed mb-2 text-sm">
          We sent an activation link to your email address.
        </p>
        <p className="text-mgray leading-relaxed mb-8 text-sm">
          Click the link in the email to activate your account and start booking classes.
        </p>

        <div className="bg-bone rounded-lg px-4 py-3 mb-8 text-left space-y-1.5">
          <p className="text-mgray text-sm">Didn&apos;t receive it?</p>
          <ul className="text-lgray text-xs space-y-1 list-disc list-inside">
            <li>Check your spam or junk folder</li>
            <li>Make sure you entered the right email</li>
            <li>It may take a couple of minutes to arrive</li>
          </ul>
        </div>

        <button
          onClick={() => router.push('/login')}
          className="w-full bg-ink hover:bg-burg text-warm-white font-medium py-3 rounded-lg transition tracking-wider text-sm uppercase"
        >
          Go to Login
        </button>
      </div>
    </div>
  )
}
