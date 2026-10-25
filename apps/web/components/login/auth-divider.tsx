/** Visual break between Google sign-in and the email form. */
export function AuthDivider() {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
      <span className="h-px bg-border" />
      <span className="text-muted-foreground">or</span>
      <span className="h-px bg-border" />
    </div>
  )
}
