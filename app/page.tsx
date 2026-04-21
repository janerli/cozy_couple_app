"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, Play, Heart, Clock, Film, Plus, Star, ListVideo, Gamepad2, Trophy } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useApp, SharedMediaItem, SharedGameItem } from "@/lib/app-context"
import Link from "next/link"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return "Доброе утро"
  if (hour < 18) return "Добрый день"
  return "Добрый вечер"
}

function getActivity(): string {
  const activities = [
    "посмотреть что-то уютное",
    "открыть новый сериал",
    "пересмотреть любимое",
    "найти новое аниме",
    "устроить киномарафон",
    "поиграть вместе",
  ]
  return activities[Math.floor(Math.random() * activities.length)]
}

const typeLabels: Record<SharedMediaItem["type"], string> = {
  movie: "Фильм",
  series: "Сериал",
  anime: "Аниме",
  "anime-movie": "Аниме-фильм",
  cartoon: "Мультсериал",
}

const platformLabels: Record<string, string> = {
  pc: "PC",
  playstation: "PlayStation",
  xbox: "Xbox",
  nintendo: "Nintendo",
  mobile: "Mobile",
}

export default function HomePage() {
  const { activeUser, partnerUser, users, sharedMediaItems, sharedGameItems, mediaItems } = useApp()
  const [randomMediaPick, setRandomMediaPick] = useState<SharedMediaItem | null>(null)
  const [showMediaPick, setShowMediaPick] = useState(false)
  const [randomGamePick, setRandomGamePick] = useState<SharedGameItem | null>(null)
  const [showGamePick, setShowGamePick] = useState(false)

  // Get shared items that are planned (will-watch)
  const sharedPlannedMedia = useMemo(() => {
    return sharedMediaItems.filter((m) => m.status === "will-watch")
  }, [sharedMediaItems])

  // Get shared games that are planned
  const sharedPlannedGames = useMemo(() => {
    return sharedGameItems.filter((g) => g.status === "planning")
  }, [sharedGameItems])

  // Currently watching from shared list
  const currentlyWatchingShared = useMemo(() => {
    return sharedMediaItems.filter((m) => m.status === "watching").slice(0, 4)
  }, [sharedMediaItems])

  // Currently playing from shared list
  const currentlyPlayingShared = useMemo(() => {
    return sharedGameItems.filter((g) => g.status === "playing").slice(0, 4)
  }, [sharedGameItems])

  // Recent activity from shared list (both media and games)
  const recentSharedActivity = useMemo(() => {
    const mediaActivity = sharedMediaItems.map(m => ({ ...m, itemType: "media" as const }))
    const gameActivity = sharedGameItems.map(g => ({ ...g, itemType: "game" as const }))
    return [...mediaActivity, ...gameActivity]
      .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
      .slice(0, 6)
  }, [sharedMediaItems, sharedGameItems])

  // Partner's personal activity
  const partnerActivity = useMemo(() => {
    return mediaItems
      .filter((m) => m.userId === partnerUser.id)
      .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
      .slice(0, 5)
  }, [mediaItems, partnerUser.id])

  const pickRandomMedia = () => {
    if (sharedPlannedMedia.length > 0) {
      const random = sharedPlannedMedia[Math.floor(Math.random() * sharedPlannedMedia.length)]
      setRandomMediaPick(random)
      setShowMediaPick(true)
    }
  }

  const pickRandomGame = () => {
    if (sharedPlannedGames.length > 0) {
      const random = sharedPlannedGames[Math.floor(Math.random() * sharedPlannedGames.length)]
      setRandomGamePick(random)
      setShowGamePick(true)
    }
  }

  const getUserById = (id: string) => users.find((u) => u.id === id)

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 pb-8"
    >
      {/* Greeting Section */}
      <motion.section variants={itemVariants} className="text-center py-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
          className="inline-block mb-4"
        >
          <span className="text-6xl">{activeUser.avatar}</span>
        </motion.div>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
          {getGreeting()}, {activeUser.name}!
        </h1>
        <p className="text-muted-foreground text-lg">
          Сегодня такой уютный день для...{" "}
          <span className="text-primary font-medium">{getActivity()}</span>
        </p>
      </motion.section>

      {/* Random Pickers Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* What to Watch Together */}
        <motion.section variants={itemVariants}>
          <Card className="soft-shadow dark:neon-glow border-2 border-primary/20 overflow-hidden h-full">
            <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Heart className="w-5 h-5 text-primary" />
                Что посмотрим?
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <AnimatePresence mode="wait">
                {showMediaPick && randomMediaPick ? (
                  <motion.div
                    key="pick"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex flex-col items-center gap-4"
                  >
                    <div className="relative group">
                      <img
                        src={randomMediaPick.poster}
                        alt={randomMediaPick.title}
                        className="w-28 h-40 object-cover rounded-2xl shadow-lg"
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">Предлагаем посмотреть:</p>
                      <h3 className="text-lg font-bold text-foreground mb-2">{randomMediaPick.title}</h3>
                      <div className="flex flex-wrap gap-2 justify-center mb-3">
                        <span className="px-2 py-0.5 bg-primary/20 text-primary rounded-full text-xs">
                          {typeLabels[randomMediaPick.type]}
                        </span>
                      </div>
                      <Button
                        onClick={() => setShowMediaPick(false)}
                        variant="outline"
                        size="sm"
                        className="rounded-full"
                      >
                        Выбрать другое
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="button"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center"
                  >
                    {sharedPlannedMedia.length > 0 ? (
                      <>
                        <p className="text-muted-foreground text-sm mb-4">
                          {sharedPlannedMedia.length} в списке
                        </p>
                        <Button
                          onClick={pickRandomMedia}
                          size="lg"
                          className="rounded-full gap-2"
                        >
                          <Sparkles className="w-5 h-5" />
                          Случайный выбор
                        </Button>
                      </>
                    ) : (
                      <div className="py-4">
                        <p className="text-muted-foreground text-sm mb-4">
                          Список пуст
                        </p>
                        <Link href="/shared">
                          <Button variant="outline" size="sm" className="rounded-full gap-2">
                            <Plus className="w-4 h-4" />
                            Добавить
                          </Button>
                        </Link>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.section>

        {/* What to Play Together */}
        <motion.section variants={itemVariants}>
          <Card className="soft-shadow dark:neon-glow border-2 border-accent/20 overflow-hidden h-full">
            <CardHeader className="bg-gradient-to-r from-accent/10 to-primary/10">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Gamepad2 className="w-5 h-5 text-accent" />
                Во что поиграем?
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <AnimatePresence mode="wait">
                {showGamePick && randomGamePick ? (
                  <motion.div
                    key="pick"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex flex-col items-center gap-4"
                  >
                    <div className="relative group">
                      <img
                        src={randomGamePick.cover}
                        alt={randomGamePick.title}
                        className="w-28 h-36 object-cover rounded-2xl shadow-lg"
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">Предлагаем поиграть:</p>
                      <h3 className="text-lg font-bold text-foreground mb-2">{randomGamePick.title}</h3>
                      <div className="flex flex-wrap gap-1 justify-center mb-3">
                        {randomGamePick.platforms.slice(0, 2).map((p) => (
                          <span key={p} className="px-2 py-0.5 bg-accent/20 text-accent-foreground rounded-full text-xs">
                            {platformLabels[p]}
                          </span>
                        ))}
                      </div>
                      <Button
                        onClick={() => setShowGamePick(false)}
                        variant="outline"
                        size="sm"
                        className="rounded-full"
                      >
                        Выбрать другое
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="button"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center"
                  >
                    {sharedPlannedGames.length > 0 ? (
                      <>
                        <p className="text-muted-foreground text-sm mb-4">
                          {sharedPlannedGames.length} в списке
                        </p>
                        <Button
                          onClick={pickRandomGame}
                          size="lg"
                          variant="secondary"
                          className="rounded-full gap-2"
                        >
                          <Sparkles className="w-5 h-5" />
                          Случайный выбор
                        </Button>
                      </>
                    ) : (
                      <div className="py-4">
                        <p className="text-muted-foreground text-sm mb-4">
                          Список пуст
                        </p>
                        <Link href="/games">
                          <Button variant="outline" size="sm" className="rounded-full gap-2">
                            <Plus className="w-4 h-4" />
                            Добавить
                          </Button>
                        </Link>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.section>
      </div>

      {/* Currently Watching/Playing Together */}
      {(currentlyWatchingShared.length > 0 || currentlyPlayingShared.length > 0) && (
        <motion.section variants={itemVariants}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Play className="w-5 h-5 text-primary" />
              Сейчас смотрим/играем
            </h2>
            <Link href="/shared" className="text-sm text-primary hover:underline">
              Все
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {currentlyWatchingShared.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="overflow-hidden soft-shadow hover:scale-105 transition-transform cursor-pointer group">
                  <div className="relative aspect-[2/3]">
                    <img
                      src={item.poster}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-white text-sm font-medium truncate">{item.title}</p>
                      {item.currentSeason && item.currentEpisode && (
                        <p className="text-white/70 text-xs">{item.currentSeason} сезон, {item.currentEpisode} серия</p>
                      )}
                      {item.type === "anime" && item.currentEpisode && !item.currentSeason && (
                        <p className="text-white/70 text-xs">{item.currentEpisode} серия</p>
                      )}
                    </div>
                    <div className="absolute top-2 right-2">
                      <span className="w-7 h-7 bg-primary rounded-full flex items-center justify-center">
                        <Heart className="w-4 h-4 text-primary-foreground fill-current" />
                      </span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
            {currentlyPlayingShared.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (currentlyWatchingShared.length + index) * 0.1 }}
              >
                <Card className="overflow-hidden soft-shadow hover:scale-105 transition-transform cursor-pointer group">
                  <div className="relative aspect-[2/3]">
                    <img
                      src={item.cover}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-white text-sm font-medium truncate">{item.title}</p>
                      <p className="text-white/70 text-xs">{item.platforms[0] && platformLabels[item.platforms[0]]}</p>
                    </div>
                    <div className="absolute top-2 right-2">
                      <span className="w-7 h-7 bg-accent rounded-full flex items-center justify-center">
                        <Gamepad2 className="w-4 h-4 text-accent-foreground" />
                      </span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Recent Shared Activity */}
      <motion.section variants={itemVariants}>
        <div className="flex items-center gap-3 mb-4">
          <ListVideo className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold">Недавно в общем списке</h2>
        </div>
        <Card className="soft-shadow">
          <CardContent className="p-4">
            {recentSharedActivity.length > 0 ? (
              <div className="space-y-3">
                {recentSharedActivity.map((item, index) => {
                  const addedBy = getUserById(item.addedByUserId)
                  const isGame = item.itemType === "game"
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-4 p-2 rounded-xl hover:bg-muted/50 transition-colors"
                    >
                      <img
                        src={isGame ? (item as SharedGameItem).cover : (item as SharedMediaItem).poster}
                        alt={item.title}
                        className="w-12 h-16 object-cover rounded-lg"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.title}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            {isGame ? (
                              <>
                                <Gamepad2 className="w-3 h-3" />
                                {(item as SharedGameItem).status === "completed" && "Прошли"}
                                {(item as SharedGameItem).status === "planning" && "Планируем"}
                                {(item as SharedGameItem).status === "playing" && "Играем"}
                                {(item as SharedGameItem).status === "dropped" && "Бросили"}
                              </>
                            ) : (
                              <>
                                {(item as SharedMediaItem).status === "watched" && (
                                  <>
                                    <Film className="w-3 h-3" /> Посмотрели
                                  </>
                                )}
                                {(item as SharedMediaItem).status === "will-watch" && (
                                  <>
                                    <Clock className="w-3 h-3" /> Будем смотреть
                                  </>
                                )}
                                {(item as SharedMediaItem).status === "watching" && (
                                  <>
                                    <Play className="w-3 h-3" /> Смотрим
                                  </>
                                )}
                                {(item as SharedMediaItem).status === "dropped" && "Бросили"}
                              </>
                            )}
                          </span>
                          <span className="text-xs">
                            {addedBy?.avatar} {addedBy?.name}
                          </span>
                        </div>
                      </div>
                      {item.rating && (
                        <div className="flex items-center gap-0.5">
                          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                          <span className="text-sm font-medium">{item.rating}</span>
                        </div>
                      )}
                      {!isGame && (item as SharedMediaItem).reaction && (
                        <span className="text-lg">{(item as SharedMediaItem).reaction}</span>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Пока ничего не добавлено
              </p>
            )}
          </CardContent>
        </Card>
      </motion.section>

      {/* Partner Activity */}
      <motion.section variants={itemVariants}>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">{partnerUser.avatar}</span>
          <h2 className="text-xl font-bold">Личная активность {partnerUser.name}</h2>
        </div>
        <Card className="soft-shadow">
          <CardContent className="p-4">
            {partnerActivity.length > 0 ? (
              <div className="space-y-3">
                {partnerActivity.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-4 p-2 rounded-xl hover:bg-muted/50 transition-colors"
                  >
                    <img
                      src={item.poster}
                      alt={item.title}
                      className="w-12 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.title}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          {item.status === "watched" && (
                            <>
                              <Film className="w-3 h-3" /> Просмотрено
                            </>
                          )}
                          {item.status === "planned" && (
                            <>
                              <Clock className="w-3 h-3" /> Запланировано
                            </>
                          )}
                          {item.status === "watching" && (
                            <>
                              <Play className="w-3 h-3" /> Смотрит
                            </>
                          )}
                          {item.status === "dropped" && "Брошено"}
                        </span>
                        {item.watchedTogether && (
                          <span className="text-primary">
                            <Heart className="w-3 h-3 inline" /> Вместе
                          </span>
                        )}
                      </div>
                    </div>
                    {item.rating && (
                      <div className="flex items-center gap-0.5">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        <span className="text-sm font-medium">{item.rating}</span>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                {partnerUser.name} пока ничего не добавил(а)
              </p>
            )}
          </CardContent>
        </Card>
      </motion.section>
    </motion.div>
  )
}
