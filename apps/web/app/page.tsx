export default function Page() {
  return (
    <div className="flex flex-col gap-2">
      
      {/* Balance */}
      <div className="w-full h-80 bg-primary rounded-3xl p-5 shadow-lg text-primary-foreground flex flex-col">
        <div className="flex-1"></div>
        <div className="text-5xl font-bold text-numeric">
          $1000.00
        </div>
      </div>
    </div>
  )
}
