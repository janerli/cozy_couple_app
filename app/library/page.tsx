"use client"

import { useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Film, Clock, Play, ArrowUpDown, Ban } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useApp, MediaItem } from "@/lib/app-context"
import { MediaCard } from "@/components/media-card"
import { AddMediaDialog } from "@/components/add-media-dialog"
import { cn } from "@/lib/utils"

type Tab = "planned" | "watching" | "watched" | "dropped"
type FilterType = "all" | MediaItem["type"]
type SortBy = "date" | "rating" | "title"

const tabs: { value: Tab; label: string; icon: React.ElementType }[] = [
  { value: "planned", label: "Запланировано", icon: Clock },
  { value: "watching", label: "Смотрю", icon: Play },
  { value: "watched", label: "Просмотрено", icon: Film },
  { value: "dropped", label: "Брошено", icon: Ban },
]

const filterOptions: { value: FilterType; label: string }[] = [
  { value: "all", label: "Все" },
  { value: "movie", label: "Фильм" },
  { value: "series", label: "Сериал" },
  { value: "anime", label: "Аниме" },
  { value: "anime-movie", label: "Аниме-фильм" },
  { value: "cartoon", label: "Мультсериал" },
]

export default function LibraryPage() {
  const { activeUser, mediaItems } = useApp()
  const [activeTab, setActiveTab] = useState<Tab>("planned")
  const [filterType, setFilterType] = useState<FilterType>("all")
  const [sortBy, setSortBy] = useState<SortBy>("date")

  const userMedia = useMemo(() => {
    return mediaItems.filter((m) => m.userId === activeUser.id)
  }, [mediaItems, activeUser.id])

  const stats = useMemo(() => {
    return {
      planned: userMedia.filter((m) => m.status === "planned").length,
      watching: userMedia.filter((m) => m.status === "watching").length,
      watched: userMedia.filter((m) => m.status === "watched").length,
      dropped: userMedia.filter((m) => m.status === "dropped").length,
    }
  }, [userMedia])

  const totalHours = useMemo(() => {
    // Rough estimate: movies ~2h, series/anime episodes ~0.7h
    const watched = userMedia.filter((m) => m.status === "watched")
    let hours = 0
    watched.forEach((m) => {
      if (m.type === "movie" || m.type === "anime-movie") {
        hours += 2
      } else {
        // Assume average 12 episodes per series
        hours += 12 * 0.7
      }
    })
    return Math.round(hours)
  }, [userMedia])

  const filteredMedia = useMemo(() => {
    let items = userMedia.filter((m) => m.status === activeTab)

    if (filterType !== "all") {
      items = items.filter((m) => m.type === filterType)
    }

    if (sortBy === "date") {
      items.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
    } else if (sortBy === "rating") {
      items.sort((a, b) => (b.rating || 0) - (a.rating || 0))
    } else {
      items.sort((a, b) => a.title.localeCompare(b.title))
    }

    return items
  }, [userMedia, activeTab, filterType, sortBy])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 pb-8"
    >
      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="soft-shadow dark:neon-glow overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", bounce: 0.5 }}
                className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center text-5xl"
              >
                {activeUser.avatar}
              </motion.div>
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-2xl font-bold mb-1">{activeUser.name}</h1>
                <p className="text-muted-foreground mb-3">{activeUser.bio}</p>
                <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                  {activeUser.favoriteGenres.map((genre) => (
                    <span
                      key={genre}
                      className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm font-medium"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-4"
      >
        <Card className="soft-shadow text-center p-4">
          <div className="text-3xl font-bold text-primary">{stats.watched}</div>
          <div className="text-sm text-muted-foreground">Просмотрено</div>
        </Card>
        <Card className="soft-shadow text-center p-4">
          <div className="text-3xl font-bold text-primary">{stats.watching}</div>
          <div className="text-sm text-muted-foreground">Смотрю</div>
        </Card>
        <Card className="soft-shadow text-center p-4">
          <div className="text-3xl font-bold text-primary">{stats.planned}</div>
          <div className="text-sm text-muted-foreground">Запланировано</div>
        </Card>
        <Card className="soft-shadow text-center p-4">
          <div className="text-3xl font-bold text-amber-500">{totalHours}ч</div>
          <div className="text-sm text-muted-foreground">Всего часов</div>
        </Card>
      </motion.div>

      {/* Tabs */}
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
            <span className="ml-1 text-xs opacity-70">
              ({stats[tab.value]})
            </span>
          </button>
        ))}
      </motion.div>

      {/* Filters & Add Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex flex-wrap items-center gap-3"
      >
        {/* Filter Chips */}
        <div className="flex gap-2 overflow-x-auto flex-1 pb-2">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setFilterType(option.value)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm transition-all whitespace-nowrap",
                filterType === option.value
                  ? "bg-accent text-accent-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Sort */}
        <Select value={sortBy} onValueChange={(v: SortBy) => setSortBy(v)}>
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

        <AddMediaDialog />
      </motion.div>

      {/* Media Grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${activeTab}-${filterType}-${sortBy}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
        >
          {filteredMedia.length > 0 ? (
            filteredMedia.map((item, index) => (
              <MediaCard key={item.id} item={item} index={index} />
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="col-span-full py-16 text-center"
            >
              <div className="text-6xl mb-4">📺</div>
              <h3 className="text-xl font-medium mb-2">Пока пусто</h3>
              <p className="text-muted-foreground mb-4">
                Добавьте что-нибудь в эту категорию!
              </p>
              <AddMediaDialog />
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}
