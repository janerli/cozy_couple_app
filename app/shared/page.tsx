"use client"

import { UserAvatar } from "@/components/user-avatar"
import { useMemo, useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Heart, Clock, Film, Play, Ban, Plus, Star, Trash2, Edit2, ArrowUpDown,
  X, Gamepad2, Trophy, Clapperboard, Search
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
import { toast } from "sonner"
import { useApp, SharedMediaItem, SharedGameItem, GamePlatform } from "@/lib/app-context"
import { createClient } from "@/lib/supabase/client"
import { upsertContent } from "@/lib/content"
import {
  MEDIA_TYPE_LABELS, PLATFORM_LABELS, SHARED_MEDIA_STATUS_LABELS, SHARED_MEDIA_STATUS_COLORS,
  GAME_STATUS_LABELS, GAME_STATUS_COLORS, hasEpisodes,
} from "@/lib/media-labels"
import { MediaSearchPicker, MediaPickResult } from "@/components/media-search-picker"
import { GameSearchPicker, GamePickResult } from "@/components/game-search-picker"
import { PosterCard } from "@/components/poster-card"
import { cn } from "@/lib/utils"

// ===================
// TYPES & CONSTANTS
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

const defaultPosters = [
  "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=300&h=450&fit=crop",
  "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=300&h=450&fit=crop",
]

function mapSharedStatusToDb(status: SharedMediaItem["status"]): string {
  if (status === "will-watch") return "planned"
  if (status === "watching") return "watching"
  if (status === "watched") return "watched"
  if (status === "dropped") return "dropped"
  return "planned"
}

// ===================
// ADD SHARED MEDIA DIALOG
// ===================

const emptyMediaForm = {
  title: "", poster: "", description: "", type: "movie" as SharedMediaItem["type"],
  status: "will-watch" as SharedMediaItem["status"], currentSeason: 1, currentEpisode: 1, externalId: "",
}

function AddSharedMediaDialog() {
  const { addSharedMediaItem, activeUserId } = useApp()
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState(emptyMediaForm)

  const handlePick = (result: MediaPickResult) => {
    setFormData((prev) => ({ ...prev, ...result }))
  }

  const saveToSupabase = async () => {
    const supabase = createClient()

    const content = await upsertContent(supabase, {
      externalId: formData.externalId,
      contentType: formData.type,
      titleRu: formData.title,
      poster: formData.poster || defaultPosters[0],
      description: formData.description,
    })

    const { data: shared, error: sharedError } = await supabase
      .from("shared_media")
      .insert({
        content_id: content.id,
        added_by: activeUserId,
        status: mapSharedStatusToDb(formData.status),
        current_season: hasEpisodes(formData.type) ? formData.currentSeason : 1,
        current_episode: hasEpisodes(formData.type) ? formData.currentEpisode : 1,
      })
      .select()
      .single()

    if (sharedError) throw sharedError
    return shared
  }

  const handleSubmit = async () => {
    if (!formData.title.trim()) return

    try {
      const savedItem = await saveToSupabase()

      const supabase = createClient()
      const { data: fullItem } = await supabase
        .from("shared_media")
        .select(`
          *,
          content:content_id (title_ru, title_en, poster_url, description, content_type)
        `)
        .eq("id", savedItem.id)
        .single()

      if (fullItem) {
        addSharedMediaItem({
          id: fullItem.id,
          title: fullItem.content?.title_ru || formData.title,
          poster: fullItem.content?.poster_url || formData.poster || defaultPosters[0],
          description: fullItem.content?.description || formData.description || undefined,
          type: fullItem.content?.content_type as SharedMediaItem["type"] || formData.type,
          status: formData.status,
          addedByUserId: activeUserId,
          addedAt: new Date(fullItem.added_at),
          currentSeason: fullItem.current_season || formData.currentSeason,
          currentEpisode: fullItem.current_episode || formData.currentEpisode,
          note: fullItem.notes || undefined,
        })
      }

      setFormData(emptyMediaForm)
      setOpen(false)
    } catch (error) {
      console.error("Submit error:", error)
      toast.error("Ошибка при сохранении. Попробуй ещё раз.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) setFormData(emptyMediaForm); setOpen(o) }}>
      <DialogTrigger asChild><Button className="rounded-full gap-2"><Plus className="w-4 h-4" />Добавить</Button></DialogTrigger>
      <DialogContent className="rounded-2xl max-h-[90vh] overflow-y-auto w-[95vw] max-w-2xl md:max-w-3xl lg:max-w-4xl">
        <DialogHeader><DialogTitle className="text-xl">Добавить в общий список</DialogTitle></DialogHeader>
        <div className="space-y-5 py-4">
          <MediaSearchPicker onSelect={handlePick} />
          {formData.title && (
            <>
              <div className="space-y-2">
                <Label className="text-base">Описание</Label>
                <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Краткое описание..." className="rounded-xl resize-none text-base" rows={4} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-base">Тип</Label>
                  <Select value={formData.type} onValueChange={(v: SharedMediaItem["type"]) => setFormData({ ...formData, type: v })}>
                    <SelectTrigger className="rounded-xl py-6 text-base"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="movie">Фильм</SelectItem><SelectItem value="series">Сериал</SelectItem>
                      <SelectItem value="anime">Аниме</SelectItem><SelectItem value="anime-movie">Аниме-фильм</SelectItem>
                      <SelectItem value="cartoon">Мультсериал</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-base">Статус</Label>
                  <Select value={formData.status} onValueChange={(v: SharedMediaItem["status"]) => setFormData({ ...formData, status: v })}>
                    <SelectTrigger className="rounded-xl py-6 text-base"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="will-watch">Будем смотреть</SelectItem>
                      <SelectItem value="watching">Смотрим</SelectItem>
                      <SelectItem value="watched">Посмотрели</SelectItem>
                      <SelectItem value="dropped">Бросили</SelectItem>
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

// ===================
// SHARED MEDIA CARD
// ===================
function SharedMediaCard({ item, index }: { item: SharedMediaItem; index: number }) {
  const { users, activeUserId, activeUser, partnerUser, updateSharedMediaItem, deleteSharedMediaItem, updateSharedMediaUserRating } = useApp()
  const [isViewing, setIsViewing] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    title: item.title, description: item.description || "", status: item.status,
    currentSeason: item.currentSeason || 1, currentEpisode: item.currentEpisode || 1, note: item.note || "",
  })
  const [userRating, setUserRating] = useState(0)
  const [userReaction, setUserReaction] = useState("")

  const addedByUser = users.find((u) => u.id === item.addedByUserId)
  const myRating = item.userRatings?.find(r => r.user_id === activeUserId)
  const partnerRating = item.userRatings?.find(r => r.user_id === partnerUser?.id)

  useEffect(() => {
    if (isEditing) {
      setUserRating(myRating?.user_rating || 0)
      setUserReaction(myRating?.reaction || "")
    }
  }, [isEditing, myRating])

  const handleSave = async () => {
    await updateSharedMediaItem(item.id, {
      title: editData.title, description: editData.description || undefined, status: editData.status,
      currentSeason: hasEpisodes(item.type) ? editData.currentSeason : undefined,
      currentEpisode: hasEpisodes(item.type) ? editData.currentEpisode : undefined, note: editData.note || undefined,
    })
    await updateSharedMediaUserRating(item.id, activeUserId, userRating || null, userReaction || null)
    setIsEditing(false)
  }

  const progressText = (() => {
    if (!hasEpisodes(item.type)) return null
    if (item.type === "anime") return item.currentEpisode ? `${item.currentEpisode} серия` : null
    if (item.currentSeason && item.currentEpisode) return `${item.currentSeason} сезон, ${item.currentEpisode} серия`
    return null
  })()

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        layout
      >
        <Card className="overflow-hidden soft-shadow dark:neon-glow group cursor-pointer">
          <PosterCard
            image={item.poster}
            alt={item.title}
            onOpen={() => setIsViewing(true)}
            statusLabel={SHARED_MEDIA_STATUS_LABELS[item.status]}
            statusColorClass={SHARED_MEDIA_STATUS_COLORS[item.status]}
            description={item.description}
            note={item.note}
            cornerBadge={myRating?.reaction && (
              <span className="w-8 h-8 bg-background/80 backdrop-blur rounded-full flex items-center justify-center text-lg shadow-lg">
                {myRating.reaction}
              </span>
            )}
            bottomBadge={
              <span className="px-2 py-1 text-xs bg-black/60 backdrop-blur-sm text-white rounded-full">
                {MEDIA_TYPE_LABELS[item.type]}
              </span>
            }
            actions={
              <>
                <Button size="sm" variant="secondary" className="rounded-full flex-1 h-9" onClick={() => setIsEditing(true)}>
                  <Edit2 className="w-4 h-4 mr-1" /> Ред.
                </Button>
                <Button size="sm" variant="destructive" className="rounded-full h-9 w-9 p-0" onClick={() => deleteSharedMediaItem(item.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            }
          />

          {/* Информация под постером */}
          <div className="p-3">
            <h3 className="font-medium text-sm truncate mb-1">{item.title}</h3>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <UserAvatar avatar={addedByUser?.avatar || ''} name={addedByUser?.name || ''} size="sm" />
              <span className="truncate">{addedByUser?.name}</span>
            </div>
            <div className="flex justify-between items-center mt-2 text-xs">
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">Ты:</span>
                {myRating?.user_rating ? (
                  <div className="flex items-center">
                    <Star className="w-3 h-3 text-amber-500 fill-amber-500 mr-0.5" />
                    <span>{myRating.user_rating}</span>
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
                    <span>{partnerRating.user_rating}</span>
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
      {/* ПРОСМОТР */}
      <Dialog open={isViewing} onOpenChange={setIsViewing}>
        <DialogContent className="!max-w-4xl !w-[90vw] rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{item.title}</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col md:flex-row gap-6 py-4">
            <div className="md:w-2/5 flex-shrink-0">
              <img
                src={item.poster}
                alt={item.title}
                className="w-full rounded-xl shadow-lg object-cover"
              />
            </div>

            <div className="md:w-3/5 space-y-5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn("px-3 py-1 text-sm font-medium rounded-full", SHARED_MEDIA_STATUS_COLORS[item.status])}>
                  {SHARED_MEDIA_STATUS_LABELS[item.status]}
                </span>
                <span className="px-3 py-1 text-sm bg-muted rounded-full">
                  {MEDIA_TYPE_LABELS[item.type]}
                </span>
                {progressText && (
                  <span className="px-3 py-1 text-sm bg-muted rounded-full">{progressText}</span>
                )}
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">Описание</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {item.description || "Нет описания"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="bg-muted/50 p-4 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <UserAvatar avatar={activeUser?.avatar || ''} name={activeUser?.name || ''} size="md" />
                    <span className="font-medium">Ты</span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <span className="text-xs text-muted-foreground">Оценка</span>
                      <div className="flex items-center gap-1 mt-1">
                        {myRating?.user_rating ? (
                          <>
                            <span className="text-2xl font-bold text-amber-500">{myRating.user_rating}</span>
                            <span className="text-sm text-muted-foreground">/10</span>
                          </>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Реакция</span>
                      <div className="mt-1">
                        {myRating?.reaction ? (
                          <span className="text-4xl">{myRating.reaction}</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-muted/50 p-4 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <UserAvatar avatar={partnerUser?.avatar || ''} name={partnerUser?.name || ''} size="md" />
                    <span className="font-medium">{partnerUser?.name}</span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <span className="text-xs text-muted-foreground">Оценка</span>
                      <div className="flex items-center gap-1 mt-1">
                        {partnerRating?.user_rating ? (
                          <>
                            <span className="text-2xl font-bold text-amber-500">{partnerRating.user_rating}</span>
                            <span className="text-sm text-muted-foreground">/10</span>
                          </>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Реакция</span>
                      <div className="mt-1">
                        {partnerRating?.reaction ? (
                          <span className="text-4xl">{partnerRating.reaction}</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {item.note && (
                <div>
                  <h3 className="font-semibold text-base mb-2">Заметка</h3>
                  <div className="bg-muted/30 p-4 rounded-xl">
                    <p className="text-muted-foreground text-sm italic">"{item.note}"</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 pt-4 border-t text-sm text-muted-foreground">
                <UserAvatar avatar={addedByUser?.avatar || ''} name={addedByUser?.name || ''} size="sm" />
                <span>Добавил(а): <span className="font-medium text-foreground">{addedByUser?.name}</span></span>
                <span className="ml-auto">{new Date(item.addedAt).toLocaleDateString('ru-RU')}</span>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsViewing(false)} className="rounded-full px-6 py-5">
              Закрыть
            </Button>
            <Button onClick={() => { setIsViewing(false); setIsEditing(true) }} className="rounded-full px-6 py-5">
              <Edit2 className="w-4 h-4 mr-1" /> Редактировать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* РЕДАКТИРОВАНИЕ */}
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
            <div className="space-y-2">
              <Label>Твоя оценка</Label>
              <div className="flex gap-0.5 flex-wrap">
                {Array.from({ length: 10 }).map((_, i) => (
                  <button key={i} onClick={() => setUserRating(i + 1)} className="p-0.5">
                    <Star className={cn("w-5 h-5", i < userRating ? "text-amber-500 fill-amber-500" : "text-muted-foreground")} />
                  </button>
                ))}
                {userRating > 0 && <button onClick={() => setUserRating(0)} className="ml-2 p-1"><X className="w-4 h-4" /></button>}
              </div>
            </div>
            <div className="space-y-2"><Label>Заметка</Label><Textarea value={editData.note} onChange={(e) => setEditData({ ...editData, note: e.target.value })} className="rounded-xl resize-none" rows={2} /></div>
            <div className="space-y-2">
              <Label>Твоя реакция</Label>
              <div className="flex gap-2 flex-wrap">
                {["💕", "🔥", "😍", "👍", "😢", "😱", "🤯", "💤"].map((e) => (
                  <button key={e} onClick={() => setUserReaction(userReaction === e ? "" : e)}
                    className={cn("w-10 h-10 rounded-xl text-xl", userReaction === e ? "bg-primary/20 ring-2 ring-primary" : "bg-muted")}>{e}</button>
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
// GAMES SECTION
// ===================

type GameTab = "planning" | "playing" | "completed" | "dropped"
type FilterPlatform = "all" | GamePlatform

const gameTabs: { value: GameTab; label: string; icon: React.ElementType }[] = [
  { value: "planning", label: "Планируем", icon: Clock }, { value: "playing", label: "Играем", icon: Play },
  { value: "completed", label: "Прошли", icon: Trophy }, { value: "dropped", label: "Бросили", icon: Ban },
]

const platformOptions: { value: FilterPlatform; label: string }[] = [
  { value: "all", label: "Все" }, { value: "pc", label: "PC" }, { value: "playstation", label: "PlayStation" },
  { value: "xbox", label: "Xbox" }, { value: "nintendo", label: "Nintendo" }, { value: "mobile", label: "Mobile" },
]

const defaultCovers = [
  "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=300&h=400&fit=crop",
  "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=300&h=400&fit=crop",
]

const emptyGameForm = {
  title: "", cover: "", description: "", platforms: [] as GamePlatform[], genres: "", externalId: "",
}

function AddSharedGameDialog() {
  const { addSharedGameItem, activeUserId } = useApp()
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState(emptyGameForm)

  const handlePick = (result: GamePickResult) => {
    setFormData((prev) => ({ ...prev, ...result }))
  }

  const saveToSupabase = async () => {
    const supabase = createClient()

    const content = await upsertContent(supabase, {
      externalId: formData.externalId,
      contentType: "game",
      titleRu: formData.title,
      poster: formData.cover || defaultCovers[0],
      description: formData.description,
      extra: { genres: formData.genres.split(",").map((g) => g.trim()).filter(Boolean) },
    })

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
      setFormData(emptyGameForm)
      setOpen(false)
    } catch (error) {
      console.error("Submit error:", error)
      toast.error("Ошибка при сохранении. Попробуй ещё раз.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) setFormData(emptyGameForm); setOpen(o) }}>
      <DialogTrigger asChild><Button className="rounded-full gap-2"><Plus className="w-4 h-4" />Добавить игру</Button></DialogTrigger>
      <DialogContent className="rounded-2xl max-h-[90vh] overflow-y-auto w-[95vw] max-w-2xl">
        <DialogHeader><DialogTitle className="text-xl">Добавить игру</DialogTitle></DialogHeader>
        <div className="space-y-5 py-4">
          <GameSearchPicker onSelect={handlePick} />
          {formData.title && (
            <>
              <div className="space-y-2"><Label className="text-base">Описание</Label><Textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="rounded-xl resize-none text-base" rows={4} /></div>
              <div className="space-y-2"><Label className="text-base">Платформы</Label><div className="flex flex-wrap gap-2">{Object.keys(PLATFORM_LABELS).map((p) => <button key={p} onClick={() => setFormData(prev => ({ ...prev, platforms: prev.platforms.includes(p as GamePlatform) ? prev.platforms.filter(x => x !== p) : [...prev.platforms, p as GamePlatform] }))} className={cn("px-3 py-1.5 rounded-full text-sm", formData.platforms.includes(p as GamePlatform) ? "bg-primary text-primary-foreground" : "bg-muted")}>{PLATFORM_LABELS[p as GamePlatform]}</button>)}</div></div>
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

function SharedGameCard({ item, index }: { item: SharedGameItem; index: number }) {
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

  useEffect(() => {
    if (isEditing) setUserRating(myRating?.user_rating || 0)
  }, [isEditing, myRating])

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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        layout
      >
        <Card className="overflow-hidden soft-shadow dark:neon-glow group cursor-pointer">
          <PosterCard
            aspect="3/4"
            image={item.cover}
            alt={item.title}
            onOpen={() => setIsViewing(true)}
            statusLabel={GAME_STATUS_LABELS[item.status]}
            statusColorClass={GAME_STATUS_COLORS[item.status]}
            description={item.description}
            note={item.note}
            bottomBadge={
              <div className="flex gap-1 flex-wrap">
                {item.platforms.slice(0, 2).map((p) => (
                  <span key={p} className="px-2 py-0.5 text-xs bg-black/60 backdrop-blur-sm text-white rounded-full">{PLATFORM_LABELS[p]}</span>
                ))}
                {item.platforms.length > 2 && (
                  <span className="px-2 py-0.5 text-xs bg-black/60 backdrop-blur-sm text-white rounded-full">+{item.platforms.length - 2}</span>
                )}
              </div>
            }
            actions={
              <>
                <Button size="sm" variant="secondary" className="rounded-full flex-1 h-9" onClick={() => setIsEditing(true)}>
                  <Edit2 className="w-4 h-4 mr-1" /> Ред.
                </Button>
                <Button size="sm" variant="destructive" className="rounded-full h-9 w-9 p-0" onClick={() => deleteSharedGameItem(item.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            }
          />

          <div className="p-3">
            <h3 className="font-medium text-sm truncate mb-1">{item.title}</h3>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <UserAvatar avatar={addedByUser?.avatar || ''} name={addedByUser?.name || ''} size="sm" />
              <span className="truncate">{addedByUser?.name}</span>
            </div>
            <div className="flex justify-between items-center mt-2 text-xs">
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">Ты:</span>
                {myRating?.user_rating ? (
                  <div className="flex items-center">
                    <Star className="w-3 h-3 text-amber-500 fill-amber-500 mr-0.5" />
                    <span>{myRating.user_rating}</span>
                  </div>
                ) : <span className="text-muted-foreground/50">—</span>}
              </div>
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">{partnerUser?.name}:</span>
                {partnerRating?.user_rating ? (
                  <div className="flex items-center">
                    <Star className="w-3 h-3 text-amber-500 fill-amber-500 mr-0.5" />
                    <span>{partnerRating.user_rating}</span>
                  </div>
                ) : <span className="text-muted-foreground/50">—</span>}
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* ПРОСМОТР */}
      <Dialog open={isViewing} onOpenChange={setIsViewing}>
        <DialogContent className="!max-w-4xl !w-[90vw] rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{item.title}</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col md:flex-row gap-6 py-4">
            <div className="md:w-2/5 flex-shrink-0">
              <img
                src={item.cover}
                alt={item.title}
                className="w-full rounded-xl shadow-lg object-cover"
              />
            </div>

            <div className="md:w-3/5 space-y-5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn("px-3 py-1 text-sm font-medium rounded-full", GAME_STATUS_COLORS[item.status])}>
                  {GAME_STATUS_LABELS[item.status]}
                </span>
                {item.platforms.map((p) => (
                  <span key={p} className="px-3 py-1 text-sm bg-muted rounded-full">{PLATFORM_LABELS[p]}</span>
                ))}
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">Описание</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {item.description || "Нет описания"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="bg-muted/50 p-4 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <UserAvatar avatar={activeUser?.avatar || ''} name={activeUser?.name || ''} size="md" />
                    <span className="font-medium">Ты</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Оценка</span>
                    <div className="flex items-center gap-1 mt-1">
                      {myRating?.user_rating ? (
                        <>
                          <span className="text-2xl font-bold text-amber-500">{myRating.user_rating}</span>
                          <span className="text-sm text-muted-foreground">/10</span>
                        </>
                      ) : <span className="text-sm text-muted-foreground">—</span>}
                    </div>
                  </div>
                </div>

                <div className="bg-muted/50 p-4 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <UserAvatar avatar={partnerUser?.avatar || ''} name={partnerUser?.name || ''} size="md" />
                    <span className="font-medium">{partnerUser?.name}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Оценка</span>
                    <div className="flex items-center gap-1 mt-1">
                      {partnerRating?.user_rating ? (
                        <>
                          <span className="text-2xl font-bold text-amber-500">{partnerRating.user_rating}</span>
                          <span className="text-sm text-muted-foreground">/10</span>
                        </>
                      ) : <span className="text-sm text-muted-foreground">—</span>}
                    </div>
                  </div>
                </div>
              </div>

              {item.note && (
                <div>
                  <h3 className="font-semibold text-base mb-2">Заметка</h3>
                  <div className="bg-muted/30 p-4 rounded-xl">
                    <p className="text-muted-foreground text-sm italic">"{item.note}"</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 pt-4 border-t text-sm text-muted-foreground">
                <UserAvatar avatar={addedByUser?.avatar || ''} name={addedByUser?.name || ''} size="sm" />
                <span>Добавил(а): <span className="font-medium text-foreground">{addedByUser?.name}</span></span>
                <span className="ml-auto">{new Date(item.addedAt).toLocaleDateString('ru-RU')}</span>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsViewing(false)} className="rounded-full px-6 py-5">Закрыть</Button>
            <Button onClick={() => { setIsViewing(false); setIsEditing(true) }} className="rounded-full px-6 py-5">
              <Edit2 className="w-4 h-4 mr-1" /> Редактировать
            </Button>
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
                {Object.keys(PLATFORM_LABELS).map((p) => (
                  <button
                    key={p}
                    onClick={() => setEditData(prev => ({
                      ...prev,
                      platforms: prev.platforms.includes(p as GamePlatform)
                        ? prev.platforms.filter(x => x !== p)
                        : [...prev.platforms, p as GamePlatform]
                    }))}
                    className={cn("px-3 py-1.5 rounded-full text-sm",
                      editData.platforms.includes(p as GamePlatform) ? "bg-primary text-primary-foreground" : "bg-muted"
                    )}
                  >
                    {PLATFORM_LABELS[p as GamePlatform]}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Твоя оценка</Label>
              <div className="flex gap-0.5">
                {Array.from({ length: 10 }).map((_, i) => (
                  <button key={i} onClick={() => setUserRating(i + 1)}>
                    <Star className={cn("w-5 h-5", i < userRating ? "text-amber-500 fill-amber-500" : "text-muted-foreground")} />
                  </button>
                ))}
                {userRating > 0 && <button onClick={() => setUserRating(0)}><X className="w-4 h-4" /></button>}
              </div>
            </div>
            <div className="space-y-2"><Label>Заметка</Label><Textarea value={editData.note} onChange={(e) => setEditData({ ...editData, note: e.target.value })} className="rounded-xl resize-none" rows={2} /></div>
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
  const [mediaSearchQuery, setMediaSearchQuery] = useState("")

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

  // Фильтр по типу
  if (filterType !== "all") {
    items = items.filter(m => m.type === filterType)
  }

  // Поиск
  if (mediaSearchQuery.trim()) {
    const query = mediaSearchQuery.toLowerCase()
    items = items.filter(m =>
      m.title.toLowerCase().includes(query) ||
      m.description?.toLowerCase().includes(query)
    )
  }

  // Сортировка
  items.sort((a, b) =>
    mediaSortBy === "date"
      ? new Date(b.updatedAt || b.addedAt).getTime() - new Date(a.updatedAt || a.addedAt).getTime()
      : mediaSortBy === "rating"
        ? ((b.userRatings?.find(r => r.user_id === users[0]?.id)?.user_rating || 0) - (a.userRatings?.find(r => r.user_id === users[0]?.id)?.user_rating || 0))
        : a.title.localeCompare(b.title)
  )
  return items
}, [sharedMediaItems, mediaTab, filterType, mediaSearchQuery, mediaSortBy, users])

  const filteredGames = useMemo(() => {
    let items = sharedGameItems.filter(g => g.status === gameTab)
    if (filterPlatform !== "all") items = items.filter(g => g.platforms.includes(filterPlatform))
    items.sort((a, b) => gameSortBy === "date" ? new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime() : gameSortBy === "rating" ? ((b.userRatings?.find(r => r.user_id === users[0]?.id)?.user_rating || 0) - (a.userRatings?.find(r => r.user_id === users[0]?.id)?.user_rating || 0)) : a.title.localeCompare(b.title))
    return items
  }, [sharedGameItems, gameTab, filterPlatform, gameSortBy, users])

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
  <div className="relative w-full sm:w-56">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
    <Input
      value={mediaSearchQuery}
      onChange={(e) => setMediaSearchQuery(e.target.value)}
      placeholder="Поиск..."
      className="rounded-full pl-10 pr-4"
    />
    {mediaSearchQuery && (
      <button
        onClick={() => setMediaSearchQuery("")}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
      >
        <X className="w-4 h-4" />
      </button>
    )}
  </div>
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
              <AddSharedGameDialog />
            </div>
            <motion.div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredGames.length > 0 ? filteredGames.map((item, i) => <SharedGameCard key={item.id} item={item} index={i} />) : (
                <div className="col-span-full py-16 text-center"><div className="text-6xl mb-4">🎮</div><h3 className="text-xl font-medium mb-2">Пока пусто</h3><p className="text-muted-foreground mb-4">Добавьте игру для совместной игры!</p><AddSharedGameDialog /></div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
