interface MatchesSymbolQueryOptions {
  query: string
  values: Array<string | undefined>
}

/** Returns whether any value contains the typed query, ignoring case and spaces around it. */
export function matchesSymbolQuery(
  options: MatchesSymbolQueryOptions
): boolean {
  const query = options.query.trim().toLocaleLowerCase('en-US')

  if (!query) {
    return true
  }

  return options.values.some((value) =>
    value?.toLocaleLowerCase('en-US').includes(query)
  )
}
