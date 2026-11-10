export type StatusTone = 'negative' | 'neutral' | 'positive' | 'warning'

export type StatusInfo = {
  label: string
  tone: StatusTone
}

const accountStatuses: Record<string, StatusInfo> = {
  ACCOUNT_CLOSED: { label: 'Closed', tone: 'neutral' },
  ACCOUNT_UPDATED: { label: 'Updating', tone: 'warning' },
  ACTION_REQUIRED: { label: 'Action required', tone: 'warning' },
  ACTIVE: { label: 'Active', tone: 'positive' },
  APPROVAL_PENDING: { label: 'Pending approval', tone: 'warning' },
  APPROVED: { label: 'Approved', tone: 'positive' },
  DISABLED: { label: 'Disabled', tone: 'negative' },
  INACTIVE: { label: 'Inactive', tone: 'neutral' },
  ONBOARDING: { label: 'Onboarding', tone: 'warning' },
  REJECTED: { label: 'Rejected', tone: 'negative' },
  SUBMISSION_FAILED: { label: 'Submission failed', tone: 'negative' },
  SUBMITTED: { label: 'Submitted', tone: 'warning' },
}

/** Maps an Alpaca account or crypto status to a readable label and tone. */
export function getAccountStatusInfo(status: string | undefined): StatusInfo {
  if (!status) {
    return { label: 'Not available', tone: 'neutral' }
  }

  return (
    accountStatuses[status.toUpperCase()] ?? {
      label: toSentenceCase(status),
      tone: 'neutral',
    }
  )
}

/** Turns SOME_STATUS into "Some status" for statuses without a mapping. */
function toSentenceCase(value: string): string {
  const words = value.toLowerCase().replaceAll('_', ' ')

  return words.charAt(0).toUpperCase() + words.slice(1)
}

interface FormatMemberSinceOptions {
  createdAt: string
}

const memberSinceFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  timeZone: 'UTC',
  year: 'numeric',
})

/** Formats the account opening date as "Mar 2024". */
export function formatMemberSince(
  options: FormatMemberSinceOptions
): string | undefined {
  const date = new Date(options.createdAt)

  if (Number.isNaN(date.getTime())) {
    return undefined
  }

  return memberSinceFormatter.format(date)
}

export type CredentialStatus = 'invalid' | 'unverified' | 'valid'

interface GetPromptCredentialStatusOptions {
  rejected: boolean
  status: CredentialStatus | undefined
}

/**
 * Status shown on the connect prompt. Unverified keys stay unverified until a
 * request failure proves stored valid keys were rejected.
 */
export function getPromptCredentialStatus(
  options: GetPromptCredentialStatusOptions
): CredentialStatus | undefined {
  if (options.rejected && options.status === 'valid') {
    return 'invalid'
  }

  return options.status
}

/** Describes a stored key pair's state in words, including a missing one. */
export function getCredentialStatusInfo(
  status: CredentialStatus | undefined
): StatusInfo {
  if (status === 'valid') {
    return { label: 'Connected', tone: 'positive' }
  }

  if (status === 'invalid') {
    return { label: 'Rejected', tone: 'negative' }
  }

  if (status === 'unverified') {
    return { label: 'Unverified', tone: 'warning' }
  }

  return { label: 'Not added', tone: 'neutral' }
}
