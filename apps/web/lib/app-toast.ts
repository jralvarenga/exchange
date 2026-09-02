import { toast } from '@workspace/ui/components/toast'

interface AppToastOptions {
  description?: string
  title: string
}

/** Shows a success toast notification. */
export function showSuccessToast(options: AppToastOptions): string {
  return toast.add({
    description: options.description,
    title: options.title,
    type: 'success',
  })
}

/** Shows an error toast notification. */
export function showErrorToast(options: AppToastOptions): string {
  return toast.add({
    description: options.description,
    priority: 'high',
    title: options.title,
    type: 'error',
  })
}
