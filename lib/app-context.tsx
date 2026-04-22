"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"

// ============================================
// ТИПЫ
// ============================================

export type User = {
  id: string
  name: string
  avatar: string
  bio: string
  favoriteGenres: string[]
}

export type MediaType = "movie" | "series" | "anime" | "anime-movie" | "cartoon"
export type GamePlatform = "pc" | "playstation" | "xbox" | "nintendo" | "mobile"

export type MediaItem = {
  id: string
  title: string
  poster: string
  description?: string
  type: MediaType
  status: "watched" | "planned" | "watching" | "dropped"
  rating?: number
  currentSeason?: number
  currentEpisode?: number
  addedAt: Date
  watchedTogether?: boolean
  userId: string
}

// Убираем rating и reaction из SharedMediaItem
export type SharedMediaItem = {
  id: string
  title: string
  poster: string
  description?: string
  type: MediaType
  status: "will-watch" | "watching" | "watched" | "dropped"
  // rating?: number  ← УДАЛИТЬ
  // reaction?: string ← УДАЛИТЬ
  currentSeason?: number
  currentEpisode?: number
  addedAt: Date
  addedByUserId: string
  note?: string
  // 🔥 Добавляем оценки пользователей
  userRatings?: SharedMediaUserRating[]
}

// Новый тип для индивидуальных оценок
export type SharedMediaUserRating = {
  id: string
  shared_media_id: string
  user_id: string
  user_rating: number | null
  reaction: string | null
  watched_at: string | null
}

// Аналогично для игр
export type SharedGameItem = {
  id: string
  title: string
  cover: string
  description?: string
  platforms: GamePlatform[]
  genres?: string[]
  status: "planning" | "playing" | "completed" | "dropped"
  // rating?: number  ← УДАЛИТЬ
  addedAt: Date
  addedByUserId: string
  note?: string
  userRatings?: SharedGameUserRating[]
}

export type SharedGameUserRating = {
  id: string
  shared_game_id: string
  user_id: string
  user_rating: number | null
  reaction: string | null
  completed_at: string | null
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
  isLoading: boolean
  mediaItems: MediaItem[]
  addMediaItem: (item: Omit<MediaItem, "id" | "addedAt">) => Promise<void>
  updateMediaItem: (id: string, updates: Partial<MediaItem>) => Promise<void>
  deleteMediaItem: (id: string) => Promise<void>
  sharedMediaItems: SharedMediaItem[]
  addSharedMediaItem: (item: SharedMediaItem) => void  // ← убрать Omit и Promise
  updateSharedMediaItem: (id: string, updates: Partial<SharedMediaItem>) => Promise<void>
  updateSharedMediaUserRating: (sharedMediaId: string, userId: string, rating: number | null, reaction: string | null) => Promise<void>
  deleteSharedMediaItem: (id: string) => Promise<void>
  sharedGameItems: SharedGameItem[]
  addSharedGameItem: (item: Omit<SharedGameItem, "id" | "addedAt">) => Promise<void>
  updateSharedGameItem: (id: string, updates: Partial<SharedGameItem>) => Promise<void>
  updateSharedGameUserRating: (sharedGameId: string, userId: string, rating: number | null, reaction: string | null) => Promise<void>
  deleteSharedGameItem: (id: string) => Promise<void>
  wishlistItems: WishlistItem[]
  addWishlistItem: (item: Omit<WishlistItem, "id">) => Promise<void>
  updateWishlistItem: (id: string, updates: Partial<WishlistItem>) => Promise<void>
  deleteWishlistItem: (id: string) => Promise<void>
  updateUser: (id: string, updates: Partial<User>) => Promise<void>
}

// ============================================
// ID ПОЛЬЗОВАТЕЛЕЙ
// ============================================
const USER_IDS = {
  YOU: "11111111-1111-1111-1111-111111111111",
  PARTNER: "22222222-2222-2222-2222-222222222222",
}

// ============================================
// КОНТЕКСТ
// ============================================
const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>([])
  const [activeUserId, setActiveUserId] = useState<string>(USER_IDS.YOU)
  const [isLoading, setIsLoading] = useState(true)

  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [sharedMediaItems, setSharedMediaItems] = useState<SharedMediaItem[]>([])
  const [sharedGameItems, setSharedGameItems] = useState<SharedGameItem[]>([])
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([])

  const supabase = createClient()

  // ============================================
  // ЗАГРУЗКА ДАННЫХ ПРИ СТАРТЕ
  // ============================================
  useEffect(() => {
    loadAllData()
  }, [])

  const loadAllData = async () => {
    setIsLoading(true)
    await Promise.all([
      loadUsers(),
      loadMediaItems(),
      loadSharedMediaItems(),
      loadSharedGameItems(),
      loadWishlistItems(),
    ])
    setIsLoading(false)
  }

  const loadUsers = async () => {
    const { data } = await supabase.from("profiles").select("*")
    if (data && data.length > 0) {
      setUsers(data.map(p => ({
        id: p.id,
        name: p.username,
        avatar: p.avatar_url || "🦊",
        bio: p.bio || "",
        favoriteGenres: p.favorite_genres || [],
      })))
    } else {
      await createDefaultUsers()
    }
  }

  const createDefaultUsers = async () => {
    const defaultUsers = [
      { id: USER_IDS.YOU, username: "Ты", avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Kitty", bio: "Люблю уютные вечера", favorite_genres: ["Аниме", "Романтика"] },
      { id: USER_IDS.PARTNER, username: "Партнёр", avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bear", bio: "Люблю игры и фильмы", favorite_genres: ["Фантастика", "Триллер"] },
    ]
    await supabase.from("profiles").upsert(defaultUsers)
    await loadUsers()
  }

  // ============================================
  // ЗАГРУЗКА МЕДИА
  // ============================================
  const loadMediaItems = async () => {
    const { data } = await supabase
      .from("personal_media")
      .select(`
        id, status, user_rating, current_season, current_episode, added_at, user_id,
        content:content_id (title_ru, title_en, poster_url, description, content_type)
      `)

    if (data) {
      setMediaItems(data.map((item: any) => ({
        id: item.id,
        title: item.content?.title_ru || item.content?.title_en || "Без названия",
        poster: item.content?.poster_url || "",
        description: item.content?.description,
        type: mapContentType(item.content?.content_type),
        status: mapPersonalStatus(item.status),
        rating: item.user_rating,
        currentSeason: item.current_season,
        currentEpisode: item.current_episode,
        addedAt: new Date(item.added_at),
        userId: item.user_id,
      })))
    }
  }

  const loadSharedMediaItems = async () => {
    const { data } = await supabase
      .from("shared_media")
      .select(`
      id, status, current_season, current_episode, added_at, added_by, notes,
      content:content_id (title_ru, title_en, poster_url, description, content_type),
      user_ratings:shared_media_user(*)
    `)

    if (data) {
      setSharedMediaItems(data.map((item: any) => ({
        id: item.id,
        title: item.content?.title_ru || item.content?.title_en || "Без названия",
        poster: item.content?.poster_url || "",
        description: item.content?.description,
        type: mapContentType(item.content?.content_type),
        status: mapSharedStatus(item.status),
        currentSeason: item.current_season,
        currentEpisode: item.current_episode,
        addedAt: new Date(item.added_at),
        addedByUserId: item.added_by,
        note: item.notes,
        userRatings: item.user_ratings || [],
      })))
    }
  }

  const loadSharedGameItems = async () => {
    const { data } = await supabase
      .from("shared_games")
      .select(`
      id, status, added_at, added_by, notes, platforms,
      content:content_id (title_ru, title_en, poster_url, description, genres),
      user_ratings:shared_games_user(*)
    `)

    if (data) {
      setSharedGameItems(data.map((item: any) => ({
        id: item.id,
        title: item.content?.title_ru || item.content?.title_en || "Без названия",
        cover: item.content?.poster_url || "",
        description: item.content?.description,
        platforms: item.platforms || [],
        genres: item.content?.genres || [],
        status: mapGameStatus(item.status),
        addedAt: new Date(item.added_at),
        addedByUserId: item.added_by,
        note: item.notes,
        userRatings: item.user_ratings || [],
      })))
    }
  }

  const loadWishlistItems = async () => {
    const { data } = await supabase.from("wishlist").select("*")
    if (data) {
      setWishlistItems(data.map((item: any) => ({
        id: item.id,
        name: item.title,
        imageUrl: item.image_url || "",
        link: item.link || "",
        price: item.price,
        priority: item.priority || "medium",
        reservedBy: item.reserved_by,
        userId: item.user_id,
        category: item.is_gift_idea ? "date-idea" : "gift",
      })))
    }
  }

  // ============================================
  // ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
  // ============================================
  const mapContentType = (type: string): MediaType => {
    const map: Record<string, MediaType> = {
      "movie": "movie", "series": "series", "anime": "anime",
      "anime-movie": "anime-movie", "cartoon": "cartoon"
    }
    return map[type] || "movie"
  }

  const mapPersonalStatus = (status: string): "watched" | "planned" | "watching" | "dropped" => {
    const map: Record<string, "watched" | "planned" | "watching" | "dropped"> = {
      "watched": "watched", "planned": "planned", "watching": "watching", "dropped": "dropped"
    }
    return map[status] || "planned"
  }

  const mapSharedStatus = (status: string): "will-watch" | "watching" | "watched" | "dropped" => {
    const map: Record<string, "will-watch" | "watching" | "watched" | "dropped"> = {
      "planned": "will-watch", "watching": "watching", "watched": "watched", "dropped": "dropped"
    }
    return map[status] || "will-watch"
  }

  const mapGameStatus = (status: string): "planning" | "playing" | "completed" | "dropped" => {
    const map: Record<string, "planning" | "playing" | "completed" | "dropped"> = {
      "planned": "planning", "playing": "playing", "completed": "completed", "dropped": "dropped"
    }
    return map[status] || "planning"
  }

  // ============================================
  // CRUD ОПЕРАЦИИ
  // ============================================
  const addMediaItem = async (item: Omit<MediaItem, "id" | "addedAt">) => {
    const newItem: MediaItem = { ...item, id: `temp-${Date.now()}`, addedAt: new Date() }
    setMediaItems(prev => [newItem, ...prev])
  }

  const updateMediaItem = async (id: string, updates: Partial<MediaItem>) => {
    const supabase = createClient()
    const { error } = await supabase
      .from("personal_media")
      .update({
        status: updates.status,
        user_rating: updates.rating || null,
        current_season: updates.currentSeason || null,
        current_episode: updates.currentEpisode || null,
        updated_at: new Date(),
      })
      .eq("id", id)
    if (!error) {
      setMediaItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item))
    }
  }

  const deleteMediaItem = async (id: string) => {
    const supabase = createClient()
    const { error } = await supabase.from("personal_media").delete().eq("id", id)
    if (!error) {
      setMediaItems(prev => prev.filter(item => item.id !== id))
    }
  }

 const addSharedMediaItem = (item: SharedMediaItem) => {
  setSharedMediaItems(prev => [item, ...prev])
}

  const updateSharedMediaItem = async (id: string, updates: Partial<SharedMediaItem>) => {
    const supabase = createClient()

    const mapStatusToDb = (status?: string) => {
      if (status === "will-watch") return "planned"
      if (status === "watching") return "watching"
      if (status === "watched") return "watched"
      if (status === "dropped") return "dropped"
      return "planned"
    }

    const { error } = await supabase
      .from("shared_media")
      .update({
        status: mapStatusToDb(updates.status),
        current_season: updates.currentSeason || null,
        current_episode: updates.currentEpisode || null,
        notes: updates.note || null,
        updated_at: new Date(),
      })
      .eq("id", id)

    if (error) throw error

    setSharedMediaItems(prev =>
      prev.map(item => item.id === id ? { ...item, ...updates } : item)
    )
  }

  const updateSharedMediaUserRating = async (
    sharedMediaId: string,
    userId: string,
    rating: number | null,
    reaction: string | null
  ) => {
    const supabase = createClient()

    const { error } = await supabase
      .from("shared_media_user")
      .upsert({
        shared_media_id: sharedMediaId,
        user_id: userId,
        user_rating: rating,
        reaction: reaction,
        updated_at: new Date(),
      }, { onConflict: "shared_media_id, user_id" })

    if (error) throw error

    // Обновляем локальное состояние
    setSharedMediaItems(prev =>
      prev.map(item => {
        if (item.id !== sharedMediaId) return item

        const existingRatings = item.userRatings || []
        const otherRatings = existingRatings.filter(r => r.user_id !== userId)

        return {
          ...item,
          userRatings: [
            ...otherRatings,
            { shared_media_id: sharedMediaId, user_id: userId, user_rating: rating, reaction }
          ]
        }
      })
    )
  }

  const deleteSharedMediaItem = async (id: string) => {
    const supabase = createClient()
    const { error } = await supabase.from("shared_media").delete().eq("id", id)
    if (!error) {
      setSharedMediaItems(prev => prev.filter(item => item.id !== id))
    }
  }

  const addSharedGameItem = async (item: Omit<SharedGameItem, "id" | "addedAt">) => {
    const newItem: SharedGameItem = { ...item, id: `temp-${Date.now()}`, addedAt: new Date() }
    setSharedGameItems(prev => [newItem, ...prev])
  }

  const updateSharedGameItem = async (id: string, updates: Partial<SharedGameItem>) => {
    const supabase = createClient()

    const mapGameStatusToDb = (status?: string) => {
      if (status === "planning") return "planned"
      if (status === "playing") return "playing"
      if (status === "completed") return "completed"
      if (status === "dropped") return "dropped"
      return "planned"
    }

    const { error } = await supabase
      .from("shared_games")
      .update({
        status: mapGameStatusToDb(updates.status),
        platforms: updates.platforms || null,
        notes: updates.note || null,
        updated_at: new Date(),
      })
      .eq("id", id)

    if (error) {
      console.error("Update shared game error:", error)
      throw error
    }

    setSharedGameItems(prev =>
      prev.map(item => item.id === id ? { ...item, ...updates } : item)
    )
  }

  const updateSharedGameUserRating = async (
    sharedGameId: string,
    userId: string,
    rating: number | null,
    reaction: string | null
  ) => {
    const supabase = createClient()

    const { error } = await supabase
      .from("shared_games_user")
      .upsert({
        shared_game_id: sharedGameId,
        user_id: userId,
        user_rating: rating,
        reaction: reaction,
        updated_at: new Date(),
      }, { onConflict: "shared_game_id, user_id" })

    if (error) {
      console.error("Update game user rating error:", error)
      throw error
    }

    // Обновляем локальное состояние
    setSharedGameItems(prev =>
      prev.map(item => {
        if (item.id !== sharedGameId) return item

        const existingRatings = item.userRatings || []
        const otherRatings = existingRatings.filter(r => r.user_id !== userId)

        return {
          ...item,
          userRatings: [
            ...otherRatings,
            { shared_game_id: sharedGameId, user_id: userId, user_rating: rating, reaction }
          ]
        }
      })
    )
  }

  const deleteSharedGameItem = async (id: string) => {
    const supabase = createClient()
    const { error } = await supabase.from("shared_games").delete().eq("id", id)
    if (!error) {
      setSharedGameItems(prev => prev.filter(item => item.id !== id))
    }
  }

  const addWishlistItem = async (item: Omit<WishlistItem, "id">) => {
    const supabase = createClient()
    const { data } = await supabase.from("wishlist").insert({
      user_id: item.userId,
      title: item.name,
      image_url: item.imageUrl,
      link: item.link,
      price: item.price,
      priority: item.priority,
      is_gift_idea: item.category === "date-idea",
    }).select().single()

    if (data) {
      setWishlistItems(prev => [{
        id: data.id, name: data.title, imageUrl: data.image_url,
        link: data.link, price: data.price, priority: data.priority,
        reservedBy: data.reserved_by, userId: data.user_id,
        category: data.is_gift_idea ? "date-idea" : "gift",
      }, ...prev])
    }
  }

  const updateWishlistItem = async (id: string, updates: Partial<WishlistItem>) => {
    const supabase = createClient()
    await supabase.from("wishlist").update({
      title: updates.name,
      image_url: updates.imageUrl,
      link: updates.link,
      price: updates.price,
      priority: updates.priority,
      reserved_by: updates.reservedBy,
    }).eq("id", id)

    setWishlistItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item))
  }

  const deleteWishlistItem = async (id: string) => {
    const supabase = createClient()
    await supabase.from("wishlist").delete().eq("id", id)
    setWishlistItems(prev => prev.filter(item => item.id !== id))
  }

  const updateUser = async (id: string, updates: Partial<User>) => {
    const supabase = createClient()
    await supabase.from("profiles").update({
      username: updates.name,
      avatar_url: updates.avatar,
      bio: updates.bio,
      favorite_genres: updates.favoriteGenres,
    }).eq("id", id)

    setUsers(prev => prev.map(user => user.id === id ? { ...user, ...updates } : user))
  }

  // ============================================
  // ВЫЧИСЛЯЕМЫЕ ЗНАЧЕНИЯ
  // ============================================
  const activeUser = users.find(u => u.id === activeUserId) || {
    id: USER_IDS.YOU, name: "Ты", avatar: "🦊", bio: "", favoriteGenres: []
  }

  const partnerUser = users.find(u => u.id !== activeUserId) || {
    id: USER_IDS.PARTNER, name: "Партнёр", avatar: "🐻", bio: "", favoriteGenres: []
  }

  // ============================================
  // ПРОВАЙДЕР
  // ============================================
  return (
    <AppContext.Provider
      value={{
        users, activeUserId, setActiveUserId, activeUser, partnerUser, isLoading,
        mediaItems, addMediaItem, updateMediaItem, deleteMediaItem,
        sharedMediaItems, addSharedMediaItem, updateSharedMediaItem, deleteSharedMediaItem,
        sharedGameItems, addSharedGameItem, updateSharedGameItem, deleteSharedGameItem,
        wishlistItems, addWishlistItem, updateWishlistItem, deleteWishlistItem,
        updateUser, updateSharedMediaUserRating,
        updateSharedGameUserRating,
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