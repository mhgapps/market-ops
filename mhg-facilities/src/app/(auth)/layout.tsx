import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'MHG Facilities - Authentication',
  description: 'Sign in to manage your facilities',
}

// String constants for bilingual support (EN/ES extraction ready)
export const AUTH_STRINGS = {
  APP_NAME: 'MHG Facilities',
  APP_TAGLINE: 'Streamline your facility management',
} as const

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Main content area - centered card */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Logo/Branding section */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-foreground">
              {AUTH_STRINGS.APP_NAME}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {AUTH_STRINGS.APP_TAGLINE}
            </p>
          </div>

          {/* Auth form content */}
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} MHG Facilities. All rights reserved.</p>
      </footer>
    </div>
  )
}
