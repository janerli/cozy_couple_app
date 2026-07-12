"use client"

import { UserAvatar } from "@/components/user-avatar"
import { useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Film, Clock, Play, ArrowUpDown, Ban, Clapperboard, Gamepad2, Trophy } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useApp, MediaItem, GamePlatform } from "@/lib/app-context"
import { MediaCard } from "@/components/media-card"
import { GameCard } from "@/components/game-card"
import { AddMediaDialog } from "@/components/add-media-dialog"
import { AddGameDialog } from "@/components/add-game-dialog"
import { cn } from "@/lib/utils"

type MediaTab = "planned" | "watching" | "watched" | "dropped"
type FilterType = "all" | MediaItem["type"]
type GameTab = "planning" | "playing" | "completed" | "dropped"
type FilterPlatform = "all" | GamePlatform
type SortBy = "date" | "rating" | "title"

const mediaTabs: { value: MediaTab; label: string; icon: React.ElementType }[] = [
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

const gameTabs: { value: GameTab; label: string; icon: React.ElementType }[] = [
  { value: "planning", label: "Планирую", icon: Clock },
  { value: "playing", label: "Играю", icon: Play },
  { value: "completed", label: "Прошёл(а)", icon: Trophy },
  { value: "dropped", label: "Бросил(а)", icon: Ban },
]

const platformOptions: { value: FilterPlatform; label: string }[] = [
  { value: "all", label: "Все" },
  { value: "pc", label: "PC" },
  { value: "playstation", label: "PlayStation" },
  { value: "xbox", label: "Xbox" },
  { value: "nintendo", label: "Nintendo" },
  { value: "mobile", label: "Mobile" },
]

export default function LibraryPage() {
  const { activeUser, mediaItems, gameItems } = useApp()
  const [topTab, setTopTab] = useState<"media" | "games">("media")

  const [mediaTab, setMediaTab] = useState<MediaTab>("planned")
  const [filterType, setFilterType] = useState<FilterType>("all")
  const [mediaSortBy, setMediaSortBy] = useState<SortBy>("date")

  const [gameTab, setGameTab] = useState<GameTab>("planning")
  const [filterPlatform, setFilterPlatform] = useState<FilterPlatform>("all")
  const [gameSortBy, setGameSortBy] = useState<SortBy>("date")

  const userMedia = useMemo(() => {
    return mediaItems.filter((m) => m.userId === activeUser.id)
  }, [mediaItems, activeUser.id])

  const userGames = useMemo(() => {
    return gameItems.filter((g) => g.userId === activeUser.id)
  }, [gameItems, activeUser.id])

  const mediaStats = useMemo(() => {
    return {
      planned: userMedia.filter((m) => m.status === "planned").length,
      watching: userMedia.filter((m) => m.status === "watching").length,
      watched: userMedia.filter((m) => m.status === "watched").length,
      dropped: userMedia.filter((m) => m.status === "dropped").length,
    }
  }, [userMedia])

  const gameStats = useMemo(() => {
    return {
      planning: userGames.filter((g) => g.status === "planning").length,
      playing: userGames.filter((g) => g.status === "playing").length,
      completed: userGames.filter((g) => g.status === "completed").length,
      dropped: userGames.filter((g) => g.status === "dropped").length,
    }
  }, [userGames])

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
    let items = userMedia.filter((m) => m.status === mediaTab)

    if (filterType !== "all") {
      items = items.filter((m) => m.type === filterType)
    }

    if (mediaSortBy === "date") {
      items.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
    } else if (mediaSortBy === "rating") {
      items.sort((a, b) => (b.rating || 0) - (a.rating || 0))
    } else {
      items.sort((a, b) => a.title.localeCompare(b.title))
    }

    return items
  }, [userMedia, mediaTab, filterType, mediaSortBy])

  const filteredGames = useMemo(() => {
    let items = userGames.filter((g) => g.status === gameTab)

    if (filterPlatform !== "all") {
      items = items.filter((g) => g.platforms.includes(filterPlatform))
    }

    if (gameSortBy === "date") {
      items.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
    } else if (gameSortBy === "rating") {
      items.sort((a, b) => (b.rating || 0) - (a.rating || 0))
    } else {
      items.sort((a, b) => a.title.localeCompare(b.title))
    }

    return items
  }, [userGames, gameTab, filterPlatform, gameSortBy])

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
              >
                <UserAvatar avatar={activeUser.avatar} name={activeUser.name} size="xl" />
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

      {/* Top Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex justify-center"
      >
        <div className="inline-flex bg-muted p-1 rounded-full">
          <button onClick={() => setTopTab("media")} className={cn("flex items-center gap-2 px-6 py-2.5 rounded-full font-medium", topTab === "media" ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>
            <Clapperboard className="w-5 h-5" />Медиатека
          </button>
          <button onClick={() => setTopTab("games")} className={cn("flex items-center gap-2 px-6 py-2.5 rounded-full font-medium", topTab === "games" ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>
            <Gamepad2 className="w-5 h-5" />Игры
          </button>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {topTab === "media" ? (
          <motion.div key="media" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
            {/* Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card className="soft-shadow text-center p-4">
                <div className="text-3xl font-bold text-primary">{mediaStats.watched}</div>
                <div className="text-sm text-muted-foreground">Просмотрено</div>
              </Card>
              <Card className="soft-shadow text-center p-4">
                <div className="text-3xl font-bold text-primary">{mediaStats.watching}</div>
                <div className="text-sm text-muted-foreground">Смотрю</div>
              </Card>
              <Card className="soft-shadow text-center p-4">
                <div className="text-3xl font-bold text-primary">{mediaStats.planned}</div>
                <div className="text-sm text-muted-foreground">Запланировано</div>
              </Card>
              <Card className="soft-shadow text-center p-4">
                <div className="text-3xl font-bold text-amber-500">{totalHours}ч</div>
                <div className="text-sm text-muted-foreground">Всего часов</div>
              </Card>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {mediaTabs.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setMediaTab(tab.value)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all whitespace-nowrap",
                    mediaTab === tab.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                  <span className="ml-1 text-xs opacity-70">({mediaStats[tab.value]})</span>
                </button>
              ))}
            </div>

            {/* Filters & Add Button */}
            <div className="flex flex-wrap items-center gap-3">
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

              <Select value={mediaSortBy} onValueChange={(v: SortBy) => setMediaSortBy(v)}>
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
            </div>

            {/* Media Grid */}
            <motion.div
              key={`${mediaTab}-${filterType}-${mediaSortBy}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5"
            >
              {filteredMedia.length > 0 ? (
                filteredMedia.map((item, index) => (
                  <MediaCard key={item.id} item={item} index={index} />
                ))
              ) : (
                <div className="col-span-full py-16 text-center">
                  <div className="text-6xl mb-4">📺</div>
                  <h3 className="text-xl font-medium mb-2">Пока пусто</h3>
                  <p className="text-muted-foreground mb-4">Добавьте что-нибудь в эту категорию!</p>
                  <AddMediaDialog />
                </div>
              )}
            </motion.div>
          </motion.div>
        ) : (
          <motion.div key="games" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            {/* Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card className="soft-shadow text-center p-4"><div className="text-3xl font-bold text-primary">{gameStats.planning}</div><div className="text-sm text-muted-foreground">Планирую</div></Card>
              <Card className="soft-shadow text-center p-4"><div className="text-3xl font-bold text-amber-500">{gameStats.playing}</div><div className="text-sm text-muted-foreground">Играю</div></Card>
              <Card className="soft-shadow text-center p-4"><div className="text-3xl font-bold text-green-500">{gameStats.completed}</div><div className="text-sm text-muted-foreground">Прошёл(а)</div></Card>
              <Card className="soft-shadow text-center p-4"><div className="text-3xl font-bold text-muted-foreground">{gameStats.dropped}</div><div className="text-sm text-muted-foreground">Бросил(а)</div></Card>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2">
              {gameTabs.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setGameTab(tab.value)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full font-medium whitespace-nowrap",
                    gameTab === tab.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                  <span className="ml-1 text-xs opacity-70">({gameStats[tab.value]})</span>
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex gap-2 overflow-x-auto flex-1 pb-2">
                {platformOptions.map((o) => (
                  <button
                    key={o.value}
                    onClick={() => setFilterPlatform(o.value)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-sm whitespace-nowrap",
                      filterPlatform === o.value ? "bg-accent text-accent-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {o.label}
                  </button>
                ))}
              </div>

              <Select value={gameSortBy} onValueChange={(v: SortBy) => setGameSortBy(v)}>
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

              <AddGameDialog />
            </div>

            <motion.div
              key={`${gameTab}-${filterPlatform}-${gameSortBy}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5"
            >
              {filteredGames.length > 0 ? (
                filteredGames.map((item, index) => (
                  <GameCard key={item.id} item={item} index={index} />
                ))
              ) : (
                <div className="col-span-full py-16 text-center">
                  <div className="text-6xl mb-4">🎮</div>
                  <h3 className="text-xl font-medium mb-2">Пока пусто</h3>
                  <p className="text-muted-foreground mb-4">Добавьте игру, в которую играете!</p>
                  <AddGameDialog />
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
