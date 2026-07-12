import type { MediaType, GamePlatform } from "@/lib/app-context"

export const MEDIA_TYPE_LABELS: Record<MediaType, string> = {
  movie: "Фильм",
  series: "Сериал",
  anime: "Аниме",
  "anime-movie": "Аниме-фильм",
  cartoon: "Мультсериал",
}

export const PLATFORM_LABELS: Record<GamePlatform, string> = {
  pc: "PC",
  playstation: "PlayStation",
  xbox: "Xbox",
  nintendo: "Nintendo",
  mobile: "Mobile",
}

export const PERSONAL_MEDIA_STATUS_LABELS = {
  watched: "Просмотрено",
  planned: "Запланировано",
  watching: "Смотрю",
  dropped: "Брошено",
} as const

export const PERSONAL_MEDIA_STATUS_COLORS = {
  watched: "bg-green-500/90 text-white",
  planned: "bg-blue-500/90 text-white",
  watching: "bg-amber-500/90 text-white",
  dropped: "bg-red-500/90 text-white",
} as const

export const SHARED_MEDIA_STATUS_LABELS = {
  "will-watch": "Будем смотреть",
  watching: "Смотрим",
  watched: "Посмотрели",
  dropped: "Бросили",
} as const

export const SHARED_MEDIA_STATUS_COLORS = {
  "will-watch": "bg-blue-500/90 text-white",
  watching: "bg-amber-500/90 text-white",
  watched: "bg-green-500/90 text-white",
  dropped: "bg-red-500/90 text-white",
} as const

export const GAME_STATUS_LABELS = {
  planning: "Планируем",
  playing: "Играем",
  completed: "Прошли",
  dropped: "Бросили",
} as const

export const GAME_STATUS_COLORS = {
  planning: "bg-blue-500/90 text-white",
  playing: "bg-amber-500/90 text-white",
  completed: "bg-green-500/90 text-white",
  dropped: "bg-red-500/90 text-white",
} as const

export function hasEpisodes(type: MediaType): boolean {
  return type === "series" || type === "anime" || type === "cartoon"
}

type GameStatus = "planning" | "playing" | "completed" | "dropped"

export function gameStatusToDb(status?: GameStatus): string {
  if (status === "planning") return "planned"
  if (status === "playing") return "playing"
  if (status === "completed") return "completed"
  if (status === "dropped") return "dropped"
  return "planned"
}

export function gameStatusFromDb(status: string): GameStatus {
  const map: Record<string, GameStatus> = {
    planned: "planning", playing: "playing", completed: "completed", dropped: "dropped",
  }
  return map[status] || "planning"
}
