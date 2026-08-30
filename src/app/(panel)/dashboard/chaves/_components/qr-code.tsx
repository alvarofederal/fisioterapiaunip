"use client"

import { QRCodeSVG } from "qrcode.react"

interface Props {
  value: string
  size?: number
}

export function QrCode({ value, size = 120 }: Props) {
  return (
    <QRCodeSVG
      value={value}
      size={size}
      bgColor="#ffffff"
      fgColor="#000000"
      level="M"
    />
  )
}
