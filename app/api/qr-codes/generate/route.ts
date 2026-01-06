import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import QRCode from "qrcode"

function getBaseUrl(request: NextRequest): string {
  // to get the current deployment URL
  const host = request.headers.get("host")
  const protocol = request.headers.get("x-forwarded-proto") || "https"

  // If we have a valid host that's not localhost or supabase, use it
  if (host && !host.includes("localhost") && !host.includes("supabase.co")) {
    const url = `${protocol}://${host}`
    console.log("[v0] Using request host for QR URL:", url)
    return url
  }

  // Check environment variable as fallback (but filter out invalid URLs)
  const envUrl = process.env.NEXT_PUBLIC_APP_URL
  if (envUrl) {
    // Reject any URL containing supabase.co
    if (envUrl.includes("supabase.co")) {
      console.log("[v0] NEXT_PUBLIC_APP_URL contains supabase.co, ignoring:", envUrl)
    } else if (!envUrl.includes("localhost")) {
      console.log("[v0] Using NEXT_PUBLIC_APP_URL:", envUrl)
      return envUrl.replace(/\/$/, "")
    }
  }

  // Last resort - hardcoded fallback
  console.log("[v0] Using hardcoded fallback URL")
  return "https://instadine.vercel.app"
}

export async function POST(request: NextRequest) {
  try {
    const BASE_URL = getBaseUrl(request)
    console.log("[v0] QR generation API called")
    console.log("[v0] BASE_URL for QR codes:", BASE_URL)

    let body
    try {
      body = await request.json()
    } catch (parseError) {
      console.error("[v0] Error parsing request body:", parseError)
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    const { tenantId, tenantSlug, tableId, tableName } = body
    console.log("[v0] Generating QR for:", { tenantId, tenantSlug, tableId, tableName })

    if (!tenantId || !tenantSlug || !tableId || !tableName) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    // Verify user has access
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const qrURL = `${BASE_URL}/t/${tenantSlug}/${tableId}`
    console.log("[v0] QR URL:", qrURL)

    let qrDataURL
    try {
      qrDataURL = await QRCode.toDataURL(qrURL, {
        errorCorrectionLevel: "H",
        width: 512,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      })
      console.log("[v0] QR code generated successfully")
    } catch (qrError) {
      console.error("[v0] Error generating QR code:", qrError)
      return NextResponse.json({ error: "Failed to generate QR code" }, { status: 500 })
    }

    // Just return the data URL so it can be downloaded directly
    return NextResponse.json({
      success: true,
      qrDataURL,
      qrUrl: qrURL,
      tableName,
    })
  } catch (error) {
    console.error("[v0] Error generating QR code:", error)
    return NextResponse.json({ error: "Failed to generate QR code" }, { status: 500 })
  }
}
