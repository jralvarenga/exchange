import { useEffect, useState } from 'react'

/** Returns a value only after it has remained unchanged for the delay. */
export function useDebouncedValue<Value>(value: Value, delayMs: number): Value {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedValue(value), delayMs)

    return () => clearTimeout(timeout)
  }, [delayMs, value])

  return debouncedValue
}
