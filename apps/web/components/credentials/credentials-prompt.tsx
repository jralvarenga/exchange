import { buttonVariants } from '@workspace/ui/components/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card'
import Link from 'next/link'

interface Props {
  environment: 'live' | 'paper'
  rejected: boolean
}

/** Asks for one Alpaca key pair, paper or live, before portfolio data can load. */
export function CredentialsPrompt({ environment, rejected }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {rejected ? 'Alpaca rejected your keys' : 'Alpaca keys needed'}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-start gap-4">
        <p>
          {rejected
            ? `Replace or test your ${environment} keys to see your portfolio.`
            : 'Add your Alpaca paper or live keys to see your portfolio. One is enough.'}
        </p>
        <Link href="/settings" className={buttonVariants()}>
          Open settings
        </Link>
      </CardContent>
    </Card>
  )
}
