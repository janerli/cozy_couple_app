"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Star, Trash2, Edit2, Heart, Check, X } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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

type MediaCardProps = {
  item: MediaItem
  index: number
}

const typeLabels: Record<MediaItem["type"], string> = {
  movie: "Фильм",
  series: "Сериал",
  anime: "Аниме",
  "anime-movie": "Аниме-фильм",
  cartoon: "Мультсериал",
}

const statusLabels: Record<MediaItem["status"], string> = {
  watched: "Просмотрено",
  planned: "Запланировано",
  watching: "Смотрю",
  dropped: "Брошено",
}

const statusColors: Record<MediaItem["status"], string> = {
  watched: "bg-green-500/90 text-white",
  planned: "bg-blue-500/90 text-white",
  watching: "bg-amber-500/90 text-white",
  dropped: "bg-red-500/90 text-white",
}

// Check if media type supports episodes
function hasEpisodes(type: MediaItem["type"]): boolean {
  return type === "series" || type === "anime" || type === "cartoon"
}

export function MediaCard({ item, index }: MediaCardProps) {
  const { updateMediaItem, deleteMediaItem } = useApp()
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    title: item.title,
    description: item.description || "",
    rating: item.rating || 0,
    status: item.status,
    currentSeason: item.currentSeason || 1,
    currentEpisode: item.currentEpisode || 1,
    watchedTogether: item.watchedTogether || false,
  })

  const handleSave = () => {
    updateMediaItem(item.id, {
      title: editData.title,
      description: editData.description || undefined,
      rating: editData.rating || undefined,
      status: editData.status,
      currentSeason: hasEpisodes(item.type) ? editData.currentSeason : undefined,
      currentEpisode: hasEpisodes(item.type) ? editData.currentEpisode : undefined,
      watchedTogether: editData.watchedTogether,
    })
    setIsEditing(false)
  }

  const getProgressText = () => {
    if (!hasEpisodes(item.type)) return null
    if (item.type === "anime") {
      return item.currentEpisode ? `${item.currentEpisode} серия` : null
    }
    if (item.currentSeason && item.currentEpisode) {
      return `${item.currentSeason} сезон, ${item.currentEpisode} серия`
    }
    return null
  }

  const progressText = getProgressText()

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        layout
      >
        <Card className="overflow-hidden soft-shadow dark:neon-glow group cursor-pointer">
          <div className="relative aspect-[2/3]">
            <img
              src={item.poster}
              alt={item.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            
            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
              <div className="absolute bottom-0 left-0 right-0 p-4">
                {/* Description */}
                {item.description && (
                  <p className="text-white/80 text-xs mb-3 line-clamp-3">{item.description}</p>
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
                    onClick={() => deleteMediaItem(item.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Status badge */}
            <div className="absolute top-2 left-2">
              <span className={cn(
                "px-2 py-1 text-xs font-medium rounded-full",
                statusColors[item.status]
              )}>
                {statusLabels[item.status]}
              </span>
            </div>

            {/* Watched together badge */}
            {item.watchedTogether && (
              <div className="absolute top-2 right-2">
                <span className="w-7 h-7 bg-primary rounded-full flex items-center justify-center">
                  <Heart className="w-4 h-4 text-primary-foreground fill-current" />
                </span>
              </div>
            )}

            {/* Type badge */}
            <div className="absolute bottom-2 left-2 right-2 opacity-100 group-hover:opacity-0 transition-opacity">
              <span className="px-2 py-1 text-xs bg-black/60 text-white rounded-full">
                {typeLabels[item.type]}
              </span>
            </div>
          </div>

          <div className="p-3">
            <h3 className="font-medium text-sm truncate mb-1">{item.title}</h3>
            <div className="flex items-center justify-between gap-2">
              {item.rating ? (
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "w-2.5 h-2.5",
                        i < item.rating!
                          ? "text-amber-500 fill-amber-500"
                          : "text-muted-foreground/30"
                      )}
                    />
                  ))}
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">Без оценки</span>
              )}
              {progressText && (
                <span className="text-xs text-muted-foreground truncate">{progressText}</span>
              )}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Редактировать</DialogTitle>
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
                onValueChange={(value: MediaItem["status"]) =>
                  setEditData({ ...editData, status: value })
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
            {hasEpisodes(item.type) && (
              <div className="grid grid-cols-2 gap-4">
                {item.type !== "anime" && (
                  <div className="space-y-2">
                    <Label>Сезон</Label>
                    <Input
                      type="number"
                      min={1}
                      value={editData.currentSeason}
                      onChange={(e) => setEditData({ ...editData, currentSeason: parseInt(e.target.value) || 1 })}
                      className="rounded-xl"
                    />
                  </div>
                )}
                <div className={cn("space-y-2", item.type === "anime" && "col-span-2")}>
                  <Label>Серия</Label>
                  <Input
                    type="number"
                    min={1}
                    value={editData.currentEpisode}
                    onChange={(e) => setEditData({ ...editData, currentEpisode: parseInt(e.target.value) || 1 })}
                    className="rounded-xl"
                  />
                </div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setEditData({ ...editData, watchedTogether: !editData.watchedTogether })
                }
                className={cn(
                  "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors",
                  editData.watchedTogether
                    ? "bg-primary border-primary text-primary-foreground"
                    : "border-muted-foreground"
                )}
              >
                {editData.watchedTogether && <Check className="w-4 h-4" />}
              </button>
              <Label className="cursor-pointer" onClick={() =>
                setEditData({ ...editData, watchedTogether: !editData.watchedTogether })
              }>
                Смотрели вместе
              </Label>
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
