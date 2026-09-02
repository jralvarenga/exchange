'use client'

import { ReactQRCode } from '@lglab/react-qr-code'
import { Button } from '@workspace/ui/components/button'
import { Check, Copy } from 'lucide-react'
import { useEffect, useState } from 'react'

import { showErrorToast, showSuccessToast } from '@/lib/app-toast'
import type { DepositMethod } from '@/lib/wallet/deposit-addresses'

interface Props {
  method: DepositMethod
}

/** Shows a copyable deposit address with a matching QR code. */
export function DepositAddress({ method }: Props) {
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
    <div className="flex w-full shrink-0 flex-col items-center gap-4 rounded-[1.75rem] bg-primary p-4 text-center text-primary-foreground sm:gap-6 sm:p-6">
      <div className="mx-auto aspect-square w-[min(100%,16rem)]">
        <ReactQRCode
          dataModulesSettings={{
            color: 'currentColor',
            style: 'rounded',
          }}
          finderPatternInnerSettings={{
            color: 'currentColor',
            style: 'rounded',
          }}
          finderPatternOuterSettings={{
            color: 'currentColor',
            style: 'rounded',
          }}
          level="M"
          marginSize={2}
          size={512}
          svgProps={{
            'aria-label': `QR code for the ${method.asset} ${method.chainLabel} deposit address`,
            className: 'size-full',
            role: 'img',
          }}
          value={method.address}
        />
      </div>

      <p className="w-full min-w-0 select-all break-all rounded-lg text-sm leading-relaxed sm:text-base">
        {method.address}
      </p>

      <Button
        className="h-12 bg-primary-foreground px-6 text-base text-primary hover:bg-primary-foreground/90"
        onClick={() => void handleCopy()}
        size="lg"
        type="button"
      >
        {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
        {copied ? 'Copied' : 'Copy address'}
      </Button>
    </div>
  )
}
