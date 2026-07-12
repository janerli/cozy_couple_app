"use client"

import { useState } from "react"
import { Plus, Star, Check, X } from "lucide-react"
import { toast } from "sonner"
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
import { upsertContent } from "@/lib/content"
import { hasEpisodes } from "@/lib/media-labels"
import { MediaSearchPicker, MediaPickResult } from "@/components/media-search-picker"
import { cn } from "@/lib/utils"

const defaultPosters = [
  "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=300&h=450&fit=crop",
  "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=300&h=450&fit=crop",
  "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=300&h=450&fit=crop",
]

const emptyForm = {
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
}

export function AddMediaDialog() {
  const { addMediaItem, activeUserId } = useApp()
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState(emptyForm)

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

    const { data: personalData, error: personalError } = await supabase
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
      .select()
      .single()

    if (personalError) throw personalError
    return personalData.id as string
  }

  const handleSubmit = async () => {
    if (!formData.title.trim()) return

    try {
      const mediaId = await saveToSupabase()
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
      }, mediaId)

      setFormData(emptyForm)
      setOpen(false)
    } catch (error) {
      console.error("Submit error:", error)
      toast.error("Ошибка при сохранении. Попробуй ещё раз.")
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) setFormData(emptyForm)
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
          <MediaSearchPicker onSelect={handlePick} />

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
