// app/api/search-anime/route.ts
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('query')

  if (!query) {
    return NextResponse.json({ error: 'Query is required' }, { status: 400 })
  }

  try {
    const response = await fetch(
      `https://shikimori.one/api/animes?search=${encodeURIComponent(query)}&limit=10`,
      {
        headers: {
          'User-Agent': 'OurCozyTracker/1.0',
          'Content-Type': 'application/json',
        },
      }
    )
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Anime search error:', error)
    return NextResponse.json({ error: 'Failed to fetch anime' }, { status: 500 })
  }
}