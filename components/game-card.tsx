"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Star, Trash2, Edit2, X } from "lucide-react"
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
import { GameItem, GamePlatform, useApp } from "@/lib/app-context"
import { GAME_STATUS_LABELS, GAME_STATUS_COLORS, PLATFORM_LABELS } from "@/lib/media-labels"
import { PosterCard } from "@/components/poster-card"
import { cn } from "@/lib/utils"

type GameCardProps = {
  item: GameItem
  index: number
}

export function GameCard({ item, index }: GameCardProps) {
  const { updateGameItem, deleteGameItem } = useApp()
  const [isViewing, setIsViewing] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    title: item.title,
    description: item.description || "",
    rating: item.rating || 0,
    status: item.status,
    platforms: item.platforms,
  })

  const handleSave = () => {
    updateGameItem(item.id, {
      title: editData.title,
      description: editData.description || undefined,
      rating: editData.rating || undefined,
      status: editData.status,
      platforms: editData.platforms,
    })
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
        <Card className="overflow-hidden soft-shadow dark:neon-glow group cursor-pointer py-0 gap-0">
          <PosterCard
            aspect="3/4"
            image={item.cover}
            alt={item.title}
            onOpen={() => setIsViewing(true)}
            statusLabel={GAME_STATUS_LABELS[item.status]}
            statusColorClass={GAME_STATUS_COLORS[item.status]}
            description={item.description}
            bottomBadge={
              <div className="flex gap-1 flex-wrap">
                {item.platforms.slice(0, 2).map((p) => (
                  <span key={p} className="px-2 py-0.5 text-xs bg-black/60 backdrop-blur-sm text-white rounded-full">
                    {PLATFORM_LABELS[p]}
                  </span>
                ))}
                {item.platforms.length > 2 && (
                  <span className="px-2 py-0.5 text-xs bg-black/60 backdrop-blur-sm text-white rounded-full">
                    +{item.platforms.length - 2}
                  </span>
                )}
              </div>
            }
            actions={
              <>
                <Button size="sm" variant="secondary" className="rounded-full flex-1 h-9" onClick={() => setIsEditing(true)}>
                  <Edit2 className="w-4 h-4 mr-1" /> Ред.
                </Button>
                <Button size="sm" variant="destructive" className="rounded-full h-9 w-9 p-0" onClick={() => deleteGameItem(item.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            }
          />

          <div className="p-4">
            <h3 className="font-medium text-sm truncate mb-2">{item.title}</h3>
            <div className="flex items-center justify-between gap-2">
              {item.rating ? (
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <Star key={i} className={cn("w-2.5 h-2.5", i < item.rating! ? "text-amber-500 fill-amber-500" : "text-muted-foreground/30")} />
                  ))}
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">Без оценки</span>
              )}
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
              <img src={item.cover} alt={item.title} className="w-full rounded-xl shadow-lg object-cover" />
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

              {item.genres && item.genres.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {item.genres.map((g) => (
                    <span key={g} className="px-2 py-0.5 text-xs bg-muted rounded-full text-muted-foreground">{g}</span>
                  ))}
                </div>
              )}

              <div>
                <h3 className="font-semibold text-lg mb-2">Твоя оценка</h3>
                {item.rating ? (
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-bold text-amber-500">{item.rating}</span>
                    <span className="text-muted-foreground">/10</span>
                    <div className="flex ml-2">
                      {Array.from({ length: 10 }).map((_, i) => (
                        <Star key={i} className={cn("w-5 h-5", i < item.rating! ? "text-amber-500 fill-amber-500" : "text-muted-foreground/30")} />
                      ))}
                    </div>
                  </div>
                ) : (
                  <span className="text-muted-foreground">Не оценено</span>
                )}
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
          <DialogHeader><DialogTitle>Редактировать</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Название</Label>
              <Input value={editData.title} onChange={(e) => setEditData({ ...editData, title: e.target.value })} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Описание</Label>
              <Textarea value={editData.description} onChange={(e) => setEditData({ ...editData, description: e.target.value })} className="rounded-xl resize-none" rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Статус</Label>
              <Select value={editData.status} onValueChange={(v: GameItem["status"]) => setEditData({ ...editData, status: v })}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">Планирую</SelectItem>
                  <SelectItem value="playing">Играю</SelectItem>
                  <SelectItem value="completed">Прошёл(а)</SelectItem>
                  <SelectItem value="dropped">Бросил(а)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Платформы</Label>
              <div className="flex flex-wrap gap-2">
                {Object.keys(PLATFORM_LABELS).map((p) => (
                  <button
                    key={p}
                    onClick={() => setEditData((prev) => ({
                      ...prev,
                      platforms: prev.platforms.includes(p as GamePlatform)
                        ? prev.platforms.filter((x) => x !== p)
                        : [...prev.platforms, p as GamePlatform],
                    }))}
                    className={cn("px-3 py-1.5 rounded-full text-sm", editData.platforms.includes(p as GamePlatform) ? "bg-primary text-primary-foreground" : "bg-muted")}
                  >
                    {PLATFORM_LABELS[p as GamePlatform]}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Оценка (1-10)</Label>
              <div className="flex gap-0.5 flex-wrap">
                {Array.from({ length: 10 }).map((_, i) => (
                  <button key={i} onClick={() => setEditData({ ...editData, rating: i + 1 })} className="p-0.5">
                    <Star className={cn("w-5 h-5", i < editData.rating ? "text-amber-500 fill-amber-500" : "text-muted-foreground hover:text-amber-500")} />
                  </button>
                ))}
                {editData.rating > 0 && (
                  <button onClick={() => setEditData({ ...editData, rating: 0 })} className="ml-2 p-1">
                    <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                  </button>
                )}
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
