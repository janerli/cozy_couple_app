import { createClient } from "@/lib/supabase/client"

type SupabaseClient = ReturnType<typeof createClient>

export type UpsertContentInput = {
  externalId?: string
  contentType: string
  titleRu: string
  poster?: string
  description?: string
  extra?: Record<string, unknown>
}

export async function upsertContent(supabase: SupabaseClient, input: UpsertContentInput) {
  const { data, error } = await supabase
    .from("content")
    .upsert(
      {
        external_id: input.externalId || Date.now().toString(),
        content_type: input.contentType,
        title_ru: input.titleRu,
        title_en: input.titleRu,
        poster_url: input.poster || null,
        description: input.description || null,
        updated_at: new Date(),
        ...input.extra,
      },
      { onConflict: "external_id, content_type" }
    )
    .select()
    .single()

  if (error) throw error
  return data
}
