// app/api/search-game/route.ts
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('query')

  if (!query) {
    return NextResponse.json({ error: 'Query is required' }, { status: 400 })
  }

  try {
    const response = await fetch(
      `https://api.rawg.io/api/games?key=${process.env.RAWG_API_KEY}&search=${encodeURIComponent(query)}&page_size=10`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Game search error:', error)
    return NextResponse.json({ error: 'Failed to fetch games' }, { status: 500 })
  }
}