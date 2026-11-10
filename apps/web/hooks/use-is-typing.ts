import { useEffect, useState } from 'react'

/** Returns whether an element accepts typed text, where a phone shows its keyboard. */
function isTextEntry(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  if (target instanceof HTMLTextAreaElement) {
    return !target.readOnly
  }

  if (target.isContentEditable) {
    return true
  }

  if (target instanceof HTMLInputElement) {
    return (
      !target.readOnly &&
      ['email', 'number', 'password', 'search', 'tel', 'text', 'url'].includes(
        target.type
      )
    )
  }

  return false
}

/** Tracks whether a text field has focus, so floating chrome can step aside. */
export function useIsTyping(): boolean {
  const [typing, setTyping] = useState(false)

  useEffect(() => {
    function onFocusIn(event: FocusEvent): void {
      setTyping(isTextEntry(event.target))
    }

    function onFocusOut(event: FocusEvent): void {
      setTyping(isTextEntry(event.relatedTarget))
    }

    document.addEventListener('focusin', onFocusIn)
    document.addEventListener('focusout', onFocusOut)

    return () => {
      document.removeEventListener('focusin', onFocusIn)
      document.removeEventListener('focusout', onFocusOut)
    }
  }, [])

  return typing
}
