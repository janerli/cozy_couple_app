"use client"

import { useState } from "react"
import { Plus, Star, Check, X } from "lucide-react"
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
import { cn } from "@/lib/utils"

const defaultPosters = [
  "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=300&h=450&fit=crop",
  "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=300&h=450&fit=crop",
  "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=300&h=450&fit=crop",
]

// Check if media type supports episodes
function hasEpisodes(type: MediaItem["type"]): boolean {
  return type === "series" || type === "anime" || type === "cartoon"
}

export function AddMediaDialog() {
  const { addMediaItem, activeUserId } = useApp()
  const [open, setOpen] = useState(false)
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
  })

  const handleSubmit = () => {
    if (!formData.title.trim()) return

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
    })
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
          <div className="space-y-2">
            <Label>Название *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Название фильма или сериала"
              className="rounded-xl"
            />
          </div>
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
            <Input
              value={formData.poster}
              onChange={(e) => setFormData({ ...formData, poster: e.target.value })}
              placeholder="https://example.com/poster.jpg"
              className="rounded-xl"
            />
            <p className="text-xs text-muted-foreground">
              Оставьте пустым для случайной заглушки
            </p>
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
