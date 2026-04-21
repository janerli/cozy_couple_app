// utils/save-movie.ts
import { createClient } from '@/lib/supabase/client'

export async function saveMovieToDatabase(movieData: any, userId: string) {
  const supabase = createClient()
  
  // 1. Сохраняем или обновляем основную информацию о фильме в таблице content
  const { data: content, error: contentError } = await supabase
    .from('content')
    .upsert({
      external_id: movieData.id.toString(),
      content_type: movieData.type === 'movie' ? 'movie' : 'series',
      title_ru: movieData.name,
      title_en: movieData.alternativeName,
      poster_url: movieData.poster?.url,
      description: movieData.description,
      year: movieData.year,
      genres: movieData.genres?.map((g: any) => g.name) || [],
      updated_at: new Date(),
    }, { onConflict: 'external_id, content_type' })
    .select()
    .single()

  if (contentError) throw contentError

  // 2. Добавляем фильм в личный список "Запланировано" (personal_media)
  const { error: personalError } = await supabase
    .from('personal_media')
    .insert({
      user_id: userId,
      content_id: content.id,
      status: 'planned',
    })

  if (personalError) throw personalError

  return content
}