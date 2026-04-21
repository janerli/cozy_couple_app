"use client"

import { useState } from "react"
import { Plus, Star, Check, X, Search, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { MediaItem, useApp } from "@/lib/app-context"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

const defaultPosters = [
  "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=300&h=450&fit=crop",
  "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=300&h=450&fit=crop",
  "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=300&h=450&fit=crop",
]

const searchSources = [
  { value: "kinopoisk", label: "🎬 Фильмы/Сериалы" },
  { value: "shikimori", label: "🌸 Аниме" },
]

function hasEpisodes(type: MediaItem["type"]): boolean {
  return type === "series" || type === "anime" || type === "cartoon"
}

// Типы для результатов поиска
interface KinopoiskMovie {
  id: number
  name: string
  alternativeName?: string
  description?: string
  poster?: { url: string }
  year?: number
  type: "movie" | "tv-series" | "anime" | "cartoon"
  genres?: { name: string }[]
}

interface ShikimoriAnime {
  id: number
  name: string
  russian: string
  kind: "tv" | "movie" | "ova" | "ona" | "special"
  score: string
  episodes: number
  aired_on: string
  poster?: { originalUrl: string; mainUrl: string }
  description?: string
  genres?: { name: string; russian: string }[]
}

type SearchResult = KinopoiskMovie | ShikimoriAnime

export function AddMediaDialog() {
  const { addMediaItem, activeUserId } = useApp()
  const [open, setOpen] = useState(false)
  
  // Поиск
  const [searchSource, setSearchSource] = useState<"kinopoisk" | "shikimori">("kinopoisk")
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  
  // Форма
  const [formData, setFormData] = useState({
    title: "",
    poster: "",
    description: "",
    type: "movie" as MediaItem["type"],
    status: "planned" as MediaItem["status"],
    rating: 0,
    currentSeason: 1,
    currentEpisode: 1,
    watchedTogether: false,
    externalId: "",
  })

  // Функция поиска
  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    
    if (query.length < 2) {
      setSearchResults([])
      setShowResults(false)
      return
    }

    setIsSearching(true)
    setShowResults(true)
    
    try {
      const endpoint = searchSource === "kinopoisk" 
        ? "/api/search-movie" 
        : "/api/search-anime"
      
      const res = await fetch(`${endpoint}?query=${encodeURIComponent(query)}`)
      const data = await res.json()
      
      if (searchSource === "kinopoisk") {
        setSearchResults(data.docs || [])
      } else {
        setSearchResults(data || [])
      }
    } catch (error) {
      console.error("Search failed:", error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  // Обработка выбора элемента из поиска
  const handleSelectItem = (item: SearchResult) => {
    if (searchSource === "kinopoisk") {
      const movie = item as KinopoiskMovie
      const mappedType = mapApiTypeToMediaType(movie.type)
      
      setFormData({
        ...formData,
        title: movie.name,
        poster: movie.poster?.url || "",
        description: movie.description || "",
        type: mappedType,
        externalId: movie.id.toString(),
      })
      setSearchQuery(movie.name)
    } else {
      const anime = item as ShikimoriAnime
      const isMovie = anime.kind === "movie"
      
      setFormData({
        ...formData,
        title: anime.russian || anime.name,
        poster: anime.poster?.originalUrl || "",
        description: anime.description || "",
        type: isMovie ? "anime-movie" : "anime",
        externalId: anime.id.toString(),
      })
      setSearchQuery(anime.russian || anime.name)
    }
    
    setShowResults(false)
    setSearchResults([])
  }

  // Преобразование типа из API Кинопоиска
  const mapApiTypeToMediaType = (apiType: string): MediaItem["type"] => {
    switch (apiType) {
      case "movie": return "movie"
      case "tv-series": return "series"
      case "anime": return "anime"
      case "cartoon": return "cartoon"
      default: return "movie"
    }
  }

  // Получение года из элемента
  const getYear = (item: SearchResult): string => {
    if (searchSource === "kinopoisk") {
      const movie = item as KinopoiskMovie
      return movie.year?.toString() || ""
    } else {
      const anime = item as ShikimoriAnime
      return anime.aired_on ? new Date(anime.aired_on).getFullYear().toString() : ""
    }
  }

  // Получение типа для отображения
  const getTypeLabel = (item: SearchResult): string => {
    if (searchSource === "kinopoisk") {
      const movie = item as KinopoiskMovie
      return movie.type === "movie" ? "Фильм" : "Сериал"
    } else {
      const anime = item as ShikimoriAnime
      return anime.kind === "movie" ? "Аниме-фильм" : "Аниме"
    }
  }

  // Сохранение в Supabase
  const saveToSupabase = async () => {
    const supabase = createClient()
    
    // 1. Сохраняем контент
    const { data: content, error: contentError } = await supabase
      .from("content")
      .upsert({
        external_id: formData.externalId || Date.now().toString(),
        content_type: formData.type,
        title_ru: formData.title,
        title_en: formData.title,
        poster_url: formData.poster || defaultPosters[Math.floor(Math.random() * defaultPosters.length)],
        description: formData.description || null,
        year: null,
        updated_at: new Date(),
      }, { onConflict: "external_id, content_type" })
      .select()
      .single()

    if (contentError) {
      console.error("Content save error:", contentError)
      throw contentError
    }

    // 2. Сохраняем в личный список
    const { error: personalError } = await supabase
      .from("personal_media")
      .insert({
        user_id: activeUserId,
        content_id: content.id,
        status: formData.status,
        user_rating: formData.rating || null,
        current_season: hasEpisodes(formData.type) ? formData.currentSeason : null,
        current_episode: hasEpisodes(formData.type) ? formData.currentEpisode : null,
        notes: null,
      })

    if (personalError) {
      console.error("Personal media save error:", personalError)
      throw personalError
    }

    return content
  }

  const handleSubmit = async () => {
    if (!formData.title.trim()) return

    try {
      await saveToSupabase()
      
      addMediaItem({
        title: formData.title,
        poster: formData.poster || defaultPosters[Math.floor(Math.random() * defaultPosters.length)],
        description: formData.description || undefined,
        type: formData.type,
        status: formData.status,
        rating: formData.rating || undefined,
        currentSeason: hasEpisodes(formData.type) ? formData.currentSeason : undefined,
        currentEpisode: hasEpisodes(formData.type) ? formData.currentEpisode : undefined,
        watchedTogether: formData.watchedTogether,
        userId: activeUserId,
      })

      // Сброс формы
      setFormData({
        title: "",
        poster: "",
        description: "",
        type: "movie",
        status: "planned",
        rating: 0,
        currentSeason: 1,
        currentEpisode: 1,
        watchedTogether: false,
        externalId: "",
      })
      setSearchQuery("")
      setSearchSource("kinopoisk")
      setOpen(false)
    } catch (error) {
      console.error("Submit error:", error)
      alert("Ошибка при сохранении. Попробуй ещё раз.")
    }
  }

  // Сброс при закрытии
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSearchQuery("")
      setSearchResults([])
      setShowResults(false)
      setSearchSource("kinopoisk")
      setFormData({
        title: "",
        poster: "",
        description: "",
        type: "movie",
        status: "planned",
        rating: 0,
        currentSeason: 1,
        currentEpisode: 1,
        watchedTogether: false,
        externalId: "",
      })
    }
    setOpen(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="rounded-full gap-2">
          <Plus className="w-4 h-4" />
          Добавить
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Добавить в медиатеку</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Переключатель источника */}
          <div className="flex gap-2 p-1 bg-muted rounded-full">
            {searchSources.map((source) => (
              <button
                key={source.value}
                type="button"
                onClick={() => {
                  setSearchSource(source.value as "kinopoisk" | "shikimori")
                  setSearchQuery("")
                  setSearchResults([])
                  setShowResults(false)
                }}
                className={cn(
                  "flex-1 px-3 py-2 rounded-full text-sm font-medium transition-all",
                  searchSource === source.value
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {source.label}
              </button>
            ))}
          </div>

          {/* Поле поиска */}
          <div className="space-y-2 relative">
            <Label>Поиск *</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => searchResults.length > 0 && setShowResults(true)}
                placeholder={searchSource === "kinopoisk" 
                  ? "Введите название фильма или сериала..." 
                  : "Введите название аниме..."
                }
                className="rounded-xl pl-10"
              />
            </div>
            
            {/* Выпадающий список результатов */}
            {showResults && (
              <div className="absolute z-10 w-full mt-1 bg-background border rounded-xl shadow-lg max-h-60 overflow-auto">
                {isSearching ? (
                  <div className="p-4 text-center">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" />
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((item) => {
                    const posterUrl = searchSource === "kinopoisk" 
                      ? (item as KinopoiskMovie).poster?.url 
                      : (item as ShikimoriAnime).poster?.originalUrl
                    
                    const title = searchSource === "kinopoisk"
                      ? (item as KinopoiskMovie).name
                      : (item as ShikimoriAnime).russian || (item as ShikimoriAnime).name
                    
                    return (
                      <div
                        key={item.id}
                        className="p-3 hover:bg-muted cursor-pointer flex items-center gap-3 border-b last:border-0"
                        onClick={() => handleSelectItem(item)}
                      >
                        {posterUrl && (
                          <img 
                            src={posterUrl} 
                            alt={title} 
                            className="w-10 h-14 object-cover rounded flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{title}</p>
                          <p className="text-xs text-muted-foreground">
                            {getYear(item)} • {getTypeLabel(item)}
                          </p>
                        </div>
                      </div>
                    )
                  })
                ) : searchQuery.length >= 2 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    Ничего не найдено
                  </div>
                ) : null}
              </div>
            )}
            
            {!showResults && searchQuery && formData.title && (
              <p className="text-xs text-muted-foreground">
                ✅ Выбрано: {formData.title}
              </p>
            )}
          </div>

          {/* Форма редактирования (показывается только после выбора) */}
          {formData.title && (
            <>
              <div className="space-y-2">
                <Label>Описание</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Краткое описание..."
                  className="rounded-xl resize-none"
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Постер (URL)</Label>
                <div className="flex gap-2">
                  <Input
                    value={formData.poster}
                    onChange={(e) => setFormData({ ...formData, poster: e.target.value })}
                    placeholder="https://example.com/poster.jpg"
                    className="rounded-xl"
                  />
                </div>
                {formData.poster && (
                  <img 
                    src={formData.poster} 
                    alt="Preview" 
                    className="w-20 h-28 object-cover rounded-lg mt-2"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Тип</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: MediaItem["type"]) =>
                      setFormData({ ...formData, type: value })
                    }
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="movie">Фильм</SelectItem>
                      <SelectItem value="series">Сериал</SelectItem>
                      <SelectItem value="anime">Аниме</SelectItem>
                      <SelectItem value="anime-movie">Аниме-фильм</SelectItem>
                      <SelectItem value="cartoon">Мультсериал</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Статус</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: MediaItem["status"]) =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planned">Запланировано</SelectItem>
                      <SelectItem value="watching">Смотрю</SelectItem>
                      <SelectItem value="watched">Просмотрено</SelectItem>
                      <SelectItem value="dropped">Брошено</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {hasEpisodes(formData.type) && (
                <div className="grid grid-cols-2 gap-4">
                  {formData.type !== "anime" && (
                    <div className="space-y-2">
                      <Label>Текущий сезон</Label>
                      <Input
                        type="number"
                        min={1}
                        value={formData.currentSeason}
                        onChange={(e) => setFormData({ ...formData, currentSeason: parseInt(e.target.value) || 1 })}
                        className="rounded-xl"
                      />
                    </div>
                  )}
                  <div className={cn("space-y-2", formData.type === "anime" && "col-span-2")}>
                    <Label>Текущая серия</Label>
                    <Input
                      type="number"
                      min={1}
                      value={formData.currentEpisode}
                      onChange={(e) => setFormData({ ...formData, currentEpisode: parseInt(e.target.value) || 1 })}
                      className="rounded-xl"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Оценка (1-10)</Label>
                <div className="flex gap-0.5 flex-wrap">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setFormData({ ...formData, rating: i + 1 })}
                      className="p-0.5"
                    >
                      <Star
                        className={cn(
                          "w-5 h-5 transition-colors",
                          i < formData.rating
                            ? "text-amber-500 fill-amber-500"
                            : "text-muted-foreground hover:text-amber-500"
                        )}
                      />
                    </button>
                  ))}
                  {formData.rating > 0 && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, rating: 0 })}
                      className="ml-2 p-1"
                    >
                      <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                    </button>
                  )}
                </div>
                {formData.rating > 0 && (
                  <p className="text-sm text-muted-foreground">{formData.rating}/10</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, watchedTogether: !formData.watchedTogether })
                  }
                  className={cn(
                    "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors",
                    formData.watchedTogether
                      ? "bg-primary border-primary text-primary-foreground"
                      : "border-muted-foreground"
                  )}
                >
                  {formData.watchedTogether && <Check className="w-4 h-4" />}
                </button>
                <Label
                  className="cursor-pointer"
                  onClick={() =>
                    setFormData({ ...formData, watchedTogether: !formData.watchedTogether })
                  }
                >
                  Смотрели вместе
                </Label>
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} className="rounded-full">
            Отмена
          </Button>
          <Button onClick={handleSubmit} disabled={!formData.title.trim()} className="rounded-full">
            Добавить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}