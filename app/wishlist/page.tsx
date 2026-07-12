"use client"

import { UserAvatar } from "@/components/user-avatar"
import { useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Gift,
  Heart,
  MapPin,
  Plus,
  ExternalLink,
  Trash2,
  Edit2,
  Check,
  AlertCircle,
  PartyPopper,
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
import { useApp, WishlistItem } from "@/lib/app-context"
import { cn } from "@/lib/utils"

type CategoryFilter = "all" | WishlistItem["category"]
type UserFilter = "all" | "user1" | "user2"

const categoryOptions: { value: WishlistItem["category"]; label: string; icon: React.ElementType }[] = [
  { value: "gift", label: "Подарки", icon: Gift },
  { value: "date-idea", label: "Идеи для свиданий", icon: Heart },
  { value: "place", label: "Хочу посетить", icon: MapPin },
]

const priorityColors = {
  high: "bg-red-500/20 text-red-600 dark:text-red-400",
  medium: "bg-amber-500/20 text-amber-600 dark:text-amber-400",
  low: "bg-green-500/20 text-green-600 dark:text-green-400",
}

const priorityLabels = {
  high: "Очень хочу",
  medium: "Хочу",
  low: "Было бы неплохо",
}

function AddWishlistDialog() {
  const { addWishlistItem, activeUserId } = useApp()
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    imageUrl: "",
    link: "",
    price: "",
    priority: "medium" as WishlistItem["priority"],
    category: "gift" as WishlistItem["category"],
  })

  const handleSubmit = () => {
    if (!formData.name.trim()) return

    addWishlistItem({
      name: formData.name,
      imageUrl: formData.imageUrl || "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=300&h=300&fit=crop",
      link: formData.link,
      price: formData.price ? parseFloat(formData.price) : undefined,
      priority: formData.priority,
      category: formData.category,
      userId: activeUserId,
    })

    setFormData({
      name: "",
      imageUrl: "",
      link: "",
      price: "",
      priority: "medium",
      category: "gift",
    })
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-full gap-2">
          <Plus className="w-4 h-4" />
          Добавить желание
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Добавить в вишлист</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Название *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Что хотите?"
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label>Категория</Label>
            <Select
              value={formData.category}
              onValueChange={(value: WishlistItem["category"]) =>
                setFormData({ ...formData, category: value })
              }
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <span className="flex items-center gap-2">
                      <opt.icon className="w-4 h-4" />
                      {opt.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Изображение (URL)</Label>
            <Input
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              placeholder="https://example.com/image.jpg"
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label>Ссылка на товар / место</Label>
            <Input
              value={formData.link}
              onChange={(e) => setFormData({ ...formData, link: e.target.value })}
              placeholder="https://shop.com/item"
              className="rounded-xl"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Цена (опционально)</Label>
              <Input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="0"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Приоритет</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: WishlistItem["priority"]) =>
                  setFormData({ ...formData, priority: value })
                }
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">Очень хочу</SelectItem>
                  <SelectItem value="medium">Хочу</SelectItem>
                  <SelectItem value="low">Было бы неплохо</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} className="rounded-full">
            Отмена
          </Button>
          <Button onClick={handleSubmit} disabled={!formData.name.trim()} className="rounded-full">
            Добавить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function WishlistCard({
  item,
  index,
  isOwner,
}: {
  item: WishlistItem
  index: number
  isOwner: boolean
}) {
  const { updateWishlistItem, deleteWishlistItem, activeUserId, users } = useApp()
  const [isViewing, setIsViewing] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isReserving, setIsReserving] = useState(false)
  const [reserveNote, setReserveNote] = useState("")
  const [editData, setEditData] = useState({
    name: item.name,
    imageUrl: item.imageUrl,
    link: item.link,
    price: item.price?.toString() || "",
    priority: item.priority,
    category: item.category,
  })
  const owner = users.find((u) => u.id === item.userId)

  const isFulfilled = item.status === "fulfilled"

  const handleCancelReserve = () => {
    updateWishlistItem(item.id, { reservedBy: undefined, reservationNote: undefined })
  }

  const handleConfirmReserve = () => {
    updateWishlistItem(item.id, { reservedBy: activeUserId, reservationNote: reserveNote.trim() || undefined })
    setReserveNote("")
    setIsReserving(false)
  }

  const handleToggleFulfilled = () => {
    updateWishlistItem(item.id, { status: isFulfilled ? "active" : "fulfilled" })
  }

  const handleSaveEdit = () => {
    if (!editData.name.trim()) return
    updateWishlistItem(item.id, {
      name: editData.name,
      imageUrl: editData.imageUrl || item.imageUrl,
      link: editData.link,
      price: editData.price ? parseFloat(editData.price) : undefined,
      priority: editData.priority,
      category: editData.category,
    })
    setIsEditing(false)
  }

  const isReserved = !!item.reservedBy
  const isReservedByMe = item.reservedBy === activeUserId

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        layout
      >
        <Card className={cn(
          "overflow-hidden soft-shadow dark:neon-glow group cursor-pointer py-0 gap-0",
          isReserved && !isOwner && "opacity-60"
        )}>
          <div className="relative aspect-square bg-muted" onClick={() => setIsViewing(true)}>
            <img
              src={item.imageUrl}
              alt={item.name}
              className="absolute inset-0 w-full h-full object-cover"
            />
            
            {/* Затемнение */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/90 via-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            
            {/* Контент оверлея */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute bottom-0 left-0 right-0 p-3 pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                  {item.link && (
                    <a href={item.link} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-[90px]">
                      <Button size="sm" variant="secondary" className="rounded-full w-full h-9 gap-1">
                        <ExternalLink className="w-3 h-3" />
                        Открыть
                      </Button>
                    </a>
                  )}
                  {!isOwner && (
                    <Button
                      size="sm"
                      variant={isReservedByMe ? "destructive" : "default"}
                      className="rounded-full h-9 px-4"
                      onClick={() => (isReservedByMe ? handleCancelReserve() : setIsReserving(true))}
                    >
                      {isReservedByMe ? "Отменить" : "Зарезервировать"}
                    </Button>
                  )}
                  {!isOwner && isReservedByMe && (
                    <Button
                      size="sm"
                      variant={isFulfilled ? "secondary" : "default"}
                      className="rounded-full h-9 w-9 p-0"
                      onClick={handleToggleFulfilled}
                      title={isFulfilled ? "Вернуть в активные" : "Отметить как куплено"}
                    >
                      <PartyPopper className="w-4 h-4" />
                    </Button>
                  )}
                  {isOwner && (
                    <>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="rounded-full h-9 w-9 p-0"
                        onClick={() => setIsEditing(true)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="rounded-full h-9 w-9 p-0"
                        onClick={() => deleteWishlistItem(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            {/* Reserved overlay */}
            {isReserved && !isOwner && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                  {isFulfilled ? "Куплено 🎉" : "Зарезервировано"}
                </span>
              </div>
            )}
            
            {/* Owner badge */}
            <div className="absolute top-2 left-2 z-10">
              <UserAvatar avatar={owner?.avatar || ''} name={owner?.name || ''} size="md" className="bg-card/90 shadow-lg" />
            </div>
            
            {/* Priority badge */}
            <div className="absolute top-2 right-2 z-10">
              <span className={cn(
                "px-2 py-1 text-xs font-medium rounded-full shadow-lg",
                priorityColors[item.priority]
              )}>
                {priorityLabels[item.priority]}
              </span>
            </div>
          </div>
          
          <CardContent className="p-4">
            <h3 className="font-medium text-sm truncate mb-2">{item.name}</h3>
            <div className="flex items-center justify-between text-sm">
              {item.price ? (
                <span className="text-primary font-semibold">
                  {item.price.toLocaleString("ru-RU")} ₽
                </span>
              ) : (
                <span className="text-muted-foreground">Без цены</span>
              )}
              {isOwner && isReserved && (
                <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                  <Check className="w-3 h-3" /> {isFulfilled ? "Готово" : "Кто-то взял"}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 🔥 ПРОСМОТР */}
<Dialog open={isViewing} onOpenChange={setIsViewing}>
  <DialogContent className="!max-w-2xl !w-[90vw] rounded-2xl max-h-[90vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle className="text-xl font-bold">{item.name}</DialogTitle>
    </DialogHeader>
    
    <div className="flex flex-col md:flex-row gap-6 py-4">
      <div className="md:w-1/2 flex-shrink-0">
        <img src={item.imageUrl} alt={item.name} className="w-full aspect-square object-cover rounded-xl shadow-lg" />
      </div>
      
      <div className="md:w-1/2 space-y-4">
        {/* Категория и приоритет */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn("px-3 py-1 text-sm font-medium rounded-full", priorityColors[item.priority])}>
            {priorityLabels[item.priority]}
          </span>
          {(() => {
            const cat = categoryOptions.find(c => c.value === item.category)
            const CatIcon = cat?.icon
            return (
              <span className="px-3 py-1 text-sm bg-muted rounded-full flex items-center gap-1">
                {CatIcon && <CatIcon className="w-3 h-3" />}
                {cat?.label}
              </span>
            )
          })()}
        </div>
        
        {/* Цена */}
        {item.price ? (
          <div>
            <h3 className="font-semibold text-lg mb-1">Цена</h3>
            <p className="text-2xl font-bold text-primary">{item.price.toLocaleString("ru-RU")} ₽</p>
          </div>
        ) : (
          <p className="text-muted-foreground">Без цены</p>
        )}
        
        {/* Ссылка */}
        {item.link && (
          <div>
            <h3 className="font-semibold text-lg mb-2">Ссылка</h3>
            <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">
              {item.link}
            </a>
          </div>
        )}
        
        {/* Кто добавил */}
        <div className="flex items-center gap-2 pt-4 border-t">
          <UserAvatar avatar={owner?.avatar || ''} name={owner?.name || ''} size="sm" />
          <span className="text-sm text-muted-foreground">
            Добавил(а): <span className="font-medium text-foreground">{owner?.name}</span>
          </span>
        </div>
        
        {/* Статус резерва */}
        {isReserved && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
            <p className="text-amber-600 dark:text-amber-400 font-medium">
              {isFulfilled ? "🎉 Куплено" : "🎁 Зарезервировано"}{!isOwner && isReservedByMe ? " тобой" : ""}
            </p>
          </div>
        )}
        {!isOwner && isReservedByMe && item.reservationNote && (
          <div>
            <h3 className="font-semibold text-base mb-2">Твоя заметка</h3>
            <div className="bg-muted/30 p-4 rounded-xl">
              <p className="text-muted-foreground text-sm italic">"{item.reservationNote}"</p>
            </div>
          </div>
        )}
      </div>
    </div>

    <DialogFooter className="gap-2">
      <Button variant="outline" onClick={() => setIsViewing(false)} className="rounded-full px-6 py-5">
        Закрыть
      </Button>
      {item.link && (
        <a href={item.link} target="_blank" rel="noopener noreferrer">
          <Button className="rounded-full px-6 py-5 gap-1">
            <ExternalLink className="w-4 h-4" /> Открыть
          </Button>
        </a>
      )}
      {!isOwner && isReservedByMe && (
        <Button
          variant={isFulfilled ? "secondary" : "default"}
          className="rounded-full px-6 py-5 gap-1"
          onClick={handleToggleFulfilled}
        >
          <PartyPopper className="w-4 h-4" /> {isFulfilled ? "Вернуть в активные" : "Отметить куплено"}
        </Button>
      )}
      {!isOwner && (
        <Button
          variant={isReservedByMe ? "destructive" : "default"}
          className="rounded-full px-6 py-5"
          onClick={() => {
            if (isReservedByMe) {
              handleCancelReserve()
            } else {
              setIsViewing(false)
              setIsReserving(true)
            }
          }}
        >
          {isReservedByMe ? "Отменить" : "Зарезервировать"}
        </Button>
      )}
    </DialogFooter>
  </DialogContent>
</Dialog>

      {/* РЕЗЕРВ С ЗАМЕТКОЙ */}
      <Dialog open={isReserving} onOpenChange={(o) => { setIsReserving(o); if (!o) setReserveNote("") }}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Зарезервировать «{item.name}»</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <Label>Заметка для себя (необязательно)</Label>
            <Textarea
              value={reserveNote}
              onChange={(e) => setReserveNote(e.target.value)}
              placeholder="Например: нужен размер M, уже заказал(а)..."
              className="rounded-xl resize-none"
              rows={3}
            />
            <p className="text-xs text-muted-foreground">{owner?.name} не увидит эту заметку.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReserving(false)} className="rounded-full">Отмена</Button>
            <Button onClick={handleConfirmReserve} className="rounded-full">Зарезервировать</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* РЕДАКТИРОВАНИЕ */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Редактировать желание</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Название *</Label>
              <Input value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Категория</Label>
              <Select value={editData.category} onValueChange={(v: WishlistItem["category"]) => setEditData({ ...editData, category: v })}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <span className="flex items-center gap-2">
                        <opt.icon className="w-4 h-4" />
                        {opt.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Изображение (URL)</Label>
              <Input value={editData.imageUrl} onChange={(e) => setEditData({ ...editData, imageUrl: e.target.value })} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Ссылка на товар / место</Label>
              <Input value={editData.link} onChange={(e) => setEditData({ ...editData, link: e.target.value })} className="rounded-xl" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Цена (опционально)</Label>
                <Input type="number" value={editData.price} onChange={(e) => setEditData({ ...editData, price: e.target.value })} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Приоритет</Label>
                <Select value={editData.priority} onValueChange={(v: WishlistItem["priority"]) => setEditData({ ...editData, priority: v })}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">Очень хочу</SelectItem>
                    <SelectItem value="medium">Хочу</SelectItem>
                    <SelectItem value="low">Было бы неплохо</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditing(false)} className="rounded-full">Отмена</Button>
            <Button onClick={handleSaveEdit} disabled={!editData.name.trim()} className="rounded-full">Сохранить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
type StatusFilter = "active" | "fulfilled"

export default function WishlistPage() {
  const { wishlistItems, users, activeUserId } = useApp()
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active")
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all")
  const [userFilter, setUserFilter] = useState<UserFilter>("all")

  const itemsByStatus = useMemo(() => {
    return wishlistItems.filter((i) => (i.status || "active") === statusFilter)
  }, [wishlistItems, statusFilter])

  const filteredItems = useMemo(() => {
    let items = itemsByStatus

    if (categoryFilter !== "all") {
      items = items.filter((i) => i.category === categoryFilter)
    }

    if (userFilter !== "all") {
      items = items.filter((i) => i.userId === userFilter)
    }

    return items
  }, [itemsByStatus, categoryFilter, userFilter])

  const statusCounts = useMemo(() => ({
    active: wishlistItems.filter((i) => (i.status || "active") === "active").length,
    fulfilled: wishlistItems.filter((i) => i.status === "fulfilled").length,
  }), [wishlistItems])

  const categoryCounts = useMemo(() => {
    return {
      all: itemsByStatus.length,
      gift: itemsByStatus.filter((i) => i.category === "gift").length,
      "date-idea": itemsByStatus.filter((i) => i.category === "date-idea").length,
      place: itemsByStatus.filter((i) => i.category === "place").length,
    }
  }, [itemsByStatus])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 pb-8"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold mb-1">Вишлист</h1>
          <p className="text-muted-foreground">Желания и идеи для двоих</p>
        </div>
        <AddWishlistDialog />
      </motion.div>

      {/* Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-primary/10 border-primary/20">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <p className="text-sm">
              <strong>Подсказка:</strong> Сюда кидаем чо хочем
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Status Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="flex gap-2 p-1 bg-muted rounded-full w-fit"
      >
        <button
          onClick={() => setStatusFilter("active")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all whitespace-nowrap",
            statusFilter === "active" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Активные
          <span className="text-xs opacity-70">({statusCounts.active})</span>
        </button>
        <button
          onClick={() => setStatusFilter("fulfilled")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all whitespace-nowrap",
            statusFilter === "fulfilled" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Выполнено
          <span className="text-xs opacity-70">({statusCounts.fulfilled})</span>
        </button>
      </motion.div>

      {/* Category Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex gap-2 overflow-x-auto pb-2"
      >
        <button
          onClick={() => setCategoryFilter("all")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all whitespace-nowrap",
            categoryFilter === "all"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          Все
          <span className="text-xs opacity-70">({categoryCounts.all})</span>
        </button>
        {categoryOptions.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setCategoryFilter(cat.value)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all whitespace-nowrap",
              categoryFilter === cat.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            <cat.icon className="w-4 h-4" />
            {cat.label}
            <span className="text-xs opacity-70">
              ({categoryCounts[cat.value]})
            </span>
          </button>
        ))}
      </motion.div>

      {/* User Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex gap-2"
      >
        <button
          onClick={() => setUserFilter("all")}
          className={cn(
            "px-3 py-1.5 rounded-full text-sm transition-all",
            userFilter === "all"
              ? "bg-accent text-accent-foreground"
              : "bg-muted/50 text-muted-foreground hover:bg-muted"
          )}
        >
          Все
        </button>
        {users.map((user) => (
  <button
    key={user.id}
    onClick={() => setUserFilter(user.id as UserFilter)}
    className={cn(
      "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all",
      userFilter === user.id
        ? "bg-accent text-accent-foreground"
        : "bg-muted/50 text-muted-foreground hover:bg-muted"
    )}
  >
    <UserAvatar avatar={user.avatar || ''} name={user.name} size="sm" />
    {user.name}
  </button>
))}
      </motion.div>

      {/* Wishlist Grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${categoryFilter}-${userFilter}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5"
        >
          {filteredItems.length > 0 ? (
            filteredItems.map((item, index) => (
              <WishlistCard
                key={item.id}
                item={item}
                index={index}
                isOwner={item.userId === activeUserId}
              />
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="col-span-full py-16 text-center"
            >
              <div className="text-6xl mb-4">🎁</div>
              <h3 className="text-xl font-medium mb-2">Пока пусто</h3>
              <p className="text-muted-foreground mb-4">
                Добавьте свои желания!
              </p>
              <AddWishlistDialog />
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}
