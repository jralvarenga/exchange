import type { GetAccountActivitiesOptions } from '@/lib/alpaca/schemas'

/** The activity tab's kind filter: everything, or one Alpaca activity category. */
export type ActivityCategoryFilter =
  | 'all'
  | NonNullable<GetAccountActivitiesOptions['category']>
