// utils/save-game.ts
import { createClient } from '@/lib/supabase/client'

export async function saveGameToDatabase(gameData: any, userId: string) {
  const supabase = createClient()
  
  // 1. Сохраняем или обновляем основную информацию об игре в таблице content
  const { data: content, error: contentError } = await supabase
    .from('content')
    .upsert({
      external_id: gameData.id.toString(),
      content_type: 'game',
      title_ru: gameData.name,
      title_en: gameData.name,
      poster_url: gameData.background_image,
      description: gameData.description_raw,
      year: gameData.released ? new Date(gameData.released).getFullYear() : null,
      platforms: gameData.platforms?.map((p: any) => p.platform.name) || [],
      genres: gameData.genres?.map((g: any) => g.name) || [],
      updated_at: new Date(),
    }, { onConflict: 'external_id, content_type' })
    .select()
    .single()

  if (contentError) throw contentError

  // 2. Добавляем игру в общий список "Планируем" (shared_games)
  const { error: sharedError } = await supabase
    .from('shared_games')
    .insert({
      content_id: content.id,
      added_by: userId,
      status: 'planning',
    })

  if (sharedError) throw sharedError

  return content
}