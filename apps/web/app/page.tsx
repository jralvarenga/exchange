import { Button } from "@workspace/ui/components/button";

export default function Page() {
  return (
    <div className="flex flex-col gap-2">
      
      {/* Balance */}
      <div className="w-full h-80 bg-primary rounded-3xl p-5 shadow-lg text-primary-foreground flex flex-col">
        <div className="flex-1"></div>
        <div className="flex flex-row items-center justify-between">
          <h1 className="text-5xl font-bold text-numeric">$1000.00</h1>
          <div className="flex flex-row gap-1 items-end h-full justify-center">
            <Button>
              1W
            </Button>
            <Button>
              1M
            </Button>
            <Button>
              3M
            </Button>
            <Button>
              YTD
            </Button>
            <Button>
              All Time
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
