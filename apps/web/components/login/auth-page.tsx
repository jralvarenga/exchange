interface Props {
  children: React.ReactNode
}

/** Centers an authentication form on the same canvas as the dashboard. */
export function AuthPage({ children }: Props) {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <div className="w-full max-w-sm">{children}</div>
    </main>
  )
}
