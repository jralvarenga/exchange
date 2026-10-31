import {
  type UseMutationResult,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'

import {
  accountConfigurationsQueryKey,
  accountOverviewQueryKey,
} from '@/lib/alpaca/query-keys'
import {
  type AccountConfigurations,
  accountConfigurationsSchema,
  type UpdateAccountConfigurations,
} from '@/lib/alpaca/trading-schemas'
import { requestJson } from '@/lib/api/request'

/** Saves part of the account's trading configuration. */
export function useUpdateAccountConfigurations(): UseMutationResult<
  AccountConfigurations,
  Error,
  UpdateAccountConfigurations
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (changes) =>
      requestJson({
        body: changes,
        fallback: 'Unable to save account settings.',
        method: 'PATCH',
        path: '/api/alpaca/account/configurations',
        schema: accountConfigurationsSchema,
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: accountConfigurationsQueryKey,
        }),
        queryClient.invalidateQueries({ queryKey: accountOverviewQueryKey }),
      ])
    },
    retry: false,
  })
}
