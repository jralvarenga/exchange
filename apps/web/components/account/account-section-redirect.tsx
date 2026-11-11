'use client'

import { useEffect } from 'react'

import { isAccountSectionId } from '@/lib/account/sections'

interface Props {
  section?: string
}

/** Scrolls to a section after a query-param redirect from a retired route. */
export function AccountSectionRedirect({ section }: Props) {
  useEffect(() => {
    if (!section || !isAccountSectionId(section)) {
      return
    }

    document.getElementById(section)?.scrollIntoView()
    window.history.replaceState(null, '', `/account#${section}`)
  }, [section])

  return null
}
