"use client"

import { UserAvatar } from "@/components/user-avatar"
import { useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Gamepad2, 
  Clock, 
  Play, 
  Trophy, 
  Ban, 
  Plus, 
  Star, 
  Trash2, 
  Edit2, 
  ArrowUpDown,
  X,
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
import { useApp, SharedGameItem, GamePlatform } from "@/lib/app-context"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

type Tab = "planning" | "playing" | "completed" | "dropped"
type FilterPlatform = "all" | GamePlatform

const tabs: { value: Tab; label: string; icon: React.ElementType }[] = [
  { value: "planning", label: "Планируем", icon: Clock },
  { value: "playing", label: "Играем", icon: Play },
  { value: "completed", label: "Прошли", icon: Trophy },
  { value: "dropped", label: "Бросили", icon: Ban },
]

const platformOptions: { value: FilterPlatform; label: string }[] = [
  { value: "all", label: "Все" },
  { value: "pc", label: "PC" },
  { value: "playstation", label: "PlayStation" },
  { value: "xbox", label: "Xbox" },
  { value: "nintendo", label: "Nintendo" },
  { value: "mobile", label: "Mobile" },
]

const platformLabels: Record<GamePlatform, string> = {
  pc: "PC",
  playstation: "PlayStation",
  xbox: "Xbox",
  nintendo: "Nintendo",
  mobile: "Mobile",
}

const statusLabels: Record<SharedGameItem["status"], string> = {
  planning: "Планируем",
  playing: "Играем",
  completed: "Прошли",
  dropped: "Бросили",
}

const statusColors: Record<SharedGameItem["status"], string> = {
  planning: "bg-blue-500/90 text-white",
  playing: "bg-amber-500/90 text-white",
  completed: "bg-green-500/90 text-white",
  dropped: "bg-red-500/90 text-white",
}

const defaultCovers = [
  "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=300&h=400&fit=crop",
  "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=300&h=400&fit=crop",
  "https://images.unsplash.com/photo-1493711662062-fa541f7f2f19?w=300&h=400&fit=crop",
]

// Тип для результатов поиска RAWG
interface RAWGGame {
  id: number
  name: string
  background_image: string
  description_raw?: string
  released?: string
  platforms?: { platform: { id: number; name: string } }[]
  genres?: { id: number; name: string }[]
}

function AddGameDialog() {
  const { addSharedGameItem, activeUserId } = useApp()
  const [open, setOpen] = useState(false)
  
  // Поиск
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<RAWGGame[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  
  // Форма
  const [formData, setFormData] = useState({
    title: "",
    cover: "",
    description: "",
    platforms: [] as GamePlatform[],
    genres: "",
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
      const res = await fetch(`/api/search-game?query=${encodeURIComponent(query)}`)
      const data = await res.json()
      setSearchResults(data.results || [])
    } catch (error) {
      console.error("Search failed:", error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  // Выбор игры из результатов поиска
  const handleSelectGame = (game: RAWGGame) => {
    // Маппинг платформ RAWG на наши типы
    const mappedPlatforms: GamePlatform[] = []
    if (game.platforms) {
      game.platforms.forEach(p => {
        const name = p.platform.name.toLowerCase()
        if (name.includes("pc")) mappedPlatforms.push("pc")
        else if (name.includes("playstation")) mappedPlatforms.push("playstation")
        else if (name.includes("xbox")) mappedPlatforms.push("xbox")
        else if (name.includes("nintendo")) mappedPlatforms.push("nintendo")
        else if (name.includes("ios") || name.includes("android")) mappedPlatforms.push("mobile")
      })
    }
    
    const uniquePlatforms = [...new Set(mappedPlatforms)]
    
    setFormData({
      ...formData,
      title: game.name,
      cover: game.background_image || "",
      description: game.description_raw || "",
      platforms: uniquePlatforms.length > 0 ? uniquePlatforms : ["pc"],
      genres: game.genres?.map(g => g.name).join(", ") || "",
      externalId: game.id.toString(),
    })
    
    setSearchQuery(game.name)
    setShowResults(false)
    setSearchResults([])
  }

  // Сохранение в Supabase
  const saveToSupabase = async () => {
    const supabase = createClient()
    
    // 1. Сохраняем контент
    const { data: content, error: contentError } = await supabase
      .from("content")
      .upsert({
        external_id: formData.externalId || Date.now().toString(),
        content_type: "game",
        title_ru: formData.title,
        title_en: formData.title,
        poster_url: formData.cover || defaultCovers[Math.floor(Math.random() * defaultCovers.length)],
        description: formData.description || null,
        year: null,
        platforms: formData.platforms,
        genres: formData.genres ? formData.genres.split(",").map(g => g.trim()) : [],
        updated_at: new Date(),
      }, { onConflict: "external_id, content_type" })
      .select()
      .single()

    if (contentError) {
      console.error("Content save error:", contentError)
      throw contentError
    }

    // 2. Сохраняем в общий список игр
    const { error: sharedError } = await supabase
      .from("shared_games")
      .insert({
        content_id: content.id,
        added_by: activeUserId,
        status: "planned",
      })

    if (sharedError) {
      console.error("Shared game save error:", sharedError)
      throw sharedError
    }

    return content
  }

  const handleSubmit = async () => {
    if (!formData.title.trim()) return

    try {
      await saveToSupabase()
      
      addSharedGameItem({
        title: formData.title,
        cover: formData.cover || defaultCovers[Math.floor(Math.random() * defaultCovers.length)],
        description: formData.description || undefined,
        platforms: formData.platforms.length > 0 ? formData.platforms : ["pc"],
        genres: formData.genres ? formData.genres.split(",").map(g => g.trim()) : undefined,
        status: "planning",
        addedByUserId: activeUserId,
      })

      // Сброс формы
      setFormData({
        title: "",
        cover: "",
        description: "",
        platforms: [],
        genres: "",
        externalId: "",
      })
      setSearchQuery("")
      setOpen(false)
    } catch (error) {
      console.error("Submit error:", error)
      alert("Ошибка при сохранении. Попробуй ещё раз.")
    }
  }

  const togglePlatform = (platform: GamePlatform) => {
    setFormData(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform]
    }))
  }

  // Сброс при закрытии
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSearchQuery("")
      setSearchResults([])
      setShowResults(false)
      setFormData({
        title: "",
        cover: "",
        description: "",
        platforms: [],
        genres: "",
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
          Добавить игру
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Добавить игру</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Поле поиска */}
          <div className="space-y-2 relative">
            <Label>Поиск игры *</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => searchResults.length > 0 && setShowResults(true)}
                placeholder="Введите название игры..."
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
                  searchResults.map((game) => (
                    <div
                      key={game.id}
                      className="p-3 hover:bg-muted cursor-pointer flex items-center gap-3 border-b last:border-0"
                      onClick={() => handleSelectGame(game)}
                    >
                      {game.background_image && (
                        <img 
                          src={game.background_image} 
                          alt={game.name} 
                          className="w-12 h-12 object-cover rounded flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{game.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {game.released ? new Date(game.released).getFullYear() : "Год не указан"}
                        </p>
                      </div>
                    </div>
                  ))
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

          {/* Форма редактирования (показывается после выбора) */}
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
                <Label>Обложка (URL)</Label>
                <Input
                  value={formData.cover}
                  onChange={(e) => setFormData({ ...formData, cover: e.target.value })}
                  placeholder="https://example.com/cover.jpg"
                  className="rounded-xl"
                />
                {formData.cover && (
                  <img 
                    src={formData.cover} 
                    alt="Preview" 
                    className="w-20 h-20 object-cover rounded-lg mt-2"
                  />
                )}
              </div>
              
              <div className="space-y-2">
                <Label>Платформы</Label>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(platformLabels) as GamePlatform[]).map((platform) => (
                    <button
                      key={platform}
                      type="button"
                      onClick={() => togglePlatform(platform)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-sm transition-all",
                        formData.platforms.includes(platform)
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      )}
                    >
                      {platformLabels[platform]}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Жанры (через запятую)</Label>
                <Input
                  value={formData.genres}
                  onChange={(e) => setFormData({ ...formData, genres: e.target.value })}
                  placeholder="Приключение, Кооператив"
                  className="rounded-xl"
                />
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

function GameCard({ item, index }: { item: SharedGameItem; index: number }) {
  const { users, updateSharedGameItem, deleteSharedGameItem } = useApp()
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    title: item.title,
    description: item.description || "",
    status: item.status,
    rating: item.rating || 0,
    platforms: item.platforms,
    note: item.note || "",
  })

  const addedByUser = users.find((u) => u.id === item.addedByUserId)

  const handleSave = () => {
    updateSharedGameItem(item.id, {
      title: editData.title,
      description: editData.description || undefined,
      status: editData.status,
      rating: editData.rating || undefined,
      platforms: editData.platforms,
      note: editData.note || undefined,
    })
    setIsEditing(false)
  }

  const togglePlatform = (platform: GamePlatform) => {
    setEditData(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform]
    }))
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        layout
      >
        <Card className="overflow-hidden soft-shadow dark:neon-glow group cursor-pointer">
          <div className="relative aspect-[3/4]">
            <img
              src={item.cover}
              alt={item.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
              <div className="absolute bottom-0 left-0 right-0 p-4">
                {item.description && (
                  <p className="text-white/80 text-xs mb-3 line-clamp-3">{item.description}</p>
                )}
                {item.note && (
                  <p className="text-white/60 text-xs mb-3 italic">{item.note}</p>
                )}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="rounded-full flex-1"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="rounded-full"
                    onClick={() => deleteSharedGameItem(item.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="absolute top-2 left-2">
              <span className={cn(
                "px-2 py-1 text-xs font-medium rounded-full",
                statusColors[item.status]
              )}>
                {statusLabels[item.status]}
              </span>
            </div>

            <div className="absolute bottom-2 left-2 right-2 flex gap-1 flex-wrap opacity-100 group-hover:opacity-0 transition-opacity">
              {item.platforms.slice(0, 2).map((platform) => (
                <span key={platform} className="px-2 py-0.5 text-xs bg-black/60 text-white rounded-full">
                  {platformLabels[platform]}
                </span>
              ))}
              {item.platforms.length > 2 && (
                <span className="px-2 py-0.5 text-xs bg-black/60 text-white rounded-full">
                  +{item.platforms.length - 2}
                </span>
              )}
            </div>
          </div>

          <div className="p-3">
            <h3 className="font-medium text-sm truncate mb-1">{item.title}</h3>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <UserAvatar avatar={addedByUser?.avatar || ''} name={addedByUser?.name || ''} size="sm" />
                <span className="truncate">{addedByUser?.name}</span>
              </div>
              {item.rating ? (
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "w-2 h-2",
                        i < item.rating!
                          ? "text-amber-500 fill-amber-500"
                          : "text-muted-foreground/30"
                      )}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </Card>
      </motion.div>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Редактировать игру</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Название</Label>
              <Input
                value={editData.title}
                onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Описание</Label>
              <Textarea
                value={editData.description}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                placeholder="Краткое описание..."
                className="rounded-xl resize-none"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Статус</Label>
              <Select
                value={editData.status}
                onValueChange={(value: SharedGameItem["status"]) =>
                  setEditData({ ...editData, status: value })
                }
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">Планируем</SelectItem>
                  <SelectItem value="playing">Играем</SelectItem>
                  <SelectItem value="completed">Прошли</SelectItem>
                  <SelectItem value="dropped">Бросили</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Платформы</Label>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(platformLabels) as GamePlatform[]).map((platform) => (
                  <button
                    key={platform}
                    type="button"
                    onClick={() => togglePlatform(platform)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-sm transition-all",
                      editData.platforms.includes(platform)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    {platformLabels[platform]}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Оценка (1-10)</Label>
              <div className="flex gap-0.5 flex-wrap">
                {Array.from({ length: 10 }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setEditData({ ...editData, rating: i + 1 })}
                    className="p-0.5"
                  >
                    <Star
                      className={cn(
                        "w-5 h-5 transition-colors",
                        i < editData.rating
                          ? "text-amber-500 fill-amber-500"
                          : "text-muted-foreground hover:text-amber-500"
                      )}
                    />
                  </button>
                ))}
                {editData.rating > 0 && (
                  <button
                    type="button"
                    onClick={() => setEditData({ ...editData, rating: 0 })}
                    className="ml-2 p-1"
                  >
                    <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                  </button>
                )}
              </div>
              {editData.rating > 0 && (
                <p className="text-sm text-muted-foreground">{editData.rating}/10</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Заметка</Label>
              <Textarea
                value={editData.note}
                onChange={(e) => setEditData({ ...editData, note: e.target.value })}
                placeholder="Ваши мысли об игре..."
                className="rounded-xl resize-none"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditing(false)} className="rounded-full">
              Отмена
            </Button>
            <Button onClick={handleSave} className="rounded-full">
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default function GamesPage() {
  const { sharedGameItems, users } = useApp()
  const [activeTab, setActiveTab] = useState<Tab>("planning")
  const [filterPlatform, setFilterPlatform] = useState<FilterPlatform>("all")
  const [sortBy, setSortBy] = useState<"date" | "rating" | "title">("date")

  const stats = useMemo(() => {
    return {
      planning: sharedGameItems.filter((g) => g.status === "planning").length,
      playing: sharedGameItems.filter((g) => g.status === "playing").length,
      completed: sharedGameItems.filter((g) => g.status === "completed").length,
      dropped: sharedGameItems.filter((g) => g.status === "dropped").length,
    }
  }, [sharedGameItems])

  const filteredGames = useMemo(() => {
    let items = sharedGameItems.filter((g) => g.status === activeTab)

    if (filterPlatform !== "all") {
      items = items.filter((g) => g.platforms.includes(filterPlatform))
    }

    if (sortBy === "date") {
      items.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
    } else if (sortBy === "rating") {
      items.sort((a, b) => (b.rating || 0) - (a.rating || 0))
    } else {
      items.sort((a, b) => a.title.localeCompare(b.title))
    }

    return items
  }, [sharedGameItems, activeTab, filterPlatform, sortBy])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 pb-8"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-6"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
          className="inline-flex items-center justify-center gap-2 mb-4"
        >
          <UserAvatar avatar={users[0]?.avatar || ''} name={users[0]?.name || ''} size="xl" />
          <Gamepad2 className="w-8 h-8 text-primary" />
          <UserAvatar avatar={users[1]?.avatar || ''} name={users[1]?.name || ''} size="xl" />
        </motion.div>
        <h1 className="text-3xl font-bold mb-1">Во что поиграем?</h1>
        <p className="text-muted-foreground">Наш общий список игр</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-4"
      >
        <Card className="soft-shadow text-center p-4">
          <div className="text-3xl font-bold text-primary">{stats.planning}</div>
          <div className="text-sm text-muted-foreground">Планируем</div>
        </Card>
        <Card className="soft-shadow text-center p-4">
          <div className="text-3xl font-bold text-amber-500">{stats.playing}</div>
          <div className="text-sm text-muted-foreground">Играем</div>
        </Card>
        <Card className="soft-shadow text-center p-4">
          <div className="text-3xl font-bold text-green-500">{stats.completed}</div>
          <div className="text-sm text-muted-foreground">Прошли</div>
        </Card>
        <Card className="soft-shadow text-center p-4">
          <div className="text-3xl font-bold text-muted-foreground">{stats.dropped}</div>
          <div className="text-sm text-muted-foreground">Бросили</div>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex gap-2 overflow-x-auto pb-2"
      >
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all whitespace-nowrap",
              activeTab === tab.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            <span className="ml-1 text-xs opacity-70">({stats[tab.value]})</span>
          </button>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex flex-wrap items-center gap-3"
      >
        <div className="flex gap-2 overflow-x-auto flex-1 pb-2">
          {platformOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setFilterPlatform(option.value)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm transition-all whitespace-nowrap",
                filterPlatform === option.value
                  ? "bg-accent text-accent-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        <Select value={sortBy} onValueChange={(v: typeof sortBy) => setSortBy(v)}>
          <SelectTrigger className="w-40 rounded-full">
            <ArrowUpDown className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">По дате</SelectItem>
            <SelectItem value="rating">По рейтингу</SelectItem>
            <SelectItem value="title">По названию</SelectItem>
          </SelectContent>
        </Select>

        <AddGameDialog />
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`${activeTab}-${filterPlatform}-${sortBy}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
        >
          {filteredGames.length > 0 ? (
            filteredGames.map((item, index) => (
              <GameCard key={item.id} item={item} index={index} />
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="col-span-full py-16 text-center"
            >
              <div className="text-6xl mb-4">🎮</div>
              <h3 className="text-xl font-medium mb-2">Пока пусто</h3>
              <p className="text-muted-foreground mb-4">
                Добавьте игру, в которую хотите поиграть вместе!
              </p>
              <AddGameDialog />
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}