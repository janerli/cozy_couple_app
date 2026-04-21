"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { User, Palette, Bell, Link2, Save, X, Plus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useApp } from "@/lib/app-context"
import { useTheme } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

const avatarOptions = ["🦊", "🐻", "🐰", "🐱", "🐶", "🦁", "🐼", "🦄", "🐨", "🦋", "🌸", "✨"]

const genreOptions = [
  "Романтика",
  "Комедия",
  "Драма",
  "Sci-Fi",
  "Триллер",
  "Хоррор",
  "Аниме",
  "Документальное",
  "Фэнтези",
  "Боевик",
  "Мюзикл",
  "Детектив",
]

export default function SettingsPage() {
  const { activeUser, partnerUser, updateUser } = useApp()
  const { theme, setTheme } = useTheme()
  
  const [name, setName] = useState(activeUser.name)
  const [bio, setBio] = useState(activeUser.bio)
  const [selectedAvatar, setSelectedAvatar] = useState(activeUser.avatar)
  const [selectedGenres, setSelectedGenres] = useState<string[]>(activeUser.favoriteGenres)
  const [hasChanges, setHasChanges] = useState(false)

  const [animationsEnabled, setAnimationsEnabled] = useState(true)

  const handleChange = () => {
    setHasChanges(true)
  }

  const handleSave = () => {
    updateUser(activeUser.id, {
      name,
      bio,
      avatar: selectedAvatar,
      favoriteGenres: selectedGenres,
    })
    setHasChanges(false)
  }

  const handleReset = () => {
    setName(activeUser.name)
    setBio(activeUser.bio)
    setSelectedAvatar(activeUser.avatar)
    setSelectedGenres(activeUser.favoriteGenres)
    setHasChanges(false)
  }

  const toggleGenre = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter((g) => g !== genre))
    } else {
      setSelectedGenres([...selectedGenres, genre])
    }
    handleChange()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-2xl mx-auto space-y-6 pb-8"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold mb-1">Настройки</h1>
        <p className="text-muted-foreground">Настройте свой профиль и приложение</p>
      </motion.div>

      {/* Profile Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="soft-shadow dark:neon-glow overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10">
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Профиль
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Avatar */}
            <div className="space-y-3">
              <Label>Аватар</Label>
              <div className="flex flex-wrap gap-2">
                {avatarOptions.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      setSelectedAvatar(emoji)
                      handleChange()
                    }}
                    className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-all",
                      selectedAvatar === emoji
                        ? "bg-primary/20 ring-2 ring-primary scale-110"
                        : "bg-muted hover:bg-muted/80"
                    )}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label>Имя</Label>
              <Input
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  handleChange()
                }}
                className="rounded-xl"
                placeholder="Ваше имя"
              />
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label>О себе</Label>
              <Input
                value={bio}
                onChange={(e) => {
                  setBio(e.target.value)
                  handleChange()
                }}
                className="rounded-xl"
                placeholder="Расскажите о себе..."
              />
            </div>

            {/* Favorite Genres */}
            <div className="space-y-3">
              <Label>Любимые жанры</Label>
              <div className="flex flex-wrap gap-2">
                {genreOptions.map((genre) => (
                  <button
                    key={genre}
                    onClick={() => toggleGenre(genre)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                      selectedGenres.includes(genre)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    {selectedGenres.includes(genre) && (
                      <Plus className="w-3 h-3 inline mr-1 rotate-45" />
                    )}
                    {genre}
                  </button>
                ))}
              </div>
            </div>

            {/* Save Buttons */}
            {hasChanges && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-2 pt-2"
              >
                <Button onClick={handleSave} className="rounded-full gap-2 flex-1">
                  <Save className="w-4 h-4" />
                  Сохранить
                </Button>
                <Button onClick={handleReset} variant="outline" className="rounded-full gap-2">
                  <X className="w-4 h-4" />
                  Отмена
                </Button>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Appearance Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="soft-shadow dark:neon-glow overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10">
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Внешний вид
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Theme */}
            <div className="space-y-3">
              <Label>Тема</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setTheme("cozy")}
                  className={cn(
                    "p-4 rounded-2xl border-2 transition-all",
                    theme === "cozy"
                      ? "border-primary bg-primary/10"
                      : "border-muted hover:border-primary/50"
                  )}
                >
                  <div className="w-full h-16 rounded-xl bg-gradient-to-br from-pink-100 to-orange-50 mb-2" />
                  <p className="font-medium">Уютная</p>
                  <p className="text-xs text-muted-foreground">Мягкие пастельные тона</p>
                </button>
                <button
                  onClick={() => setTheme("dark")}
                  className={cn(
                    "p-4 rounded-2xl border-2 transition-all",
                    theme === "dark"
                      ? "border-primary bg-primary/10"
                      : "border-muted hover:border-primary/50"
                  )}
                >
                  <div className="w-full h-16 rounded-xl bg-gradient-to-br from-purple-900 to-violet-800 mb-2" />
                  <p className="font-medium">Тёмная</p>
                  <p className="text-xs text-muted-foreground">Глубокие фиолетовые тона</p>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Notifications */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="soft-shadow dark:neon-glow overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10">
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Уведомления
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Анимации</p>
                <p className="text-sm text-muted-foreground">Включить плавные переходы</p>
              </div>
              <Switch
                checked={animationsEnabled}
                onCheckedChange={setAnimationsEnabled}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Partner Link */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="soft-shadow dark:neon-glow overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10">
            <CardTitle className="flex items-center gap-2">
              <Link2 className="w-5 h-5" />
              Связь с партнёром
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-3xl">
                {partnerUser.avatar}
              </div>
              <div className="flex-1">
                <p className="font-medium text-lg">{partnerUser.name}</p>
                <p className="text-sm text-muted-foreground">{partnerUser.bio}</p>
                <div className="flex gap-1 mt-2">
                  {partnerUser.favoriteGenres.slice(0, 3).map((genre) => (
                    <span
                      key={genre}
                      className="px-2 py-0.5 bg-muted rounded-full text-xs"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-4 text-center">
              Вы связаны вместе навсегда 💕
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
