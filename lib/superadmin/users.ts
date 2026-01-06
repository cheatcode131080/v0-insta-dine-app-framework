import { createBrowserClient } from "@/lib/supabase/client"

export async function toggleUserDisabled(userId: string, isDisabled: boolean) {
  const supabase = createBrowserClient()

  const { error } = await supabase.from("users").update({ is_disabled: isDisabled }).eq("id", userId)

  return { error }
}
