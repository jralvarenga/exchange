import { HistoryEmpty } from '@/components/account/history-empty'
import { HistoryRow } from '@/components/account/history-row'
import { Section } from '@/components/section'
import { SectionHeader } from '@/components/section-header'
import type { HistoryEntry } from '@/lib/activity/history'
import type { WorkspaceMember } from '@/models/workspace/members'

interface Props {
  currentUserId: string
  entries: HistoryEntry[]
  members: WorkspaceMember[]
}

/** Recent orders and changes in the workspace, each tagged with its member and connection. */
export function AccountHistory({ currentUserId, entries, members }: Props) {
  const names = new Map(
    members.map((member) => [member.userId, member.name || member.email])
  )

  /** Names who did something: "You", a member, or someone who left. */
  function actorName(userId: string | null): string {
    if (userId === currentUserId) {
      return 'You'
    }

    return (userId ? names.get(userId) : undefined) ?? 'Former member'
  }

  return (
    <Section className="max-w-3xl" id="history" titleId="history-title">
      <SectionHeader id="history-title" title="History">
        <p className="text-muted-foreground">
          Orders and changes made through Exchange in this workspace.
        </p>
      </SectionHeader>
      {entries.length > 0 ? (
        <ul className="flex flex-col divide-y divide-border border-border border-y">
          {entries.map((entry) => (
            <HistoryRow
              actorName={actorName(entry.userId)}
              entry={entry}
              key={entry.id}
            />
          ))}
        </ul>
      ) : (
        <HistoryEmpty />
      )}
    </Section>
  )
}
