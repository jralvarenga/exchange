interface VisibleActionMessageOptions<T extends { message?: string }> {
  dismissedState: T
  state: T
}

/**
 * Returns the latest action message unless this exact result was dismissed.
 * Identity comparison keeps a cancelled error hidden while still showing a
 * new save result that happens to reuse the same text.
 */
export function getVisibleActionMessage<T extends { message?: string }>(
  options: VisibleActionMessageOptions<T>
): string | undefined {
  if (options.dismissedState === options.state) {
    return undefined
  }

  return options.state.message
}
