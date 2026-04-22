import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('query')

  if (!query) {
    return NextResponse.json({ error: 'Query is required' }, { status: 400 })
  }

  try {
    const graphqlQuery = {
      query: `
        query SearchAnime($search: String!) {
          animes(search: $search, limit: 10) {
            id
            name
            russian
            kind
            airedOn { year }
            description
            poster {
              originalUrl
              mainUrl
            }
            genres {
              russian
            }
            score
          }
        }
      `,
      variables: { search: query }
    }

    const response = await fetch('https://shikimori.io/api/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'OurCozyTracker/1.0',
      },
      body: JSON.stringify(graphqlQuery)
    })

    const data = await response.json()
    
    // Возвращаем массив аниме
    return NextResponse.json(data.data?.animes || [])
  } catch (error) {
    console.error('Anime search error:', error)
    return NextResponse.json({ error: 'Failed to fetch anime' }, { status: 500 })
  }
}