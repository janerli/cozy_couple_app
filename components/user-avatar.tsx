import { cn } from "@/lib/utils"

interface UserAvatarProps {
  avatar: string
  name: string
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
}

const sizeClasses = {
  sm: "w-6 h-6 text-sm",
  md: "w-8 h-8 text-base",
  lg: "w-10 h-10 text-lg",
  xl: "w-24 h-24 text-5xl",
}

export function UserAvatar({ avatar, name, size = "md", className }: UserAvatarProps) {
  const isUrl = avatar?.startsWith('http')
  
  return (
    <div className={cn(
      "rounded-full bg-primary/20 flex items-center justify-center overflow-hidden",
      sizeClasses[size],
      className
    )}>
      {isUrl ? (
        <img 
          src={avatar} 
          alt={name}
          className="w-full h-full object-cover"
        />
      ) : (
        <span>{avatar || name?.charAt(0) || '👤'}</span>
      )}
    </div>
  )
}