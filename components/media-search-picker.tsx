"use client"

import { useState } from "react"
import { Search, Loader2, Film, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import type { MediaType } from "@/lib/app-context"
import { cn } from "@/lib/utils"

const searchSources = [
  { value: "kinopoisk", label: "🎬 Фильмы/Сериалы" },
  { value: "shikimori", label: "🌸 Аниме" },
] as const

type SearchSource = (typeof searchSources)[number]["value"]

interface KinopoiskMovie {
  id: number
  name: string
  description?: string
  poster?: { url: string }
  year?: number
  type: "movie" | "tv-series" | "cartoon" | "anime"
  seriesLength?: number
  seasonsCount?: number
}

interface ShikimoriAnime {
  id: string
  name: string
  russian: string
  kind: "tv" | "movie" | "ova" | "ona" | "special"
  poster?: { originalUrl: string; mainUrl: string }
  description?: string
  airedOn?: { year: number }
}

type SearchResult = KinopoiskMovie | ShikimoriAnime

export type MediaPickResult = {
  title: string
  poster: string
  description: string
  type: MediaType
  externalId: string
}

const cleanDescription = (text: string) => {
  if (!text) return ""
  return text.replace(/<[^>]*>/g, "").replace(/\[[^\]]*\]/g, "").trim()
}

function mapKinopoiskType(movie: KinopoiskMovie): MediaType {
  if (movie.type === "cartoon") {
    const hasEpisodes = (movie.seriesLength ?? 0) > 0 || (movie.seasonsCount ?? 0) > 0
    return hasEpisodes ? "cartoon" : "movie"
  }
  if (movie.type === "movie") return "movie"
  if (movie.type === "tv-series") return "series"
  if (movie.type === "anime") return "anime"
  return "movie"
}

interface MediaSearchPickerProps {
  onSelect: (result: MediaPickResult) => void
}

export function MediaSearchPicker({ onSelect }: MediaSearchPickerProps) {
  const [searchSource, setSearchSource] = useState<SearchSource>("kinopoisk")
  const [searchInput, setSearchInput] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [selectedTitle, setSelectedTitle] = useState("")

  const handleSearch = async () => {
    if (searchInput.length < 2) return
    setIsSearching(true)
    setShowResults(true)
    try {
      const endpoint = searchSource === "kinopoisk" ? "/api/search-movie" : "/api/search-anime"
      const res = await fetch(`${endpoint}?query=${encodeURIComponent(searchInput)}`)
      const data = await res.json()
      setSearchResults(searchSource === "kinopoisk" ? data.docs || [] : data || [])
    } catch {
      setSearchResults([])
      toast.error("Не удалось выполнить поиск. Попробуй ещё раз.")
    } finally {
      setIsSearching(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleSearch()
    }
  }

  const handleSelectItem = (item: SearchResult) => {
    if (searchSource === "kinopoisk") {
      const movie = item as KinopoiskMovie
      setSelectedTitle(movie.name)
      onSelect({
        title: movie.name,
        poster: movie.poster?.url || "",
        description: movie.description || "",
        type: mapKinopoiskType(movie),
        externalId: movie.id.toString(),
      })
    } else {
      const anime = item as ShikimoriAnime
      setSelectedTitle(anime.russian || anime.name)
      onSelect({
        title: anime.russian || anime.name,
        poster: anime.poster?.originalUrl || anime.poster?.mainUrl || "",
        description: cleanDescription(anime.description || ""),
        type: anime.kind === "movie" ? "anime-movie" : "anime",
        externalId: anime.id.toString(),
      })
    }
    setShowResults(false)
    setSearchResults([])
  }

  const getYear = (item: SearchResult): string =>
    searchSource === "kinopoisk"
      ? (item as KinopoiskMovie).year?.toString() || ""
      : (item as ShikimoriAnime).airedOn?.year?.toString() || ""

  const getTypeLabel = (item: SearchResult): string => {
    if (searchSource === "kinopoisk") {
      const movie = item as KinopoiskMovie
      switch (movie.type) {
        case "movie": return "Фильм"
        case "tv-series": return "Сериал"
        case "cartoon": return "Мультсериал"
        default: return "Фильм"
      }
    }
    return (item as ShikimoriAnime).kind === "movie" ? "Аниме-фильм" : "Аниме"
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2 p-1 bg-muted rounded-full">
        {searchSources.map((source) => (
          <button
            key={source.value}
            type="button"
            onClick={() => {
              setSearchSource(source.value)
              setSearchInput("")
              setSearchResults([])
              setShowResults(false)
            }}
            className={cn(
              "flex-1 px-4 py-2.5 rounded-full text-sm md:text-base font-medium transition-all",
              searchSource === source.value
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {source.label}
          </button>
        ))}
      </div>

      <Label className="text-base">Поиск *</Label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={searchSource === "kinopoisk" ? "Введите название фильма или сериала..." : "Введите название аниме..."}
            className="rounded-xl pl-10 pr-4 py-6 text-base"
          />
        </div>
        <Button onClick={handleSearch} disabled={searchInput.length < 2 || isSearching} className="rounded-xl px-6 py-6 text-base">
          {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : "Найти"}
        </Button>
      </div>

      {showResults && (
        <div className="relative w-full mt-2 bg-background border rounded-xl shadow-lg max-h-80 md:max-h-96 overflow-auto z-10">
          {isSearching ? (
            <div className="p-6 text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground mt-2">Ищем...</p>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="py-1">
              {searchResults.map((item) => {
                const poster = searchSource === "kinopoisk"
                  ? (item as KinopoiskMovie).poster?.url
                  : (item as ShikimoriAnime).poster?.originalUrl || (item as ShikimoriAnime).poster?.mainUrl
                const title = searchSource === "kinopoisk"
                  ? (item as KinopoiskMovie).name
                  : (item as ShikimoriAnime).russian || (item as ShikimoriAnime).name
                return (
                  <div
                    key={item.id}
                    className="p-4 hover:bg-muted cursor-pointer flex items-start gap-4 border-b last:border-0 transition-colors"
                    onClick={() => handleSelectItem(item)}
                  >
                    {poster && !poster.includes("missing") ? (
                      <img src={poster} alt={title} className="w-14 h-20 md:w-16 md:h-24 object-cover rounded-lg flex-shrink-0 shadow-sm" />
                    ) : (
                      <div className="w-14 h-20 md:w-16 md:h-24 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                        <Film className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0 py-1">
                      <p className="font-medium text-base md:text-lg truncate">{title}</p>
                      <p className="text-sm text-muted-foreground mt-1">{getYear(item)} • {getTypeLabel(item)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-base text-muted-foreground">Ничего не найдено</p>
              <p className="text-sm text-muted-foreground mt-1">Попробуйте изменить запрос</p>
            </div>
          )}
        </div>
      )}

      {!showResults && selectedTitle && (
        <div className="mt-3 p-3 bg-muted/50 rounded-xl">
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Check className="w-4 h-4 text-green-500" />
            Выбрано: <span className="font-medium text-foreground">{selectedTitle}</span>
          </p>
        </div>
      )}
    </div>
  )
}
