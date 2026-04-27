"use client"

import { UserAvatar } from "@/components/user-avatar"
import { useMemo, useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Gamepad2, Clock, Play, Trophy, Ban, Plus, Star, Trash2, Edit2, ArrowUpDown,
  X, Search, Loader2, Check, MessageCircle
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  pc: "PC", playstation: "PlayStation", xbox: "Xbox", nintendo: "Nintendo", mobile: "Mobile",
}

const statusLabels: Record<SharedGameItem["status"], string> = {
  planning: "Планируем", playing: "Играем", completed: "Прошли", dropped: "Бросили",
}

const statusColors: Record<SharedGameItem["status"], string> = {
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
  const [searchInput, setSearchInput] = useState("")
  const [searchResults, setSearchResults] = useState<RAWGGame[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [formData, setFormData] = useState({
    title: "", cover: "", description: "", platforms: [] as GamePlatform[], genres: "", externalId: "",
  })

  const handleSearch = async () => {
    if (searchInput.length < 2) return
    setIsSearching(true); setShowResults(true)
    try {
      const res = await fetch(`/api/search-game?query=${encodeURIComponent(searchInput)}`)
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
    setShowResults(false); setSearchResults([])
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
    const { data: shared, error: sharedError } = await supabase.from("shared_games").insert({
      content_id: content.id, added_by: activeUserId, status: "planned",
    }).select().single()
    if (sharedError) throw sharedError
    return shared
  }

  const handleSubmit = async () => {
    if (!formData.title.trim()) return
    try {
      const savedGame = await saveToSupabase()
      const supabase = createClient()
      const { data: fullItem } = await supabase
        .from("shared_games")
        .select(`*, content:content_id (title_ru, title_en, poster_url, description, genres)`)
        .eq("id", savedGame.id)
        .single()

      if (fullItem) {
        addSharedGameItem({
          id: fullItem.id,
          title: fullItem.content?.title_ru || formData.title,
          cover: fullItem.content?.poster_url || formData.cover || defaultCovers[0],
          description: fullItem.content?.description || formData.description || undefined,
          platforms: formData.platforms.length ? formData.platforms : ["pc"],
          genres: fullItem.content?.genres || (formData.genres ? formData.genres.split(",").map((g: string) => g.trim()) : undefined),
          status: "planning",
          addedByUserId: activeUserId,
          addedAt: new Date(fullItem.added_at),
          note: fullItem.notes || undefined,
          userRatings: [],
        })
      }
      setFormData({ title: "", cover: "", description: "", platforms: [], genres: "", externalId: "" })
      setSearchInput(""); setOpen(false)
    } catch { alert("Ошибка при сохранении") }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if(!o){ setSearchInput(""); setFormData({ title: "", cover: "", description: "", platforms: [], genres: "", externalId: "" }) } setOpen(o) }}>
      <DialogTrigger asChild><Button className="rounded-full gap-2"><Plus className="w-4 h-4" />Добавить игру</Button></DialogTrigger>
      <DialogContent className="rounded-2xl max-h-[90vh] overflow-y-auto w-[95vw] max-w-2xl">
        <DialogHeader><DialogTitle className="text-xl">Добавить игру</DialogTitle></DialogHeader>
        <div className="space-y-5 py-4">
          <div className="space-y-2">
            <Label className="text-base">Поиск *</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="Введите название игры..." className="rounded-xl pl-10 pr-4 py-6 text-base" />
              </div>
              <Button onClick={handleSearch} disabled={searchInput.length < 2 || isSearching}
                className="rounded-xl px-6 py-6 text-base">{isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : "Найти"}</Button>
            </div>
            {showResults && (
              <div className="relative w-full mt-2 bg-background border rounded-xl shadow-lg max-h-80 overflow-auto z-10">
                {isSearching ? <div className="p-6 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div> :
                 searchResults.length > 0 ? searchResults.map(g => (
                  <div key={g.id} className="p-4 hover:bg-muted cursor-pointer flex items-start gap-4 border-b last:border-0" onClick={() => handleSelectGame(g)}>
                    {g.background_image ? <img src={g.background_image} alt={g.name} className="w-14 h-14 object-cover rounded-lg" />
                      : <div className="w-14 h-14 bg-muted rounded-lg flex items-center justify-center"><Gamepad2 className="w-6 h-6 text-muted-foreground" /></div>}
                    <div><p className="font-medium text-base">{g.name}</p><p className="text-sm text-muted-foreground">{g.released?.slice(0,4)||""}</p></div>
                  </div>
                )) : <div className="p-8 text-center text-muted-foreground">Ничего не найдено</div>}
              </div>
            )}
            {!showResults && formData.title && (
              <div className="mt-3 p-3 bg-muted/50 rounded-xl flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-green-500" /> Выбрано: <span className="font-medium">{formData.title}</span>
              </div>
            )}
          </div>
          {formData.title && (
            <>
              <div className="space-y-2"><Label className="text-base">Описание</Label><Textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="rounded-xl resize-none text-base" rows={4} /></div>
              <div className="space-y-2"><Label className="text-base">Платформы</Label><div className="flex flex-wrap gap-2">{Object.keys(platformLabels).map((p) => <button key={p} onClick={() => setFormData(prev => ({ ...prev, platforms: prev.platforms.includes(p as GamePlatform) ? prev.platforms.filter(x => x !== p) : [...prev.platforms, p as GamePlatform] }))} className={cn("px-3 py-1.5 rounded-full text-sm", formData.platforms.includes(p as GamePlatform) ? "bg-primary text-primary-foreground" : "bg-muted")}>{platformLabels[p as GamePlatform]}</button>)}</div></div>
              <div className="space-y-2"><Label className="text-base">Жанры (через запятую)</Label><Input value={formData.genres} onChange={(e) => setFormData({...formData, genres: e.target.value})} className="rounded-xl py-6 text-base" /></div>
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

function GameCard({ item, index }: { item: SharedGameItem; index: number }) {
  const { users, activeUserId, activeUser, partnerUser, updateSharedGameItem, deleteSharedGameItem, updateSharedGameUserRating } = useApp()
  const [isViewing, setIsViewing] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    title: item.title, description: item.description || "", status: item.status, platforms: item.platforms, note: item.note || "",
  })
  const [userRating, setUserRating] = useState(0)
  
  const addedByUser = users.find((u) => u.id === item.addedByUserId)
  const myRating = item.userRatings?.find(r => r.user_id === activeUserId)
  const partnerRating = item.userRatings?.find(r => r.user_id === partnerUser?.id)

  useEffect(() => { if (isEditing) setUserRating(myRating?.user_rating || 0) }, [isEditing, myRating])

  const handleSave = async () => {
    await updateSharedGameItem(item.id, {
      title: editData.title, description: editData.description || undefined, status: editData.status,
      platforms: editData.platforms, note: editData.note || undefined,
    })
    await updateSharedGameUserRating(item.id, activeUserId, userRating || null, null)
    setIsEditing(false)
  }

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} layout>
        <Card className="overflow-hidden soft-shadow dark:neon-glow group cursor-pointer">
          <div className="relative aspect-[3/4] bg-muted" onClick={() => setIsViewing(true)}>
            <img src={item.cover} alt={item.title} className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/90 via-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute bottom-0 left-0 right-0 p-4 pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="max-h-24 overflow-hidden mb-3">
                  {item.description && <p className="text-white/90 text-xs line-clamp-2">{item.description}</p>}
                  {item.note && <p className="text-white/80 text-xs italic mt-1 line-clamp-1">{item.note}</p>}
                </div>
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <Button size="sm" variant="secondary" className="rounded-full flex-1 h-9" onClick={() => setIsEditing(true)}><Edit2 className="w-4 h-4 mr-1" /> Ред.</Button>
                  <Button size="sm" variant="destructive" className="rounded-full h-9 w-9 p-0" onClick={() => deleteSharedGameItem(item.id)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
            </div>
            <div className="absolute top-2 left-2 z-10">
              <span className={cn("px-2 py-1 text-xs font-medium rounded-full shadow-lg", statusColors[item.status])}>{statusLabels[item.status]}</span>
            </div>
            <div className="absolute bottom-2 left-2 right-2 z-10 flex gap-1 flex-wrap opacity-100 group-hover:opacity-0 transition-opacity">
              {item.platforms.slice(0, 2).map((p) => <span key={p} className="px-2 py-0.5 text-xs bg-black/60 backdrop-blur-sm text-white rounded-full">{platformLabels[p]}</span>)}
              {item.platforms.length > 2 && <span className="px-2 py-0.5 text-xs bg-black/60 backdrop-blur-sm text-white rounded-full">+{item.platforms.length - 2}</span>}
            </div>
          </div>
          <div className="p-3">
            <h3 className="font-medium text-sm truncate mb-1">{item.title}</h3>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <UserAvatar avatar={addedByUser?.avatar || ''} name={addedByUser?.name || ''} size="sm" />
              <span className="truncate">{addedByUser?.name}</span>
            </div>
            <div className="flex justify-between items-center mt-2 text-xs">
              <div className="flex items-center gap-1"><span className="text-muted-foreground">Ты:</span>{myRating?.user_rating ? <div className="flex items-center"><Star className="w-3 h-3 text-amber-500 fill-amber-500 mr-0.5" /><span>{myRating.user_rating}</span></div> : <span className="text-muted-foreground/50">—</span>}</div>
              <div className="flex items-center gap-1"><span className="text-muted-foreground">{partnerUser?.name}:</span>{partnerRating?.user_rating ? <div className="flex items-center"><Star className="w-3 h-3 text-amber-500 fill-amber-500 mr-0.5" /><span>{partnerRating.user_rating}</span></div> : <span className="text-muted-foreground/50">—</span>}</div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* ПРОСМОТР */}
      <Dialog open={isViewing} onOpenChange={setIsViewing}>
        <DialogContent className="!max-w-4xl !w-[90vw] rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-xl font-bold">{item.title}</DialogTitle></DialogHeader>
          <div className="flex flex-col md:flex-row gap-6 py-4">
            <div className="md:w-2/5 flex-shrink-0"><img src={item.cover} alt={item.title} className="w-full rounded-xl shadow-lg object-cover" /></div>
            <div className="md:w-3/5 space-y-5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn("px-3 py-1 text-sm font-medium rounded-full", statusColors[item.status])}>{statusLabels[item.status]}</span>
                {item.platforms.map((p) => <span key={p} className="px-3 py-1 text-sm bg-muted rounded-full">{platformLabels[p]}</span>)}
              </div>
              <div><h3 className="font-semibold text-lg mb-2">Описание</h3><p className="text-muted-foreground text-sm leading-relaxed">{item.description || "Нет описания"}</p></div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="bg-muted/50 p-4 rounded-xl">
                  <div className="flex items-center gap-2 mb-3"><UserAvatar avatar={activeUser?.avatar || ''} name={activeUser?.name || ''} size="md" /><span className="font-medium">Ты</span></div>
                  <div><span className="text-xs text-muted-foreground">Оценка</span><div className="flex items-center gap-1 mt-1">{myRating?.user_rating ? <><span className="text-2xl font-bold text-amber-500">{myRating.user_rating}</span><span className="text-sm text-muted-foreground">/10</span></> : <span className="text-sm text-muted-foreground">—</span>}</div></div>
                </div>
                <div className="bg-muted/50 p-4 rounded-xl">
                  <div className="flex items-center gap-2 mb-3"><UserAvatar avatar={partnerUser?.avatar || ''} name={partnerUser?.name || ''} size="md" /><span className="font-medium">{partnerUser?.name}</span></div>
                  <div><span className="text-xs text-muted-foreground">Оценка</span><div className="flex items-center gap-1 mt-1">{partnerRating?.user_rating ? <><span className="text-2xl font-bold text-amber-500">{partnerRating.user_rating}</span><span className="text-sm text-muted-foreground">/10</span></> : <span className="text-sm text-muted-foreground">—</span>}</div></div>
                </div>
              </div>
              {item.note && <div><h3 className="font-semibold text-base mb-2">Заметка</h3><div className="bg-muted/30 p-4 rounded-xl"><p className="text-muted-foreground text-sm italic">"{item.note}"</p></div></div>}
              <div className="flex items-center gap-2 pt-4 border-t text-sm text-muted-foreground">
                <UserAvatar avatar={addedByUser?.avatar || ''} name={addedByUser?.name || ''} size="sm" />
                <span>Добавил(а): <span className="font-medium text-foreground">{addedByUser?.name}</span></span>
                <span className="ml-auto">{new Date(item.addedAt).toLocaleDateString('ru-RU')}</span>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsViewing(false)} className="rounded-full px-6 py-5">Закрыть</Button>
            <Button onClick={() => { setIsViewing(false); setIsEditing(true) }} className="rounded-full px-6 py-5"><Edit2 className="w-4 h-4 mr-1" /> Редактировать</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* РЕДАКТИРОВАНИЕ */}
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
                <SelectContent><SelectItem value="planning">Планируем</SelectItem><SelectItem value="playing">Играем</SelectItem><SelectItem value="completed">Прошли</SelectItem><SelectItem value="dropped">Бросили</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Платформы</Label><div className="flex flex-wrap gap-2">{Object.keys(platformLabels).map((p) => <button key={p} onClick={() => setEditData(prev => ({ ...prev, platforms: prev.platforms.includes(p as GamePlatform) ? prev.platforms.filter(x => x !== p) : [...prev.platforms, p as GamePlatform] }))} className={cn("px-3 py-1.5 rounded-full text-sm", editData.platforms.includes(p as GamePlatform) ? "bg-primary text-primary-foreground" : "bg-muted")}>{platformLabels[p as GamePlatform]}</button>)}</div></div>
            <div className="space-y-2"><Label>Твоя оценка</Label><div className="flex gap-0.5">{Array.from({ length: 10 }).map((_, i) => <button key={i} onClick={() => setUserRating(i + 1)}><Star className={cn("w-5 h-5", i < userRating ? "text-amber-500 fill-amber-500" : "text-muted-foreground")} /></button>)}{userRating > 0 && <button onClick={() => setUserRating(0)}><X className="w-4 h-4" /></button>}</div></div>
            <div className="space-y-2"><Label>Заметка</Label><Textarea value={editData.note} onChange={(e) => setEditData({ ...editData, note: e.target.value })} className="rounded-xl resize-none" rows={2} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setIsEditing(false)} className="rounded-full">Отмена</Button><Button onClick={handleSave} className="rounded-full">Сохранить</Button></DialogFooter>
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
  const [searchQuery, setSearchQuery] = useState("")

  const stats = useMemo(() => ({
    planning: sharedGameItems.filter(g => g.status === "planning").length,
    playing: sharedGameItems.filter(g => g.status === "playing").length,
    completed: sharedGameItems.filter(g => g.status === "completed").length,
    dropped: sharedGameItems.filter(g => g.status === "dropped").length,
  }), [sharedGameItems])

  const filteredGames = useMemo(() => {
    let items = sharedGameItems.filter(g => g.status === activeTab)
    if (filterPlatform !== "all") items = items.filter(g => g.platforms.includes(filterPlatform))
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      items = items.filter(g => g.title.toLowerCase().includes(q) || g.description?.toLowerCase().includes(q))
    }
    items.sort((a, b) => sortBy === "date" ? new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime() : sortBy === "rating" ? ((b.userRatings?.find(r => r.user_id === users[0]?.id)?.user_rating || 0) - (a.userRatings?.find(r => r.user_id === users[0]?.id)?.user_rating || 0)) : a.title.localeCompare(b.title))
    return items
  }, [sharedGameItems, activeTab, filterPlatform, searchQuery, sortBy, users])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-6">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.5, delay: 0.2 }} className="inline-flex items-center justify-center gap-2 mb-4">
          <UserAvatar avatar={users[0]?.avatar || ''} name={users[0]?.name || ''} size="xl" />
          <Gamepad2 className="w-8 h-8 text-primary" />
          <UserAvatar avatar={users[1]?.avatar || ''} name={users[1]?.name || ''} size="xl" />
        </motion.div>
        <h1 className="text-3xl font-bold mb-1">Во что поиграем?</h1>
        <p className="text-muted-foreground">Наш общий список игр</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="soft-shadow text-center p-4"><div className="text-3xl font-bold text-primary">{stats.planning}</div><div className="text-sm text-muted-foreground">Планируем</div></Card>
        <Card className="soft-shadow text-center p-4"><div className="text-3xl font-bold text-amber-500">{stats.playing}</div><div className="text-sm text-muted-foreground">Играем</div></Card>
        <Card className="soft-shadow text-center p-4"><div className="text-3xl font-bold text-green-500">{stats.completed}</div><div className="text-sm text-muted-foreground">Прошли</div></Card>
        <Card className="soft-shadow text-center p-4"><div className="text-3xl font-bold text-muted-foreground">{stats.dropped}</div><div className="text-sm text-muted-foreground">Бросили</div></Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map(tab => <button key={tab.value} onClick={() => setActiveTab(tab.value)} className={cn("flex items-center gap-2 px-4 py-2 rounded-full font-medium whitespace-nowrap", activeTab === tab.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80")}><tab.icon className="w-4 h-4" />{tab.label}<span className="ml-1 text-xs opacity-70">({stats[tab.value]})</span></button>)}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-56">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Поиск..." className="rounded-full pl-10 pr-4" />
          {searchQuery && <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>}
        </div>
        <div className="flex gap-2 overflow-x-auto flex-1 pb-2">{platformOptions.map(o => <button key={o.value} onClick={() => setFilterPlatform(o.value)} className={cn("px-3 py-1.5 rounded-full text-sm whitespace-nowrap", filterPlatform === o.value ? "bg-accent text-accent-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted")}>{o.label}</button>)}</div>
        <Select value={sortBy} onValueChange={(v: typeof sortBy) => setSortBy(v)}><SelectTrigger className="w-40 rounded-full"><ArrowUpDown className="w-4 h-4 mr-2" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="date">По дате</SelectItem><SelectItem value="rating">По рейтингу</SelectItem><SelectItem value="title">По названию</SelectItem></SelectContent></Select>
        <AddGameDialog />
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div key={`${activeTab}-${filterPlatform}-${sortBy}-${searchQuery}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredGames.length > 0 ? filteredGames.map((item, i) => <GameCard key={item.id} item={item} index={i} />) : (
            <div className="col-span-full py-16 text-center"><div className="text-6xl mb-4">🎮</div><h3 className="text-xl font-medium mb-2">Пока пусто</h3><p className="text-muted-foreground mb-4">Добавьте игру для совместной игры!</p><AddGameDialog /></div>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}