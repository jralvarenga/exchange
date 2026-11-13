interface Props {
  description: string
  title: string
}

/** Opens an auth form with a large title and one line on what happens next. */
export function AuthHeader({ description, title }: Props) {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="font-bold text-4xl tracking-tighter">{title}</h1>
      <p className="text-muted-foreground">{description}</p>
    </div>
  )
}
