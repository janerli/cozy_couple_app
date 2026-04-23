import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    // Создаём клиент с серверными ключами
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,  // ← нужен сервисный ключ
      {
        db: {
          schema: 'public',
        },
      }
    )

    // 🔥 Простой запрос к БД — будит базу
    const { data } = await supabase.from('profiles').select('id').limit(1)
    
    return NextResponse.json({ ok: true, db: !!data })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}