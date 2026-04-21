"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { Moon, Sparkles, Home, Library, Gift, Settings, ListVideo, Gamepad2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTheme } from "@/components/theme-provider"
import { useApp } from "@/lib/app-context"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

const navItems = [
  { href: "/", label: "Главная", icon: Home },
  { href: "/shared", label: "Общий список", icon: ListVideo },
  { href: "/library", label: "Медиатека", icon: Library },
  { href: "/games", label: "Игры", icon: Gamepad2 },
  { href: "/wishlist", label: "Вишлист", icon: Gift },
  { href: "/settings", label: "Настройки", icon: Settings },
]

export function Header() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const { users, activeUserId, setActiveUserId } = useApp()

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="sticky top-0 z-50 glass border-b border-border/50"
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <motion.div
            whileHover={{ scale: 1.05, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
            className="text-xl font-bold text-primary flex items-center gap-1"
          >
            <span className="text-2xl">✨</span>
            <span className="hidden sm:inline">Любимость</span>
          </motion.div>
        </Link>

        {/* Navigation - Desktop */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link key={item.href} href={item.href}>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "px-4 py-2 rounded-2xl text-sm font-medium transition-colors relative",
                    isActive
                      ? "text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute inset-0 bg-primary rounded-2xl"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </span>
                </motion.div>
              </Link>
            )
          })}
        </nav>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          {/* User Avatars */}
          <div className="flex items-center gap-1">
            {users.map((user) => (
              <motion.button
                key={user.id}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setActiveUserId(user.id)}
                className={cn(
                  "relative rounded-full transition-all",
                  activeUserId === user.id
                    ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                    : ""
                )}
              >
                <Avatar className="w-10 h-10">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
              </motion.button>
            ))}
          </div>

          {/* Theme Toggle */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setTheme(theme === "cozy" ? "dark" : "cozy")}
            className="relative w-14 h-8 rounded-full bg-muted p-1 transition-colors"
          >
            <motion.div
              animate={{ x: theme === "dark" ? 24 : 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground"
            >
              {theme === "cozy" ? (
                <Sparkles className="w-3.5 h-3.5" />
              ) : (
                <Moon className="w-3.5 h-3.5" />
              )}
            </motion.div>
          </motion.button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <nav className="md:hidden flex items-center justify-around py-2 border-t border-border/50">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileTap={{ scale: 0.9 }}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-xs">{item.label}</span>
              </motion.div>
            </Link>
          )
        })}
      </nav>
    </motion.header>
  )
}