function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

// "YYYY-MM-DD" is parsed as UTC midnight by `new Date(str)`, which can shift
// a day off in negative-UTC-offset timezones. Parse the components directly
// so the date always lands on the calendar day the user actually picked.
export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number)
  return new Date(year, month - 1, day)
}

export function getNextOccurrence(dateStr: string, isRecurring: boolean): Date {
  const original = parseLocalDate(dateStr)
  if (!isRecurring) return startOfDay(original)

  const today = startOfDay(new Date())
  let next = new Date(today.getFullYear(), original.getMonth(), original.getDate())
  if (next < today) {
    next = new Date(today.getFullYear() + 1, original.getMonth(), original.getDate())
  }
  return next
}

export function daysUntil(date: Date): number {
  const today = startOfDay(new Date())
  const target = startOfDay(date)
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}
