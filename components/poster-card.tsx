"use client"

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface PosterCardProps {
  aspect?: "2/3" | "3/4"
  image: string
  alt: string
  onOpen: () => void
  statusLabel: string
  statusColorClass: string
  bottomBadge?: ReactNode
  cornerBadge?: ReactNode
  description?: string
  note?: string
  actions: ReactNode
}

export function PosterCard({
  aspect = "2/3",
  image,
  alt,
  onOpen,
  statusLabel,
  statusColorClass,
  bottomBadge,
  cornerBadge,
  description,
  note,
  actions,
}: PosterCardProps) {
  return (
    <div
      className={cn("relative bg-muted", aspect === "2/3" ? "aspect-[2/3]" : "aspect-[3/4]")}
      onClick={onOpen}
    >
      <img src={image} alt={alt} className="absolute inset-0 w-full h-full object-cover" />

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/90 via-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-0 right-0 p-4 pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {(description || note) && (
            <div className="max-h-24 overflow-hidden mb-3">
              {description && <p className="text-white/90 text-xs line-clamp-2">{description}</p>}
              {note && <p className="text-white/80 text-xs italic line-clamp-1 mt-1">{note}</p>}
            </div>
          )}
          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
            {actions}
          </div>
        </div>
      </div>

      <div className="absolute top-2 left-2 z-10">
        <span className={cn("px-2 py-1 text-xs font-medium rounded-full shadow-lg", statusColorClass)}>
          {statusLabel}
        </span>
      </div>

      {cornerBadge && <div className="absolute top-2 right-2 z-10">{cornerBadge}</div>}

      {bottomBadge && (
        <div className="absolute bottom-2 left-2 right-2 z-10 opacity-100 group-hover:opacity-0 transition-opacity">
          {bottomBadge}
        </div>
      )}
    </div>
  )
}
