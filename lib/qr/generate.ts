"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import QRCode from "qrcode"

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://instadine.com"

export async function generateQRCodeURL(tenantSlug: string, tableId: string): Promise<string> {
  return `${BASE_URL}/t/${tenantSlug}/${tableId}`
}

export async function generateQRCodeImage(url: string): Promise<Buffer> {
  try {
    const qrBuffer = await QRCode.toBuffer(url, {
      errorCorrectionLevel: "H",
      type: "png",
      width: 512,
      margin: 2,
    })
    return qrBuffer
  } catch (error) {
    console.error("[v0] Error generating QR code:", error)
    throw new Error("Failed to generate QR code")
  }
}

export async function uploadQRCode(
  tenantId: string,
  tableId: string,
  qrBuffer: Buffer,
  fileName: string,
): Promise<string> {
  const supabase = await createServerSupabaseClient()

  const filePath = `${tenantId}/tables/${fileName}`

  // Upload to storage
  const { error: uploadError } = await supabase.storage.from("qr-codes").upload(filePath, qrBuffer, {
    contentType: "image/png",
    upsert: true,
  })

  if (uploadError) {
    console.error("[v0] Error uploading QR code:", uploadError)
    throw new Error("Failed to upload QR code")
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from("qr-codes").getPublicUrl(filePath)

  return publicUrl
}

export async function generateAndUploadQRCode(
  tenantId: string,
  tenantSlug: string,
  tableId: string,
  tableName: string,
): Promise<{ qrUrl: string; qrDataURL: string }> {
  const response = await fetch("/api/qr-codes/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      tenantId,
      tenantSlug,
      tableId,
      tableName,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to generate QR code")
  }

  const data = await response.json()
  return { qrUrl: data.qrUrl, qrDataURL: data.qrDataURL }
}

export async function deleteQRCode(tenantId: string, fileName: string): Promise<void> {
  const supabase = await createServerSupabaseClient()

  const filePath = `${tenantId}/tables/${fileName}`

  const { error } = await supabase.storage.from("qr-codes").remove([filePath])

  if (error) {
    console.error("[v0] Error deleting QR code:", error)
    // Don't throw - file might not exist
  }
}
