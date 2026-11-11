'use client'

import { PillGroup, type PillOption } from '@/components/pill-group'
import { SectionHeader } from '@/components/section-header'
import { useTheme } from '@/hooks/use-theme'
import type { Theme } from '@/lib/theme'

const themeOptions: PillOption<Theme>[] = [
  { label: 'System', value: 'system' },
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
]

/** Picks a light, dark, or system theme for this browser. */
export function Appearance() {
  const { setTheme, theme } = useTheme()

  return (
    <section
      aria-labelledby="appearance-title"
      className="flex scroll-mt-28 flex-col gap-4"
      id="appearance"
    >
      <SectionHeader id="appearance-title" title="Appearance">
        <p className="text-muted-foreground">
          Saved in this browser. Press D anywhere to flip between light and
          dark.
        </p>
      </SectionHeader>
      <div className="-ml-3">
        <PillGroup
          label="Theme"
          onChange={setTheme}
          options={themeOptions}
          value={theme}
        />
      </div>
    </section>
  )
}
