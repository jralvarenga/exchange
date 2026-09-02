'use client'

import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback: ReactNode
  resetKey?: string
}

interface State {
  hasError: boolean
}

/** Isolates a failed balance query so the rest of the panel can still render. */
export class BalanceErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
  }

  /** Updates state so the next render shows the fallback. */
  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  /** Clears a recovered error when the selected interval changes. */
  componentDidUpdate(prevProps: Props): void {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false })
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback
    }

    return this.props.children
  }
}
