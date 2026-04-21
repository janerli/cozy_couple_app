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
  Check,
  AlertCircle,
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
  const owner = users.find((u) => u.id === item.userId)

  const handleReserve = () => {
    if (item.reservedBy) {
      updateWishlistItem(item.id, { reservedBy: undefined })
    } else {
      updateWishlistItem(item.id, { reservedBy: activeUserId })
    }
  }

  const isReserved = !!item.reservedBy
  const isReservedByMe = item.reservedBy === activeUserId

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      layout
    >
      <Card className={cn(
        "overflow-hidden soft-shadow dark:neon-glow group",
        isReserved && !isOwner && "opacity-60"
      )}>
        <div className="relative aspect-square">
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover"
          />
          
          {/* Reserved overlay */}
          {isReserved && !isOwner && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                Зарезервировано
              </span>
            </div>
          )}

{/* Owner badge */}
<div className="absolute top-2 left-2">
  <UserAvatar avatar={owner?.avatar || ''} name={owner?.name || ''} size="md" className="bg-card/90" />
</div>

          {/* Priority badge */}
          <div className="absolute top-2 right-2">
            <span className={cn(
              "px-2 py-1 text-xs font-medium rounded-full",
              priorityColors[item.priority]
            )}>
              {priorityLabels[item.priority]}
            </span>
          </div>

          {/* Hover actions */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all">
            <div className="absolute bottom-0 left-0 right-0 p-3 flex gap-2">
              {item.link && (
                <a href={item.link} target="_blank" rel="noopener noreferrer" className="flex-1">
                  <Button size="sm" variant="secondary" className="rounded-full w-full gap-1">
                    <ExternalLink className="w-3 h-3" />
                    Открыть
                  </Button>
                </a>
              )}
              {!isOwner && (
                <Button
                  size="sm"
                  variant={isReservedByMe ? "destructive" : "default"}
                  className="rounded-full"
                  onClick={handleReserve}
                >
                  {isReservedByMe ? "Отменить" : "Зарезервировать"}
                </Button>
              )}
              {isOwner && (
                <Button
                  size="sm"
                  variant="destructive"
                  className="rounded-full"
                  onClick={() => deleteWishlistItem(item.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
        <CardContent className="p-3">
          <h3 className="font-medium text-sm truncate mb-1">{item.name}</h3>
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
                <Check className="w-3 h-3" /> Кто-то взял
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default function WishlistPage() {
  const { wishlistItems, users, activeUserId } = useApp()
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all")
  const [userFilter, setUserFilter] = useState<UserFilter>("all")

  const filteredItems = useMemo(() => {
    let items = wishlistItems

    if (categoryFilter !== "all") {
      items = items.filter((i) => i.category === categoryFilter)
    }

    if (userFilter !== "all") {
      items = items.filter((i) => i.userId === userFilter)
    }

    return items
  }, [wishlistItems, categoryFilter, userFilter])

  const categoryCounts = useMemo(() => {
    return {
      all: wishlistItems.length,
      gift: wishlistItems.filter((i) => i.category === "gift").length,
      "date-idea": wishlistItems.filter((i) => i.category === "date-idea").length,
      place: wishlistItems.filter((i) => i.category === "place").length,
    }
  }, [wishlistItems])

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
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"
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
