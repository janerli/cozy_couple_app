"use client"

import { useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Trash2, Edit2, CalendarHeart, Check } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useApp, EventItem } from "@/lib/app-context"
import { UserAvatar } from "@/components/user-avatar"
import { getNextOccurrence, daysUntil, parseLocalDate } from "@/lib/dates"
import { cn } from "@/lib/utils"

const iconOptions = ["💕", "🎂", "🎉", "✈️", "🏠", "🎓", "💍", "📅"]

type FormData = {
  title: string
  eventDate: string
  isRecurring: boolean
  isRelationshipStart: boolean
  icon: string
}

const emptyForm: FormData = {
  title: "",
  eventDate: "",
  isRecurring: true,
  isRelationshipStart: false,
  icon: "📅",
}

function EventFormFields({ formData, setFormData }: { formData: FormData; setFormData: (f: FormData) => void }) {
  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label>Название *</Label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Например: годовщина знакомства"
          className="rounded-xl"
        />
      </div>
      <div className="space-y-2">
        <Label>Дата *</Label>
        <Input
          type="date"
          value={formData.eventDate}
          onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
          className="rounded-xl"
        />
      </div>
      <div className="space-y-2">
        <Label>Иконка</Label>
        <div className="flex flex-wrap gap-2">
          {iconOptions.map((icon) => (
            <button
              key={icon}
              type="button"
              onClick={() => setFormData({ ...formData, icon })}
              className={cn(
                "w-10 h-10 rounded-xl text-xl flex items-center justify-center",
                formData.icon === icon ? "bg-primary/20 ring-2 ring-primary" : "bg-muted"
              )}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setFormData({ ...formData, isRecurring: !formData.isRecurring })}
          disabled={formData.isRelationshipStart}
          className={cn(
            "w-6 h-6 rounded-lg border-2 flex items-center justify-center disabled:opacity-50",
            formData.isRecurring ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground"
          )}
        >
          {formData.isRecurring && <Check className="w-4 h-4" />}
        </button>
        <Label className="cursor-pointer">Повторяется каждый год</Label>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setFormData({
            ...formData,
            isRelationshipStart: !formData.isRelationshipStart,
            isRecurring: !formData.isRelationshipStart ? true : formData.isRecurring,
          })}
          className={cn(
            "w-6 h-6 rounded-lg border-2 flex items-center justify-center",
            formData.isRelationshipStart ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground"
          )}
        >
          {formData.isRelationshipStart && <Check className="w-4 h-4" />}
        </button>
        <Label className="cursor-pointer">Это дата начала отношений</Label>
      </div>
    </div>
  )
}

function AddEventDialog() {
  const { addEvent, activeUserId } = useApp()
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState<FormData>(emptyForm)

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.eventDate) return
    await addEvent({
      title: formData.title,
      eventDate: formData.eventDate,
      isRecurring: formData.isRecurring,
      isRelationshipStart: formData.isRelationshipStart,
      icon: formData.icon,
      createdByUserId: activeUserId,
    })
    setFormData(emptyForm)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) setFormData(emptyForm); setOpen(o) }}>
      <DialogTrigger asChild>
        <Button className="rounded-full gap-2">
          <Plus className="w-4 h-4" />
          Добавить дату
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Добавить дату</DialogTitle></DialogHeader>
        <EventFormFields formData={formData} setFormData={setFormData} />
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} className="rounded-full">Отмена</Button>
          <Button onClick={handleSubmit} disabled={!formData.title.trim() || !formData.eventDate} className="rounded-full">Добавить</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function EventRow({ item, index }: { item: EventItem; index: number }) {
  const { updateEvent, deleteEvent, users } = useApp()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    title: item.title,
    eventDate: item.eventDate,
    isRecurring: item.isRecurring,
    isRelationshipStart: item.isRelationshipStart,
    icon: item.icon || "📅",
  })

  const createdBy = users.find((u) => u.id === item.createdByUserId)
  const next = getNextOccurrence(item.eventDate, item.isRecurring)
  const days = daysUntil(next)
  const anniversaryNumber = item.isRecurring ? next.getFullYear() - parseLocalDate(item.eventDate).getFullYear() : null

  const countdownLabel = days === 0 ? "Сегодня!" : days === 1 ? "Завтра" : days > 0 ? `Через ${days} дн.` : "Прошло"
  const isSoon = days >= 0 && days <= 7

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.eventDate) return
    await updateEvent(item.id, {
      title: formData.title,
      eventDate: formData.eventDate,
      isRecurring: formData.isRecurring,
      isRelationshipStart: formData.isRelationshipStart,
      icon: formData.icon,
    })
    setIsEditing(false)
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        layout
      >
        <Card className="soft-shadow dark:neon-glow">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-2xl flex-shrink-0">
              {item.icon || "📅"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-medium truncate">{item.title}</h3>
                {item.isRelationshipStart && (
                  <span className="px-2 py-0.5 text-xs bg-primary/20 text-primary rounded-full flex-shrink-0">начало отношений</span>
                )}
                {item.isRecurring && anniversaryNumber !== null && anniversaryNumber > 0 && (
                  <span className="px-2 py-0.5 text-xs bg-muted rounded-full flex-shrink-0">{anniversaryNumber}-я годовщина</span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                <span>{parseLocalDate(item.eventDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: item.isRecurring ? undefined : 'numeric' })}</span>
                {createdBy && <UserAvatar avatar={createdBy.avatar} name={createdBy.name} size="sm" />}
              </div>
            </div>
            <span className={cn(
              "px-3 py-1 text-sm font-medium rounded-full flex-shrink-0",
              isSoon ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}>
              {countdownLabel}
            </span>
            <div className="flex gap-1 flex-shrink-0">
              <Button size="sm" variant="ghost" className="rounded-full h-9 w-9 p-0" onClick={() => setIsEditing(true)}>
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="ghost" className="rounded-full h-9 w-9 p-0 text-destructive hover:text-destructive" onClick={() => deleteEvent(item.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Редактировать дату</DialogTitle></DialogHeader>
          <EventFormFields formData={formData} setFormData={setFormData} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditing(false)} className="rounded-full">Отмена</Button>
            <Button onClick={handleSave} disabled={!formData.title.trim() || !formData.eventDate} className="rounded-full">Сохранить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default function CalendarPage() {
  const { events } = useApp()

  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      const daysA = daysUntil(getNextOccurrence(a.eventDate, a.isRecurring))
      const daysB = daysUntil(getNextOccurrence(b.eventDate, b.isRecurring))
      return daysA - daysB
    })
  }, [events])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold mb-1 flex items-center gap-2">
            <CalendarHeart className="w-8 h-8 text-primary" />
            Календарь
          </h1>
          <p className="text-muted-foreground">Годовщины, дни рождения и другие важные даты</p>
        </div>
        <AddEventDialog />
      </motion.div>

      <AnimatePresence mode="popLayout">
        <motion.div className="space-y-3">
          {sortedEvents.length > 0 ? (
            sortedEvents.map((item, index) => (
              <EventRow key={item.id} item={item} index={index} />
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-16 text-center"
            >
              <div className="text-6xl mb-4">📅</div>
              <h3 className="text-xl font-medium mb-2">Пока пусто</h3>
              <p className="text-muted-foreground mb-4">Добавьте первую важную дату!</p>
              <AddEventDialog />
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}
