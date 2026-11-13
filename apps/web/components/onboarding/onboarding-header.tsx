interface Props {
  description: string
  step: number
  title: string
  total: number
}

/** The step count, title and one-line purpose at the top of an onboarding step. */
export function OnboardingHeader({ description, step, title, total }: Props) {
  return (
    <header className="flex flex-col gap-2">
      <p className="text-muted-foreground tabular-nums">
        Step {step} of {total}
      </p>
      <h1 className="font-bold text-2xl tracking-tight">{title}</h1>
      <p className="text-muted-foreground">{description}</p>
    </header>
  )
}
