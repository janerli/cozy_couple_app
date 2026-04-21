"use client"

import { createContext, useContext, useState, ReactNode } from "react"

export type User = {
  id: string
  name: string
  avatar: string
  bio: string
  favoriteGenres: string[]
}

export type MediaType = "movie" | "series" | "anime" | "anime-movie" | "cartoon"
export type GamePlatform = "pc" | "playstation" | "xbox" | "nintendo" | "mobile"

// Personal media item (each user has their own)
export type MediaItem = {
  id: string
  title: string
  poster: string
  description?: string
  type: MediaType
  status: "watched" | "planned" | "watching" | "dropped"
  rating?: number // 1-10
  currentSeason?: number
  currentEpisode?: number
  addedAt: Date
  watchedTogether?: boolean
  userId: string
}

// Shared media item (unified list for both users)
export type SharedMediaItem = {
  id: string
  title: string
  poster: string
  description?: string
  type: MediaType
  status: "will-watch" | "watching" | "watched" | "dropped"
  rating?: number // 1-10
  currentSeason?: number
  currentEpisode?: number
  addedAt: Date
  addedByUserId: string
  note?: string
  reaction?: string
}

// Shared game item (only shared list, no personal tracking)
export type SharedGameItem = {
  id: string
  title: string
  cover: string
  description?: string
  platforms: GamePlatform[]
  genres?: string[]
  status: "planning" | "playing" | "completed" | "dropped"
  rating?: number // 1-10
  addedAt: Date
  addedByUserId: string
  note?: string
}

export type WishlistItem = {
  id: string
  name: string
  imageUrl: string
  link: string
  price?: number
  priority: "high" | "medium" | "low"
  reservedBy?: string
  userId: string
  category: "gift" | "date-idea" | "place"
}

type AppContextType = {
  users: User[]
  activeUserId: string
  setActiveUserId: (id: string) => void
  activeUser: User
  partnerUser: User
  mediaItems: MediaItem[]
  addMediaItem: (item: Omit<MediaItem, "id" | "addedAt">) => void
  updateMediaItem: (id: string, updates: Partial<MediaItem>) => void
  deleteMediaItem: (id: string) => void
  sharedMediaItems: SharedMediaItem[]
  addSharedMediaItem: (item: Omit<SharedMediaItem, "id" | "addedAt">) => void
  updateSharedMediaItem: (id: string, updates: Partial<SharedMediaItem>) => void
  deleteSharedMediaItem: (id: string) => void
  sharedGameItems: SharedGameItem[]
  addSharedGameItem: (item: Omit<SharedGameItem, "id" | "addedAt">) => void
  updateSharedGameItem: (id: string, updates: Partial<SharedGameItem>) => void
  deleteSharedGameItem: (id: string) => void
  wishlistItems: WishlistItem[]
  addWishlistItem: (item: Omit<WishlistItem, "id">) => void
  updateWishlistItem: (id: string, updates: Partial<WishlistItem>) => void
  deleteWishlistItem: (id: string) => void
  updateUser: (id: string, updates: Partial<User>) => void
}

const defaultUsers: User[] = [
  {
    id: "user1",
    name: "Женечка",
    avatar: "🦊",
    bio: "мяу",
    favoriteGenres: ["Романтика", "Аниме", "Комедия"],
  },
  {
    id: "user2",
    name: "Димочка",
    avatar: "🐻",
    bio: "просто був",
    favoriteGenres: ["Триллер", "Документальное"],
  },
]

const defaultMediaItems: MediaItem[] = [
  {
    id: "m1",
    title: "Твоё имя",
    poster: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=300&h=450&fit=crop",
    description: "Прекрасная история о связи двух душ через время и пространство",
    type: "anime-movie",
    status: "watched",
    rating: 10,
    addedAt: new Date("2024-01-15"),
    watchedTogether: true,
    userId: "user1",
  },
  {
    id: "m2",
    title: "Атака титанов",
    poster: "https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=300&h=450&fit=crop",
    description: "Эпическое аниме о борьбе человечества за выживание",
    type: "anime",
    status: "watching",
    currentSeason: 4,
    currentEpisode: 12,
    addedAt: new Date("2024-02-01"),
    userId: "user1",
  },
  {
    id: "m3",
    title: "Игра престолов",
    poster: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=300&h=450&fit=crop",
    description: "Культовый сериал о борьбе за железный трон",
    type: "series",
    status: "dropped",
    currentSeason: 5,
    currentEpisode: 3,
    addedAt: new Date("2024-02-10"),
    userId: "user1",
  },
  {
    id: "m4",
    title: "Интерстеллар",
    poster: "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=300&h=450&fit=crop",
    description: "Путешествие сквозь космос ради спасения человечества",
    type: "movie",
    status: "watched",
    rating: 9,
    addedAt: new Date("2024-01-20"),
    watchedTogether: true,
    userId: "user2",
  },
  {
    id: "m5",
    title: "Ванпанчмен",
    poster: "https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?w=300&h=450&fit=crop",
    description: "Комедийное аниме о супергерое, который побеждает всех одним ударом",
    type: "anime",
    status: "planned",
    addedAt: new Date("2024-02-08"),
    userId: "user2",
  },
  {
    id: "m6",
    title: "Очень странные дела",
    poster: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=300&h=450&fit=crop",
    description: "Мистический сериал о паранормальных событиях в маленьком городке",
    type: "series",
    status: "watching",
    currentSeason: 3,
    currentEpisode: 5,
    addedAt: new Date("2024-02-05"),
    userId: "user2",
  },
]

const defaultSharedMediaItems: SharedMediaItem[] = [
  {
    id: "sm1",
    title: "Дюна",
    poster: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=300&h=450&fit=crop",
    description: "Эпическая космическая сага по роману Фрэнка Герберта",
    type: "movie",
    status: "will-watch",
    addedAt: new Date("2024-02-15"),
    addedByUserId: "user1",
  },
  {
    id: "sm2",
    title: "Властелин колец",
    poster: "https://images.unsplash.com/photo-1506466010722-395aa2bef877?w=300&h=450&fit=crop",
    description: "Легендарная трилогия о приключениях в Средиземье",
    type: "movie",
    status: "watching",
    addedAt: new Date("2024-02-10"),
    addedByUserId: "user2",
  },
  {
    id: "sm3",
    title: "Унесённые призраками",
    poster: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300&h=450&fit=crop",
    description: "Волшебная история от студии Ghibli",
    type: "anime-movie",
    status: "watched",
    rating: 10,
    addedAt: new Date("2024-01-05"),
    addedByUserId: "user1",
    note: "Невероятно красивый фильм!",
    reaction: "💕",
  },
  {
    id: "sm4",
    title: "Тетрадь смерти",
    poster: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=300&h=450&fit=crop",
    description: "Психологический триллер о студенте, нашедшем сверхъестественную тетрадь",
    type: "anime",
    status: "will-watch",
    addedAt: new Date("2024-02-20"),
    addedByUserId: "user2",
  },
  {
    id: "sm5",
    title: "Рик и Морти",
    poster: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=300&h=450&fit=crop",
    description: "Безумные приключения учёного и его внука",
    type: "cartoon",
    status: "watching",
    currentSeason: 2,
    currentEpisode: 4,
    addedAt: new Date("2024-02-12"),
    addedByUserId: "user1",
  },
]

const defaultSharedGameItems: SharedGameItem[] = [
  {
    id: "g1",
    title: "It Takes Two",
    cover: "https://images.unsplash.com/photo-1493711662062-fa541f7f2f19?w=300&h=400&fit=crop",
    description: "Кооперативное приключение для двоих о паре на грани развода",
    platforms: ["pc", "playstation", "xbox"],
    genres: ["Приключение", "Кооператив"],
    status: "planning",
    addedAt: new Date("2024-02-18"),
    addedByUserId: "user1",
  },
  {
    id: "g2",
    title: "Stardew Valley",
    cover: "https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=300&h=400&fit=crop",
    description: "Уютный фермерский симулятор с кооперативом",
    platforms: ["pc", "nintendo", "playstation", "xbox"],
    genres: ["Симулятор", "RPG"],
    status: "playing",
    addedAt: new Date("2024-02-01"),
    addedByUserId: "user2",
  },
  {
    id: "g3",
    title: "Portal 2",
    cover: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=300&h=400&fit=crop",
    description: "Головоломка с порталами и отличным кооперативом",
    platforms: ["pc", "playstation", "xbox"],
    genres: ["Головоломка", "Кооператив"],
    status: "completed",
    rating: 10,
    addedAt: new Date("2024-01-10"),
    addedByUserId: "user1",
    note: "Лучший кооператив!",
  },
  {
    id: "g4",
    title: "Overcooked 2",
    cover: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=300&h=400&fit=crop",
    description: "Хаотичный кулинарный симулятор для двоих",
    platforms: ["pc", "nintendo", "playstation", "xbox"],
    genres: ["Симулятор", "Кооператив"],
    status: "planning",
    addedAt: new Date("2024-02-20"),
    addedByUserId: "user2",
  },
  {
    id: "g5",
    title: "A Way Out",
    cover: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=300&h=400&fit=crop",
    description: "Кооперативный экшен о побеге из тюрьмы",
    platforms: ["pc", "playstation", "xbox"],
    genres: ["Экшен", "Приключение"],
    status: "playing",
    addedAt: new Date("2024-02-15"),
    addedByUserId: "user1",
  },
]

const defaultWishlistItems: WishlistItem[] = [
  {
    id: "w1",
    name: "Уютный плед с рукавами",
    imageUrl: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=300&h=300&fit=crop",
    link: "https://example.com/blanket",
    price: 2500,
    priority: "high",
    userId: "user1",
    category: "gift",
  },
  {
    id: "w2",
    name: "Поход в планетарий",
    imageUrl: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=300&h=300&fit=crop",
    link: "https://example.com/planetarium",
    priority: "medium",
    userId: "user1",
    category: "date-idea",
  },
  {
    id: "w3",
    name: "Механическая клавиатура",
    imageUrl: "https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=300&h=300&fit=crop",
    link: "https://example.com/keyboard",
    price: 8000,
    priority: "high",
    userId: "user2",
    category: "gift",
  },
]

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>(defaultUsers)
  const [activeUserId, setActiveUserId] = useState<string>("user1")
  const [mediaItems, setMediaItems] = useState<MediaItem[]>(defaultMediaItems)
  const [sharedMediaItems, setSharedMediaItems] = useState<SharedMediaItem[]>(defaultSharedMediaItems)
  const [sharedGameItems, setSharedGameItems] = useState<SharedGameItem[]>(defaultSharedGameItems)
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>(defaultWishlistItems)

  const activeUser = users.find((u) => u.id === activeUserId) || users[0]
  const partnerUser = users.find((u) => u.id !== activeUserId) || users[1]

  const addMediaItem = (item: Omit<MediaItem, "id" | "addedAt">) => {
    const newItem: MediaItem = {
      ...item,
      id: `m${Date.now()}`,
      addedAt: new Date(),
    }
    setMediaItems((prev) => [newItem, ...prev])
  }

  const updateMediaItem = (id: string, updates: Partial<MediaItem>) => {
    setMediaItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    )
  }

  const deleteMediaItem = (id: string) => {
    setMediaItems((prev) => prev.filter((item) => item.id !== id))
  }

  const addSharedMediaItem = (item: Omit<SharedMediaItem, "id" | "addedAt">) => {
    const newItem: SharedMediaItem = {
      ...item,
      id: `sm${Date.now()}`,
      addedAt: new Date(),
    }
    setSharedMediaItems((prev) => [newItem, ...prev])
  }

  const updateSharedMediaItem = (id: string, updates: Partial<SharedMediaItem>) => {
    setSharedMediaItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    )
  }

  const deleteSharedMediaItem = (id: string) => {
    setSharedMediaItems((prev) => prev.filter((item) => item.id !== id))
  }

  const addSharedGameItem = (item: Omit<SharedGameItem, "id" | "addedAt">) => {
    const newItem: SharedGameItem = {
      ...item,
      id: `g${Date.now()}`,
      addedAt: new Date(),
    }
    setSharedGameItems((prev) => [newItem, ...prev])
  }

  const updateSharedGameItem = (id: string, updates: Partial<SharedGameItem>) => {
    setSharedGameItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    )
  }

  const deleteSharedGameItem = (id: string) => {
    setSharedGameItems((prev) => prev.filter((item) => item.id !== id))
  }

  const addWishlistItem = (item: Omit<WishlistItem, "id">) => {
    const newItem: WishlistItem = {
      ...item,
      id: `w${Date.now()}`,
    }
    setWishlistItems((prev) => [newItem, ...prev])
  }

  const updateWishlistItem = (id: string, updates: Partial<WishlistItem>) => {
    setWishlistItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    )
  }

  const deleteWishlistItem = (id: string) => {
    setWishlistItems((prev) => prev.filter((item) => item.id !== id))
  }

  const updateUser = (id: string, updates: Partial<User>) => {
    setUsers((prev) =>
      prev.map((user) => (user.id === id ? { ...user, ...updates } : user))
    )
  }

  return (
    <AppContext.Provider
      value={{
        users,
        activeUserId,
        setActiveUserId,
        activeUser,
        partnerUser,
        mediaItems,
        addMediaItem,
        updateMediaItem,
        deleteMediaItem,
        sharedMediaItems,
        addSharedMediaItem,
        updateSharedMediaItem,
        deleteSharedMediaItem,
        sharedGameItems,
        addSharedGameItem,
        updateSharedGameItem,
        deleteSharedGameItem,
        wishlistItems,
        addWishlistItem,
        updateWishlistItem,
        deleteWishlistItem,
        updateUser,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider")
  }
  return context
}
