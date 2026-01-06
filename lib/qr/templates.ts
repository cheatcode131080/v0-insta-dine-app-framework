"use server"

import { createServerClient } from "@/lib/supabase/server"

export async function uploadQRTemplate(formData: FormData) {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  // Get tenant
  const { data: membership } = await supabase
    .from("tenant_members")
    .select("tenant_id, role")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single()

  if (!membership || !["owner", "admin"].includes(membership.role)) {
    throw new Error("Insufficient permissions")
  }

  const file = formData.get("template") as File
  const name = formData.get("name") as string
  const setAsDefault = formData.get("setAsDefault") === "true"

  if (!file) throw new Error("No file provided")

  // Upload to storage
  const fileName = `${membership.tenant_id}/${Date.now()}_${file.name}`
  const { data: uploadData, error: uploadError } = await supabase.storage.from("qr-templates").upload(fileName, file, {
    contentType: file.type,
    upsert: false,
  })

  if (uploadError) throw uploadError

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from("qr-templates").getPublicUrl(fileName)

  // If setting as default, unset current default
  if (setAsDefault) {
    await supabase
      .from("qr_templates")
      .update({ is_default: false })
      .eq("tenant_id", membership.tenant_id)
      .eq("is_default", true)
  }

  // Save template record
  const { data, error } = await supabase
    .from("qr_templates")
    .insert({
      tenant_id: membership.tenant_id,
      name: name || file.name,
      template_url: publicUrl,
      is_default: setAsDefault,
    })
    .select()
    .single()

  if (error) throw error

  // Log activity
  await supabase.from("activity_log").insert({
    tenant_id: membership.tenant_id,
    user_id: user.id,
    action: "qr_template_uploaded",
    entity_type: "qr_template",
    entity_id: data.id,
    details: { name: name || file.name },
  })

  return data
}

export async function getQRTemplates(tenantId: string) {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from("qr_templates")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data
}

export async function deleteQRTemplate(templateId: string) {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  // Get template to delete file
  const { data: template } = await supabase.from("qr_templates").select("*").eq("id", templateId).single()

  if (template) {
    // Extract file path from URL
    const urlParts = template.template_url.split("/")
    const filePath = urlParts.slice(-2).join("/")

    // Delete from storage
    await supabase.storage.from("qr-templates").remove([filePath])
  }

  // Delete record
  const { error } = await supabase.from("qr_templates").delete().eq("id", templateId)

  if (error) throw error

  return { success: true }
}
