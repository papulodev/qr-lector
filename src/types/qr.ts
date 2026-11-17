export type QRLocation = {
  topLeftCorner: { x: number; y: number }
  topRightCorner: { x: number; y: number }
  bottomRightCorner: { x: number; y: number }
  bottomLeftCorner: { x: number; y: number }
}

export type QRResult = {
  data: string
  version: number
  location: QRLocation
}

export type ParsedResult = {
  type: string
  sub: string
  fields: Array<[string, string]>
  link?: string
  notes?: string[]
}
