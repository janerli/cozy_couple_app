"use client"

import { useState } from "react"
import { Search, Loader2, Gamepad2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import type { GamePlatform } from "@/lib/app-context"

interface RAWGGame {
  id: number
  name: string
  background_image: string
  description_raw?: string
  released?: string
  platforms?: { platform: { name: string } }[]
  genres?: { name: string }[]
}

export type GamePickResult = {
  title: string
  cover: string
  description: string
  platforms: GamePlatform[]
  genres: string
  externalId: string
}

function mapPlatforms(game: RAWGGame): GamePlatform[] {
  const mapped: GamePlatform[] = []
  game.platforms?.forEach((p) => {
    const n = p.platform.name.toLowerCase()
    if (n.includes("pc")) mapped.push("pc")
    else if (n.includes("playstation")) mapped.push("playstation")
    else if (n.includes("xbox")) mapped.push("xbox")
    else if (n.includes("nintendo")) mapped.push("nintendo")
    else if (n.includes("ios") || n.includes("android")) mapped.push("mobile")
  })
  return [...new Set(mapped)]
}

interface GameSearchPickerProps {
  onSelect: (result: GamePickResult) => void
}

export function GameSearchPicker({ onSelect }: GameSearchPickerProps) {
  const [searchInput, setSearchInput] = useState("")
  const [searchResults, setSearchResults] = useState<RAWGGame[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [selectedTitle, setSelectedTitle] = useState("")

  const handleSearch = async () => {
    if (searchInput.length < 2) return
    setIsSearching(true)
    setShowResults(true)
    try {
      const res = await fetch(`/api/search-game?query=${encodeURIComponent(searchInput)}`)
      const data = await res.json()
      setSearchResults(data.results || [])
    } catch {
      setSearchResults([])
      toast.error("Не удалось выполнить поиск. Попробуй ещё раз.")
    } finally {
      setIsSearching(false)
    }
  }

  const handleSelectGame = (game: RAWGGame) => {
    setSelectedTitle(game.name)
    onSelect({
      title: game.name,
      cover: game.background_image || "",
      description: game.description_raw || "",
      platforms: mapPlatforms(game),
      genres: game.genres?.map((g) => g.name).join(", ") || "",
      externalId: game.id.toString(),
    })
    setShowResults(false)
    setSearchResults([])
  }

  return (
    <div className="space-y-2">
      <Label className="text-base">Поиск *</Label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSearch())}
            placeholder="Введите название игры..."
            className="rounded-xl pl-10 pr-4 py-6 text-base"
          />
        </div>
        <Button onClick={handleSearch} disabled={searchInput.length < 2 || isSearching} className="rounded-xl px-6 py-6 text-base">
          {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : "Найти"}
        </Button>
      </div>

      {showResults && (
        <div className="relative w-full mt-2 bg-background border rounded-xl shadow-lg max-h-80 overflow-auto z-10">
          {isSearching ? (
            <div className="p-6 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
          ) : searchResults.length > 0 ? (
            searchResults.map((g) => (
              <div key={g.id} className="p-4 hover:bg-muted cursor-pointer flex items-start gap-4 border-b last:border-0" onClick={() => handleSelectGame(g)}>
                {g.background_image ? (
                  <img src={g.background_image} alt={g.name} className="w-14 h-14 object-cover rounded-lg" />
                ) : (
                  <div className="w-14 h-14 bg-muted rounded-lg flex items-center justify-center"><Gamepad2 className="w-6 h-6 text-muted-foreground" /></div>
                )}
                <div>
                  <p className="font-medium text-base">{g.name}</p>
                  <p className="text-sm text-muted-foreground">{g.released?.slice(0, 4) || ""}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-muted-foreground">Ничего не найдено</div>
          )}
        </div>
      )}

      {!showResults && selectedTitle && (
        <div className="mt-3 p-3 bg-muted/50 rounded-xl flex items-center gap-2 text-sm">
          <Check className="w-4 h-4 text-green-500" /> Выбрано: <span className="font-medium">{selectedTitle}</span>
        </div>
      )}
    </div>
  )
}
