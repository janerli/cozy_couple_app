// app/api/search-movie/route.ts
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('query')

  if (!query) {
    return NextResponse.json({ error: 'Query is required' }, { status: 400 })
  }

  const apiKey = process.env.KINOPOISK_API_KEY

  if (!apiKey) {
    console.error('KINOPOISK_API_KEY is not set')
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
  }

  try {
    const url = `https://api.poiskkino.dev/v1.4/movie/search?page=1&limit=10&query=${encodeURIComponent(query)}`

    const response = await fetch(url, {
      headers: {
        'X-API-KEY': apiKey,
        'accept': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('API error response:', errorText)
      return NextResponse.json({ error: `API error: ${response.status}` }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Movie search error:', error)
    return NextResponse.json({ error: 'Failed to fetch movies' }, { status: 500 })
  }
}