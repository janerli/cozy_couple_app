"use client"

import { UserAvatar } from "@/components/user-avatar"
import { useMemo, useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Heart, 
  Clock, 
  Film, 
  Play, 
  Ban, 
  Plus, 
  Star, 
  Trash2, 
  Edit2, 
  ArrowUpDown,
  X,
  MessageCircle,
  Gamepad2,
  Trophy,
  Clapperboard,
  Search,
  Loader2
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useApp, SharedMediaItem, SharedGameItem, GamePlatform } from "@/lib/app-context"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

// ===================
// MEDIA SECTION
// ===================

type MediaTab = "will-watch" | "watching" | "watched" | "dropped"
type FilterType = "all" | SharedMediaItem["type"]
type SortBy = "date" | "rating" | "title"

const mediaTabs: { value: MediaTab; label: string; icon: React.ElementType }[] = [
  { value: "will-watch", label: "Будем смотреть", icon: Clock },
  { value: "watching", label: "Смотрим", icon: Play },
  { value: "watched", label: "Посмотрели", icon: Film },
  { value: "dropped", label: "Бросили", icon: Ban },
]

const filterOptions: { value: FilterType; label: string }[] = [
  { value: "all", label: "Все" },
  { value: "movie", label: "Фильм" },
  { value: "series", label: "Сериал" },
  { value: "anime", label: "Аниме" },
  { value: "anime-movie", label: "Аниме-фильм" },
  { value: "cartoon", label: "Мультсериал" },
]

const typeLabels: Record<SharedMediaItem["type"], string> = {
  movie: "Фильм",
  series: "Сериал",
  anime: "Аниме",
  "anime-movie": "Аниме-фильм",
  cartoon: "Мультсериал",
}

const mediaStatusLabels: Record<SharedMediaItem["status"], string> = {
  "will-watch": "Будем смотреть",
  watching: "Смотрим",
  watched: "Посмотрели",
  dropped: "Бросили",
}

const mediaStatusColors: Record<SharedMediaItem["status"], string> = {
  "will-watch": "bg-blue-500/90 text-white",
  watching: "bg-amber-500/90 text-white",
  watched: "bg-green-500/90 text-white",
  dropped: "bg-red-500/90 text-white",
}

const defaultPosters = [
  "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=300&h=450&fit=crop",
  "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=300&h=450&fit=crop",
  "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=300&h=450&fit=crop",
]

const reactions = ["💕", "🔥", "😍", "👍", "😢", "😱", "🤯", "💤"]

const searchSources = [
  { value: "kinopoisk", label: "🎬 Фильмы/Сериалы" },
  { value: "shikimori", label: "🌸 Аниме" },
]

function hasEpisodes(type: SharedMediaItem["type"]): boolean {
  return type === "series" || type === "anime" || type === "cartoon"
}

// Функция очистки HTML и BB-кодов
const cleanDescription = (text: string) => {
  if (!text) return ""
  // Удаляем HTML-теги
  const noHtml = text.replace(/<[^>]*>/g, '')
  // Удаляем BB-коды [character=...] и [/character]
  const noBbCode = noHtml.replace(/\[[^\]]*\]/g, '')
  return noBbCode.trim()
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
  poster?: { originalUrl: string }
  image?: {
    original: string  // Оригинальное изображение
    preview: string   // Превью (обычно x160)
    x96: string       // Маленькое (x96)
    x48: string       // Очень маленькое (x48)
  }
  description?: string
  aired_on?: string
}

type SearchResult = KinopoiskMovie | ShikimoriAnime

function AddSharedMediaDialog() {
  const { addSharedMediaItem, activeUserId } = useApp()
  const [open, setOpen] = useState(false)
  
  const [searchSource, setSearchSource] = useState<"kinopoisk" | "shikimori">("kinopoisk")
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  
  const [formData, setFormData] = useState({
    title: "",
    poster: "",
    description: "",
    type: "movie" as SharedMediaItem["type"],
    externalId: "",
  })

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
      const endpoint = searchSource === "kinopoisk" ? "/api/search-movie" : "/api/search-anime"
      const res = await fetch(`${endpoint}?query=${encodeURIComponent(query)}`)
      const data = await res.json()
      setSearchResults(searchSource === "kinopoisk" ? (data.docs || []) : (data || []))
    } catch {
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleSelectItem = async (item: SearchResult) => {
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
      setSearchQuery(movie.name)
    } else {
// При выборе аниме
const anime = item as ShikimoriAnime
    
    // 🔥 Запрашиваем детальную информацию
     let description = cleanDescription(anime.description || "")
    
    if (!description) {
      try {
        const res = await fetch(`https://shikimori.io/api/animes/${anime.id}`, {
          headers: { 'User-Agent': 'OurCozyTracker/1.0' }
        })
        const detail = await res.json()
        description = cleanDescription(detail.description || "")
      } catch (error) {
        console.error('Failed to fetch anime details:', error)
      }
    }
    const imgPath = anime.image?.original || anime.image?.preview || ""
    const poster = imgPath.startsWith('/') ? `https://shikimori.io${imgPath}` : imgPath
setFormData({
  ...formData,
  title: anime.russian || anime.name,
  poster: poster,
  description: description,
  type: anime.kind === "movie" ? "anime-movie" : "anime",
  externalId: anime.id.toString(),
})
      setSearchQuery(anime.russian || anime.name)
    }
    setShowResults(false)
    setSearchResults([])
  }

  const saveToSupabase = async () => {
    const supabase = createClient()
    const { data: content, error: contentError } = await supabase
      .from("content")
      .upsert({
        external_id: formData.externalId || Date.now().toString(),
        content_type: formData.type,
        title_ru: formData.title,
        poster_url: formData.poster || defaultPosters[0],
        description: formData.description || null,
        updated_at: new Date(),
      }, { onConflict: "external_id, content_type" })
      .select()
      .single()
    if (contentError) throw contentError

    const { error: sharedError } = await supabase
      .from("shared_media")
      .insert({
        content_id: content.id,
        added_by: activeUserId,
        status: "planned",
        current_season: 1,
        current_episode: 1,
      })
    if (sharedError) throw sharedError
    return content
  }

  const handleSubmit = async () => {
    if (!formData.title.trim()) return
    try {
      await saveToSupabase()
      addSharedMediaItem({
        title: formData.title,
        poster: formData.poster || defaultPosters[0],
        description: formData.description || undefined,
        type: formData.type,
        status: "will-watch",
        addedByUserId: activeUserId,
      })
      setFormData({ title: "", poster: "", description: "", type: "movie", externalId: "" })
      setSearchQuery("")
      setOpen(false)
    } catch {
      alert("Ошибка при сохранении")
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSearchQuery("")
      setSearchResults([])
      setShowResults(false)
      setFormData({ title: "", poster: "", description: "", type: "movie", externalId: "" })
    }
    setOpen(newOpen)
  }

  const getYear = (item: SearchResult) => searchSource === "kinopoisk" 
    ? (item as KinopoiskMovie).year?.toString() || "" 
    : (item as ShikimoriAnime).aired_on?.slice(0, 4) || ""

  const getTypeLabel = (item: SearchResult) => searchSource === "kinopoisk"
    ? ((item as KinopoiskMovie).type === "movie" ? "Фильм" : "Сериал")
    : ((item as ShikimoriAnime).kind === "movie" ? "Аниме-фильм" : "Аниме")

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="rounded-full gap-2">
          <Plus className="w-4 h-4" /> Добавить
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Добавить в общий список</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex gap-2 p-1 bg-muted rounded-full">
            {searchSources.map((s) => (
              <button
                key={s.value}
                onClick={() => {
                  setSearchSource(s.value as "kinopoisk" | "shikimori")
                  setSearchQuery("")
                  setSearchResults([])
                }}
                className={cn("flex-1 px-3 py-2 rounded-full text-sm font-medium transition-all",
                  searchSource === s.value ? "bg-primary text-primary-foreground" : "text-muted-foreground")}
              >
                {s.label}
              </button>
            ))}
          </div>
          <div className="space-y-2 relative">
            <Label>Поиск *</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => searchResults.length > 0 && setShowResults(true)}
                placeholder="Введите название..."
                className="rounded-xl pl-10"
              />
            </div>
            {showResults && (
              <div className="absolute z-10 w-full mt-1 bg-background border rounded-xl shadow-lg max-h-60 overflow-auto">
                {isSearching ? (
                  <div className="p-4 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((item) => {
  const poster = searchSource === "kinopoisk" 
    ? (item as KinopoiskMovie).poster?.url 
    : (() => {
        const img = (item as ShikimoriAnime).image
        const path = img?.preview || img?.original || ""
        // Если путь начинается с "/", добавляем домен Shikimori
        return path.startsWith('/') ? `https://shikimori.io${path}` : path
      })()
  
  const title = searchSource === "kinopoisk"
    ? (item as KinopoiskMovie).name
    : (item as ShikimoriAnime).russian || (item as ShikimoriAnime).name
    
  return (
    <div
      key={item.id}
      className="p-3 hover:bg-muted cursor-pointer flex items-center gap-3 border-b last:border-0"
      onClick={() => handleSelectItem(item)}
    >
      {poster && !poster.includes('missing') && (
        <img 
          src={poster} 
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
                  <div className="p-4 text-center text-sm text-muted-foreground">Ничего не найдено</div>
                ) : null}
              </div>
            )}
          </div>
          {formData.title && (
            <>
              <div className="space-y-2">
                <Label>Описание</Label>
                <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Краткое описание..." className="rounded-xl resize-none" rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Тип</Label>
                <Select value={formData.type} onValueChange={(v: SharedMediaItem["type"]) => setFormData({ ...formData, type: v })}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="movie">Фильм</SelectItem>
                    <SelectItem value="series">Сериал</SelectItem>
                    <SelectItem value="anime">Аниме</SelectItem>
                    <SelectItem value="anime-movie">Аниме-фильм</SelectItem>
                    <SelectItem value="cartoon">Мультсериал</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} className="rounded-full">Отмена</Button>
          <Button onClick={handleSubmit} disabled={!formData.title.trim()} className="rounded-full">Добавить</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function SharedMediaCard({ item, index }: { item: SharedMediaItem; index: number }) {
  const { users, activeUserId, partnerUser, updateSharedMediaItem, deleteSharedMediaItem, updateSharedMediaUserRating } = useApp()
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    title: item.title,
    description: item.description || "",
    status: item.status,
    currentSeason: item.currentSeason || 1,
    currentEpisode: item.currentEpisode || 1,
    note: item.note || "",
  })
  
  // 🔥 Индивидуальные оценки и реакции
  const [userRating, setUserRating] = useState(0)
  const [userReaction, setUserReaction] = useState("")

  const addedByUser = users.find((u) => u.id === item.addedByUserId)
  
  // 🔥 Получаем оценки обоих пользователей
  const myRating = item.userRatings?.find(r => r.user_id === activeUserId)
  const partnerRating = item.userRatings?.find(r => r.user_id === partnerUser?.id)

  // 🔥 Загружаем текущие оценки при открытии редактирования
  useEffect(() => {
    if (isEditing) {
      setUserRating(myRating?.user_rating || 0)
      setUserReaction(myRating?.reaction || "")
    }
  }, [isEditing, myRating])

  const handleSave = async () => {
    // Сохраняем основные данные карточки
    await updateSharedMediaItem(item.id, {
      title: editData.title,
      description: editData.description || undefined,
      status: editData.status,
      currentSeason: hasEpisodes(item.type) ? editData.currentSeason : undefined,
      currentEpisode: hasEpisodes(item.type) ? editData.currentEpisode : undefined,
      note: editData.note || undefined,
    })
    
    // 🔥 Сохраняем индивидуальную оценку и реакцию
    await updateSharedMediaUserRating(
      item.id, 
      activeUserId, 
      userRating || null, 
      userReaction || null
    )
    
    setIsEditing(false)
  }

  const getProgressText = () => {
    if (!hasEpisodes(item.type)) return null
    if (item.type === "anime") return item.currentEpisode ? `${item.currentEpisode} серия` : null
    if (item.currentSeason && item.currentEpisode) return `${item.currentSeason} сезон, ${item.currentEpisode} серия`
    return null
  }

  const progressText = getProgressText()

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} layout>
        <Card className="overflow-hidden soft-shadow dark:neon-glow group cursor-pointer">
          <div className="relative aspect-[2/3]">
            <img src={item.poster} alt={item.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
              <div className="absolute bottom-0 left-0 right-0 p-4">
                {item.description && <p className="text-white/80 text-xs mb-3 line-clamp-3">{item.description}</p>}
                {item.note && <p className="text-white/60 text-xs mb-3 italic flex items-center gap-1"><MessageCircle className="w-3 h-3" />{item.note}</p>}
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" className="rounded-full flex-1" onClick={() => setIsEditing(true)}><Edit2 className="w-4 h-4" /></Button>
                  <Button size="sm" variant="destructive" className="rounded-full" onClick={() => deleteSharedMediaItem(item.id)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
            </div>
            
            <div className="absolute top-2 left-2">
              <span className={cn("px-2 py-1 text-xs font-medium rounded-full", mediaStatusColors[item.status])}>{mediaStatusLabels[item.status]}</span>
            </div>
            
            {/* 🔥 Реакция текущего пользователя */}
            {myRating?.reaction && (
              <div className="absolute top-2 right-2">
                <span className="w-8 h-8 bg-background/80 backdrop-blur rounded-full flex items-center justify-center text-lg">
                  {myRating.reaction}
                </span>
              </div>
            )}
            
            <div className="absolute bottom-2 left-2 right-2 opacity-100 group-hover:opacity-0 transition-opacity">
              <span className="px-2 py-1 text-xs bg-black/60 text-white rounded-full">{typeLabels[item.type]}</span>
            </div>
          </div>
          
          <div className="p-3">
            <h3 className="font-medium text-sm truncate mb-1">{item.title}</h3>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <UserAvatar avatar={addedByUser?.avatar || ''} name={addedByUser?.name || ''} size="sm" />
                <span className="truncate">{addedByUser?.name}</span>
              </div>
            </div>
            
            {/* 🔥 Оценки обоих пользователей */}
            <div className="flex justify-between items-center mt-2 text-xs">
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">Ты:</span>
                {myRating?.user_rating ? (
                  <div className="flex items-center">
                    <Star className="w-3 h-3 text-amber-500 fill-amber-500 mr-0.5" />
                    <span className="font-medium">{myRating.user_rating}</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground/50">—</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">{partnerUser?.name}:</span>
                {partnerRating?.user_rating ? (
                  <div className="flex items-center">
                    <Star className="w-3 h-3 text-amber-500 fill-amber-500 mr-0.5" />
                    <span className="font-medium">{partnerRating.user_rating}</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground/50">—</span>
                )}
              </div>
              {progressText && <span className="text-muted-foreground truncate">{progressText}</span>}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Редактировать</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Название</Label><Input value={editData.title} onChange={(e) => setEditData({ ...editData, title: e.target.value })} className="rounded-xl" /></div>
            <div className="space-y-2"><Label>Описание</Label><Textarea value={editData.description} onChange={(e) => setEditData({ ...editData, description: e.target.value })} className="rounded-xl resize-none" rows={3} /></div>
            <div className="space-y-2">
              <Label>Статус</Label>
              <Select value={editData.status} onValueChange={(v: SharedMediaItem["status"]) => setEditData({ ...editData, status: v })}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="will-watch">Будем смотреть</SelectItem>
                  <SelectItem value="watching">Смотрим</SelectItem>
                  <SelectItem value="watched">Посмотрели</SelectItem>
                  <SelectItem value="dropped">Бросили</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {hasEpisodes(item.type) && (
              <div className="grid grid-cols-2 gap-4">
                {item.type !== "anime" && <div className="space-y-2"><Label>Сезон</Label><Input type="number" min={1} value={editData.currentSeason} onChange={(e) => setEditData({ ...editData, currentSeason: parseInt(e.target.value) || 1 })} className="rounded-xl" /></div>}
                <div className={cn("space-y-2", item.type === "anime" && "col-span-2")}><Label>Серия</Label><Input type="number" min={1} value={editData.currentEpisode} onChange={(e) => setEditData({ ...editData, currentEpisode: parseInt(e.target.value) || 1 })} className="rounded-xl" /></div>
              </div>
            )}
            
            {/* 🔥 Индивидуальная оценка */}
            <div className="space-y-2">
              <Label>Твоя оценка (1-10)</Label>
              <div className="flex gap-0.5 flex-wrap">
                {Array.from({ length: 10 }).map((_, i) => (
                  <button key={i} onClick={() => setUserRating(i + 1)} className="p-0.5">
                    <Star className={cn("w-5 h-5 transition-colors", i < userRating ? "text-amber-500 fill-amber-500" : "text-muted-foreground hover:text-amber-500")} />
                  </button>
                ))}
                {userRating > 0 && (
                  <button onClick={() => setUserRating(0)} className="ml-2 p-1">
                    <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                  </button>
                )}
              </div>
            </div>
            
            <div className="space-y-2"><Label>Заметка</Label><Textarea value={editData.note} onChange={(e) => setEditData({ ...editData, note: e.target.value })} className="rounded-xl resize-none" rows={2} /></div>
            
            {/* 🔥 Индивидуальная реакция */}
            <div className="space-y-2">
              <Label>Твоя реакция</Label>
              <div className="flex gap-2 flex-wrap">
                {["💕", "🔥", "😍", "👍", "😢", "😱", "🤯", "💤"].map((e) => (
                  <button key={e} onClick={() => setUserReaction(userReaction === e ? "" : e)} className={cn("w-10 h-10 rounded-xl text-xl", userReaction === e ? "bg-primary/20 ring-2 ring-primary" : "bg-muted")}>{e}</button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditing(false)} className="rounded-full">Отмена</Button>
            <Button onClick={handleSave} className="rounded-full">Сохранить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ===================
// GAMES SECTION (аналогично AddGameDialog из предыдущего ответа, с поиском через RAWG)
// ===================

type GameTab = "planning" | "playing" | "completed" | "dropped"
type FilterPlatform = "all" | GamePlatform

const gameTabs: { value: GameTab; label: string; icon: React.ElementType }[] = [
  { value: "planning", label: "Планируем", icon: Clock },
  { value: "playing", label: "Играем", icon: Play },
  { value: "completed", label: "Прошли", icon: Trophy },
  { value: "dropped", label: "Бросили", icon: Ban },
]

const platformOptions: { value: FilterPlatform; label: string }[] = [
  { value: "all", label: "Все" }, { value: "pc", label: "PC" }, { value: "playstation", label: "PlayStation" },
  { value: "xbox", label: "Xbox" }, { value: "nintendo", label: "Nintendo" }, { value: "mobile", label: "Mobile" },
]

const platformLabels: Record<GamePlatform, string> = {
  pc: "PC", playstation: "PlayStation", xbox: "Xbox", nintendo: "Nintendo", mobile: "Mobile",
}

const gameStatusLabels: Record<SharedGameItem["status"], string> = {
  planning: "Планируем", playing: "Играем", completed: "Прошли", dropped: "Бросили",
}

const gameStatusColors: Record<SharedGameItem["status"], string> = {
  planning: "bg-blue-500/90 text-white", playing: "bg-amber-500/90 text-white",
  completed: "bg-green-500/90 text-white", dropped: "bg-red-500/90 text-white",
}

const defaultCovers = [
  "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=300&h=400&fit=crop",
  "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=300&h=400&fit=crop",
]

interface RAWGGame {
  id: number; name: string; background_image: string; description_raw?: string;
  released?: string; platforms?: { platform: { name: string } }[]; genres?: { name: string }[];
}

function AddGameDialog() {
  const { addSharedGameItem, activeUserId } = useApp()
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<RAWGGame[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [formData, setFormData] = useState({
    title: "", cover: "", description: "", platforms: [] as GamePlatform[], genres: "", externalId: "",
  })

  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    if (query.length < 2) { setSearchResults([]); setShowResults(false); return }
    setIsSearching(true); setShowResults(true)
    try {
      const res = await fetch(`/api/search-game?query=${encodeURIComponent(query)}`)
      const data = await res.json()
      setSearchResults(data.results || [])
    } catch { setSearchResults([]) } finally { setIsSearching(false) }
  }

  const handleSelectGame = (game: RAWGGame) => {
    const mapped: GamePlatform[] = []
    game.platforms?.forEach(p => {
      const n = p.platform.name.toLowerCase()
      if (n.includes("pc")) mapped.push("pc")
      else if (n.includes("playstation")) mapped.push("playstation")
      else if (n.includes("xbox")) mapped.push("xbox")
      else if (n.includes("nintendo")) mapped.push("nintendo")
      else if (n.includes("ios")||n.includes("android")) mapped.push("mobile")
    })
    setFormData({
      ...formData, title: game.name, cover: game.background_image || "",
      description: game.description_raw || "", platforms: [...new Set(mapped)],
      genres: game.genres?.map(g => g.name).join(", ") || "", externalId: game.id.toString(),
    })
    setSearchQuery(game.name); setShowResults(false); setSearchResults([])
  }

  const saveToSupabase = async () => {
    const supabase = createClient()
    const { data: content, error: contentError } = await supabase
      .from("content").upsert({
        external_id: formData.externalId || Date.now().toString(), content_type: "game",
        title_ru: formData.title, poster_url: formData.cover || defaultCovers[0],
        description: formData.description || null, platforms: formData.platforms,
        genres: formData.genres.split(",").map(g => g.trim()), updated_at: new Date(),
      }, { onConflict: "external_id, content_type" }).select().single()
    if (contentError) throw contentError
    const { error: sharedError } = await supabase.from("shared_games").insert({
      content_id: content.id, added_by: activeUserId, status: "planning",
    })
    if (sharedError) throw sharedError
    return content
  }

  const handleSubmit = async () => {
    if (!formData.title.trim()) return
    try {
      await saveToSupabase()
      addSharedGameItem({
        title: formData.title, cover: formData.cover || defaultCovers[0],
        description: formData.description || undefined,
        platforms: formData.platforms.length ? formData.platforms : ["pc"],
        genres: formData.genres ? formData.genres.split(",").map(g => g.trim()) : undefined,
        status: "planning", addedByUserId: activeUserId,
      })
      setFormData({ title: "", cover: "", description: "", platforms: [], genres: "", externalId: "" })
      setSearchQuery(""); setOpen(false)
    } catch { alert("Ошибка при сохранении") }
  }

  const togglePlatform = (p: GamePlatform) => setFormData(prev => ({
    ...prev, platforms: prev.platforms.includes(p) ? prev.platforms.filter(x => x !== p) : [...prev.platforms, p]
  }))

  return (
    <Dialog open={open} onOpenChange={(o) => { if(!o){ setSearchQuery(""); setFormData({ title: "", cover: "", description: "", platforms: [], genres: "", externalId: "" }) } setOpen(o) }}>
      <DialogTrigger asChild><Button className="rounded-full gap-2"><Plus className="w-4 h-4" />Добавить игру</Button></DialogTrigger>
      <DialogContent className="rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Добавить игру</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2 relative">
            <Label>Поиск *</Label>
            <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={searchQuery} onChange={(e) => handleSearch(e.target.value)} onFocus={() => searchResults.length > 0 && setShowResults(true)} placeholder="Введите название игры..." className="rounded-xl pl-10" />
            </div>
            {showResults && (
              <div className="absolute z-10 w-full mt-1 bg-background border rounded-xl shadow-lg max-h-60 overflow-auto">
                {isSearching ? <div className="p-4 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></div> :
                 searchResults.length > 0 ? searchResults.map(g => (
                  <div key={g.id} className="p-3 hover:bg-muted cursor-pointer flex gap-3" onClick={() => handleSelectGame(g)}>
                    {g.background_image && <img src={g.background_image} alt={g.name} className="w-10 h-10 object-cover rounded" />}
                    <div><p className="font-medium">{g.name}</p><p className="text-xs text-muted-foreground">{g.released?.slice(0,4)||""}</p></div>
                  </div>
                )) : searchQuery.length >= 2 ? <div className="p-4 text-center text-sm text-muted-foreground">Ничего не найдено</div> : null}
              </div>
            )}
          </div>
          {formData.title && (
            <>
              <div className="space-y-2"><Label>Описание</Label><Textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="rounded-xl resize-none" rows={3} /></div>
              <div className="space-y-2"><Label>Платформы</Label><div className="flex flex-wrap gap-2">{Object.keys(platformLabels).map((p) => <button key={p} onClick={() => togglePlatform(p as GamePlatform)} className={cn("px-3 py-1.5 rounded-full text-sm", formData.platforms.includes(p as GamePlatform) ? "bg-primary text-primary-foreground" : "bg-muted")}>{platformLabels[p as GamePlatform]}</button>)}</div></div>
              <div className="space-y-2"><Label>Жанры (через запятую)</Label><Input value={formData.genres} onChange={(e) => setFormData({...formData, genres: e.target.value})} className="rounded-xl" /></div>
            </>
          )}
        </div>
        <DialogFooter><Button variant="outline" onClick={() => setOpen(false)} className="rounded-full">Отмена</Button><Button onClick={handleSubmit} disabled={!formData.title.trim()} className="rounded-full">Добавить</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
// ... предыдущий код ...

function SharedGameCard({ item, index }: { item: SharedGameItem; index: number }) {
  const { users, activeUserId, partnerUser, updateSharedGameItem, deleteSharedGameItem, updateSharedGameUserRating } = useApp()
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    title: item.title,
    description: item.description || "",
    status: item.status,
    platforms: item.platforms,
    note: item.note || "",
  })
  
  // 🔥 Индивидуальная оценка
  const [userRating, setUserRating] = useState(0)

  const addedByUser = users.find((u) => u.id === item.addedByUserId)
  
  // 🔥 Получаем оценки обоих пользователей
  const myRating = item.userRatings?.find(r => r.user_id === activeUserId)
  const partnerRating = item.userRatings?.find(r => r.user_id === partnerUser?.id)

  // 🔥 Загружаем текущую оценку при открытии редактирования
  useEffect(() => {
    if (isEditing) {
      setUserRating(myRating?.user_rating || 0)
    }
  }, [isEditing, myRating])

  const handleSave = async () => {
    // Сохраняем основные данные карточки
    await updateSharedGameItem(item.id, {
      title: editData.title,
      description: editData.description || undefined,
      status: editData.status,
      platforms: editData.platforms,
      note: editData.note || undefined,
    })
    
    // 🔥 Сохраняем индивидуальную оценку
    await updateSharedGameUserRating(
      item.id,
      activeUserId,
      userRating || null,
      null  // для игр пока без реакций
    )
    
    setIsEditing(false)
  }

  const togglePlatform = (p: GamePlatform) => setEditData(prev => ({
    ...prev, platforms: prev.platforms.includes(p) ? prev.platforms.filter(x => x !== p) : [...prev.platforms, p]
  }))

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} layout>
        <Card className="overflow-hidden soft-shadow dark:neon-glow group cursor-pointer">
          <div className="relative aspect-[3/4]">
            <img src={item.cover} alt={item.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
              <div className="absolute bottom-0 left-0 right-0 p-4">
                {item.description && <p className="text-white/80 text-xs mb-3 line-clamp-3">{item.description}</p>}
                {item.note && <p className="text-white/60 text-xs mb-3 italic">{item.note}</p>}
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" className="rounded-full flex-1" onClick={() => setIsEditing(true)}><Edit2 className="w-4 h-4" /></Button>
                  <Button size="sm" variant="destructive" className="rounded-full" onClick={() => deleteSharedGameItem(item.id)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
            </div>
            <div className="absolute top-2 left-2">
              <span className={cn("px-2 py-1 text-xs font-medium rounded-full", gameStatusColors[item.status])}>{gameStatusLabels[item.status]}</span>
            </div>
            <div className="absolute bottom-2 left-2 right-2 flex gap-1 flex-wrap opacity-100 group-hover:opacity-0 transition-opacity">
              {item.platforms.slice(0, 2).map((p) => <span key={p} className="px-2 py-0.5 text-xs bg-black/60 text-white rounded-full">{platformLabels[p]}</span>)}
              {item.platforms.length > 2 && <span className="px-2 py-0.5 text-xs bg-black/60 text-white rounded-full">+{item.platforms.length - 2}</span>}
            </div>
          </div>
          <div className="p-3">
            <h3 className="font-medium text-sm truncate mb-1">{item.title}</h3>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <UserAvatar avatar={addedByUser?.avatar || ''} name={addedByUser?.name || ''} size="sm" />
                <span className="truncate">{addedByUser?.name}</span>
              </div>
            </div>
            
            {/* 🔥 Оценки обоих пользователей */}
            <div className="flex justify-between items-center mt-2 text-xs">
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">Ты:</span>
                {myRating?.user_rating ? (
                  <div className="flex items-center">
                    <Star className="w-3 h-3 text-amber-500 fill-amber-500 mr-0.5" />
                    <span className="font-medium">{myRating.user_rating}</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground/50">—</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">{partnerUser?.name}:</span>
                {partnerRating?.user_rating ? (
                  <div className="flex items-center">
                    <Star className="w-3 h-3 text-amber-500 fill-amber-500 mr-0.5" />
                    <span className="font-medium">{partnerRating.user_rating}</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground/50">—</span>
                )}
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Редактировать игру</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Название</Label><Input value={editData.title} onChange={(e) => setEditData({ ...editData, title: e.target.value })} className="rounded-xl" /></div>
            <div className="space-y-2"><Label>Описание</Label><Textarea value={editData.description} onChange={(e) => setEditData({ ...editData, description: e.target.value })} className="rounded-xl resize-none" rows={3} /></div>
            <div className="space-y-2">
              <Label>Статус</Label>
              <Select value={editData.status} onValueChange={(v: SharedGameItem["status"]) => setEditData({ ...editData, status: v })}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">Планируем</SelectItem>
                  <SelectItem value="playing">Играем</SelectItem>
                  <SelectItem value="completed">Прошли</SelectItem>
                  <SelectItem value="dropped">Бросили</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Платформы</Label><div className="flex flex-wrap gap-2">{Object.keys(platformLabels).map((p) => <button key={p} onClick={() => togglePlatform(p as GamePlatform)} className={cn("px-3 py-1.5 rounded-full text-sm", editData.platforms.includes(p as GamePlatform) ? "bg-primary text-primary-foreground" : "bg-muted")}>{platformLabels[p as GamePlatform]}</button>)}</div></div>
            
            {/* 🔥 Индивидуальная оценка */}
            <div className="space-y-2">
              <Label>Твоя оценка (1-10)</Label>
              <div className="flex gap-0.5">
                {Array.from({ length: 10 }).map((_, i) => (
                  <button key={i} onClick={() => setUserRating(i + 1)}>
                    <Star className={cn("w-5 h-5", i < userRating ? "text-amber-500 fill-amber-500" : "text-muted-foreground")} />
                  </button>
                ))}
                {userRating > 0 && (
                  <button onClick={() => setUserRating(0)}><X className="w-4 h-4" /></button>
                )}
              </div>
            </div>
            
            <div className="space-y-2"><Label>Заметка</Label><Textarea value={editData.note} onChange={(e) => setEditData({ ...editData, note: e.target.value })} className="rounded-xl resize-none" rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditing(false)}>Отмена</Button>
            <Button onClick={handleSave}>Сохранить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
// ===================
// MAIN PAGE
// ===================

export default function SharedPage() {
  const { sharedMediaItems, sharedGameItems, users } = useApp()
  const [topTab, setTopTab] = useState<"media" | "games">("media")
  const [mediaTab, setMediaTab] = useState<MediaTab>("will-watch")
  const [filterType, setFilterType] = useState<FilterType>("all")
  const [mediaSortBy, setMediaSortBy] = useState<SortBy>("date")
  const [gameTab, setGameTab] = useState<GameTab>("planning")
  const [filterPlatform, setFilterPlatform] = useState<FilterPlatform>("all")
  const [gameSortBy, setGameSortBy] = useState<SortBy>("date")

  const mediaStats = useMemo(() => ({
    "will-watch": sharedMediaItems.filter(m => m.status === "will-watch").length,
    watching: sharedMediaItems.filter(m => m.status === "watching").length,
    watched: sharedMediaItems.filter(m => m.status === "watched").length,
    dropped: sharedMediaItems.filter(m => m.status === "dropped").length,
  }), [sharedMediaItems])

  const gameStats = useMemo(() => ({
    planning: sharedGameItems.filter(g => g.status === "planning").length,
    playing: sharedGameItems.filter(g => g.status === "playing").length,
    completed: sharedGameItems.filter(g => g.status === "completed").length,
    dropped: sharedGameItems.filter(g => g.status === "dropped").length,
  }), [sharedGameItems])

  const filteredMedia = useMemo(() => {
    let items = sharedMediaItems.filter(m => m.status === mediaTab)
    if (filterType !== "all") items = items.filter(m => m.type === filterType)
    items.sort((a, b) => mediaSortBy === "date" ? new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime() : mediaSortBy === "rating" ? (b.rating || 0) - (a.rating || 0) : a.title.localeCompare(b.title))
    return items
  }, [sharedMediaItems, mediaTab, filterType, mediaSortBy])

  const filteredGames = useMemo(() => {
    let items = sharedGameItems.filter(g => g.status === gameTab)
    if (filterPlatform !== "all") items = items.filter(g => g.platforms.includes(filterPlatform))
    items.sort((a, b) => gameSortBy === "date" ? new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime() : gameSortBy === "rating" ? (b.rating || 0) - (a.rating || 0) : a.title.localeCompare(b.title))
    return items
  }, [sharedGameItems, gameTab, filterPlatform, gameSortBy])

  // Где-нибудь в SharedPage после загрузки данных
useEffect(() => {
  console.log('Все элементы:', sharedMediaItems.map(m => m.type))
  console.log('Аниме-фильмы:', sharedMediaItems.filter(m => m.type === 'anime-movie'))
}, [sharedMediaItems])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-6">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.5, delay: 0.2 }} className="inline-flex items-center justify-center gap-2 mb-4">
          <UserAvatar avatar={users[0]?.avatar || ''} name={users[0]?.name || ''} size="xl" />
          <Heart className="w-8 h-8 text-primary fill-primary" />
          <UserAvatar avatar={users[1]?.avatar || ''} name={users[1]?.name || ''} size="xl" />
        </motion.div>
        <h1 className="text-3xl font-bold mb-1">Наш общий список</h1>
        <p className="text-muted-foreground">Что посмотрим и во что поиграем вместе</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex justify-center">
        <div className="inline-flex bg-muted p-1 rounded-full">
          <button onClick={() => setTopTab("media")} className={cn("flex items-center gap-2 px-6 py-2.5 rounded-full font-medium", topTab === "media" ? "bg-primary text-primary-foreground" : "text-muted-foreground")}><Clapperboard className="w-5 h-5" />Фильмы и сериалы</button>
          <button onClick={() => setTopTab("games")} className={cn("flex items-center gap-2 px-6 py-2.5 rounded-full font-medium", topTab === "games" ? "bg-primary text-primary-foreground" : "text-muted-foreground")}><Gamepad2 className="w-5 h-5" />Игры</button>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {topTab === "media" ? (
          <motion.div key="media" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card className="soft-shadow text-center p-4"><div className="text-3xl font-bold text-primary">{mediaStats["will-watch"]}</div><div className="text-sm text-muted-foreground">Будем смотреть</div></Card>
              <Card className="soft-shadow text-center p-4"><div className="text-3xl font-bold text-amber-500">{mediaStats.watching}</div><div className="text-sm text-muted-foreground">Смотрим</div></Card>
              <Card className="soft-shadow text-center p-4"><div className="text-3xl font-bold text-green-500">{mediaStats.watched}</div><div className="text-sm text-muted-foreground">Посмотрели</div></Card>
              <Card className="soft-shadow text-center p-4"><div className="text-3xl font-bold text-muted-foreground">{mediaStats.dropped}</div><div className="text-sm text-muted-foreground">Бросили</div></Card>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {mediaTabs.map(t => <button key={t.value} onClick={() => setMediaTab(t.value)} className={cn("flex items-center gap-2 px-4 py-2 rounded-full font-medium", mediaTab === t.value ? "bg-primary text-primary-foreground" : "bg-muted")}><t.icon className="w-4 h-4" />{t.label}<span className="ml-1 text-xs">({mediaStats[t.value]})</span></button>)}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex gap-2 overflow-x-auto flex-1 pb-2">{filterOptions.map(o => <button key={o.value} onClick={() => setFilterType(o.value)} className={cn("px-3 py-1.5 rounded-full text-sm", filterType === o.value ? "bg-accent" : "bg-muted/50")}>{o.label}</button>)}</div>
              <Select value={mediaSortBy} onValueChange={(v: SortBy) => setMediaSortBy(v)}><SelectTrigger className="w-40 rounded-full"><ArrowUpDown className="w-4 h-4 mr-2" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="date">По дате</SelectItem><SelectItem value="rating">По рейтингу</SelectItem><SelectItem value="title">По названию</SelectItem></SelectContent></Select>
              <AddSharedMediaDialog />
            </div>
            <motion.div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredMedia.length > 0 ? filteredMedia.map((item, i) => <SharedMediaCard key={item.id} item={item} index={i} />) : (
                <div className="col-span-full py-16 text-center"><div className="text-6xl mb-4">🎬</div><h3 className="text-xl font-medium mb-2">Пока пусто</h3><p className="text-muted-foreground mb-4">Добавьте что-нибудь для совместного просмотра!</p><AddSharedMediaDialog /></div>
              )}
            </motion.div>
          </motion.div>
        ) : (
          <motion.div key="games" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card className="soft-shadow text-center p-4"><div className="text-3xl font-bold text-primary">{gameStats.planning}</div><div className="text-sm text-muted-foreground">Планируем</div></Card>
              <Card className="soft-shadow text-center p-4"><div className="text-3xl font-bold text-amber-500">{gameStats.playing}</div><div className="text-sm text-muted-foreground">Играем</div></Card>
              <Card className="soft-shadow text-center p-4"><div className="text-3xl font-bold text-green-500">{gameStats.completed}</div><div className="text-sm text-muted-foreground">Прошли</div></Card>
              <Card className="soft-shadow text-center p-4"><div className="text-3xl font-bold text-muted-foreground">{gameStats.dropped}</div><div className="text-sm text-muted-foreground">Бросили</div></Card>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">{gameTabs.map(t => <button key={t.value} onClick={() => setGameTab(t.value)} className={cn("flex items-center gap-2 px-4 py-2 rounded-full font-medium", gameTab === t.value ? "bg-primary text-primary-foreground" : "bg-muted")}><t.icon className="w-4 h-4" />{t.label}<span className="ml-1 text-xs">({gameStats[t.value]})</span></button>)}</div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex gap-2 overflow-x-auto flex-1 pb-2">{platformOptions.map(o => <button key={o.value} onClick={() => setFilterPlatform(o.value)} className={cn("px-3 py-1.5 rounded-full text-sm", filterPlatform === o.value ? "bg-accent" : "bg-muted/50")}>{o.label}</button>)}</div>
              <Select value={gameSortBy} onValueChange={(v: SortBy) => setGameSortBy(v)}><SelectTrigger className="w-40 rounded-full"><ArrowUpDown className="w-4 h-4 mr-2" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="date">По дате</SelectItem><SelectItem value="rating">По рейтингу</SelectItem><SelectItem value="title">По названию</SelectItem></SelectContent></Select>
              <AddGameDialog />
            </div>
            <motion.div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredGames.length > 0 ? filteredGames.map((item, i) => <SharedGameCard key={item.id} item={item} index={i} />) : (
                <div className="col-span-full py-16 text-center"><div className="text-6xl mb-4">🎮</div><h3 className="text-xl font-medium mb-2">Пока пусто</h3><p className="text-muted-foreground mb-4">Добавьте игру для совместной игры!</p><AddGameDialog /></div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}