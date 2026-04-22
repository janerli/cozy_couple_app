// utils/save-anime.ts
import { createClient } from '@/lib/supabase/client'

interface ShikimoriAnime {
  id: string  // ← GraphQL возвращает строку
  name: string
  russian: string
  kind: 'tv' | 'movie' | 'ova' | 'ona' | 'special'
  airedOn?: { year: number }  // ← GraphQL формат
  poster?: { 
    originalUrl: string
    mainUrl: string 
  }
  description?: string
  genres?: { name: string; russian: string }[]
  score?: number
  episodes?: number
}

export async function saveAnimeToDatabase(
  animeData: ShikimoriAnime, 
  userId: string, 
  listType: 'personal' | 'shared' = 'personal'
) {
  const supabase = createClient()
  
  // Определяем тип контента: аниме-сериал или аниме-фильм
  const contentType = animeData.kind === 'movie' ? 'anime_film' : 'anime'
  
  // 1. Сохраняем или обновляем информацию об аниме в таблице content
  const { data: content, error: contentError } = await supabase
    .from('content')
    .upsert({
      external_id: animeData.id.toString(),
      content_type: contentType,
      title_ru: animeData.russian || animeData.name,
      title_en: animeData.name,
      poster_url: animeData.poster?.originalUrl || animeData.poster?.mainUrl || '',
      description: animeData.description || null,
      year: animeData.airedOn?.year || null,  // ← GraphQL формат
      genres: animeData.genres?.map(g => g.russian || g.name) || [],
      updated_at: new Date(),
    }, { onConflict: 'external_id, content_type' })
    .select()
    .single()

  if (contentError) throw contentError

  // 2. Добавляем в личный или общий список
  if (listType === 'personal') {
    const { error } = await supabase
      .from('personal_media')
      .insert({
        user_id: userId,
        content_id: content.id,
        status: 'planned',
        current_season: 1,
        current_episode: 0,
      })
    if (error) throw error
  } else {
    const { error } = await supabase
      .from('shared_media')
      .insert({
        content_id: content.id,
        added_by: userId,
        status: 'planned',
        current_season: 1,
        current_episode: 0,
      })
    if (error) throw error
  }

  return content
}