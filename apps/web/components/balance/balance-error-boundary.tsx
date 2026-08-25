'use client'

import type { ReactNode } from 'react'
import { Component } from 'react'

interface Props {
  children: ReactNode
  fallback: ReactNode
  resetKey?: string
}

interface State {
  hasError: boolean
}

/** Keeps balance query failures inside the balance card. */
export class BalanceErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidUpdate(previousProps: Props): void {
    if (this.state.hasError && previousProps.resetKey !== this.props.resetKey) {
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
