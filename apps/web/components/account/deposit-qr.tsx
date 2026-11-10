'use client'

import { ReactQRCode } from '@lglab/react-qr-code'
import { Button } from '@workspace/ui/components/button'
import { Check, CircleAlert, Copy } from 'lucide-react'
import { useEffect, useState } from 'react'

import { showErrorToast, showSuccessToast } from '@/lib/app-toast'
import { revealClassName } from '@/lib/utils'
import type { DepositMethod } from '@/lib/wallet/deposit-addresses'

interface Props {
  method: DepositMethod
}

/** Shows a deposit address as a QR code and copyable text with its network warning. */
export function DepositQr({ method }: Props) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) {
      return
    }

    const timeout = window.setTimeout(() => {
      setCopied(false)
    }, 2000)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [copied])

  /** Copies the deposit address and confirms the result. */
  async function handleCopy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(method.address)
      setCopied(true)
      showSuccessToast({
        description: 'Paste it in your sending wallet.',
        title: 'Address copied',
      })
    } catch {
      setCopied(false)
      showErrorToast({
        description: 'Select the address and copy it manually.',
        title: 'Unable to copy',
      })
    }
  }

  return (
    <div
      className={`flex flex-col gap-6 sm:flex-row sm:items-center ${revealClassName}`}
    >
      <div className="aspect-square w-full max-w-56 shrink-0 self-center rounded-[2rem] p-3 ring-1 ring-border sm:w-48 sm:self-auto">
        <ReactQRCode
          dataModulesSettings={{ color: 'currentColor', style: 'rounded' }}
          finderPatternInnerSettings={{
            color: 'currentColor',
            style: 'rounded',
          }}
          finderPatternOuterSettings={{
            color: 'currentColor',
            style: 'rounded',
          }}
          level="M"
          marginSize={0}
          size={512}
          svgProps={{
            'aria-label': `QR code for the ${method.asset} ${method.chainLabel} deposit address`,
            className: 'size-full text-foreground',
            role: 'img',
          }}
          value={method.address}
        />
      </div>
      <div className="flex min-w-0 flex-col gap-4">
        <div className="flex flex-col gap-1">
          <p className="font-medium text-muted-foreground">
            {method.asset} on {method.chainLabel}
          </p>
          <p className="select-all break-all font-mono text-lg leading-relaxed">
            {method.address}
          </p>
        </div>
        <Button
          className="h-11 self-start rounded-full px-5 text-base"
          onClick={() => void handleCopy()}
          type="button"
          variant="outline"
        >
          {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
          {copied ? 'Copied' : 'Copy address'}
        </Button>
        <p className="flex gap-2 text-muted-foreground">
          <CircleAlert
            aria-hidden="true"
            className="mt-0.5 size-5 shrink-0 text-warning"
          />
          <span>
            Send only {method.asset} on {method.chainLabel} (
            {method.tokenStandard}). Other networks or tokens may not be
            credited.
          </span>
        </p>
      </div>
    </div>
  )
}
