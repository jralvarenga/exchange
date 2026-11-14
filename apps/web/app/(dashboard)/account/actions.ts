'use server'

import { findAlpacaConnection } from '@workspace/db/queries/alpaca-connections'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { recordActivity } from '@/lib/activity/record'
import {
  AlpacaCredentialsError,
  addConnection,
  ConnectionNameTakenError,
  connectionActor,
  connectionNameSchema,
  keyMaterialSchema,
  type MaskedConnection,
  removeConnection,
  renameConnection,
  replaceConnectionKeys,
  setActiveConnection,
  setDefaultConnection,
  testConnection,
} from '@/lib/alpaca/connections'
import { alpacaEnvironmentSchema } from '@/lib/alpaca/schemas'
import { requireSession } from '@/lib/auth/require-session'
import { enforceAlpacaCredentialGuard } from '@/lib/auth/settings-guard'
import {
  removeDepositAddress,
  saveDepositAddress,
} from '@/lib/wallet/crypto-wallets'
import {
  depositAddressInputSchema,
  depositAssets,
  depositChains,
} from '@/lib/wallet/deposit-addresses'
import {
  NoWorkspaceError,
  resolveActiveWorkspace,
  resolveExpectedWorkspace,
  STALE_WORKSPACE_MESSAGE,
  WorkspacePermissionError,
  workspaceActor,
} from '@/lib/workspaces/workspace'

interface ConnectionActionState {
  connection?: MaskedConnection
  message?: string
}

interface DepositAddressActionState {
  message?: string
  saved?: boolean
}

const connectionIdSchema = z.string().trim().min(1).max(64)

const depositSlotSchema = z.object({
  asset: z.enum(depositAssets),
  chain: z.enum(depositChains),
})

const addInputSchema = keyMaterialSchema.extend({
  environment: alpacaEnvironmentSchema,
  name: connectionNameSchema,
})

const replaceInputSchema = keyMaterialSchema.extend({
  connectionId: connectionIdSchema,
})

const connectionWorkspaceSchema = z.object({
  connectionId: connectionIdSchema,
  workspaceId: connectionIdSchema,
})

/** Checks a key pair with Alpaca and saves it as a new named connection. */
export async function addConnectionAction(
  _state: ConnectionActionState,
  formData: FormData
): Promise<ConnectionActionState> {
  const session = await requireSession()
  const parsed = addInputSchema.safeParse({
    environment: formData.get('environment'),
    keyId: formData.get('keyId'),
    name: formData.get('name'),
    secret: formData.get('secret'),
  })

  if (!parsed.success) {
    return { message: 'Name the connection and enter its key ID and secret.' }
  }

  try {
    const workspace = await resolveExpectedWorkspace(
      session.user,
      formData.get('workspaceId')
    )

    if (!workspace) {
      return { message: STALE_WORKSPACE_MESSAGE }
    }

    const blocked = await enforceAlpacaCredentialGuard({
      action: 'save',
      environment: parsed.data.environment,
      session,
    })

    if (blocked) {
      return { message: blocked }
    }

    const connection = await addConnection({ ...parsed.data, workspace })
    await recordActivity({
      action: 'connection.added',
      actor: connectionActor(workspace, connection),
      targetId: connection.id,
      targetType: 'connection',
    })
    revalidatePath('/', 'layout')

    return { connection }
  } catch (error) {
    return { message: connectionErrorMessage(error, 'save') }
  }
}

/** Swaps the key pair of an existing connection after Alpaca accepts the new one. */
export async function replaceConnectionKeysAction(
  _state: ConnectionActionState,
  formData: FormData
): Promise<ConnectionActionState> {
  const session = await requireSession()
  const parsed = replaceInputSchema.safeParse({
    connectionId: formData.get('connectionId'),
    keyId: formData.get('keyId'),
    secret: formData.get('secret'),
  })

  if (!parsed.success) {
    return { message: 'Enter the Alpaca key ID and secret.' }
  }

  try {
    const workspace = await resolveExpectedWorkspace(
      session.user,
      formData.get('workspaceId')
    )

    if (!workspace) {
      return { message: STALE_WORKSPACE_MESSAGE }
    }

    const current = await findAlpacaConnection({
      id: parsed.data.connectionId,
      userId: workspace.userId,
      workspaceId: workspace.workspaceId,
    })

    if (!current) {
      return { message: 'That connection no longer exists.' }
    }

    const blocked = await enforceAlpacaCredentialGuard({
      action: 'save',
      environment: alpacaEnvironmentSchema.parse(current.environment),
      session,
    })

    if (blocked) {
      return { message: blocked }
    }

    const connection = await replaceConnectionKeys({
      ...parsed.data,
      workspace,
    })
    await recordActivity({
      action: 'connection.keys_replaced',
      actor: connectionActor(workspace, connection),
      targetId: connection.id,
      targetType: 'connection',
    })
    revalidatePath('/', 'layout')

    return { connection }
  } catch (error) {
    return { message: connectionErrorMessage(error, 'save') }
  }
}

/** Calls Alpaca with a stored connection and returns the masked result. */
export async function testConnectionAction(
  connectionId: string,
  workspaceId: string
): Promise<ConnectionActionState> {
  const session = await requireSession()
  const parsed = connectionWorkspaceSchema.safeParse({
    connectionId,
    workspaceId,
  })

  if (!parsed.success) {
    return { message: 'The connection could not be tested.' }
  }

  try {
    const workspace = await resolveExpectedWorkspace(
      session.user,
      parsed.data.workspaceId
    )

    if (!workspace) {
      return { message: STALE_WORKSPACE_MESSAGE }
    }

    const current = await findAlpacaConnection({
      id: parsed.data.connectionId,
      userId: workspace.userId,
      workspaceId: workspace.workspaceId,
    })

    if (!current) {
      return { message: 'That connection no longer exists.' }
    }

    const blocked = await enforceAlpacaCredentialGuard({
      action: 'test',
      environment: alpacaEnvironmentSchema.parse(current.environment),
      session,
    })

    if (blocked) {
      return { message: blocked }
    }

    const connection = await testConnection({
      connectionId: parsed.data.connectionId,
      workspace,
    })
    await recordActivity({
      action: 'connection.tested',
      actor: connectionActor(workspace, connection),
      metadata: { status: connection.status },
      targetId: connection.id,
      targetType: 'connection',
    })
    revalidatePath('/', 'layout')

    return { connection }
  } catch (error) {
    revalidatePath('/', 'layout')

    return { message: connectionErrorMessage(error, 'test') }
  }
}

/** Renames a connection. Owners and admins. */
export async function renameConnectionAction(
  connectionId: string,
  name: string,
  workspaceId: string
): Promise<ConnectionActionState> {
  const session = await requireSession()
  const parsed = z
    .object({
      connectionId: connectionIdSchema,
      name: connectionNameSchema,
      workspaceId: connectionIdSchema,
    })
    .safeParse({ connectionId, name, workspaceId })

  if (!parsed.success) {
    return { message: 'Use a name between 1 and 40 characters.' }
  }

  try {
    const workspace = await resolveExpectedWorkspace(
      session.user,
      parsed.data.workspaceId
    )

    if (!workspace) {
      return { message: STALE_WORKSPACE_MESSAGE }
    }

    await renameConnection({ ...parsed.data, workspace })
    const renamed = await findAlpacaConnection({
      id: parsed.data.connectionId,
      userId: workspace.userId,
      workspaceId: workspace.workspaceId,
    })

    if (renamed) {
      await recordActivity({
        action: 'connection.renamed',
        actor: connectionActor(workspace, renamed),
        targetId: renamed.id,
        targetType: 'connection',
      })
    }

    revalidatePath('/', 'layout')

    return {}
  } catch (error) {
    return { message: connectionErrorMessage(error, 'rename') }
  }
}

/** Deletes a connection from the workspace. Owners and admins. */
export async function removeConnectionAction(
  connectionId: string,
  workspaceId: string
): Promise<ConnectionActionState> {
  const session = await requireSession()
  const parsed = connectionWorkspaceSchema.safeParse({
    connectionId,
    workspaceId,
  })

  if (!parsed.success) {
    return { message: 'That connection could not be removed.' }
  }

  try {
    const workspace = await resolveExpectedWorkspace(
      session.user,
      parsed.data.workspaceId
    )

    if (!workspace) {
      return { message: STALE_WORKSPACE_MESSAGE }
    }

    const removed = await removeConnection({
      connectionId: parsed.data.connectionId,
      workspace,
    })
    // The row is gone, so the log keeps only the copied name and environment.
    await recordActivity({
      action: 'connection.removed',
      actor: { ...connectionActor(workspace, removed), connectionId: null },
      targetId: removed.id,
      targetType: 'connection',
    })
    revalidatePath('/', 'layout')

    return {}
  } catch (error) {
    return { message: connectionErrorMessage(error, 'remove') }
  }
}

/** Switches the connection this member trades with. */
export async function switchConnectionAction(
  connectionId: string,
  workspaceId: string
): Promise<ConnectionActionState> {
  const session = await requireSession()
  const parsed = connectionWorkspaceSchema.safeParse({
    connectionId,
    workspaceId,
  })

  if (!parsed.success) {
    return { message: 'The active connection could not be changed.' }
  }

  try {
    const workspace = await resolveExpectedWorkspace(
      session.user,
      parsed.data.workspaceId
    )

    if (!workspace) {
      return { message: STALE_WORKSPACE_MESSAGE }
    }

    const connection = await setActiveConnection({
      connectionId: parsed.data.connectionId,
      workspace,
    })
    await recordActivity({
      action: 'connection.switched',
      actor: connectionActor(workspace, connection),
      targetId: connection.id,
      targetType: 'connection',
    })
    revalidatePath('/', 'layout')

    return {}
  } catch (error) {
    return { message: connectionErrorMessage(error, 'switch') }
  }
}

/** Makes a connection the workspace default. Owners and admins. */
export async function setDefaultConnectionAction(
  connectionId: string,
  workspaceId: string
): Promise<ConnectionActionState> {
  const session = await requireSession()
  const parsed = connectionWorkspaceSchema.safeParse({
    connectionId,
    workspaceId,
  })

  if (!parsed.success) {
    return { message: 'The default connection could not be changed.' }
  }

  try {
    const workspace = await resolveExpectedWorkspace(
      session.user,
      parsed.data.workspaceId
    )

    if (!workspace) {
      return { message: STALE_WORKSPACE_MESSAGE }
    }

    const connection = await setDefaultConnection({
      connectionId: parsed.data.connectionId,
      workspace,
    })
    await recordActivity({
      action: 'connection.default_changed',
      actor: connectionActor(workspace, connection),
      targetId: connection.id,
      targetType: 'connection',
    })
    revalidatePath('/', 'layout')

    return {}
  } catch (error) {
    return { message: connectionErrorMessage(error, 'default') }
  }
}

/** Saves the signed-in user's deposit address for one network and stablecoin. */
export async function saveDepositAddressAction(
  _state: DepositAddressActionState,
  formData: FormData
): Promise<DepositAddressActionState> {
  const session = await requireSession()
  const parsed = depositAddressInputSchema.safeParse({
    address: formData.get('address'),
    asset: formData.get('asset'),
    chain: formData.get('chain'),
  })

  if (!parsed.success) {
    return { message: 'Enter a valid address for this network.' }
  }

  try {
    await saveDepositAddress({ ...parsed.data, userId: session.user.id })
    await recordDepositActivity({
      action: 'deposit_address.saved',
      metadata: { asset: parsed.data.asset, chain: parsed.data.chain },
      user: session.user,
    })
    revalidatePath('/', 'layout')

    return { saved: true }
  } catch {
    return { message: 'That address could not be saved.' }
  }
}

/** Removes the signed-in user's deposit address for one network and stablecoin. */
export async function removeDepositAddressAction(slot: {
  asset: string
  chain: string
}): Promise<DepositAddressActionState> {
  const session = await requireSession()
  const parsed = depositSlotSchema.safeParse(slot)

  if (!parsed.success) {
    return { message: 'That address could not be removed.' }
  }

  try {
    await removeDepositAddress({ ...parsed.data, userId: session.user.id })
    await recordDepositActivity({
      action: 'deposit_address.removed',
      metadata: parsed.data,
      user: session.user,
    })
    revalidatePath('/', 'layout')

    return {}
  } catch {
    return { message: 'That address could not be removed.' }
  }
}

interface RecordDepositActivityInput {
  action: 'deposit_address.removed' | 'deposit_address.saved'
  metadata: Record<string, unknown>
  user: { id: string; name: string }
}

/**
 * Logs a deposit address change in the active workspace. Deposit addresses
 * belong to the user, so someone with no workspace yet still saves them; the
 * log is simply skipped.
 */
async function recordDepositActivity(
  input: RecordDepositActivityInput
): Promise<void> {
  const workspace = await resolveActiveWorkspace(input.user).catch(
    (error: unknown) => {
      if (error instanceof NoWorkspaceError) {
        return undefined
      }

      throw error
    }
  )

  if (workspace) {
    await recordActivity({
      action: input.action,
      actor: workspaceActor(workspace),
      metadata: input.metadata,
    })
  }
}

/** Turns a connection failure into a message the user can act on. */
function connectionErrorMessage(
  error: unknown,
  action: 'default' | 'remove' | 'rename' | 'save' | 'switch' | 'test'
): string {
  if (error instanceof WorkspacePermissionError) {
    return action === 'test'
      ? error.message
      : 'Only workspace owners and admins can change connections.'
  }

  if (error instanceof ConnectionNameTakenError) {
    return 'Another connection already uses that name.'
  }

  if (error instanceof AlpacaCredentialsError) {
    if (error.code === 'MISSING') {
      return 'That connection no longer exists.'
    }

    if (action === 'save') {
      return 'Alpaca rejected those keys. Check the environment and try again.'
    }

    if (action === 'switch' || action === 'default') {
      return 'Test or replace the keys before using that connection.'
    }

    return 'Alpaca rejected the stored keys.'
  }

  switch (action) {
    case 'default':
      return 'The default connection could not be changed.'
    case 'remove':
      return 'That connection could not be removed.'
    case 'rename':
      return 'That connection could not be renamed.'
    case 'save':
      return 'Those keys could not be saved.'
    case 'switch':
      return 'The active connection could not be changed.'
    case 'test':
      return 'The connection could not be tested.'
  }
}
