"use client"

import { useState } from "react"
import { Plus, Star, Check, X, Search, Loader2, Film } from "lucide-react"
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

interface KinopoiskMovie {
  id: number
  name: string
  alternativeName?: string
  description?: string
  poster?: { url: string }
  year?: number
  type: "movie" | "tv-series" | "anime" | "cartoon"
}

interface ShikimoriAnime {
  id: number
  name: string
  russian: string
  kind: "tv" | "movie" | "ova" | "ona" | "special"
  aired_on: string
  image?: { original: string; preview: string; x96: string; x48: string }
  description?: string
}

type SearchResult = KinopoiskMovie | ShikimoriAnime

const getShikimoriImage = (image: ShikimoriAnime['image']) => {
  if (!image) return ""
  const path = image.preview || image.original || ""
  return path.startsWith('/') ? `https://shikimori.one${path}` : path
}

export function AddMediaDialog() {
  const { addMediaItem, activeUserId } = useApp()
  const [open, setOpen] = useState(false)

  const [searchSource, setSearchSource] = useState<"kinopoisk" | "shikimori">("kinopoisk")
  const [searchInput, setSearchInput] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)

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

  const handleSearch = async () => {
    if (searchInput.length < 2) {
      setSearchResults([])
      setShowResults(false)
      return
    }

    setIsSearching(true)
    setShowResults(true)

    try {
      const endpoint = searchSource === "kinopoisk" ? "/api/search-movie" : "/api/search-anime"
      const res = await fetch(`${endpoint}?query=${encodeURIComponent(searchInput)}`)
      const data = await res.json()
      setSearchResults(searchSource === "kinopoisk" ? (data.docs || []) : (data || []))
    } catch (error) {
      console.error("Search failed:", error)
      setSearchResults([])
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
      setFormData({
        ...formData,
        title: movie.name,
        poster: movie.poster?.url || "",
        description: movie.description || "",
        type: movie.type === "movie" ? "movie" : movie.type === "tv-series" ? "series" : "movie",
        externalId: movie.id.toString(),
      })
    } else {
      const anime = item as ShikimoriAnime
      const poster = getShikimoriImage(anime.image)
      setFormData({
        ...formData,
        title: anime.russian || anime.name,
        poster: poster,
        description: anime.description || "",
        type: anime.kind === "movie" ? "anime-movie" : "anime",
        externalId: anime.id.toString(),
      })
    }
    setShowResults(false)
    setSearchResults([])
  }

  const getYear = (item: SearchResult): string => {
    if (searchSource === "kinopoisk") return (item as KinopoiskMovie).year?.toString() || ""
    const aired = (item as ShikimoriAnime).aired_on
    return aired ? new Date(aired).getFullYear().toString() : ""
  }

  const getTypeLabel = (item: SearchResult): string => {
    if (searchSource === "kinopoisk") {
      return (item as KinopoiskMovie).type === "movie" ? "Фильм" : "Сериал"
    }
    return (item as ShikimoriAnime).kind === "movie" ? "Аниме-фильм" : "Аниме"
  }

  const saveToSupabase = async () => {
    const supabase = createClient()

    const { data: content, error: contentError } = await supabase
      .from("content")
      .upsert({
        external_id: formData.externalId || Date.now().toString(),
        content_type: formData.type,
        title_ru: formData.title,
        title_en: formData.title,
        poster_url: formData.poster || defaultPosters[0],
        description: formData.description || null,
        year: null,
        updated_at: new Date(),
      }, { onConflict: "external_id, content_type" })
      .select()
      .single()

    if (contentError) throw contentError

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

    if (personalError) throw personalError
    return content
  }

  const handleSubmit = async () => {
    if (!formData.title.trim()) return

    try {
      await saveToSupabase()
      addMediaItem({
        title: formData.title,
        poster: formData.poster || defaultPosters[0],
        description: formData.description || undefined,
        type: formData.type,
        status: formData.status,
        rating: formData.rating || undefined,
        currentSeason: hasEpisodes(formData.type) ? formData.currentSeason : undefined,
        currentEpisode: hasEpisodes(formData.type) ? formData.currentEpisode : undefined,
        watchedTogether: formData.watchedTogether,
        userId: activeUserId,
      })

      setFormData({
        title: "", poster: "", description: "", type: "movie", status: "planned",
        rating: 0, currentSeason: 1, currentEpisode: 1, watchedTogether: false, externalId: "",
      })
      setSearchInput("")
      setSearchSource("kinopoisk")
      setOpen(false)
    } catch (error) {
      console.error("Submit error:", error)
      alert("Ошибка при сохранении. Попробуй ещё раз.")
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSearchInput("")
      setSearchResults([])
      setShowResults(false)
      setSearchSource("kinopoisk")
      setFormData({
        title: "", poster: "", description: "", type: "movie", status: "planned",
        rating: 0, currentSeason: 1, currentEpisode: 1, watchedTogether: false, externalId: "",
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
      <DialogContent className="rounded-2xl max-h-[90vh] overflow-y-auto w-[95vw] max-w-2xl md:max-w-3xl lg:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Добавить в медиатеку</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Переключатель источника */}
          <div className="flex gap-2 p-1 bg-muted rounded-full">
            {searchSources.map((source) => (
              <button
                key={source.value}
                type="button"
                onClick={() => {
                  setSearchSource(source.value as "kinopoisk" | "shikimori")
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

          {/* Поле поиска с кнопкой */}
          <div className="space-y-2">
            <Label className="text-base">Поиск *</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={searchSource === "kinopoisk"
                    ? "Введите название фильма или сериала..."
                    : "Введите название аниме..."}
                  className="rounded-xl pl-10 pr-4 py-6 text-base"
                />
              </div>
              <Button
                onClick={handleSearch}
                disabled={searchInput.length < 2 || isSearching}
                className="rounded-xl px-6 py-6 text-base"
              >
                {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : "Найти"}
              </Button>
            </div>

            {/* Выпадающий список */}
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
                        : getShikimoriImage((item as ShikimoriAnime).image)
                      const title = searchSource === "kinopoisk"
                        ? (item as KinopoiskMovie).name
                        : (item as ShikimoriAnime).russian || (item as ShikimoriAnime).name

                      return (
                        <div
                          key={item.id}
                          className="p-4 hover:bg-muted cursor-pointer flex items-start gap-4 border-b last:border-0 transition-colors"
                          onClick={() => handleSelectItem(item)}
                        >
                          {poster && !poster.includes('missing') ? (
                            <img src={poster} alt={title} className="w-14 h-20 md:w-16 md:h-24 object-cover rounded-lg flex-shrink-0 shadow-sm" />
                          ) : (
                            <div className="w-14 h-20 md:w-16 md:h-24 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                              <Film className="w-6 h-6 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0 py-1">
                            <p className="font-medium text-base md:text-lg truncate">{title}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {getYear(item)} • {getTypeLabel(item)}
                            </p>
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

            {/* Выбранный элемент */}
            {!showResults && formData.title && (
              <div className="mt-3 p-3 bg-muted/50 rounded-xl">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Выбрано: <span className="font-medium text-foreground">{formData.title}</span>
                </p>
              </div>
            )}
          </div>

          {/* Форма редактирования */}
          {formData.title && (
            <>
              <div className="space-y-2">
                <Label className="text-base">Описание</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Краткое описание..."
                  className="rounded-xl resize-none text-base"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-base">Тип</Label>
                  <Select value={formData.type} onValueChange={(v: MediaItem["type"]) => setFormData({ ...formData, type: v })}>
                    <SelectTrigger className="rounded-xl py-6 text-base"><SelectValue /></SelectTrigger>
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
                  <Label className="text-base">Статус</Label>
                  <Select value={formData.status} onValueChange={(v: MediaItem["status"]) => setFormData({ ...formData, status: v })}>
                    <SelectTrigger className="rounded-xl py-6 text-base"><SelectValue /></SelectTrigger>
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
                      <Label className="text-base">Текущий сезон</Label>
                      <Input type="number" min={1} value={formData.currentSeason}
                        onChange={(e) => setFormData({ ...formData, currentSeason: parseInt(e.target.value) || 1 })}
                        className="rounded-xl py-6 text-base" />
                    </div>
                  )}
                  <div className={cn("space-y-2", formData.type === "anime" && "col-span-2")}>
                    <Label className="text-base">Текущая серия</Label>
                    <Input type="number" min={1} value={formData.currentEpisode}
                      onChange={(e) => setFormData({ ...formData, currentEpisode: parseInt(e.target.value) || 1 })}
                      className="rounded-xl py-6 text-base" />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-base">Оценка (1-10)</Label>
                <div className="flex gap-1 flex-wrap">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <button key={i} type="button" onClick={() => setFormData({ ...formData, rating: i + 1 })} className="p-1">
                      <Star className={cn("w-7 h-7 transition-colors", i < formData.rating ? "text-amber-500 fill-amber-500" : "text-muted-foreground hover:text-amber-500")} />
                    </button>
                  ))}
                  {formData.rating > 0 && (
                    <button type="button" onClick={() => setFormData({ ...formData, rating: 0 })} className="ml-2 p-1">
                      <X className="w-6 h-6 text-muted-foreground hover:text-foreground" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 py-2">
                <button type="button" onClick={() => setFormData({ ...formData, watchedTogether: !formData.watchedTogether })}
                  className={cn("w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-colors",
                    formData.watchedTogether ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground")}>
                  {formData.watchedTogether && <Check className="w-5 h-5" />}
                </button>
                <Label className="cursor-pointer text-base" onClick={() => setFormData({ ...formData, watchedTogether: !formData.watchedTogether })}>
                  Смотрели вместе
                </Label>
              </div>
            </>
          )}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} className="rounded-full px-6 py-5 text-base">Отмена</Button>
          <Button onClick={handleSubmit} disabled={!formData.title.trim()} className="rounded-full px-6 py-5 text-base">Добавить</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}