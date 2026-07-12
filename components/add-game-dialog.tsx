"use client"

import { useState } from "react"
import { Plus, Star, X } from "lucide-react"
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
import { GameItem, GamePlatform, useApp } from "@/lib/app-context"
import { createClient } from "@/lib/supabase/client"
import { upsertContent } from "@/lib/content"
import { PLATFORM_LABELS, gameStatusToDb } from "@/lib/media-labels"
import { GameSearchPicker, GamePickResult } from "@/components/game-search-picker"
import { cn } from "@/lib/utils"

const defaultCovers = [
  "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=300&h=400&fit=crop",
  "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=300&h=400&fit=crop",
]

const emptyForm = {
  title: "",
  cover: "",
  description: "",
  platforms: [] as GamePlatform[],
  genres: "",
  status: "planning" as GameItem["status"],
  rating: 0,
  externalId: "",
}

export function AddGameDialog() {
  const { addGameItem, activeUserId } = useApp()
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState(emptyForm)

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

    const { data, error } = await supabase
      .from("personal_games")
      .insert({
        user_id: activeUserId,
        content_id: content.id,
        status: gameStatusToDb(formData.status),
        user_rating: formData.rating || null,
        platforms: formData.platforms.length ? formData.platforms : ["pc"],
      })
      .select()
      .single()

    if (error) throw error
    return data.id as string
  }

  const handleSubmit = async () => {
    if (!formData.title.trim()) return

    try {
      const gameId = await saveToSupabase()
      addGameItem({
        title: formData.title,
        cover: formData.cover || defaultCovers[0],
        description: formData.description || undefined,
        platforms: formData.platforms.length ? formData.platforms : ["pc"],
        genres: formData.genres ? formData.genres.split(",").map((g) => g.trim()).filter(Boolean) : undefined,
        status: formData.status,
        rating: formData.rating || undefined,
        userId: activeUserId,
      }, gameId)

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
          Добавить игру
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-2xl max-h-[90vh] overflow-y-auto w-[95vw] max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Добавить игру</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-4">
          <GameSearchPicker onSelect={handlePick} />

          {formData.title && (
            <>
              <div className="space-y-2">
                <Label className="text-base">Описание</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="rounded-xl resize-none text-base"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-base">Статус</Label>
                  <Select value={formData.status} onValueChange={(v: GameItem["status"]) => setFormData({ ...formData, status: v })}>
                    <SelectTrigger className="rounded-xl py-6 text-base"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planning">Планирую</SelectItem>
                      <SelectItem value="playing">Играю</SelectItem>
                      <SelectItem value="completed">Прошёл(а)</SelectItem>
                      <SelectItem value="dropped">Бросил(а)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-base">Жанры (через запятую)</Label>
                  <Input value={formData.genres} onChange={(e) => setFormData({ ...formData, genres: e.target.value })} className="rounded-xl py-6 text-base" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-base">Платформы</Label>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(PLATFORM_LABELS).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setFormData((prev) => ({
                        ...prev,
                        platforms: prev.platforms.includes(p as GamePlatform)
                          ? prev.platforms.filter((x) => x !== p)
                          : [...prev.platforms, p as GamePlatform],
                      }))}
                      className={cn("px-3 py-1.5 rounded-full text-sm", formData.platforms.includes(p as GamePlatform) ? "bg-primary text-primary-foreground" : "bg-muted")}
                    >
                      {PLATFORM_LABELS[p as GamePlatform]}
                    </button>
                  ))}
                </div>
              </div>

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
