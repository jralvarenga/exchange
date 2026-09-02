/** Error returned when an asset data route cannot complete its request. */
export class AssetDataError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'AssetDataError'
    this.status = status
  }
}
